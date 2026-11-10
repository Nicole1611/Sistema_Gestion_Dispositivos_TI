
const express = require("express");
const router = express.Router();

const dispositivosController = require("../controllers/dispositivos.controller");

const {
    verificarToken,
    verificarAdministrador,
    verificarCambioContrasena
} = require("../middlewares/auth.middleware");

// Consultar tipos, marcas y estados
router.get(
    "/catalogos",
    verificarToken,
    verificarCambioContrasena,
    verificarAdministrador,
    dispositivosController.listarCatalogos
);

// Consultar dispositivos
router.get(
    "/",
    verificarToken,
    verificarCambioContrasena,
    verificarAdministrador,
    dispositivosController.listarDispositivos
);
// Registrar dispositivo
router.post(
    "/",
    verificarToken,
    verificarCambioContrasena,
    verificarAdministrador,
    dispositivosController.registrarDispositivo
);
module.exports = router;
