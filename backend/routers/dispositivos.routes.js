const router = require("express").Router();
const { verificarToken, verificarCambioContrasena } = require("../middlewares/auth.middleware");
const { verificarRol } = require("../middlewares/verificarRol");
const { listarDispositivos, registrarDispositivo } = require("../controllers/dispositivos.controller");
router.use(verificarToken, verificarCambioContrasena);
// Catálogo para el módulo futuro de préstamos: solo equipos disponibles.
router.get("/catalogo", verificarRol("Administrador", "Técnico", "Docente", "Estudiante"),
    (req, res, next) => { req.query.disponibles = "1"; next(); }, listarDispositivos);
router.get("/", verificarRol("Administrador", "Técnico"), listarDispositivos);
router.post("/", verificarRol("Administrador", "Técnico"), registrarDispositivo);
module.exports = router;
