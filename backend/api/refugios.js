const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const refugios = await db.all(
      'SELECT idrefugio, nombreref, direccionref, horarioatenc, tiporef FROM Refugio ORDER BY nombreref'
    );

    res.json({ refugios });
  } catch (error) {
    console.error('Error al listar refugios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const refugio = await db.get(
      'SELECT idrefugio, nombreref, direccionref, horarioatenc, tiporef FROM Refugio WHERE idrefugio = ?',
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

router.post('/register', async (req, res) => {
  const { nombreRefugio, email, password, telefono, ciudad, responsable } = req.body;

  if (!nombreRefugio || !email || !password || !responsable) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }

  try {
    const existente = await db.get(
      'SELECT idres FROM Responsables_de_Refugio WHERE email = ?',
      [email]
    );

    if (existente) {
      return res.status(409).json({ error: 'Este correo ya está registrado como responsable.' });
    }

    const nuevoRefugio = await db.run(
      'INSERT INTO Refugio (nombreref, direccionref, horarioatenc, tiporef) VALUES (?, ?, ?, ?)',
      [nombreRefugio, ciudad || null, '9:00 AM - 5:00 PM', 'General']
    );

    await db.run(
      'INSERT INTO Responsables_de_Refugio (idres, nombreres, email, password, telefono, direccionres) VALUES (?, ?, ?, ?, ?, ?)',
      [nuevoRefugio.id, responsable, email, password, telefono || null, ciudad || null]
    );

    const refugio = await db.get(
      `SELECT r.idrefugio, r.nombreref, r.direccionref, resp.nombreres, resp.email, resp.telefono
       FROM Refugio r JOIN Responsables_de_Refugio resp ON resp.idres = r.idrefugio
       WHERE r.idrefugio = ?`,
      [nuevoRefugio.id]
    );

    res.status(201).json({
      mensaje: 'Responsable y Refugio creados con éxito.',
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
              ref.nombreref
       FROM Responsables_de_Refugio resp
       JOIN Refugio ref ON ref.idrefugio = resp.idres
       WHERE resp.email = ?`,
      [email]
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
      `SELECT m.idmascota, m.nombremasc, m.especie, m.raza, m.sexo, m.edady, m.idrefugio,
              r.nombreref, r.direccionref
       FROM Mascota m
       JOIN Refugio r ON r.idrefugio = m.idrefugio
       WHERE m.idrefugio = ?
       ORDER BY m.idmascota DESC`,
      [id]
    );

    res.json({ mascotas });
  } catch (error) {
    console.error('Error al obtener mascotas por refugio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
