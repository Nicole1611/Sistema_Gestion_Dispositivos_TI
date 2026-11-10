const { conectarBD, sql } = require("./config/database");

async function probarConexion() {
    try {
        const pool = await conectarBD();

        const resultado = await pool.request().query(`
            SELECT
                @@SERVERNAME AS servidor,
                DB_NAME() AS baseDatos,
                SUSER_SNAME() AS usuario;

            SELECT
                TABLE_NAME AS tabla,
                COLUMN_NAME AS columna,
                DATA_TYPE AS tipo,
                CHARACTER_MAXIMUM_LENGTH AS longitud,
                IS_NULLABLE AS permiteNulos
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'dbo'
              AND TABLE_NAME IN (
                  'Persona',
                  'Usuario',
                  'Rol',
                  'UsuarioRol',
                  'Estudiante',
                  'Dispositivo',
                  'TipoDispositivo',
                  'Marca',
                  'EstadoDispositivo',
                  'HU17_DetalleDispositivo'
              )
            ORDER BY TABLE_NAME, ORDINAL_POSITION;
        `);

        console.log("\nDATOS DE LA CONEXIÓN:");
        console.table(resultado.recordsets[0]);

        console.log("\nCOLUMNAS DE TUS TABLAS:");
        console.table(resultado.recordsets[1]);

        console.log("\nConexión comprobada correctamente.");

    } catch (error) {
        console.error("\nError al comprobar la conexión:");
        console.error(error.message);
        process.exitCode = 1;

    } finally {
        await sql.close();
    }
}

probarConexion();