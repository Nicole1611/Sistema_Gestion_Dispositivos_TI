
const express = require('express');
const router = express.Router();

const {
    registrarUsuario
} = require('../controllers/usuariosController');

// Ruta para registrar cuentas del personal
router.post('/registrar', registrarUsuario);

module.exports = router;
