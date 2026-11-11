
const express = require("express");
const router = express.Router();

const dispositivosController = require("../controllers/dispositivos.controller");

const {
    verificarToken,
    verificarCambioContrasena
} = require("../middlewares/auth.middleware");

const { verificarRol } = require("../middlewares/verificarRol");

// Consultar tipos, marcas y estados
router.get(
    "/catalogos",
    verificarToken,
    verificarCambioContrasena,
    verificarRol("Administrador", "Técnico"),
    dispositivosController.listarCatalogos
);

// Consultar dispositivos
router.get(
    "/",
    verificarToken,
    verificarCambioContrasena,
    verificarRol("Administrador", "Técnico"),
    dispositivosController.listarDispositivos
);

// Registrar dispositivo
router.post(
    "/",
    verificarToken,
    verificarCambioContrasena,
    verificarRol("Administrador", "Técnico"),
    dispositivosController.registrarDispositivo
);

// Actualizar dispositivo
router.put(
    "/:id",
    verificarToken,
    verificarCambioContrasena,
    verificarRol("Administrador", "Técnico"),
    dispositivosController.actualizarDispositivo
);

module.exports = router;
