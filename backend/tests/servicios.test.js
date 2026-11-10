// Pruebas de integración simulada del servicio: no requieren SQL Server ni credenciales.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const moduloDb = require.resolve('../config/database');
const moduloFactory = require.resolve('../factories/usuario.factory');
const sql = { VarChar:n=>`VARCHAR(${n})`, NVarChar:n=>`NVARCHAR(${n})`, Date:'DATE',
    Int:'INT', Bit:'BIT', ISOLATION_LEVEL:{ SERIALIZABLE:'SERIALIZABLE' } };
let escenario = {};
class Solicitud {
    constructor(){this.parametros={};}
    input(nombre,_tipo,valor){this.parametros[nombre]=valor;return this;}
    async query(query){
        escenario.consultas.push({query, parametros:this.parametros});
        if(query.includes('cedulaExiste'))return {recordset:[{
            cedulaExiste:escenario.cedulaExiste||0, correoExiste:escenario.correoExiste||0,
            matriculaExiste:escenario.matriculaExiste||0 }]};
        if(query.includes('SELECT id_rol')) return {recordset:[{id_rol:4}]};
        if(query.includes('OUTPUT INSERTED.id_persona'))return {recordset:[{id_persona:8}]};
        if(query.includes('OUTPUT INSERTED.id_usuario'))return {recordset:[{id_usuario:9}]};
        if(query.includes('AS existe'))return {recordset:[{existe:escenario.existe||0}]};
        if(query.includes('OUTPUT INSERTED.id_dispositivo'))return {recordset:[{id_dispositivo:2}]};
        return {recordset:[]};
    }
}
class Transaccion {
    request(){return new Solicitud();}
    async begin(nivel){escenario.begin=nivel;}
    async commit(){escenario.commit=true;}
    async rollback(){escenario.rollback=true;}
}
sql.Transaction=Transaccion;
require.cache[moduloDb]={id:moduloDb,filename:moduloDb,loaded:true,exports:{
    conectarBD:async()=>({request:()=>new Solicitud()}),sql
}};
require.cache[moduloFactory]={id:moduloFactory,filename:moduloFactory,loaded:true,exports:{
    crearUsuarioEstudiante:async()=>({rol:'Estudiante',estado:'Activo',
        contrasenaTemporal:'TEMPORAL12!ABCD', contrasenaHash:'hash$prueba'})
}};
const { registrarEstudiante } = require('../services/estudiantes.service');
const { registrarDispositivo } = require('../services/dispositivos.service');
const { cedulaEcuatorianaValida } = require('../validators/cedula.validator');
function cedula() { let base='171234567',sum=0; for(let i=0;i<9;i++){let v=Number(base[i])*(i%2===0?2:1);sum+=v>9?v-9:v;} const id=base+(10-sum%10)%10;assert.ok(cedulaEcuatorianaValida(id));return id; }
const estudiante = {cedula:cedula(),nombres:'Ana',apellidos:'Prueba',correo:'ana@espoch.edu.ec',matricula:'MAT-123456'};
const dispositivo = {codigoInventario:'TI-01',nombre:'Laptop',tipo:'Laptop',marca:'HP',modelo:'15',estado:'Disponible'};
function reset(nuevos={}) { escenario={consultas:[],commit:false,rollback:false,...nuevos}; }

test('HU-12: alta atómica de Persona, Usuario, rol y Estudiante', async()=>{
    reset(); const r=await registrarEstudiante(estudiante);
    assert.equal(r.mensaje,'Estudiante y cuenta de acceso registrados correctamente');
    assert.equal(escenario.begin,'SERIALIZABLE');
    assert.equal(escenario.commit,true);
    for(const tabla of ['Persona','Usuario','UsuarioRol','Estudiante'])
        assert.ok(escenario.consultas.some(c=>c.query.includes(`INSERT dbo.${tabla} `)),tabla);
    const q=escenario.consultas.find(c=>c.query.includes('INSERT dbo.Estudiante'));
    assert.equal(q.parametros.matricula,'MAT-123456');
});
test('HU-12: correo duplicado causa 409 y rollback',async()=>{
    reset({correoExiste:1});
    await assert.rejects(()=>registrarEstudiante(estudiante),e=>e.estado===409&&/correo/.test(e.message));
    assert.equal(escenario.rollback,true);
    assert.equal(escenario.commit,false);
});
test('HU-12: matrícula duplicada causa 409 y rollback',async()=>{
    reset({matriculaExiste:1});
    await assert.rejects(()=>registrarEstudiante(estudiante),e=>e.estado===409&&/matrícula/.test(e.message));
    assert.equal(escenario.rollback,true);
});
test('HU-12: cédula duplicada causa 409 y rollback',async()=>{
    reset({cedulaExiste:1});
    await assert.rejects(()=>registrarEstudiante(estudiante),e=>e.estado===409&&/cédula/.test(e.message));
    assert.equal(escenario.rollback,true);
});
test('HU-17: equipo disponible se inserta correctamente',async()=>{
    reset(); const r=await registrarDispositivo(dispositivo);
    assert.equal(r.id_dispositivo,2);
    const q=escenario.consultas.find(c=>c.query.includes('INSERT dbo.Dispositivo'));
    assert.equal(q.parametros.estado,'Disponible');
    assert.equal(q.parametros.serie,null);
});
test('HU-17: número de inventario/serie duplicado causa error 409',async()=>{
    reset({existe:1});
    await assert.rejects(()=>registrarDispositivo(dispositivo),e=>e.estado===409&&/registrado/.test(e.message));
    assert.equal(escenario.consultas.some(c=>c.query.includes('INSERT dbo.Dispositivo')),false);
});
