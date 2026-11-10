
const express = require("express");
const router = express.Router();

const {
    listarDocentes,
    registrarDocente
} = require("../controllers/docentes.controller");

const { verificarToken } = require("../middlewares/auth.middleware");
const { verificarRol } = require("../middlewares/verificarRol");

// Consultar docentes: solo administrador
router.get(
    "/",
    verificarToken,
    verificarRol("Administrador"),
    listarDocentes
);

// Registrar docentes: solo administrador
router.post(
    "/",
    verificarToken,
    verificarRol("Administrador"),
    registrarDocente
);

module.exports = router;
