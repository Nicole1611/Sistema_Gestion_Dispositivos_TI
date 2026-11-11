
const { conectarBD, sql } = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function iniciarSesion(correo, contrasena) {
    try {
            if (!contrasena || contrasena.length < 10 || contrasena.length > 64) {
            throw new Error("La contraseña debe tener entre 12 y 64 caracteres.");
        }
        const pool = await conectarBD();

        // Buscar al usuario y sus roles
        const resultado = await pool.request()
            .input("correo", sql.VarChar(150), correo)
            .query(`
                SELECT
                    U.id_usuario,
                    U.contrasena_hash,
                    U.estado,
                    U.debe_cambiar_contrasena,
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
                roles: roles,
                debe_cambiar_contrasena: usuario.debe_cambiar_contrasena
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
                roles,
                debe_cambiar_contrasena: usuario.debe_cambiar_contrasena
            }
        };

    } catch (error) {
        throw error;
    }
}
// Cambiar contraseña del usuario
async function cambiarContrasena(id_usuario, contrasenaActual, contrasenaNueva) {
    try {
        if (
        !contrasenaNueva ||
        contrasenaNueva.length < 10 ||
        contrasenaNueva.length > 64
    ) {
        throw new Error("La nueva contraseña debe tener entre 12 y 64 caracteres.");
    }

        const pool = await conectarBD();

        // Consultar contraseña actual y cédula
const resultado = await pool.request()
    .input("id_usuario", sql.Int, id_usuario)
    .query(`
        SELECT
            U.contrasena_hash,
            P.cedula
        FROM Usuario U
        INNER JOIN Persona P
            ON U.id_persona = P.id_persona
        WHERE U.id_usuario = @id_usuario
    `);

        if (resultado.recordset.length === 0) {
            throw new Error("Usuario no encontrado.");
        }

        const hashActual = resultado.recordset[0].contrasena_hash;
        const cedula = resultado.recordset[0].cedula;

        // La nueva contraseña no puede ser igual a la cédula
        if (contrasenaNueva === cedula) {
            throw new Error("La nueva contraseña no puede ser igual a su número de cédula.");
        }
        // Verificar contraseña actual
        const coincide = await bcrypt.compare(
            contrasenaActual,
            hashActual
        );

        if (!coincide) {
            throw new Error("La contraseña actual es incorrecta.");
        }

        // Evitar reutilizar la contraseña actual
        const esLaMisma = await bcrypt.compare(
            contrasenaNueva,
            hashActual
        );

        if (esLaMisma) {
            throw new Error("La nueva contraseña debe ser diferente a la actual.");
        }
        // Generar hash de la nueva contraseña
        const nuevoHash = await bcrypt.hash(contrasenaNueva, 10);

        // Actualizar contraseña y quitar obligación de cambio
        await pool.request()
            .input("id_usuario", sql.Int, id_usuario)
            .input("contrasena_hash", sql.VarChar(255), nuevoHash)
            .query(`
                UPDATE Usuario
                SET contrasena_hash = @contrasena_hash,
                    debe_cambiar_contrasena = 0
                WHERE id_usuario = @id_usuario
            `);

        return {
            mensaje: "Contraseña actualizada correctamente."
        };

    } catch (error) {
        throw error;
    }
}
module.exports = { iniciarSesion, cambiarContrasena };
