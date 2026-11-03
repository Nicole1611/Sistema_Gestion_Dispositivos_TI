
const { iniciarSesion } = require("../services/auth.service");

async function login(req, res) {
    try {
        const { correo, contrasena } = req.body;

        // Validar que se hayan enviado los datos
        if (!correo || !contrasena) {
            return res.status(400).json({
                mensaje: "Ingrese el correo y la contraseña."
            });
        }

        // Ejecutar la autenticación
        const resultado = await iniciarSesion(
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

module.exports = { login };
