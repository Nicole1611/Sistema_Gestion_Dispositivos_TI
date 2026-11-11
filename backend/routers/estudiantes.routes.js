
const express = require("express");
const router = express.Router();

const estudiantesController = require("../controllers/estudiantes.controller");

const {
    verificarToken,
    verificarAdministrador,
    verificarCambioContrasena
} = require("../middlewares/auth.middleware");

// Consultar estudiantes
router.get(
    "/",
    verificarToken,
    verificarCambioContrasena,
    verificarAdministrador,
    estudiantesController.listarEstudiantes
);

// Registrar estudiante
router.post(
    "/",
    verificarToken,
    verificarCambioContrasena,
    verificarAdministrador,
    estudiantesController.registrarEstudiante
);

module.exports = router;
