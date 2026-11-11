
const {
    obtenerUsuarios,
    registrarUsuario
} = require("../services/usuarios.service");

// Consultar usuarios
async function listarUsuarios(req, res) {
    try {
        const usuarios = await obtenerUsuarios();

        return res.status(200).json({
            mensaje: "Usuarios consultados correctamente.",
            datos: usuarios
        });

    } catch (error) {
        console.error("Error al consultar usuarios:", error);

        return res.status(500).json({
            mensaje: "Error al consultar los usuarios."
        });
    }
}

// Registrar usuario
async function crearUsuario(req, res) {
    try {
        const resultado = await registrarUsuario(req.body);

        return res.status(201).json({
            mensaje: resultado.mensaje,
            contrasenaTemporal: resultado.contrasenaTemporal
        });

    } catch (error) {
        console.error("Error al registrar usuario:", error);

        return res.status(400).json({
            mensaje: error.message
        });
    }
}

module.exports = {
    listarUsuarios,
    crearUsuario
};
