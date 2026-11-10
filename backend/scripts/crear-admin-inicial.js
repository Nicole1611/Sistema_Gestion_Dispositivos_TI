/* Herramienta de instalación local, NO ruta HTTP. Permite crear el primer
   administrador cuando la base está vacía. Requiere acceso a SQL Server. */
require('dotenv').config();
const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');
const { conectarBD, sql } = require('../config/database');
const { cedulaEcuatorianaValida } = require('../validators/cedula.validator');
const { generarContrasenaSegura, encriptarContrasena } = require('../utils/contrasena');
const rl = readline.createInterface({ input, output });

async function main() {
    console.log('Crear el PRIMER administrador (solo instalación local).');
    const nombres = (await rl.question('Nombres: ')).trim();
    const apellidos = (await rl.question('Apellidos: ')).trim();
    const cedula = (await rl.question('Cédula ecuatoriana válida: ')).trim();
    const correo = (await rl.question('Correo institucional @espoch.edu.ec: ')).trim().toLowerCase();
    if (!nombres || nombres.length > 100 || !apellidos || apellidos.length > 100 ||
        !cedulaEcuatorianaValida(cedula) || correo.length > 150 || !/^[^\s@]+@espoch\.edu\.ec$/.test(correo)) {
        throw new Error('Datos inválidos. Cédula y correo institucional deben ser válidos.');
    }
    const pool = await conectarBD();
    const tx = new sql.Transaction(pool);
    let iniciada = false;
    try {
        await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        iniciada = true;
        const datos = await tx.request()
            .input('cedula', sql.VarChar(10), cedula)
            .input('correo', sql.VarChar(150), correo)
            .query(`
                SELECT
                  (SELECT COUNT(*) FROM dbo.Usuario u
                   INNER JOIN dbo.UsuarioRol ur ON ur.id_usuario=u.id_usuario
                   INNER JOIN dbo.Rol r ON r.id_rol=ur.id_rol
                   WHERE r.nombre='Administrador') AS admins,
                  (SELECT COUNT(*) FROM dbo.Persona p WHERE p.cedula=@cedula OR p.correo_institucional=@correo) AS duplicados
            `);
        if (datos.recordset[0].admins) throw new Error('Ya existe un administrador. Inicia sesión con esa cuenta.');
        if (datos.recordset[0].duplicados) throw new Error('Cédula o correo ya registrados.');
        const rol = await tx.request().query("SELECT id_rol FROM dbo.Rol WHERE nombre='Administrador'");
        if (!rol.recordset.length) throw new Error('Falta el rol Administrador. Ejecuta primero el SQL base.');
        const temporal = generarContrasenaSegura(18);
        const hash = await encriptarContrasena(temporal);
        const persona = await tx.request().input('cedula',sql.VarChar(10),cedula)
            .input('nombres',sql.VarChar(100),nombres)
            .input('apellidos',sql.VarChar(100),apellidos)
            .input('correo',sql.VarChar(150),correo)
            .query(`INSERT dbo.Persona (cedula,nombres,apellidos,correo_institucional)
                    OUTPUT INSERTED.id_persona VALUES (@cedula,@nombres,@apellidos,@correo)`);
        const usuario = await tx.request().input('id_persona',sql.Int,persona.recordset[0].id_persona)
            .input('hash',sql.VarChar(255),hash)
            .query(`INSERT dbo.Usuario (id_persona,contrasena_hash,estado,debe_cambiar_contrasena)
                    OUTPUT INSERTED.id_usuario VALUES (@id_persona,@hash,'Activo',1)`);
        await tx.request().input('id_usuario',sql.Int,usuario.recordset[0].id_usuario)
            .input('id_rol',sql.Int,rol.recordset[0].id_rol)
            .query('INSERT dbo.UsuarioRol (id_usuario,id_rol) VALUES (@id_usuario,@id_rol)');
        await tx.commit(); iniciada=false;
        console.log('\nAdministrador registrado.');
        console.log('Correo:', correo);
        console.log('Contraseña temporal (se muestra solo ahora):', temporal);
        console.log('Debes cambiarla en el primer inicio de sesión.');
    } catch(error) {
        if (iniciada && !tx._aborted) { try { await tx.rollback(); } catch(e) {console.error('Error rollback:',e);} }
        throw error;
    }
}
main().catch(e=>{ console.error('Error:',e.message); process.exitCode=1; })
    .finally(()=>rl.close());
