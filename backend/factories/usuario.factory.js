const { generarContrasenaSegura, encriptarContrasena } = require("../utils/contrasena");

// Factory: genera un objeto de usuario listo para persistirse en la transacción.
async function crearUsuarioEstudiante() {
    const contrasenaTemporal = generarContrasenaSegura(18);
    return {
        rol: "Estudiante",
        estado: "Activo", // El esquema y el login actuales usan «Activo» (cuenta activa).
        debeCambiarContrasena: true,
        contrasenaHash: await encriptarContrasena(contrasenaTemporal),
        contrasenaTemporal
    };
}
module.exports = { crearUsuarioEstudiante };
