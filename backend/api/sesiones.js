const express = require('express');
const crypto = require('crypto');
const db = require('../database');

const router = express.Router();

const crearToken = () => {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return crypto.randomBytes(24).toString('hex');
};

let tablaSesionesLista = null;

async function obtenerNombreTablaSesiones() {
  if (tablaSesionesLista !== null) {
    return tablaSesionesLista;
  }

  const candidatos = ['Sesiones', 'sesiones'];

  for (const nombre of candidatos) {
    // eslint-disable-next-line no-await-in-loop
    const existente = await db.get(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
      [nombre]
    );
    if (existente && existente.name) {
      tablaSesionesLista = existente.name;
      return tablaSesionesLista;
    }
  }

  tablaSesionesLista = false;
  return tablaSesionesLista;
}

async function asegurarTablaSesiones(res) {
  const nombreTabla = await obtenerNombreTablaSesiones();
  if (!nombreTabla) {
    res
      .status(501)
      .json({ error: 'La tabla de sesiones no existe en la base de datos configurada.' });
    return null;
  }

  return nombreTabla;
}

router.post('/', async (req, res) => {
  const { idUsuario, token } = req.body;

  if (!idUsuario) {
    return res.status(400).json({ error: 'Debe proporcionar el idUsuario.' });
  }

  try {
    const usuario = await db.get('SELECT idusuario FROM Usuario WHERE idusuario = ?', [idUsuario]);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const nombreTabla = await asegurarTablaSesiones(res);
    if (!nombreTabla) {
      return;
    }

    let tokenFinal = (token || '').trim() || crearToken();

    let intentos = 0;
    while (intentos < 3) {
      try {
        const insertSql = `INSERT INTO ${nombreTabla} (id_usuario, token) VALUES (?, ?)`;
        const resultado = await db.run(insertSql, [idUsuario, tokenFinal]);

        const selectSql = `SELECT idsesion, id_usuario AS idUsuario, token, creado_en FROM ${nombreTabla} WHERE idsesion = ?`;
        const sesion = await db.get(selectSql, [resultado.id]);

        return res.status(201).json({ mensaje: 'Sesión creada correctamente', sesion });
      } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          tokenFinal = crearToken();
          intentos += 1;
        } else {
          throw error;
        }
      }
    }

    res.status(500).json({ error: 'No se pudo generar un token único para la sesión.' });
  } catch (error) {
    console.error('Error al crear sesión:', error);
    res.status(500).json({ error: 'Error interno del servidor al crear la sesión.' });
  }
});

router.get('/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const nombreTabla = await asegurarTablaSesiones(res);
    if (!nombreTabla) {
      return;
    }

    const selectSql = `SELECT idsesion, id_usuario AS idUsuario, token, creado_en FROM ${nombreTabla} WHERE token = ?`;
    const sesion = await db.get(selectSql, [token]);

    if (!sesion) {
      return res.status(404).json({ error: 'Sesión no encontrada.' });
    }

    res.json({ sesion });
  } catch (error) {
    console.error('Error al validar sesión:', error);
    res.status(500).json({ error: 'Error interno del servidor al validar la sesión.' });
  }
});

router.delete('/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const nombreTabla = await asegurarTablaSesiones(res);
    if (!nombreTabla) {
      return;
    }

    const deleteSql = `DELETE FROM ${nombreTabla} WHERE token = ?`;
    const resultado = await db.run(deleteSql, [token]);
    if (!resultado.changes) {
      return res.status(404).json({ error: 'Sesión no encontrada.' });
    }

    res.json({ mensaje: 'Sesión eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar sesión:', error);
    res.status(500).json({ error: 'Error interno del servidor al eliminar la sesión.' });
  }
});

module.exports = router;
