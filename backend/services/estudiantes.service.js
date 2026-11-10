
const { conectarBD, sql } = require("../config/database");
const {
    generarContrasenaTemporal,
    encriptarContrasena
} = require("../utils/contrasena");

// Obtener todos los estudiantes registrados
async function obtenerEstudiantes() {
    try {
        const pool = await conectarBD();

        const resultado = await pool.request().query(`
            SELECT
                e.id_estudiante,
                e.codigo_estudiante,
                p.cedula,
                p.nombres,
                p.apellidos,
                p.correo_institucional,
                p.telefono,
                e.carrera,
                e.nivel,
                e.estado
            FROM Estudiante e
            INNER JOIN Persona p
                ON e.id_persona = p.id_persona
            ORDER BY p.apellidos, p.nombres;
        `);

        return resultado.recordset;

    } catch (error) {
        console.error("Error al obtener estudiantes:", error);
        throw error;
    }
}

// Registrar un estudiante
async function registrarEstudiante(datos) {
    const pool = await conectarBD();
    const transaccion = new sql.Transaction(pool);

    try {
        await transaccion.begin();

        const {
            cedula,
            codigoEstudiante,
            nombres,
            apellidos,
            correo,
            telefono,
            carrera,
            nivel
        } = datos;

        // Verificar datos duplicados
        const duplicados = await transaccion.request()
            .input("cedula", sql.VarChar(10), cedula)
            .input("codigo", sql.Char(4), codigoEstudiante)
            .input("correo", sql.VarChar(150), correo)
            .query(`
                SELECT
                    CASE WHEN EXISTS (
                        SELECT 1 FROM Persona WHERE cedula = @cedula
                    ) THEN 1 ELSE 0 END AS cedulaExiste,

                    CASE WHEN EXISTS (
                        SELECT 1 FROM Estudiante
                        WHERE codigo_estudiante = @codigo
                    ) THEN 1 ELSE 0 END AS codigoExiste,

                    CASE WHEN EXISTS (
                        SELECT 1 FROM Persona
                        WHERE correo_institucional = @correo
                    ) THEN 1 ELSE 0 END AS correoExiste;
            `);

        const repetidos = duplicados.recordset[0];

        if (repetidos.cedulaExiste) {
            throw new Error("La cédula ya se encuentra registrada.");
        }

        if (repetidos.codigoExiste) {
            throw new Error("El código de estudiante ya está registrado.");
        }

        if (repetidos.correoExiste) {
            throw new Error("El correo institucional ya está registrado.");
        }

        // Buscar el rol Estudiante
        const resultadoRol = await transaccion.request().query(`
            SELECT id_rol
            FROM Rol
            WHERE nombre = 'Estudiante';
        `);

        if (resultadoRol.recordset.length === 0) {
            throw new Error("No existe el rol Estudiante en la base de datos.");
        }

        const idRol = resultadoRol.recordset[0].id_rol;

        // Guardar datos personales
        const resultadoPersona = await transaccion.request()
            .input("cedula", sql.VarChar(10), cedula)
            .input("nombres", sql.VarChar(100), nombres)
            .input("apellidos", sql.VarChar(100), apellidos)
            .input("correo", sql.VarChar(150), correo)
            .input("telefono", sql.VarChar(15), telefono || null)
            .query(`
                INSERT INTO Persona (
                    cedula,
                    nombres,
                    apellidos,
                    correo_institucional,
                    telefono
                )
                OUTPUT INSERTED.id_persona
                VALUES (
                    @cedula,
                    @nombres,
                    @apellidos,
                    @correo,
                    @telefono
                );
            `);

        const idPersona = resultadoPersona.recordset[0].id_persona;

        // Generar contraseña temporal y encriptarla
        const contrasenaTemporal = generarContrasenaTemporal(cedula);
        const hash = await encriptarContrasena(contrasenaTemporal);

        // Crear cuenta de usuario
        const resultadoUsuario = await transaccion.request()
            .input("id_persona", sql.Int, idPersona)
            .input("hash", sql.VarChar(255), hash)
            .query(`
                INSERT INTO Usuario (
                    id_persona,
                    contrasena_hash,
                    debe_cambiar_contrasena
                )
                OUTPUT INSERTED.id_usuario
                VALUES (
                    @id_persona,
                    @hash,
                    1
                );
            `);

        const idUsuario = resultadoUsuario.recordset[0].id_usuario;

        // Asignar rol Estudiante
        await transaccion.request()
            .input("id_usuario", sql.Int, idUsuario)
            .input("id_rol", sql.Int, idRol)
            .query(`
                INSERT INTO UsuarioRol (id_usuario, id_rol)
                VALUES (@id_usuario, @id_rol);
            `);

        // Guardar información académica
        await transaccion.request()
            .input("id_persona", sql.Int, idPersona)
            .input("codigo", sql.Char(4), codigoEstudiante)
            .input("carrera", sql.VarChar(100), carrera)
            .input("nivel", sql.Int, Number(nivel))
            .query(`
                INSERT INTO Estudiante (
                    id_persona,
                    codigo_estudiante,
                    carrera,
                    nivel
                )
                VALUES (
                    @id_persona,
                    @codigo,
                    @carrera,
                    @nivel
                );
            `);

        await transaccion.commit();

        return {
            mensaje: "Estudiante registrado correctamente.",
            contrasenaTemporal
        };

    } catch (error) {
        await transaccion.rollback();
        console.error("Error al registrar estudiante:", error);
        throw error;
    }
}

module.exports = {
    obtenerEstudiantes,
    registrarEstudiante
};
