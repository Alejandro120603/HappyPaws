const express = require('express');
const db = require('../database');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { nombre, email, password, telefono, ciudad } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const existente = await db.get('SELECT idusuario FROM Usuario WHERE email = ?', [email.trim()]);
    if (existente) {
      return res.status(409).json({ error: 'Este correo ya está registrado.' });
    }

    const insercion = await db.run(
      'INSERT INTO Usuario (nombrecomp, email, password, telefono, ciudad) VALUES (?, ?, ?, ?, ?)',
      [nombre.trim(), email.trim(), password.trim(), telefono || null, ciudad || null]
    );

    const usuario = await db.get(
      'SELECT idusuario, nombrecomp, email, telefono, ciudad FROM Usuario WHERE idusuario = ?',
      [insercion.id]
    );

    res.status(201).json({
      mensaje: 'Cuenta creada con éxito',
      usuario,
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor al registrar.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Debe proporcionar email y contraseña.' });
  }

  try {
    const usuario = await db.get(
      'SELECT idusuario, nombrecomp, email, password, telefono, ciudad FROM Usuario WHERE email = ?',
      [email.trim()]
    );

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    if ((usuario.password || '').trim() !== password.trim()) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    delete usuario.password;

    res.json({
      mensaje: `¡Bienvenido, ${usuario.nombrecomp}!`,
      usuario,
    });
  } catch (error) {
    console.error('Error en el login de usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor al iniciar sesión.' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const usuario = await db.get(
      'SELECT idusuario, nombrecomp, email, telefono, ciudad FROM Usuario WHERE idusuario = ?',
      [id]
    );

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ usuario });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombreComp, telefono, ciudad } = req.body;

  try {
    const existente = await db.get('SELECT idusuario FROM Usuario WHERE idusuario = ?', [id]);
    if (!existente) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const campos = [];
    const valores = [];

    if (typeof nombreComp !== 'undefined') {
      campos.push('nombrecomp = ?');
      valores.push(nombreComp);
    }
    if (typeof telefono !== 'undefined') {
      campos.push('telefono = ?');
      valores.push(telefono);
    }
    if (typeof ciudad !== 'undefined') {
      campos.push('ciudad = ?');
      valores.push(ciudad);
    }

    if (!campos.length) {
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }

    valores.push(id);
    await db.run(`UPDATE Usuario SET ${campos.join(', ')} WHERE idusuario = ?`, valores);

    const usuario = await db.get(
      'SELECT idusuario, nombrecomp, email, telefono, ciudad FROM Usuario WHERE idusuario = ?',
      [id]
    );

    res.json({ mensaje: 'Perfil actualizado con éxito', usuario });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
