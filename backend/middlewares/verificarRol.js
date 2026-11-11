function verificarRol(...rolesPermitidos) {
    return (req, res, next) => {

        const rolesUsuario = req.usuario.roles || [];

        const tienePermiso = rolesPermitidos.some(rol =>
            rolesUsuario.includes(rol)
        );

        if (!tienePermiso) {
            return res.status(403).json({
                mensaje: "No tienes permisos para realizar esta acción."
            });
        }

        next();
    };
}

module.exports = { verificarRol };