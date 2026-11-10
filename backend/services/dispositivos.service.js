const { conectarBD, sql } = require("../config/database");

const {
    validarDispositivo,
    ErrorValidacion
} = require("../validators/registro.validator");

async function obtenerDispositivos(soloDisponibles = false) {
    const pool = await conectarBD();

    const resultado = await pool.request()
        .input("soloDisponibles", sql.Bit, !!soloDisponibles)
        .query(`
            SELECT
                D.id_dispositivo,
                D.codigo AS codigo_inventario,
                D.nombre,
                T.nombre AS tipo,
                M.nombre AS marca,
                D.modelo,
                D.numero_serie,
                D.descripcion,
                H.observaciones,
                CONVERT(
                    VARCHAR(10),
                    H.fecha_adquisicion,
                    23
                ) AS fecha_adquisicion,
                E.nombre AS estado
            FROM dbo.Dispositivo D
            INNER JOIN dbo.TipoDispositivo T
                ON T.id_tipo = D.id_tipo
            INNER JOIN dbo.Marca M
                ON M.id_marca = D.id_marca
            INNER JOIN dbo.EstadoDispositivo E
                ON E.id_estado = D.id_estado
            LEFT JOIN dbo.HU17_DetalleDispositivo H
                ON H.id_dispositivo = D.id_dispositivo
            WHERE @soloDisponibles = 0
               OR E.nombre = 'Disponible'
            ORDER BY D.id_dispositivo DESC;
        `);

    return resultado.recordset;
}

// Los nombres de tablas y columnas provienen solo de esta lista fija.
async function obtenerOCrearCatalogo(transaccion, catalogo, nombre) {
    const catalogos = {
        tipo: {
            tabla: "TipoDispositivo",
            columna: "id_tipo",
            tipo: sql.VarChar(50)
        },
        marca: {
            tabla: "Marca",
            columna: "id_marca",
            tipo: sql.NVarChar(50)
        },
        estado: {
            tabla: "EstadoDispositivo",
            columna: "id_estado",
            tipo: sql.VarChar(30)
        }
    };

    const config = catalogos[catalogo];

    if (!config) {
        throw new Error("Catálogo no permitido.");
    }

    const existente = await transaccion.request()
        .input("nombre", config.tipo, nombre)
        .query(`
            SELECT ${config.columna} AS id
            FROM dbo.${config.tabla}
            WHERE nombre = @nombre;
        `);

    if (existente.recordset.length) {
        return existente.recordset[0].id;
    }

    const creado = await transaccion.request()
        .input("nombre", config.tipo, nombre)
        .query(`
            INSERT INTO dbo.${config.tabla} (nombre)
            OUTPUT INSERTED.${config.columna} AS id
            VALUES (@nombre);
        `);

    return creado.recordset[0].id;
}

function comprobarLongitud(valor, limite, nombre) {
    if (valor != null && valor.length > limite) {
        throw new ErrorValidacion(
            `${nombre} no puede superar ${limite} caracteres.`
        );
    }
}

async function registrarDispositivo(datos) {
    const dispositivo = validarDispositivo(datos);

    // Límites reales de tus columnas SQL.
    comprobarLongitud(
        dispositivo.codigoInventario, 30, "El código"
    );
    comprobarLongitud(
        dispositivo.nombre, 100, "El nombre"
    );
    comprobarLongitud(
        dispositivo.marca, 50, "La marca"
    );
    comprobarLongitud(
        dispositivo.numeroSerie, 80, "El número de serie"
    );
    comprobarLongitud(
        dispositivo.descripcion, 250, "La descripción"
    );
    comprobarLongitud(
        dispositivo.observaciones, 500, "Las observaciones"
    );

    const pool = await conectarBD();
    const transaccion = new sql.Transaction(pool);
    let iniciada = false;

    try {
        await transaccion.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        iniciada = true;

        const duplicados = await transaccion.request()
            .input(
                "codigo",
                sql.VarChar(30),
                dispositivo.codigoInventario
            )
            .input(
                "serie",
                sql.VarChar(80),
                dispositivo.numeroSerie
            )
            .query(`
                SELECT id_dispositivo
                FROM dbo.Dispositivo
                WHERE codigo = @codigo
                   OR (
                       @serie IS NOT NULL
                       AND numero_serie = @serie
                   );
            `);

        if (duplicados.recordset.length) {
            throw new ErrorValidacion(
                "El código o número de serie ya está registrado.",
                409
            );
        }

        const idTipo = await obtenerOCrearCatalogo(
            transaccion,
            "tipo",
            dispositivo.tipo
        );

        const idMarca = await obtenerOCrearCatalogo(
            transaccion,
            "marca",
            dispositivo.marca
        );

        // El formulario usa "En Mantenimiento".
        // Si ya existe "Mantenimiento", reutilizamos ese estado.
        let nombreEstado = dispositivo.estado;

        if (nombreEstado === "En Mantenimiento") {
            const mantenimiento = await transaccion.request()
                .query(`
                    SELECT id_estado
                    FROM dbo.EstadoDispositivo
                    WHERE nombre = 'Mantenimiento';
                `);

            if (mantenimiento.recordset.length) {
                nombreEstado = "Mantenimiento";
            }
        }

        const idEstado = await obtenerOCrearCatalogo(
            transaccion,
            "estado",
            nombreEstado
        );

        const resultado = await transaccion.request()
            .input(
                "codigo",
                sql.VarChar(30),
                dispositivo.codigoInventario
            )
            .input(
                "nombre",
                sql.NVarChar(100),
                dispositivo.nombre
            )
            .input("idTipo", sql.Int, idTipo)
            .input("idMarca", sql.Int, idMarca)
            .input(
                "modelo",
                sql.NVarChar(80),
                dispositivo.modelo
            )
            .input(
                "serie",
                sql.VarChar(80),
                dispositivo.numeroSerie
            )
            .input("idEstado", sql.Int, idEstado)
            .input(
                "descripcion",
                sql.NVarChar(250),
                dispositivo.descripcion
            )
            .query(`
                INSERT INTO dbo.Dispositivo (
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
                    @idTipo,
                    @idMarca,
                    @modelo,
                    @serie,
                    @idEstado,
                    @descripcion
                );
            `);

        const idDispositivo =
            resultado.recordset[0].id_dispositivo;

        const fecha = dispositivo.fechaAdquisicion
            ? new Date(
                dispositivo.fechaAdquisicion + "T00:00:00Z"
            )
            : null;

        await transaccion.request()
            .input("idDispositivo", sql.Int, idDispositivo)
            .input(
                "observaciones",
                sql.NVarChar(500),
                dispositivo.observaciones
            )
            .input("fecha", sql.Date, fecha)
            .query(`
                INSERT INTO dbo.HU17_DetalleDispositivo (
                    id_dispositivo,
                    observaciones,
                    fecha_adquisicion
                )
                VALUES (
                    @idDispositivo,
                    @observaciones,
                    @fecha
                );
            `);

        await transaccion.commit();
        iniciada = false;

        return {
            mensaje: "Dispositivo guardado correctamente.",
            id_dispositivo: idDispositivo
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
                "Hay un valor duplicado. Revisa el código y el número de serie.",
                409
            );
        }

        throw error;
    }
}

module.exports = {
    obtenerDispositivos,
    registrarDispositivo
};