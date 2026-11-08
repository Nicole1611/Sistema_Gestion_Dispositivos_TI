const express = require('express');
const router = express.Router();

const {
    registrarDocente,
    consultarDocentes
} = require('../controllers/docentesController');

// Ruta para consultar docentes
router.get('/consultar', consultarDocentes);

// Ruta para registrar docentes
router.post('/registrar', registrarDocente);

module.exports = router;