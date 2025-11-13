const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const refugios = await db.all(
      `SELECT ref.idrefugio, ref.nombreref, ref.direccionref, ref.horarioatenc, ref.tiporef,
              resp.nombreres AS responsable, resp.telefono, resp.email, resp.direccionres
         FROM Refugio ref
         LEFT JOIN Responsables_de_Refugio resp ON resp.idres = ref.idrefugio
         ORDER BY ref.nombreref`
    );

    res.json({
      refugios: refugios.map((r) => ({
        idrefugio: r.idrefugio,
        nombreref: r.nombreref,
        direccionref: r.direccionref,
        horarioatenc: r.horarioatenc,
        tiporef: r.tiporef,
        telefono: r.telefono || null,
        email: r.email || null,
        responsable: r.responsable || null,
        ciudad: r.direccionres || null,
      })),
    });
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
    const existente = await db.get('SELECT idres FROM Responsables_de_Refugio WHERE email = ?', [email.trim()]);
    if (existente) {
      return res.status(409).json({ error: 'Este correo ya está registrado como responsable.' });
    }

    const nuevoRefugio = await db.run(
      'INSERT INTO Refugio (nombreref, direccionref, horarioatenc, tiporef) VALUES (?, ?, ?, ?)',
      [
        nombreRefugio.trim(),
        ciudad || null,
        'Horario no especificado',
        'General',
      ]
    );

    await db.run(
      'INSERT INTO Responsables_de_Refugio (idres, nombreres, email, password, telefono, direccionres) VALUES (?, ?, ?, ?, ?, ?)',
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
         FROM Responsables_de_Refugio resp
         JOIN Refugio ref ON ref.idrefugio = resp.idres
        WHERE resp.idres = ?`,
      [nuevoRefugio.id]
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
         FROM Responsables_de_Refugio resp
         JOIN Refugio ref ON ref.idrefugio = resp.idres
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
      `SELECT m.idmascota, m.nombremasc, m.especie, m.raza, m.sexo, m.edady,
              m.idrefugio AS idrefugio,
              r.nombreref, r.direccionref,
              resp.idres AS idresponsable, resp.nombreres
         FROM Mascota m
         JOIN Refugio r ON r.idrefugio = m.idrefugio
         LEFT JOIN Responsables_de_Refugio resp ON resp.idres = r.idrefugio
        WHERE m.idrefugio = ?
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
      img_url: 'https://via.placeholder.com/260x200?text=Añadir+Imagen',
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
      `SELECT ref.idrefugio, ref.nombreref, ref.direccionref, ref.horarioatenc, ref.tiporef,
              resp.telefono, resp.email, resp.direccionres
         FROM Refugio ref
         LEFT JOIN Responsables_de_Refugio resp ON resp.idres = ref.idrefugio
        WHERE ref.idrefugio = ?`,
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
    const existente = await db.get('SELECT idrefugio FROM Refugio WHERE idrefugio = ?', [id]);
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

    const camposResponsable = [];
    const valoresResponsable = [];

    if (typeof telefono !== 'undefined') {
      camposResponsable.push('telefono = ?');
      valoresResponsable.push(telefono);
    }

    if (typeof email !== 'undefined') {
      camposResponsable.push('email = ?');
      valoresResponsable.push(email);
    }

    if (!campos.length && !camposResponsable.length) {
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }

    if (campos.length) {
      valores.push(id);
      await db.run(`UPDATE Refugio SET ${campos.join(', ')} WHERE idrefugio = ?`, valores);
    }

    if (camposResponsable.length) {
      valoresResponsable.push(id);
      await db.run(
        `UPDATE Responsables_de_Refugio SET ${camposResponsable.join(', ')} WHERE idres = ?`,
        valoresResponsable
      );
    }

    const refugio = await db.get(
      `SELECT ref.idrefugio, ref.nombreref, ref.direccionref, ref.horarioatenc, ref.tiporef,
              resp.telefono, resp.email, resp.direccionres
         FROM Refugio ref
         LEFT JOIN Responsables_de_Refugio resp ON resp.idres = ref.idrefugio
        WHERE ref.idrefugio = ?`,
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
    const existente = await db.get('SELECT idrefugio FROM Refugio WHERE idrefugio = ?', [id]);
    if (!existente) {
      return res.status(404).json({ error: 'Refugio no encontrado' });
    }

    await db.run('DELETE FROM Responsables_de_Refugio WHERE idres = ?', [id]);
    await db.run('DELETE FROM Refugio WHERE idrefugio = ?', [id]);
    res.json({ mensaje: 'Refugio eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar refugio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
