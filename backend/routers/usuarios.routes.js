
const express = require("express");
const router = express.Router();

const {
    listarUsuarios,
    crearUsuario
} = require("../controllers/usuarios.controller");

const { verificarToken } = require("../middlewares/auth.middleware");
const { verificarRol } = require("../middlewares/verificarRol");

// Consultar usuarios: solo Administrador
router.get(
    "/",
    verificarToken,
    verificarRol("Administrador"),
    listarUsuarios
);

// Registrar Administrador o Técnico: solo Administrador
router.post(
    "/",
    verificarToken,
    verificarRol("Administrador"),
    crearUsuario
);

module.exports = router;
