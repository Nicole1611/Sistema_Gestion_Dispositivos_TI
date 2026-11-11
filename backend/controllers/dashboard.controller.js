
const dashboardService = require("../services/dashboard.service");

async function consultarEstadisticas(req, res) {
    try {
        const estadisticas = await dashboardService.obtenerEstadisticas();

        return res.status(200).json({
            mensaje: "Estadísticas consultadas correctamente.",
            datos: estadisticas
        });

    } catch (error) {
        console.error("Error al consultar estadísticas:", error);

        return res.status(500).json({
            mensaje: "Error al consultar las estadísticas."
        });
    }
}

module.exports = {
    consultarEstadisticas
};
