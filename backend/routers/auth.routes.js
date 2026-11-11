const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const { verificarToken } = require("../middlewares/auth.middleware");

// Iniciar sesión
router.post("/login", authController.login);

// Cambiar contraseña
router.put(
    "/cambiar-contrasena",
    verificarToken,
    authController.cambiarContrasena
);

module.exports = router;