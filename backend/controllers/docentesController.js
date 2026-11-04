const bcrypt = require('bcrypt');
const { sql, poolPromise } = require('../config/db');

// Registrar un docente
const registrarDocente = async (req, res) => {
    const transaction = new sql.Transaction(await poolPromise);

    try {
        const {
            Nombres,
            Apellidos,
            Cedula,
            CorreoInstitucional,
            Contrasena
        } = req.body;

        // 1. Validar campos obligatorios
        if (
            !Nombres || !Apellidos || !Cedula ||
            !CorreoInstitucional || !Contrasena
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

        // 5. Comprobar si el docente ya está registrado
        const existente = await pool.request()
            .input('Cedula', sql.VarChar(10), Cedula)
            .input('Correo', sql.VarChar(150), correo)
            .query(`
                SELECT IdUsuario
                FROM Usuarios
                WHERE Cedula = @Cedula
                   OR CorreoInstitucional = @Correo
            `);

        if (existente.recordset.length > 0) {
            return res.status(409).json({
                mensaje: 'El docente ya tiene una cuenta registrada'
            });
        }

        // 6. Encriptar contraseña
        const contrasenaHash = await bcrypt.hash(Contrasena, 10);

        // 7. Registrar cuenta y docente en una transacción
        await transaction.begin();

        const resultado = await transaction.request()
            .input('Nombres', sql.VarChar(100), Nombres.trim())
            .input('Apellidos', sql.VarChar(100), Apellidos.trim())
            .input('Cedula', sql.VarChar(10), Cedula)
            .input('Correo', sql.VarChar(150), correo)
            .input('ContrasenaHash', sql.VarChar(255), contrasenaHash)
            .input('IdRol', sql.Int, 2)
            .query(`
                INSERT INTO Usuarios (
                    Nombres,
                    Apellidos,
                    Cedula,
                    CorreoInstitucional,
                    ContrasenaHash,
                    IdRol
                )
                OUTPUT INSERTED.IdUsuario
                VALUES (
                    @Nombres,
                    @Apellidos,
                    @Cedula,
                    @Correo,
                    @ContrasenaHash,
                    @IdRol
                )
            `);

        const idUsuario = resultado.recordset[0].IdUsuario;

        await transaction.request()
            .input('IdUsuario', sql.Int, idUsuario)
            .query(`
                INSERT INTO Docentes (IdUsuario)
                VALUES (@IdUsuario)
            `);

        await transaction.commit();

        return res.status(201).json({
            mensaje: 'Docente registrado correctamente',
            IdUsuario: idUsuario
        });

    } catch (error) {
        try {
            await transaction.rollback();
        } catch (errorRollback) {
            console.error('Error al revertir transacción:', errorRollback.message);
        }

        console.error('Error al registrar docente:', error.message);

        return res.status(500).json({
            mensaje: 'Error interno al registrar el docente'
        });
    }
};

module.exports = {
    registrarDocente
};