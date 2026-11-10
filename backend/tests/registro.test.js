const test = require('node:test');
const assert = require('node:assert/strict');
const { cedulaEcuatorianaValida } = require('../validators/cedula.validator');
const { validarEstudiante, validarDispositivo } = require('../validators/registro.validator');
const { generarContrasenaTemporal, generarContrasenaSegura } = require('../utils/contrasena');
const { verificarRol } = require('../middlewares/verificarRol');

function cedulaValida(nueve) {
    let total = 0;
    for (let i=0;i<9;i++) {
        let n=Number(nueve[i])*(i%2===0?2:1);
        if(n>9)n-=9;
        total+=n;
    }
    return nueve+String((10-total%10)%10);
}
const cedula = cedulaValida('171234567');
const estudiante = { nombres:'  Maria  ', apellidos:' Prueba ', cedula,
    correo:'MARIA@espoch.edu.ec', matricula:'ti-2026-0001' };
const dispositivo = { codigoInventario:' inv-01 ', nombre:'Laptop', tipo:'Laptop',
    marca:'Lenovo', modelo:'E14', estado:'Disponible',
    numeroSerie:'ABC-0001', fechaAdquisicion:'2026-10-29' };

test('Cédula ecuatoriana: acepta dígito verificador correcto', () => {
    assert.equal(cedulaEcuatorianaValida(cedula),true);
});
test('Cédula ecuatoriana: rechaza longitud, caracteres y dígito erróneo', () => {
    for(const v of ['1234','a'.repeat(10),'0000000000', cedula.slice(0,9)+((+cedula[9]+1)%10), '2512345678'])
        assert.equal(cedulaEcuatorianaValida(v),false,v);
});
test('HU-12 acepta y normaliza estudiante válido',()=>{
    assert.deepEqual(validarEstudiante(estudiante),{
        nombres:'Maria', apellidos:'Prueba', cedula,
        correo:'maria@espoch.edu.ec', matricula:'TI-2026-0001'
    });
});
test('HU-12 rechaza campos obligatorios vacíos',()=>{
    for(const campo of ['nombres','apellidos','cedula','correo','matricula'])
        assert.throws(()=>validarEstudiante({...estudiante,[campo]:''}), /obligatorio|cédula/i);
});
test('HU-12 rechaza correo no institucional',()=>{
    assert.throws(()=>validarEstudiante({...estudiante,correo:'a@gmail.com'}),/institucional/i);
});
test('HU-12 acepta matrícula de más de cuatro caracteres',()=>{
    assert.equal(validarEstudiante(estudiante).matricula,'TI-2026-0001');
});
test('HU-17 valida datos y permite campos opcionales vacíos',()=>{
    assert.equal(validarDispositivo({...dispositivo,numeroSerie:'',fechaAdquisicion:''}).numeroSerie,null);
});
test('HU-17 normaliza código y serie para duplicados',()=>{
    assert.equal(validarDispositivo(dispositivo).codigoInventario,'INV-01');
    assert.equal(validarDispositivo(dispositivo).numeroSerie,'ABC-0001');
});
test('HU-17 rechaza estado y tipo fuera de catálogo',()=>{
    assert.throws(()=>validarDispositivo({...dispositivo,tipo:'Helicóptero'}),/tipo/i);
    assert.throws(()=>validarDispositivo({...dispositivo,estado:'Prestado'}),/estado/i);
});
test('HU-17 rechaza fechas imposibles',()=>{
    assert.throws(()=>validarDispositivo({...dispositivo,fechaAdquisicion:'2026-02-31'}),/fecha/i);
});
test('HU-17 rechaza ausencia de cada campo obligatorio',()=>{
    for(const campo of ['codigoInventario','nombre','tipo','marca','modelo','estado'])
        assert.throws(()=>validarDispositivo({...dispositivo,[campo]:''}),/obligatorio/i);
});
test('Factory: contraseña temporal es aleatoria y cumple longitud/complejidad',()=>{
    const a=generarContrasenaSegura(18),b=generarContrasenaSegura(18);
    assert.equal(a.length,18);
    assert.notEqual(a,b);
    assert.match(a,/[A-Z]/);
    assert.match(a,/[a-z]/);
    assert.match(a,/[0-9]/);
    assert.match(a,/[!@#$%*_-]/);
    assert.equal(generarContrasenaTemporal(cedula).length,18);
    assert.ok(!generarContrasenaTemporal(cedula).includes(cedula));
});
test('Rol: solo Administrador puede registrar estudiantes',()=>{
    const middleware=verificarRol('Administrador');
    let paso=false, status=0;
    middleware({usuario:{roles:['Estudiante']}}, {
        status(n){status=n;return this;},json(){return null;}
    },()=>paso=true);
    assert.equal(paso,false); assert.equal(status,403);
    middleware({usuario:{roles:['Administrador']}}, {},()=>paso=true);
    assert.equal(paso,true);
});
test('Rol: Técnico y Administrador pueden registrar dispositivos',()=>{
    const middleware=verificarRol('Administrador','Técnico');
    for(const rol of ['Administrador','Técnico']) {
        let paso=false;
        middleware({usuario:{roles:[rol]}},{},()=>paso=true);
        assert.equal(paso,true);
    }
});
