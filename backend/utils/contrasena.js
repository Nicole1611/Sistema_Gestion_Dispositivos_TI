const crypto = require("crypto");
const bcrypt = require("bcryptjs");
// Generar contraseña temporal para cualquier usuario
function generarContrasenaTemporal(cedula) {

    const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let aleatorios = "";

    for (let i = 0; i < 2; i++) {
        aleatorios += caracteres[crypto.randomInt(caracteres.length)];
    }

    return cedula + aleatorios;
}
// Encriptar contraseña antes de guardarla
async function encriptarContrasena(contrasena) {
    return await bcrypt.hash(contrasena, 10);
}
module.exports = {
    generarContrasenaTemporal,
    encriptarContrasena
};