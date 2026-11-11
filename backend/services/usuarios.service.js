
const { conectarBD, sql } = require("../config/database");
const {
    generarContrasenaTemporal,
    encriptarContrasena
} = require("../utils/contrasena");

// Obtener usuarios Administradores y Técnicos

async function obtenerUsuarios() {
    try {
        const pool = await conectarBD();

        const resultado = await pool.request().query(`
            SELECT
                u.id_usuario,
                p.cedula,
                p.nombres,
                p.apellidos,
                p.correo_institucional,
                p.telefono,
                r.nombre AS rol,
                u.estado
            FROM Usuario u
            INNER JOIN Persona p ON u.id_persona = p.id_persona
            INNER JOIN UsuarioRol ur ON u.id_usuario = ur.id_usuario
            INNER JOIN Rol r ON ur.id_rol = r.id_rol
            ORDER BY p.apellidos, p.nombres;
        `);

        return resultado.recordset;

    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        throw error;
    }
}


// Registrar Administrador o Técnico
async function registrarUsuario(datos) {
    const pool = await conectarBD();
    const transaccion = new sql.Transaction(pool);

    try {
        await transaccion.begin();

        const {
            cedula,
            nombres,
            apellidos,
            correo,
            telefono,
            rol
        } = datos;

        // Validar campos obligatorios
        if (!cedula || !nombres || !apellidos || !correo || !rol) {
            throw new Error("Completa todos los campos obligatorios.");
        }

        // Validar cédula
        if (!/^\d{10}$/.test(cedula)) {
            throw new Error("La cédula debe contener 10 dígitos.");
        }

        // Validar correo institucional
        if (!/^[^\s@]+@espoch\.edu\.ec$/i.test(correo.trim())) {
            throw new Error("Ingresa un correo institucional válido de ESPOCH.");
        }

        // Validar rol permitido
        if (!["Administrador", "Técnico"].includes(rol)) {
            throw new Error("Solo se pueden registrar Administradores o Técnicos.");
        }

        // Verificar duplicados
        const duplicados = await transaccion.request()
            .input("cedula", sql.VarChar(10), cedula)
            .input("correo", sql.VarChar(150), correo.trim())
            .query(`
                SELECT
                    CASE WHEN EXISTS (
                        SELECT 1 FROM Persona WHERE cedula = @cedula
                    ) THEN 1 ELSE 0 END AS cedulaExiste,

                    CASE WHEN EXISTS (
                        SELECT 1 FROM Persona WHERE correo_institucional = @correo
                    ) THEN 1 ELSE 0 END AS correoExiste;
            `);

        const repetidos = duplicados.recordset[0];

        if (repetidos.cedulaExiste) {
            throw new Error("La cédula ya se encuentra registrada.");
        }

        if (repetidos.correoExiste) {
            throw new Error("El correo institucional ya está registrado.");
        }

        // Buscar el rol
        const resultadoRol = await transaccion.request()
            .input("rol", sql.VarChar(50), rol)
            .query(`
                SELECT id_rol
                FROM Rol
                WHERE nombre = @rol;
            `);

        if (resultadoRol.recordset.length === 0) {
            throw new Error("El rol seleccionado no existe.");
        }

        const idRol = resultadoRol.recordset[0].id_rol;

        // Registrar persona
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

        // Crear usuario
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

        // Asignar rol
        await transaccion.request()
            .input("id_usuario", sql.Int, idUsuario)
            .input("id_rol", sql.Int, idRol)
            .query(`
                INSERT INTO UsuarioRol (id_usuario, id_rol)
                VALUES (@id_usuario, @id_rol);
            `);

        await transaccion.commit();

        return {
            mensaje: "Usuario registrado correctamente.",
            contrasenaTemporal
        };

    } catch (error) {
        if (transaccion._aborted !== true) {
            try {
                await transaccion.rollback();
            } catch (errorRollback) {
                console.error("Error al revertir el registro:", errorRollback);
            }
        }

        console.error("Error al registrar usuario:", error);
        throw error;
    }
}

module.exports = {
    obtenerUsuarios,
    registrarUsuario
};
