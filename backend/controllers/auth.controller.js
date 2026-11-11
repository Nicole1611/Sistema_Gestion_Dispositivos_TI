const jwt = require("jsonwebtoken");
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

// Cambiar contraseña
async function cambiarContrasena(req, res) {
    try {
        const {
            contrasenaActual,
            contrasenaNueva,
            confirmarContrasena
        } = req.body;

        // Validar los tres campos obligatorios
        if (!contrasenaActual || !contrasenaNueva || !confirmarContrasena) {
            return res.status(400).json({
                mensaje: "Complete todos los campos de contraseña."
            });
        }

        // Verificar que las contraseñas coincidan
        if (contrasenaNueva !== confirmarContrasena) {
            return res.status(400).json({
                mensaje: "Las contraseñas no coinciden."
            });
        }

        const resultado = await authService.cambiarContrasena(
            req.usuario.id_usuario,
            contrasenaActual,
            contrasenaNueva
        );

       // Generar un nuevo token sin obligación de cambiar contraseña
const nuevoToken = jwt.sign(
    {
        id_usuario: req.usuario.id_usuario,
        roles: req.usuario.roles,
        debe_cambiar_contrasena: false
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
);

return res.status(200).json({
    ...resultado,
    token: nuevoToken
});

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