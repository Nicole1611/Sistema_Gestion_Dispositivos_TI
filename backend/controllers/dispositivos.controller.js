const servicio = require("../services/dispositivos.service");
const { ErrorValidacion } = require("../validators/registro.validator");

async function listarDispositivos(req, res) {
    try {
        return res.json({ datos: await servicio.obtenerDispositivos(req.query.disponibles === "1") });
    } catch (error) {
        console.error("Error al consultar inventario:", error);
        return res.status(500).json({ mensaje: "No se pudo consultar el inventario." });
    }
}
async function registrarDispositivo(req, res) {
    try {
        return res.status(201).json(await servicio.registrarDispositivo(req.body));
    } catch (error) {
        if (error instanceof ErrorValidacion) {
            return res.status(error.estado).json({ mensaje: error.message });
        }
        console.error("Error al registrar dispositivo:", error);
        return res.status(500).json({ mensaje: "No se pudo registrar el dispositivo. Verifique la base de datos." });
    }
}
module.exports = { listarDispositivos, registrarDispositivo };
