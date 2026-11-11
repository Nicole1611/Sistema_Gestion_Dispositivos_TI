const express = require('express');
const router = express.Router();

const {
    consultarEstudiantes
} = require('../controllers/estudiantesController');

// Consultar estudiantes - HU-13
router.get('/consultar', consultarEstudiantes);

module.exports = router;