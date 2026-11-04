const authService = require("../services/auth.service");

// Iniciar sesión
async function login(req, res) {
    try {
        const { correo, contrasena } = req.body;

        if (!correo || !contrasena) {
            return res.status(400).json({
                mensaje: "Ingrese el correo y la contraseña."
            });
        }

        const resultado = await authService.iniciarSesion(
            correo.trim(),
            contrasena
        );

        return res.status(200).json(resultado);

    } catch (error) {
        console.error("Error en login:", error.message);

        return res.status(401).json({
            mensaje: error.message
        });
    }
}

// Cambiar contraseña
async function cambiarContrasena(req, res) {
    try {
        const { contrasenaActual, contrasenaNueva } = req.body;

        if (!contrasenaActual || !contrasenaNueva) {
            return res.status(400).json({
                mensaje: "Ingrese la contraseña actual y la nueva."
            });
        }

        const resultado = await authService.cambiarContrasena(
            req.usuario.id_usuario,
            contrasenaActual,
            contrasenaNueva
        );

        return res.status(200).json(resultado);

    } catch (error) {
        return res.status(400).json({
            mensaje: error.message
        });
    }
}

module.exports = {
    login,
    cambiarContrasena
};