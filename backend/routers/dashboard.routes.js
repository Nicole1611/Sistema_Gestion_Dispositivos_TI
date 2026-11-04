
const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboard.controller");

const {
    verificarToken,
    verificarCambioContrasena,
    verificarAdministrador
} = require("../middlewares/auth.middleware");

router.get(
    "/estadisticas",
    verificarToken,
    verificarCambioContrasena,
    verificarAdministrador,
    dashboardController.consultarEstadisticas
);

module.exports = router;
