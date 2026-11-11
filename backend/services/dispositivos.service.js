
const { conectarBD, sql } = require("../config/database");

// Obtener los catálogos para los formularios
async function obtenerCatalogos() {
    try {
        const pool = await conectarBD();

        const [tipos, marcas, estados] = await Promise.all([
            pool.request().query(`
                SELECT id_tipo, nombre
                FROM TipoDispositivo
                ORDER BY nombre;
            `),
            pool.request().query(`
                SELECT id_marca, nombre
                FROM Marca
                ORDER BY nombre;
            `),
            pool.request().query(`
                SELECT id_estado, nombre
                FROM EstadoDispositivo
                ORDER BY nombre;
            `)
        ]);

        return {
            tipos: tipos.recordset,
            marcas: marcas.recordset,
            estados: estados.recordset
        };

    } catch (error) {
        console.error("Error al obtener catálogos:", error);
        throw error;
    }
}


// Obtener todos los dispositivos
async function obtenerDispositivos() {
    try {
        const pool = await conectarBD();

        const resultado = await pool.request().query(`
            SELECT
                d.id_dispositivo,
                d.codigo,
                d.nombre,
                d.id_tipo,
                d.id_marca,
                d.id_estado,
                t.nombre AS tipo,
                m.nombre AS marca,
                d.modelo,
                d.numero_serie,
                e.nombre AS estado,
                d.descripcion,
                d.fecha_registro
            FROM Dispositivo d
            INNER JOIN TipoDispositivo t
                ON d.id_tipo = t.id_tipo
            INNER JOIN Marca m
                ON d.id_marca = m.id_marca
            INNER JOIN EstadoDispositivo e
                ON d.id_estado = e.id_estado
            ORDER BY d.fecha_registro DESC;
        `);

        return resultado.recordset;

    } catch (error) {
        console.error("Error al obtener dispositivos:", error);
        throw error;
    }
}



/**
 * Registrar un dispositivo tecnológico
 */
async function registrarDispositivo(datos) {
    const pool = await conectarBD();

    const {
        codigo,
        nombre,
        id_tipo,
        id_marca,
        modelo,
        numero_serie,
        id_estado,
        descripcion
    } = datos;

    // Validar que el código no esté duplicado
    const existente = await pool.request()
        .input("codigo", sql.VarChar(30), codigo)
        .query(`
            SELECT id_dispositivo
            FROM Dispositivo
            WHERE codigo = @codigo;
        `);

    if (existente.recordset.length > 0) {
        throw new Error("El código del dispositivo ya está registrado.");
    }

    // Registrar el dispositivo
    const resultado = await pool.request()
        .input("codigo", sql.VarChar(30), codigo)
        .input("nombre", sql.VarChar(100), nombre)
        .input("id_tipo", sql.Int, Number(id_tipo))
        .input("id_marca", sql.Int, Number(id_marca))
        .input("modelo", sql.VarChar(80), modelo || null)
        .input("numero_serie", sql.VarChar(80), numero_serie || null)
        .input("id_estado", sql.Int, Number(id_estado))
        .input("descripcion", sql.VarChar(250), descripcion || null)
        .query(`
            INSERT INTO Dispositivo (
                codigo,
                nombre,
                id_tipo,
                id_marca,
                modelo,
                numero_serie,
                id_estado,
                descripcion
            )
            OUTPUT INSERTED.id_dispositivo
            VALUES (
                @codigo,
                @nombre,
                @id_tipo,
                @id_marca,
                @modelo,
                @numero_serie,
                @id_estado,
                @descripcion
            );
        `);

    return {
        mensaje: "Dispositivo registrado correctamente.",
        id_dispositivo: resultado.recordset[0].id_dispositivo
    };
}
// Actualizar los datos de un dispositivo (sin modificar su estado)
async function actualizarDispositivo(id, datos) {
    const pool = await conectarBD();

    const {
        codigo,
        nombre,
        id_tipo,
        id_marca,
        modelo,
        numero_serie,
        descripcion
    } = datos;

    // Comprobar que el dispositivo exista
    const dispositivoExistente = await pool.request()
        .input("id_dispositivo", sql.Int, Number(id))
        .query(`
            SELECT id_dispositivo
            FROM Dispositivo
            WHERE id_dispositivo = @id_dispositivo;
        `);

    if (dispositivoExistente.recordset.length === 0) {
        throw new Error("El dispositivo no existe.");
    }

    // Comprobar que el código no pertenezca a otro dispositivo
    const codigoExistente = await pool.request()
        .input("codigo", sql.VarChar(30), codigo)
        .input("id_dispositivo", sql.Int, Number(id))
        .query(`
            SELECT id_dispositivo
            FROM Dispositivo
            WHERE codigo = @codigo
              AND id_dispositivo <> @id_dispositivo;
        `);

    if (codigoExistente.recordset.length > 0) {
        throw new Error("El código ya está registrado en otro dispositivo.");
    }

    // Comprobar que el número de serie no pertenezca a otro dispositivo
    if (numero_serie) {
        const serieExistente = await pool.request()
            .input("numero_serie", sql.VarChar(80), numero_serie)
            .input("id_dispositivo", sql.Int, Number(id))
            .query(`
                SELECT id_dispositivo
                FROM Dispositivo
                WHERE numero_serie = @numero_serie
                  AND id_dispositivo <> @id_dispositivo;
            `);

        if (serieExistente.recordset.length > 0) {
            throw new Error("El número de serie ya está registrado en otro dispositivo.");
        }
    }

    // Actualizar únicamente los datos permitidos.
    // El estado del dispositivo no se modifica aquí.
    await pool.request()
        .input("id_dispositivo", sql.Int, Number(id))
        .input("codigo", sql.VarChar(30), codigo)
        .input("nombre", sql.VarChar(100), nombre)
        .input("id_tipo", sql.Int, Number(id_tipo))
        .input("id_marca", sql.Int, Number(id_marca))
        .input("modelo", sql.VarChar(80), modelo || null)
        .input("numero_serie", sql.VarChar(80), numero_serie || null)
        .input("descripcion", sql.VarChar(250), descripcion || null)
        .query(`
            UPDATE Dispositivo
            SET
                codigo = @codigo,
                nombre = @nombre,
                id_tipo = @id_tipo,
                id_marca = @id_marca,
                modelo = @modelo,
                numero_serie = @numero_serie,
                descripcion = @descripcion
            WHERE id_dispositivo = @id_dispositivo;
        `);

    return {
        mensaje: "Dispositivo actualizado correctamente."
    };
}
module.exports = {
    obtenerCatalogos,
    obtenerDispositivos,
    registrarDispositivo,
    actualizarDispositivo
};
