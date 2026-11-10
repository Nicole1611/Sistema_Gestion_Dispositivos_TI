
const { conectarBD } = require("../config/database");

async function obtenerEstadisticas() {
    try {
        const pool = await conectarBD();

        const resultado = await pool.request().query(`
            SELECT
                (SELECT COUNT(*) FROM Usuario) AS totalUsuarios,
                (SELECT COUNT(*) FROM Dispositivo) AS totalDispositivos;
        `);

        return resultado.recordset[0];

    } catch (error) {
        console.error("Error al obtener estadísticas:", error);
        throw error;
    }
}

module.exports = {
    obtenerEstadisticas
};
