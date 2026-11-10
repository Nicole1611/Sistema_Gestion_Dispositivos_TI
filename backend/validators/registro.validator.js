const { cedulaEcuatorianaValida } = require("./cedula.validator");

class ErrorValidacion extends Error {
    constructor(mensaje, estado = 400) {
        super(mensaje);
        this.name = "ErrorValidacion";
        this.estado = estado;
    }
}

function texto(campo, limite, etiqueta) {
    if (typeof campo !== "string" || !campo.trim()) {
        throw new ErrorValidacion(`El campo ${etiqueta} es obligatorio.`);
    }
    const limpio = campo.trim();
    if (limpio.length > limite) {
        throw new ErrorValidacion(`${etiqueta} no puede superar ${limite} caracteres.`);
    }
    return limpio;
}

function validarEstudiante(datos = {}) {
    const nombres = texto(datos.nombres, 100, "Nombres");
    const apellidos = texto(datos.apellidos, 100, "Apellidos");
    const cedula = texto(datos.cedula, 10, "Cédula");
    const correo = texto(datos.correo, 150, "Correo institucional").toLowerCase();
    const matricula = texto(datos.matricula, 30, "Matrícula").toUpperCase();

    if (!cedulaEcuatorianaValida(cedula)) {
        throw new ErrorValidacion("La cédula ecuatoriana debe tener 10 dígitos y un dígito verificador válido.");
    }
    if (!/^[^\s@]+@espoch\.edu\.ec$/i.test(correo)) {
        throw new ErrorValidacion("Ingrese un correo institucional válido de ESPOCH (@espoch.edu.ec).");
    }
    if (!/^[A-Z0-9][A-Z0-9._-]{0,29}$/.test(matricula)) {
        throw new ErrorValidacion("La matrícula solo admite letras, números, puntos, guiones o guion bajo.");
    }
    return { nombres, apellidos, cedula, correo, matricula };
}

const TIPOS = Object.freeze(["Laptop", "Dron", "Proyector", "Tablet", "Accesorio"]);
const ESTADOS = Object.freeze(["Disponible", "En Mantenimiento"]);
function validarDispositivo(datos = {}) {
    const codigoInventario = texto(datos.codigoInventario, 40, "Código de inventario").toUpperCase();
    const nombre = texto(datos.nombre, 120, "Nombre del dispositivo");
    const tipo = texto(datos.tipo, 30, "Tipo");
    const marca = texto(datos.marca, 80, "Marca");
    const modelo = texto(datos.modelo, 80, "Modelo");
    const estado = texto(datos.estado, 30, "Estado inicial");
    const numeroSerie = datos.numeroSerie == null || datos.numeroSerie === ""
        ? null : texto(datos.numeroSerie, 100, "Número de serie").toUpperCase();
    const descripcion = datos.descripcion == null || datos.descripcion === ""
        ? null : texto(datos.descripcion, 1000, "Descripción");
    const observaciones = datos.observaciones == null || datos.observaciones === ""
        ? null : texto(datos.observaciones, 1000, "Observaciones");
    const fechaAdquisicion = datos.fechaAdquisicion == null || datos.fechaAdquisicion === ""
        ? null : datos.fechaAdquisicion;

    if (!TIPOS.includes(tipo)) throw new ErrorValidacion("Seleccione un tipo de dispositivo válido.");
    if (!ESTADOS.includes(estado)) throw new ErrorValidacion("Seleccione un estado inicial válido.");
    if (fechaAdquisicion !== null) {
        if (typeof fechaAdquisicion !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fechaAdquisicion)) {
            throw new ErrorValidacion("La fecha de adquisición debe tener el formato AAAA-MM-DD.");
        }
        const fecha = new Date(`${fechaAdquisicion}T00:00:00Z`);
        if (Number.isNaN(fecha.valueOf()) || fecha.toISOString().slice(0, 10) !== fechaAdquisicion) {
            throw new ErrorValidacion("Ingrese una fecha de adquisición válida.");
        }
    }
    return { codigoInventario, nombre, tipo, marca, modelo, numeroSerie, descripcion,
        observaciones, fechaAdquisicion, estado };
}
module.exports = { ErrorValidacion, validarEstudiante, validarDispositivo, TIPOS, ESTADOS };
