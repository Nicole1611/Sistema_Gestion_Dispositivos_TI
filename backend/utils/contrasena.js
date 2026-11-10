const crypto = require("crypto");
// Generar contraseña temporal para cualquier usuario
function generarContrasenaTemporal(_cedula) {
    // Conserva la firma usada por docentes y usuarios, sin utilizar la cédula.
    return generarContrasenaSegura(18);
}
// Encriptar contraseña antes de guardarla
async function encriptarContrasena(contrasena) {
    return await require("bcryptjs").hash(contrasena, 10);
}

// Contraseña para HU-12: aleatoria con CSPRNG, nunca derivada de la cédula.
function generarContrasenaSegura(longitud = 18) {
    if (!Number.isInteger(longitud) || longitud < 12 || longitud > 64) {
        throw new Error("La longitud segura debe estar entre 12 y 64 caracteres.");
    }
    const grupos = [
        "ABCDEFGHJKLMNPQRSTUVWXYZ",
        "abcdefghijkmnopqrstuvwxyz",
        "23456789",
        "!@#$%*-_"
    ];
    const todos = grupos.join("");
    const claves = grupos.map(g => g[crypto.randomInt(g.length)]);
    while (claves.length < longitud) claves.push(todos[crypto.randomInt(todos.length)]);
    // Barajar sin usar Math.random para garantizar aleatoriedad criptográfica.
    for (let i = claves.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [claves[i], claves[j]] = [claves[j], claves[i]];
    }
    return claves.join("");
}
module.exports = {
    generarContrasenaTemporal,
    generarContrasenaSegura,
    encriptarContrasena
};