const express = require('express');
const router = express.Router();

const {
    registrarDocente
} = require('../controllers/docentesController');

// Ruta para registrar docentes
router.post('/registrar', registrarDocente);

module.exports = router;