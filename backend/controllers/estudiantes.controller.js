
const estudiantesService = require("../services/estudiantes.service");

// Consultar estudiantes
async function listarEstudiantes(req, res) {
    try {
        const estudiantes = await estudiantesService.obtenerEstudiantes();

        return res.status(200).json({
            mensaje: "Estudiantes consultados correctamente.",
            datos: estudiantes
        });

    } catch (error) {
        console.error("Error al consultar estudiantes:", error);

        return res.status(500).json({
            mensaje: "Error al consultar los estudiantes."
        });
    }
}

// Registrar estudiante
async function registrarEstudiante(req, res) {
    try {
        const {
            cedula,
            codigoEstudiante,
            nombres,
            apellidos,
            correo,
            telefono,
            carrera,
            nivel
        } = req.body;

        // Validar campos obligatorios
        if (
            !cedula ||
            !codigoEstudiante ||
            !nombres ||
            !apellidos ||
            !correo ||
            !carrera ||
            nivel === undefined ||
            nivel === null ||
            nivel === ""
        ) {
            return res.status(400).json({
                mensaje: "Complete todos los campos obligatorios."
            });
        }

        // Validar formatos
        if (!/^\d{10}$/.test(cedula)) {
            return res.status(400).json({
                mensaje: "La cédula debe contener exactamente 10 dígitos."
            });
        }

        if (!/^\d{4}$/.test(codigoEstudiante)) {
            return res.status(400).json({
                mensaje: "El código debe contener exactamente 4 dígitos."
            });
        }

        if (!/^\d+$/.test(String(nivel)) ||
            Number(nivel) < 0 ||
            Number(nivel) > 9) {
            return res.status(400).json({
                mensaje: "El nivel debe estar entre 0 y 9."
            });
        }

        const resultado = await estudiantesService.registrarEstudiante({
            cedula,
            codigoEstudiante,
            nombres,
            apellidos,
            correo,
            telefono,
            carrera,
            nivel
        });

        return res.status(201).json(resultado);

    } catch (error) {
        console.error("Error al registrar estudiante:", error);

        return res.status(400).json({
            mensaje: error.message || "No se pudo registrar el estudiante."
        });
    }
}

module.exports = {
    listarEstudiantes,
    registrarEstudiante
};
