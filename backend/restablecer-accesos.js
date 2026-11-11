const { conectarBD, sql } = require("./config/database");
const bcrypt = require("bcryptjs");

async function restablecerAccesos() {
    const cuentas = [
        {
            correo: "anthony.moreira@espoch.edu.ec",
            contrasena: "Anthony2026*TI"
        },
        {
            correo: "estudiante.prueba@espoch.edu.ec",
            contrasena: "Estudiante2026*"
        }
    ];

    try {
        const pool = await conectarBD();

        for (const cuenta of cuentas) {
            const hash = await bcrypt.hash(cuenta.contrasena, 12);

            const resultado = await pool.request()
                .input("correo", sql.VarChar(150), cuenta.correo)
                .input("hash", sql.VarChar(255), hash)
                .query(`
                    UPDATE U
                    SET
                        contrasena_hash = @hash,
                        debe_cambiar_contrasena = 1,
                        version_sesion = version_sesion + 1
                    OUTPUT
                        INSERTED.id_usuario,
                        INSERTED.estado
                    FROM dbo.Usuario U
                    INNER JOIN dbo.Persona P
                        ON P.id_persona = U.id_persona
                    WHERE P.correo_institucional = @correo;
                `);

            if (!resultado.recordset.length) {
                console.log("Cuenta no encontrada:", cuenta.correo);
                continue;
            }

            console.log("\nContraseña restablecida.");
            console.log("Correo:", cuenta.correo);
            console.log("Contraseña temporal:", cuenta.contrasena);
            console.log("Estado:", resultado.recordset[0].estado);
        }

    } catch (error) {
        console.error("Error:", error.message);
        process.exitCode = 1;
    } finally {
        await sql.close();
    }
}

restablecerAccesos();