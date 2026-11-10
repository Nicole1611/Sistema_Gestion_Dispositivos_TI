const router = require("express").Router();
const { verificarToken, verificarCambioContrasena } = require("../middlewares/auth.middleware");
const { verificarRol } = require("../middlewares/verificarRol");
const { listarEstudiantes, registrarEstudiante } = require("../controllers/estudiantes.controller");
router.use(verificarToken, verificarCambioContrasena, verificarRol("Administrador"));
router.get("/", listarEstudiantes);
router.post("/", registrarEstudiante);
module.exports = router;
