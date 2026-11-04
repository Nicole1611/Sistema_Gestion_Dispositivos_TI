
const { conectarBD, sql } = require("./config/database");
const bcrypt = require("bcryptjs");

async function actualizarContrasenas() {
    try {
        const pool = await conectarBD();

        const usuarios = [
            {
                correo: "admin.prueba@espoch.edu.ec",
                contrasena: "Admin2026*"
            },
            {
                correo: "tecnico.prueba@espoch.edu.ec",
                contrasena: "Tecni2026*"
            },
            {
                correo: "docente.prueba@espoch.edu.ec",
                contrasena: "Docen2026*"
            },
            {
                correo: "estudiante.prueba@espoch.edu.ec",
                contrasena: "Estud2026*"
            }
        ];

        for (const usuario of usuarios) {

            if (usuario.contrasena.length > 12) {
                throw new Error("Una contraseña supera los 12 caracteres.");
            }

            const hash = await bcrypt.hash(usuario.contrasena, 10);

            const resultado = await pool.request()
                .input("correo", sql.VarChar(150), usuario.correo)
                .input("hash", sql.VarChar(255), hash)
                .query(`
                    UPDATE U
                    SET
                        U.contrasena_hash = @hash,
                        U.debe_cambiar_contrasena = 0
                    FROM Usuario U
                    INNER JOIN Persona P
                        ON U.id_persona = P.id_persona
                    WHERE P.correo_institucional = @correo;
                `);

            if (resultado.rowsAffected[0] === 0) {
                console.log("Usuario no encontrado:", usuario.correo);
            } else {
                console.log("Contraseña actualizada:", usuario.correo);
            }
        }

        await pool.close();

        console.log("Proceso finalizado.");

    } catch (error) {
        console.error("Error:", error.message);
    }
}

actualizarContrasenas();
