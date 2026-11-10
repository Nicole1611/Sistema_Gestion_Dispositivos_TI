const { conectarBD, sql } = require("../config/database");
const {
    crearUsuarioEstudiante
} = require("../factories/usuario.factory");

const {
    validarEstudiante,
    ErrorValidacion
} = require("../validators/registro.validator");

async function obtenerEstudiantes() {
    const pool = await conectarBD();

    const resultado = await pool.request().query(`
        SELECT
            E.id_estudiante,
            E.matricula,
            E.carrera,
            E.nivel,
            E.estado,
            P.cedula,
            P.nombres,
            P.apellidos,
            P.correo_institucional
        FROM dbo.Estudiante E
        INNER JOIN dbo.Persona P
            ON P.id_persona = E.id_persona
        ORDER BY E.id_estudiante DESC;
    `);

    return resultado.recordset;
}

async function registrarEstudiante(datos) {
    const estudiante = validarEstudiante(datos);

    if (estudiante.matricula.length > 20) {
        throw new ErrorValidacion(
            "La matrícula no puede superar 20 caracteres."
        );
    }

    const pool = await conectarBD();
    const cuentaNueva = await crearUsuarioEstudiante();
    const transaccion = new sql.Transaction(pool);
    let iniciada = false;

    try {
        await transaccion.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        iniciada = true;

        const duplicados = await transaccion.request()
            .input("cedula", sql.VarChar(10), estudiante.cedula)
            .input("correo", sql.VarChar(150), estudiante.correo)
            .input("matricula", sql.VarChar(20), estudiante.matricula)
            .query(`
                SELECT
                    CASE WHEN EXISTS (
                        SELECT 1 FROM dbo.Persona
                        WHERE cedula = @cedula
                    ) THEN 1 ELSE 0 END AS cedulaExiste,

                    CASE WHEN EXISTS (
                        SELECT 1 FROM dbo.Persona
                        WHERE correo_institucional = @correo
                    ) THEN 1 ELSE 0 END AS correoExiste,

                    CASE WHEN EXISTS (
                        SELECT 1 FROM dbo.Estudiante
                        WHERE matricula = @matricula
                    ) THEN 1 ELSE 0 END AS matriculaExiste;
            `);

        const repetidos = duplicados.recordset[0];

        if (repetidos.cedulaExiste) {
            throw new ErrorValidacion(
                "La cédula ya se encuentra registrada.", 409
            );
        }

        if (repetidos.correoExiste) {
            throw new ErrorValidacion(
                "El correo ya se encuentra registrado.", 409
            );
        }

        if (repetidos.matriculaExiste) {
            throw new ErrorValidacion(
                "La matrícula ya se encuentra registrada.", 409
            );
        }

        let rol = await transaccion.request().query(`
            SELECT id_rol
            FROM dbo.Rol
            WHERE nombre = 'Estudiante';
        `);

        if (!rol.recordset.length) {
            rol = await transaccion.request().query(`
                INSERT INTO dbo.Rol (nombre, descripcion)
                OUTPUT INSERTED.id_rol
                VALUES ('Estudiante', 'Usuario estudiante');
            `);
        }

        const persona = await transaccion.request()
            .input("cedula", sql.VarChar(10), estudiante.cedula)
            .input("nombres", sql.NVarChar(100), estudiante.nombres)
            .input("apellidos", sql.NVarChar(100), estudiante.apellidos)
            .input("correo", sql.VarChar(150), estudiante.correo)
            .query(`
                INSERT INTO dbo.Persona (
                    cedula,
                    nombres,
                    apellidos,
                    correo_institucional
                )
                OUTPUT INSERTED.id_persona
                VALUES (
                    @cedula,
                    @nombres,
                    @apellidos,
                    @correo
                );
            `);

        const idPersona = persona.recordset[0].id_persona;

        const usuario = await transaccion.request()
            .input("idPersona", sql.Int, idPersona)
            .input(
                "hash",
                sql.VarChar(255),
                cuentaNueva.contrasenaHash
            )
            .query(`
                INSERT INTO dbo.Usuario (
                    id_persona,
                    contrasena_hash,
                    estado,
                    debe_cambiar_contrasena
                )
                OUTPUT INSERTED.id_usuario
                VALUES (@idPersona, @hash, 'Activo', 1);
            `);

        await transaccion.request()
            .input(
                "idUsuario",
                sql.Int,
                usuario.recordset[0].id_usuario
            )
            .input("idRol", sql.Int, rol.recordset[0].id_rol)
            .query(`
                INSERT INTO dbo.UsuarioRol (id_usuario, id_rol)
                VALUES (@idUsuario, @idRol);
            `);

        const registro = await transaccion.request()
            .input("idPersona", sql.Int, idPersona)
            .input("matricula", sql.VarChar(20), estudiante.matricula)
            .input(
                "carrera",
                sql.NVarChar(100),
                "Tecnologías de la Información"
            )
            .query(`
                INSERT INTO dbo.Estudiante (
                    id_persona,
                    matricula,
                    carrera,
                    nivel,
                    estado
                )
                OUTPUT INSERTED.id_estudiante
                VALUES (
                    @idPersona,
                    @matricula,
                    @carrera,
                    NULL,
                    'Activo'
                );
            `);

        await transaccion.commit();
        iniciada = false;

        return {
            mensaje: "Estudiante y cuenta guardados correctamente.",
            id_estudiante: registro.recordset[0].id_estudiante,
            contrasenaTemporal: cuentaNueva.contrasenaTemporal
        };

    } catch (error) {
        if (iniciada) {
            try {
                await transaccion.rollback();
            } catch {
                // SQL Server pudo revertir la transacción previamente.
            }
        }

        if (error instanceof ErrorValidacion) {
            throw error;
        }

        if (error.number === 2601 || error.number === 2627) {
            throw new ErrorValidacion(
                "La cédula, el correo o la matrícula ya están registrados.",
                409
            );
        }

        throw error;
    }
}

module.exports = {
    obtenerEstudiantes,
    registrarEstudiante
};