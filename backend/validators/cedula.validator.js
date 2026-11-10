// Cédula de persona natural ecuatoriana: 10 dígitos y módulo 10.
function cedulaEcuatorianaValida(valor) {
    if (typeof valor !== "string" || !/^\d{10}$/.test(valor)) return false;
    const provincia = Number(valor.slice(0, 2));
    const tercerDigito = Number(valor[2]);
    if (provincia < 1 || provincia > 24 || tercerDigito > 5) return false;

    let suma = 0;
    for (let i = 0; i < 9; i++) {
        let digito = Number(valor[i]) * (i % 2 === 0 ? 2 : 1);
        if (digito > 9) digito -= 9;
        suma += digito;
    }
    const verificador = (10 - (suma % 10)) % 10;
    return verificador === Number(valor[9]);
}
module.exports = { cedulaEcuatorianaValida };
