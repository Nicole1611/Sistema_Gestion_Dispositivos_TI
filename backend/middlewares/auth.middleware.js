const jwt = require("jsonwebtoken");
const { conectarBD, sql } = require("../config/database");

async function verificarToken(req, res, next) {
    const encabezado = req.headers.authorization || "";

    if (!encabezado.startsWith("Bearer ")) {
        return res.status(401).json({
            mensaje: "Acceso no autorizado."
        });
    }

    let datos;

    try {
        datos = jwt.verify(
            encabezado.slice(7),
            process.env.JWT_SECRET,
            { algorithms: ["HS256"] }
        );

        if (!Number.isInteger(datos.id_usuario)) {
            throw new Error("Token inválido.");
        }
    } catch {
        return res.status(401).json({
            mensaje: "Sesión inválida o expirada."
        });
    }

    try {
        const pool = await conectarBD();

        const resultado = await pool.request()
            .input("id", sql.Int, datos.id_usuario)
            .query(`
                SELECT
                    U.id_usuario,
                    U.estado,
                    U.version_sesion,
                    U.debe_cambiar_contrasena,
                    R.nombre AS rol
                FROM dbo.Usuario U
                LEFT JOIN dbo.UsuarioRol UR
                    ON UR.id_usuario = U.id_usuario
                LEFT JOIN dbo.Rol R
                    ON R.id_rol = UR.id_rol
                WHERE U.id_usuario = @id;
            `);

        const usuario = resultado.recordset[0];

        if (!usuario) {
            return res.status(401).json({
                mensaje: "Sesión inválida."
            });
        }

        const estado = String(usuario.estado)
            .trim()
            .toLowerCase();

        if (!["activo", "activa"].includes(estado)) {
            return res.status(403).json({
                mensaje: "La cuenta se encuentra inactiva."
            });
        }

        if (
            Number(datos.version_sesion ?? 0) !==
            usuario.version_sesion
        ) {
            return res.status(401).json({
                mensaje: "La sesión terminó. Inicia sesión nuevamente."
            });
        }

        // Consulta los roles actuales, no solo los del token antiguo.
        req.usuario = {
            id_usuario: usuario.id_usuario,
            version_sesion: usuario.version_sesion,
            debe_cambiar_contrasena:
                usuario.debe_cambiar_contrasena,
            roles: [
                ...new Set(
                    resultado.recordset
                        .map(fila => fila.rol)
                        .filter(Boolean)
                )
            ]
        };

        next();

    } catch (error) {
        console.error("Error al comprobar la sesión:", error.message);

        return res.status(503).json({
            mensaje: "No se pudo comprobar la sesión."
        });
    }
}

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
    if (!req.usuario?.roles?.includes("Administrador")) {
        return res.status(403).json({
            mensaje: "Solo el administrador puede realizar esta acción."
        });
    }

    next();
}

module.exports = {
    verificarToken,
    verificarCambioContrasena,
    verificarAdministrador
};