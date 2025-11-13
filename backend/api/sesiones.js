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

router.post('/', async (req, res) => {
  const { idUsuario, token } = req.body;

  if (!idUsuario) {
    return res.status(400).json({ error: 'Debe proporcionar el idUsuario.' });
  }

  try {
    const usuario = await db.get('SELECT idusuario FROM usuarios WHERE idusuario = ?', [idUsuario]);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    let tokenFinal = (token || '').trim() || crearToken();

    let intentos = 0;
    while (intentos < 3) {
      try {
        const resultado = await db.run('INSERT INTO sesiones (id_usuario, token) VALUES (?, ?)', [idUsuario, tokenFinal]);

        const sesion = await db.get(
          'SELECT idsesion, id_usuario AS idUsuario, token, creado_en FROM sesiones WHERE idsesion = ?',
          [resultado.id]
        );

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
    const sesion = await db.get(
      'SELECT idsesion, id_usuario AS idUsuario, token, creado_en FROM sesiones WHERE token = ?',
      [token]
    );

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
    const resultado = await db.run('DELETE FROM sesiones WHERE token = ?', [token]);
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
