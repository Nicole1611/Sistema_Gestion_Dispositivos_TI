const jwt = require("jsonwebtoken");

function verificarToken(req, res, next) {
    const encabezado = req.headers.authorization;

    if (!encabezado || !encabezado.startsWith("Bearer ")) {
        return res.status(401).json({
            mensaje: "Acceso no autorizado."
        });
    }

    const token = encabezado.split(" ")[1];

    try {
        const datosUsuario = jwt.verify(token, process.env.JWT_SECRET);

        req.usuario = datosUsuario;

        next();

    } catch (error) {
        return res.status(401).json({
            mensaje: "Sesión inválida o expirada."
        });
    }
}
// Verificar si el usuario debe cambiar su contraseña
function verificarCambioContrasena(req, res, next) {

    if (req.usuario?.debe_cambiar_contrasena) {
        return res.status(403).json({
            mensaje: "Debes cambiar tu contraseña antes de continuar.",
            debe_cambiar_contrasena: true
        });
    }

    next();
}
function verificarAdministrador(req, res, next) {

    const roles = req.usuario?.roles || [];

    if (!roles.includes("Administrador")) {
        return res.status(403).json({
            mensaje: "No tienes permisos para realizar esta acción."
        });
    }

    next();
}

module.exports = {
    verificarToken,
    verificarAdministrador,
    verificarCambioContrasena
};