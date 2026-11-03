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

module.exports = { verificarToken };