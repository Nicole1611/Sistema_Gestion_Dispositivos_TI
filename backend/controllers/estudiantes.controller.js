const servicio = require("../services/estudiantes.service");
const { ErrorValidacion } = require("../validators/registro.validator");

async function listarEstudiantes(req, res) {
    try {
        return res.json({ datos: await servicio.obtenerEstudiantes() });
    } catch (error) {
        console.error("Error al listar estudiantes:", error);
        return res.status(500).json({ mensaje: "No se pudo consultar el listado de estudiantes." });
    }
}
async function registrarEstudiante(req, res) {
    try {
        return res.status(201).json(await servicio.registrarEstudiante(req.body));
    } catch (error) {
        if (error instanceof ErrorValidacion) {
            return res.status(error.estado).json({ mensaje: error.message });
        }
        console.error("Error al registrar estudiante:", error);
        return res.status(500).json({ mensaje: "No se pudo registrar el estudiante. Verifique la base de datos." });
    }
}
module.exports = { listarEstudiantes, registrarEstudiante };
