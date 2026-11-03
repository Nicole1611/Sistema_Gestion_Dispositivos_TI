
const { conectarBD, sql } = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function iniciarSesion(correo, contrasena) {
    try {
        const pool = await conectarBD();

        // Buscar al usuario y sus roles
        const resultado = await pool.request()
            .input("correo", sql.VarChar(150), correo)
            .query(`
                SELECT
                    U.id_usuario,
                    U.contrasena_hash,
                    U.estado,
                    P.id_persona,
                    P.nombres,
                    P.apellidos,
                    P.correo_institucional,
                    R.nombre AS rol
                FROM Usuario U
                INNER JOIN Persona P
                    ON U.id_persona = P.id_persona
                INNER JOIN UsuarioRol UR
                    ON U.id_usuario = UR.id_usuario
                INNER JOIN Rol R
                    ON UR.id_rol = R.id_rol
                WHERE P.correo_institucional = @correo
            `);

        if (resultado.recordset.length === 0) {
            throw new Error("Correo o contraseña incorrectos.");
        }

        const usuario = resultado.recordset[0];

        // Comprobar estado de la cuenta
        if (usuario.estado !== "Activo") {
            throw new Error("La cuenta se encuentra inactiva.");
        }

        // Verificar contraseña
        const contrasenaValida = await bcrypt.compare(
            contrasena,
            usuario.contrasena_hash
        );

        if (!contrasenaValida) {
            throw new Error("Correo o contraseña incorrectos.");
        }

        // Obtener los roles del usuario
        const roles = [
            ...new Set(resultado.recordset.map(fila => fila.rol))
        ];

        // Generar token
        const token = jwt.sign(
            {
                id_usuario: usuario.id_usuario,
                roles: roles
            },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        return {
            mensaje: "Inicio de sesión exitoso.",
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                id_persona: usuario.id_persona,
                nombres: usuario.nombres,
                apellidos: usuario.apellidos,
                correo: usuario.correo_institucional,
                roles
            }
        };

    } catch (error) {
        throw error;
    }
}

module.exports = { iniciarSesion };
