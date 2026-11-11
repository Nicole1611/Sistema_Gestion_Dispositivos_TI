
const { conectarBD, sql } = require("../config/database");
const {
    generarContrasenaTemporal,
    encriptarContrasena
} = require("../utils/contrasena");

// Obtener todos los docentes registrados
async function obtenerDocentes() {
    try {
        const pool = await conectarBD();

        const resultado = await pool.request().query(`
            SELECT
                d.id_docente,
                d.codigo_docente,
                p.cedula,
                p.nombres,
                p.apellidos,
                p.correo_institucional,
                p.telefono,
                d.estado
            FROM Docente d
            INNER JOIN Persona p
                ON d.id_persona = p.id_persona
            ORDER BY p.apellidos, p.nombres;
        `);

        return resultado.recordset;

    } catch (error) {
        console.error("Error al obtener docentes:", error);
        throw error;
    }
}

// Registrar un docente
async function registrarDocente(datos) {
    const pool = await conectarBD();
    const transaccion = new sql.Transaction(pool);

    try {
        await transaccion.begin();

        const {
            cedula,
            codigoDocente,
            nombres,
            apellidos,
            correo,
            telefono
        } = datos;

        // Validar campos obligatorios
        if (
            !cedula ||
            !codigoDocente ||
            !nombres ||
            !apellidos ||
            !correo
        ) {
            throw new Error("Completa todos los campos obligatorios.");
        }

        // Validar formatos
        if (!/^\d{10}$/.test(cedula)) {
            throw new Error("La cédula debe contener 10 dígitos.");
        }

        if (!/^[^\s@]+@espoch\.edu\.ec$/i.test(correo)) {
            throw new Error(
                "Ingresa un correo institucional válido de ESPOCH."
            );
        }

        if (codigoDocente.trim().length > 20) {
            throw new Error(
                "El código del docente no puede superar los 20 caracteres."
            );
        }

        // Verificar datos duplicados
        const duplicados = await transaccion.request()
            .input("cedula", sql.VarChar(10), cedula)
            .input("codigo", sql.VarChar(20), codigoDocente.trim())
            .input("correo", sql.VarChar(150), correo.trim())
            .query(`
                SELECT
                    CASE WHEN EXISTS (
                        SELECT 1 FROM Persona
                        WHERE cedula = @cedula
                    ) THEN 1 ELSE 0 END AS cedulaExiste,

                    CASE WHEN EXISTS (
                        SELECT 1 FROM Docente
                        WHERE codigo_docente = @codigo
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
            throw new Error("El código del docente ya está registrado.");
        }

        if (repetidos.correoExiste) {
            throw new Error("El correo institucional ya está registrado.");
        }

        // Buscar el rol Docente
        const resultadoRol = await transaccion.request().query(`
            SELECT id_rol
            FROM Rol
            WHERE nombre = 'Docente';
        `);

        if (resultadoRol.recordset.length === 0) {
            throw new Error(
                "No existe el rol Docente en la base de datos."
            );
        }

        const idRol = resultadoRol.recordset[0].id_rol;

        // Guardar datos personales
        const resultadoPersona = await transaccion.request()
            .input("cedula", sql.VarChar(10), cedula)
            .input("nombres", sql.VarChar(100), nombres.trim())
            .input("apellidos", sql.VarChar(100), apellidos.trim())
            .input("correo", sql.VarChar(150), correo.trim())
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

        // Generar contraseña temporal
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

        // Asignar rol Docente
        await transaccion.request()
            .input("id_usuario", sql.Int, idUsuario)
            .input("id_rol", sql.Int, idRol)
            .query(`
                INSERT INTO UsuarioRol (id_usuario, id_rol)
                VALUES (@id_usuario, @id_rol);
            `);

        // Guardar información del docente
        await transaccion.request()
            .input("id_persona", sql.Int, idPersona)
            .input("codigo", sql.VarChar(20), codigoDocente.trim())
            .query(`
                INSERT INTO Docente (
                    id_persona,
                    codigo_docente
                )
                VALUES (
                    @id_persona,
                    @codigo
                );
            `);

        await transaccion.commit();

        return {
            mensaje: "Docente registrado correctamente.",
            contrasenaTemporal
        };

    } catch (error) {
        if (transaccion._aborted !== true) {
            try {
                await transaccion.rollback();
            } catch (errorRollback) {
                console.error(
                    "Error al revertir el registro del docente:",
                    errorRollback
                );
            }
        }

        console.error("Error al registrar docente:", error);
        throw error;
    }
}

module.exports = {
    obtenerDocentes,
    registrarDocente
};
