const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const responsables = await db.all(
      `SELECT resp.idres, resp.nombreres, resp.email, resp.telefono, resp.direccionres,
              ref.nombreref
       FROM Responsables_de_Refugio resp
       JOIN Refugio ref ON ref.idrefugio = resp.idres
       ORDER BY resp.nombreres`
    );

    res.json({ responsables });
  } catch (error) {
    console.error('Error al listar responsables:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const responsable = await db.get(
      `SELECT resp.idres, resp.nombreres, resp.email, resp.telefono, resp.direccionres,
              ref.nombreref
       FROM Responsables_de_Refugio resp
       JOIN Refugio ref ON ref.idrefugio = resp.idres
       WHERE resp.idres = ?`,
      [id]
    );

    if (!responsable) {
      return res.status(404).json({ error: 'Responsable no encontrado' });
    }

    res.json({ responsable });
  } catch (error) {
    console.error('Error al obtener responsable:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { telefono, ciudad, responsable, password } = req.body;

  try {
    const existente = await db.get('SELECT idres FROM Responsables_de_Refugio WHERE idres = ?', [id]);
    if (!existente) {
      return res.status(404).json({ error: 'Responsable no encontrado' });
    }

    const campos = [];
    const valores = [];

    if (typeof telefono !== 'undefined') {
      campos.push('telefono = ?');
      valores.push(telefono);
    }
    if (typeof ciudad !== 'undefined') {
      campos.push('direccionres = ?');
      valores.push(ciudad);
    }
    if (typeof responsable !== 'undefined') {
      campos.push('nombreres = ?');
      valores.push(responsable);
    }
    if (typeof password !== 'undefined') {
      campos.push('password = ?');
      valores.push(password);
    }

    if (!campos.length) {
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }

    valores.push(id);
    await db.run(`UPDATE Responsables_de_Refugio SET ${campos.join(', ')} WHERE idres = ?`, valores);

    const responsableActualizado = await db.get(
      `SELECT resp.idres, resp.nombreres, resp.email, resp.telefono, resp.direccionres,
              ref.nombreref
       FROM Responsables_de_Refugio resp
       JOIN Refugio ref ON ref.idrefugio = resp.idres
       WHERE resp.idres = ?`,
      [id]
    );

    res.json({ mensaje: 'Configuración actualizada con éxito', refugio: responsableActualizado });
  } catch (error) {
    console.error('Error al actualizar responsable:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
