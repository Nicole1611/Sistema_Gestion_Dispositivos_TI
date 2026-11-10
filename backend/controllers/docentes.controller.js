
const docentesService = require("../services/docentes.service");

// Consultar docentes
async function listarDocentes(req, res) {
    try {
        const docentes = await docentesService.obtenerDocentes();

        return res.status(200).json({
            mensaje: "Docentes consultados correctamente.",
            datos: docentes
        });

    } catch (error) {
        console.error("Error al consultar docentes:", error);

        return res.status(500).json({
            mensaje: "Error al consultar los docentes."
        });
    }
}

// Registrar docente
async function registrarDocente(req, res) {
    try {
        const {
            cedula,
            codigoDocente,
            nombres,
            apellidos,
            correo,
            telefono
        } = req.body;

        // Validar campos obligatorios
        if (
            !cedula ||
            !codigoDocente ||
            !nombres ||
            !apellidos ||
            !correo
        ) {
            return res.status(400).json({
                mensaje: "Complete todos los campos obligatorios."
            });
        }

        // Validar cédula
        if (!/^\d{10}$/.test(cedula)) {
            return res.status(400).json({
                mensaje: "La cédula debe contener exactamente 10 dígitos."
            });
        }

        // Validar correo institucional
        if (!/^[^\s@]+@espoch\.edu\.ec$/i.test(correo)) {
            return res.status(400).json({
                mensaje: "Ingrese un correo institucional válido de ESPOCH."
            });
        }

        // Validar código docente
        if (codigoDocente.trim().length > 20) {
            return res.status(400).json({
                mensaje: "El código del docente no puede superar los 20 caracteres."
            });
        }

        const resultado = await docentesService.registrarDocente({
            cedula,
            codigoDocente,
            nombres,
            apellidos,
            correo,
            telefono
        });

        return res.status(201).json(resultado);

    } catch (error) {
        console.error("Error al registrar docente:", error);

        return res.status(400).json({
            mensaje: error.message || "No se pudo registrar el docente."
        });
    }
}

module.exports = {
    listarDocentes,
    registrarDocente
};
