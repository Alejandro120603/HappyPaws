const express = require('express');
const usuariosRouter = require('./usuarios');
const refugiosRouter = require('./refugios');
const mascotasRouter = require('./mascotas');
const responsablesRouter = require('./responsables');

const router = express.Router();

router.use('/usuarios', usuariosRouter);
router.use('/refugios', refugiosRouter);
router.use('/mascotas', mascotasRouter);
router.use('/responsables', responsablesRouter);

module.exports = router;
