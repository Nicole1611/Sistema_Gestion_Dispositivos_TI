
const bcrypt = require('bcrypt');
const { sql, poolPromise } = require('../config/db');

// Registrar una cuenta del personal
const registrarUsuario = async (req, res) => {
    try {
       const {
            Nombres,
            Apellidos,
            Cedula,
            Telefono,
            CorreoInstitucional,
            Contrasena,
            IdRol
        } = req.body;

        // 1. Validar campos obligatorios
       if (
            !Nombres || !Apellidos || !Cedula ||
            !Telefono || !CorreoInstitucional || !Contrasena || !IdRol
        ) {
             return res.status(400).json({
                mensaje: 'Todos los campos son obligatorios'
             });
        }
        // 2. Validar cédula
        if (!/^\d{10}$/.test(Cedula)) {
            return res.status(400).json({
                mensaje: 'La cédula debe contener 10 dígitos'
            });
        }

        // Validar teléfono
        if (!/^\+?\d{9,15}$/.test(Telefono.trim())) {
            return res.status(400).json({
                mensaje: 'El teléfono debe contener entre 9 y 15 dígitos'
             });
        }

        // 3. Validar correo institucional
        const correo = CorreoInstitucional.trim().toLowerCase();

        if (!/^[^\s@]+@espoch\.edu\.ec$/.test(correo)) {
            return res.status(400).json({
                mensaje: 'Debe ingresar un correo institucional @espoch.edu.ec'
            });
        }

        // 4. Validar contraseña
        if (Contrasena.length < 8) {
            return res.status(400).json({
                mensaje: 'La contraseña debe tener al menos 8 caracteres'
            });
        }

        const pool = await poolPromise;

        // 5. Comprobar si la cédula o el correo ya existen
        const usuarioExistente = await pool.request()
            .input('Cedula', sql.VarChar(10), Cedula)
            .input('Correo', sql.VarChar(150), correo)
            .query(`
                SELECT IdUsuario
                FROM Usuarios
                WHERE Cedula = @Cedula
                   OR CorreoInstitucional = @Correo
            `);

        if (usuarioExistente.recordset.length > 0) {
            return res.status(409).json({
                mensaje: 'La cédula o el correo institucional ya están registrados'
            });
        }

        // 6. Verificar que el rol exista
        const rolExistente = await pool.request()
            .input('IdRol', sql.Int, Number(IdRol))
            .query(`
                SELECT IdRol
                FROM Roles
                WHERE IdRol = @IdRol
            `);

        if (rolExistente.recordset.length === 0) {
            return res.status(400).json({
                mensaje: 'El rol seleccionado no existe'
            });
        }

        // 7. Encriptar contraseña
        const contrasenaHash = await bcrypt.hash(Contrasena, 10);

        // 8. Guardar usuario en SQL Server
        const resultado = await pool.request()
            .input('Nombres', sql.VarChar(100), Nombres.trim())
            .input('Apellidos', sql.VarChar(100), Apellidos.trim())
            .input('Cedula', sql.VarChar(10), Cedula)
            .input('Telefono', sql.VarChar(15), Telefono.trim())
            .input('Correo', sql.VarChar(150), correo)
            .input('ContrasenaHash', sql.VarChar(255), contrasenaHash)
            .input('IdRol', sql.Int, Number(IdRol))
            .query(`
                INSERT INTO Usuarios (
                    Nombres,
                    Apellidos,
                    Cedula,
                    Telefono,
                    CorreoInstitucional,
                    ContrasenaHash,
                    IdRol
                )
                OUTPUT INSERTED.IdUsuario
                VALUES (
                    @Nombres,
                    @Apellidos,
                    @Cedula,
                    @Telefono,
                    @Correo,
                    @ContrasenaHash,
                    @IdRol
                )
            `);

        return res.status(201).json({
            mensaje: 'Cuenta registrada correctamente',
            IdUsuario: resultado.recordset[0].IdUsuario
        });

    } catch (error) {
        console.error('Error al registrar usuario:', error.message);

        return res.status(500).json({
            mensaje: 'Error interno al registrar la cuenta'
        });
    }
};

module.exports = {
    registrarUsuario
};
