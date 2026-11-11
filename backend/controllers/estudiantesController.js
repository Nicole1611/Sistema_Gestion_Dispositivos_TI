const { sql, poolPromise } = require('../config/db');

// ==========================================
// CONSULTAR ESTUDIANTES - HU-13
// ==========================================

async function consultarEstudiantes(req, res) {

    try {

        const pool = await poolPromise;

        const resultado = await pool.request().query(`
            SELECT
                U.Nombres,
                U.Apellidos,
                U.Cedula,
                U.CorreoInstitucional,
                E.CodigoMatricula,
                CASE
                    WHEN U.Estado = 1 THEN 'Activo'
                    ELSE 'Inactivo'
                END AS Estado
            FROM Usuarios U
            INNER JOIN Estudiantes E
                ON U.IdUsuario = E.IdUsuario
            INNER JOIN Roles R
                ON U.IdRol = R.IdRol
            WHERE R.NombreRol = 'Estudiante'
            ORDER BY U.Apellidos, U.Nombres;
        `);

        return res.status(200).json({
            mensaje: 'Estudiantes consultados correctamente',
            datos: resultado.recordset
        });

    } catch (error) {

        console.error('Error al consultar estudiantes:', error);

        return res.status(500).json({
            mensaje: 'No se pudieron consultar los estudiantes'
        });
    }
}

module.exports = {
    consultarEstudiantes
};