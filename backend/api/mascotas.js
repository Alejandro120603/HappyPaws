const express = require('express');
const db = require('../database');

const router = express.Router();

const formatearMascota = (m) => ({
  idmascota: m.idmascota,
  nombre: m.nombremasc,
  especie: m.especie,
  raza: m.raza,
  sexo: m.sexo,
  edad: m.edady,
  ciudad: m.direccionref,
  idrefugio: m.idrefugio,
  idresponsable: m.idresponsable || null,
  responsable: m.nombreres || null,
  img_url: 'https://via.placeholder.com/260x200?text=Añadir+Imagen',
});

router.get('/', async (_req, res) => {
  try {
    const mascotas = await db.all(
      `SELECT m.idmascota, m.nombremasc, m.especie, m.raza, m.sexo, m.edady,
              m.idrefugio AS idrefugio,
              r.nombreref, r.direccionref,
              resp.idres AS idresponsable, resp.nombreres
         FROM Mascota m
         JOIN Refugio r ON r.idrefugio = m.idrefugio
         LEFT JOIN Responsables_de_Refugio resp ON resp.idres = r.idrefugio
         ORDER BY m.idmascota DESC`
    );

    res.json(mascotas.map(formatearMascota));
  } catch (error) {
    console.error('Error al obtener mascotas:', error);
    res.status(500).json({ error: 'Error interno del servidor al consultar mascotas' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const mascota = await db.get(
      `SELECT m.idmascota, m.nombremasc, m.especie, m.raza, m.sexo, m.edady,
              m.idrefugio AS idrefugio,
              r.nombreref, r.direccionref,
              resp.idres AS idresponsable, resp.nombreres
         FROM Mascota m
         JOIN Refugio r ON r.idrefugio = m.idrefugio
         LEFT JOIN Responsables_de_Refugio resp ON resp.idres = r.idrefugio
        WHERE m.idmascota = ?`,
      [id]
    );

    if (!mascota) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    res.json(formatearMascota(mascota));
  } catch (error) {
    console.error('Error al obtener mascota:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/', async (req, res) => {
  const { idRefugio, nombre, edad, especie, raza, sexo } = req.body;

  if (!idRefugio || !nombre || !especie || !raza || !sexo || typeof edad === 'undefined') {
    return res.status(400).json({ error: 'Faltan datos obligatorios para la mascota.' });
  }

  try {
    const refugio = await db.get('SELECT idrefugio FROM Refugio WHERE idrefugio = ?', [idRefugio]);
    if (!refugio) {
      return res.status(400).json({ error: 'El refugio especificado no existe.' });
    }

    const responsable = await db.get('SELECT idres FROM Responsables_de_Refugio WHERE idres = ?', [idRefugio]);
    if (!responsable) {
      return res
        .status(400)
        .json({ error: 'Debe existir un responsable asociado al refugio para registrar la mascota.' });
    }

    const edadNumero = Number.parseInt(edad, 10);
    if (!Number.isFinite(edadNumero) || edadNumero < 0) {
      return res.status(400).json({ error: 'La edad debe ser un número entero positivo.' });
    }

    const resultado = await db.run(
      `INSERT INTO Mascota (idrefugio, nombremasc, especie, raza, sexo, edady)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [idRefugio, nombre.trim(), especie.trim(), raza.trim(), sexo.trim(), edadNumero]
    );

    const mascota = await db.get(
      `SELECT m.idmascota, m.nombremasc, m.especie, m.raza, m.sexo, m.edady,
              m.idrefugio AS idrefugio,
              r.nombreref, r.direccionref,
              resp.idres AS idresponsable, resp.nombreres
         FROM Mascota m
         JOIN Refugio r ON r.idrefugio = m.idrefugio
         LEFT JOIN Responsables_de_Refugio resp ON resp.idres = r.idrefugio
        WHERE m.idmascota = ?`,
      [resultado.id]
    );

    res.status(201).json({
      mensaje: 'Mascota registrada con éxito',
      mascota: formatearMascota(mascota),
    });
  } catch (error) {
    console.error('Error al registrar mascota:', error);
    res.status(500).json({ error: 'Error interno del servidor al registrar la mascota.' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, especie, raza, sexo, edad, idRefugio } = req.body;

  try {
    const existente = await db.get('SELECT idmascota FROM Mascota WHERE idmascota = ?', [id]);
    if (!existente) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    const campos = [];
    const valores = [];

    if (typeof nombre !== 'undefined') {
      campos.push('nombremasc = ?');
      valores.push(nombre);
    }
    if (typeof especie !== 'undefined') {
      campos.push('especie = ?');
      valores.push(especie);
    }
    if (typeof raza !== 'undefined') {
      campos.push('raza = ?');
      valores.push(raza);
    }
    if (typeof sexo !== 'undefined') {
      campos.push('sexo = ?');
      valores.push(sexo);
    }
    if (typeof edad !== 'undefined') {
      const edadNumero = Number.parseInt(edad, 10);
      if (!Number.isFinite(edadNumero) || edadNumero < 0) {
        return res.status(400).json({ error: 'La edad debe ser un número entero positivo.' });
      }
      campos.push('edady = ?');
      valores.push(edadNumero);
    }
    if (typeof idRefugio !== 'undefined') {
      const refugio = await db.get('SELECT idrefugio FROM Refugio WHERE idrefugio = ?', [idRefugio]);
      if (!refugio) {
        return res.status(400).json({ error: 'El refugio especificado no existe.' });
      }
      const responsable = await db.get('SELECT idres FROM Responsables_de_Refugio WHERE idres = ?', [idRefugio]);
      if (!responsable) {
        return res.status(400).json({ error: 'Debe existir un responsable asociado al refugio.' });
      }
      campos.push('idrefugio = ?');
      valores.push(idRefugio);
    }

    if (!campos.length) {
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }

    valores.push(id);
    await db.run(`UPDATE Mascota SET ${campos.join(', ')} WHERE idmascota = ?`, valores);

    const mascota = await db.get(
      `SELECT m.idmascota, m.nombremasc, m.especie, m.raza, m.sexo, m.edady,
              m.idrefugio AS idrefugio,
              r.nombreref, r.direccionref,
              resp.idres AS idresponsable, resp.nombreres
         FROM Mascota m
         JOIN Refugio r ON r.idrefugio = m.idrefugio
         LEFT JOIN Responsables_de_Refugio resp ON resp.idres = r.idrefugio
        WHERE m.idmascota = ?`,
      [id]
    );

    res.json({ mensaje: 'Mascota actualizada correctamente', mascota: formatearMascota(mascota) });
  } catch (error) {
    console.error('Error al actualizar mascota:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar la mascota.' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const existente = await db.get('SELECT idmascota FROM Mascota WHERE idmascota = ?', [id]);
    if (!existente) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    await db.run('DELETE FROM Mascota WHERE idmascota = ?', [id]);
    res.json({ mensaje: 'Mascota eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar mascota:', error);
    res.status(500).json({ error: 'Error interno del servidor al eliminar la mascota.' });
  }
});

module.exports = router;
