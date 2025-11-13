const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const refugios = await db.all(
      'SELECT idrefugio, nombreref, direccionref, horarioatenc, tiporef, telefono, email FROM refugios ORDER BY nombreref'
    );

    res.json({ refugios });
  } catch (error) {
    console.error('Error al listar refugios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/register', async (req, res) => {
  const { nombreRefugio, email, password, telefono, ciudad, responsable } = req.body;

  if (!nombreRefugio || !email || !password || !responsable) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }

  try {
    const existente = await db.get('SELECT idres FROM responsables WHERE email = ?', [email.trim()]);
    if (existente) {
      return res.status(409).json({ error: 'Este correo ya está registrado como responsable.' });
    }

    const nuevoRefugio = await db.run(
      'INSERT INTO refugios (nombreref, direccionref, horarioatenc, tiporef, telefono, email) VALUES (?, ?, ?, ?, ?, ?)',
      [
        nombreRefugio.trim(),
        ciudad || null,
        '9:00 AM - 5:00 PM',
        'General',
        telefono || null,
        email.trim(),
      ]
    );

    const nuevoResponsable = await db.run(
      'INSERT INTO responsables (idrefugio, nombreres, email, password, telefono, direccionres) VALUES (?, ?, ?, ?, ?, ?)',
      [
        nuevoRefugio.id,
        responsable.trim(),
        email.trim(),
        password.trim(),
        telefono || null,
        ciudad || null,
      ]
    );

    const refugio = await db.get(
      `SELECT resp.idres, resp.nombreres, resp.email, resp.telefono, resp.direccionres,
              ref.idrefugio, ref.nombreref, ref.direccionref, ref.horarioatenc, ref.tiporef
       FROM responsables resp
       JOIN refugios ref ON ref.idrefugio = resp.idrefugio
       WHERE resp.idres = ?`,
      [nuevoResponsable.id]
    );

    res.status(201).json({
      mensaje: 'Responsable y refugio creados con éxito.',
      refugio,
    });
  } catch (error) {
    console.error('Error en el registro de refugio:', error);
    res.status(500).json({ error: 'Error interno del servidor al registrar.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (correo y contraseña).' });
  }

  try {
    const refugio = await db.get(
      `SELECT resp.idres, resp.nombreres, resp.email, resp.password, resp.telefono, resp.direccionres,
              ref.idrefugio, ref.nombreref, ref.direccionref
       FROM responsables resp
       JOIN refugios ref ON ref.idrefugio = resp.idrefugio
       WHERE resp.email = ?`,
      [email.trim()]
    );

    if (!refugio) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    if ((refugio.password || '').trim() !== password.trim()) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    delete refugio.password;

    res.json({
      mensaje: `¡Bienvenido al panel, ${refugio.nombreres}!`,
      refugio,
    });
  } catch (error) {
    console.error('Error en el login de refugio:', error);
    res.status(500).json({ error: 'Error interno del servidor al iniciar sesión.' });
  }
});

router.get('/:id/mascotas', async (req, res) => {
  const { id } = req.params;

  try {
    const mascotas = await db.all(
      `SELECT m.idmascota, m.nombremasc, m.especie, m.raza, m.sexo, m.edady, m.img_url,
              m.id_refugio AS idrefugio, m.id_responsable AS idresponsable,
              r.nombreref, r.direccionref, resp.nombreres
       FROM mascotas m
       JOIN refugios r ON r.idrefugio = m.id_refugio
       LEFT JOIN responsables resp ON resp.idres = m.id_responsable
       WHERE m.id_refugio = ?
       ORDER BY m.idmascota DESC`,
      [id]
    );

    res.json({ mascotas: mascotas.map((m) => ({
      idmascota: m.idmascota,
      nombre: m.nombremasc,
      especie: m.especie,
      raza: m.raza,
      sexo: m.sexo,
      edad: m.edady,
      img_url: m.img_url,
      idrefugio: m.idrefugio,
      idresponsable: m.idresponsable,
      responsable: m.nombreres || null,
    })) });
  } catch (error) {
    console.error('Error al obtener mascotas por refugio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const refugio = await db.get(
      'SELECT idrefugio, nombreref, direccionref, horarioatenc, tiporef, telefono, email FROM refugios WHERE idrefugio = ?',
      [id]
    );

    if (!refugio) {
      return res.status(404).json({ error: 'Refugio no encontrado' });
    }

    res.json({ refugio });
  } catch (error) {
    console.error('Error al obtener refugio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, direccion, horario, tipo, telefono, email } = req.body;

  try {
    const existente = await db.get('SELECT idrefugio FROM refugios WHERE idrefugio = ?', [id]);
    if (!existente) {
      return res.status(404).json({ error: 'Refugio no encontrado' });
    }

    const campos = [];
    const valores = [];

    if (typeof nombre !== 'undefined') {
      campos.push('nombreref = ?');
      valores.push(nombre);
    }
    if (typeof direccion !== 'undefined') {
      campos.push('direccionref = ?');
      valores.push(direccion);
    }
    if (typeof horario !== 'undefined') {
      campos.push('horarioatenc = ?');
      valores.push(horario);
    }
    if (typeof tipo !== 'undefined') {
      campos.push('tiporef = ?');
      valores.push(tipo);
    }
    if (typeof telefono !== 'undefined') {
      campos.push('telefono = ?');
      valores.push(telefono);
    }
    if (typeof email !== 'undefined') {
      campos.push('email = ?');
      valores.push(email);
    }

    if (!campos.length) {
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }

    valores.push(id);
    await db.run(`UPDATE refugios SET ${campos.join(', ')} WHERE idrefugio = ?`, valores);

    const refugio = await db.get(
      'SELECT idrefugio, nombreref, direccionref, horarioatenc, tiporef, telefono, email FROM refugios WHERE idrefugio = ?',
      [id]
    );

    res.json({ mensaje: 'Refugio actualizado correctamente', refugio });
  } catch (error) {
    console.error('Error al actualizar refugio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const existente = await db.get('SELECT idrefugio FROM refugios WHERE idrefugio = ?', [id]);
    if (!existente) {
      return res.status(404).json({ error: 'Refugio no encontrado' });
    }

    await db.run('DELETE FROM refugios WHERE idrefugio = ?', [id]);
    res.json({ mensaje: 'Refugio eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar refugio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
