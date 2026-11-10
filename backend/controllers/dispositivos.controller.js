
const dispositivosService = require("../services/dispositivos.service");

// Consultar catálogos
async function listarCatalogos(req, res) {
    try {
        const catalogos = await dispositivosService.obtenerCatalogos();

        return res.status(200).json({
            mensaje: "Catálogos consultados correctamente.",
            datos: catalogos
        });

    } catch (error) {
        console.error("Error al consultar catálogos:", error);

        return res.status(500).json({
            mensaje: "Error al consultar los catálogos."
        });
    }
}

// Consultar dispositivos
async function listarDispositivos(req, res) {
    try {
        const dispositivos = await dispositivosService.obtenerDispositivos();

        return res.status(200).json({
            mensaje: "Dispositivos consultados correctamente.",
            datos: dispositivos
        });

    } catch (error) {
        console.error("Error al consultar dispositivos:", error);

        return res.status(500).json({
            mensaje: "Error al consultar los dispositivos."
        });
    }
}
// Registrar dispositivo
async function registrarDispositivo(req, res) {
    try {
        const {
            codigo,
            nombre,
            id_tipo,
            id_marca,
            modelo,
            numero_serie,
            id_estado,
            descripcion
        } = req.body;

        // Validar campos obligatorios
        if (
            !codigo ||
            !nombre ||
            !id_tipo ||
            !id_marca ||
            !id_estado
        ) {
            return res.status(400).json({
                mensaje: "Complete todos los campos obligatorios."
            });
        }

        // Validar longitudes
        if (codigo.length > 30 || nombre.length > 100) {
            return res.status(400).json({
                mensaje: "El código o nombre supera la longitud permitida."
            });
        }

        const resultado = await dispositivosService.registrarDispositivo({
            codigo: codigo.trim(),
            nombre: nombre.trim(),
            id_tipo,
            id_marca,
            modelo,
            numero_serie,
            id_estado,
            descripcion
        });

        return res.status(201).json(resultado);

    } catch (error) {
        console.error("Error al registrar dispositivo:", error);

        return res.status(400).json({
            mensaje: error.message || "No se pudo registrar el dispositivo."
        });
    }
}

module.exports = {
    listarCatalogos,
    listarDispositivos,
    registrarDispositivo
};
