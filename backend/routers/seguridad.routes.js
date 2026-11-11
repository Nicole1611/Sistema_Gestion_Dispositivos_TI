const router = require("express").Router();
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { rateLimit } = require("express-rate-limit");

const { conectarBD, sql } = require("../config/database");

const {
    verificarToken,
    verificarCambioContrasena,
    verificarAdministrador
} = require("../middlewares/auth.middleware");

const MENSAJE_RECUPERACION =
    "Si el correo es válido, recibirás un enlace de recuperación";

const MENSAJE_ENLACE =
    "El enlace es inválido, ha expirado o ya fue utilizado.";

const limitarSolicitudes = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        mensaje: "Demasiadas solicitudes. Intenta nuevamente en 15 minutos."
    }
});

const limitarCambios = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        mensaje: "Demasiados intentos. Intenta nuevamente en 15 minutos."
    }
});

function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

function crearCorreoSMTP() {
    const obligatorias = [
        "APP_PUBLIC_URL",
        "SMTP_HOST",
        "SMTP_USER",
        "SMTP_PASS",
        "SMTP_FROM"
    ];

    for (const variable of obligatorias) {
        if (
            !process.env[variable] ||
            process.env[variable].includes("REEMPLAZAR")
        ) {
            throw new Error(`Configura ${variable} en backend/.env`);
        }
    }

    const secure = process.env.SMTP_SECURE === "true";

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure,
        requireTLS: !secure,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000
    });
}

async function enviarRecuperacion(correo) {
    const transporte = crearCorreoSMTP();

    const base = new URL(process.env.APP_PUBLIC_URL);

    if (!["http:", "https:"].includes(base.protocol)) {
        throw new Error("APP_PUBLIC_URL debe ser HTTP o HTTPS.");
    }

    if (
        base.protocol !== "https:" &&
        !["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)
    ) {
        throw new Error("Usa HTTPS fuera del entorno local.");
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hash = hashToken(token);
    const pool = await conectarBD();

    // Solo genera recuperación para una cuenta activa.
    const insertado = await pool.request()
        .input("correo", sql.VarChar(150), correo)
        .input("hash", sql.Char(64), hash)
        .query(`
            INSERT INTO dbo.RecuperacionContrasena (
                id_usuario,
                token_hash,
                version_sesion,
                expira_en
            )
            OUTPUT INSERTED.id_recuperacion
            SELECT
                U.id_usuario,
                @hash,
                U.version_sesion,
                DATEADD(MINUTE, 15, SYSUTCDATETIME())
            FROM dbo.Usuario U
            INNER JOIN dbo.Persona P
                ON P.id_persona = U.id_persona
            WHERE P.correo_institucional = @correo
              AND LOWER(LTRIM(RTRIM(U.estado))) IN ('activo', 'activa');
        `);

    if (!insertado.recordset.length) return;

    const enlace = new URL(
        "/frontend/pages/auth/restablecer.html",
        base
    );

    // El fragmento no se envía en la petición GET al servidor.
    enlace.hash = token;

    try {
        await transporte.sendMail({
            from: process.env.SMTP_FROM,
            to: correo,
            subject: "Recuperación de contraseña - Gestión TI",
            text:
                "Solicitaste recuperar tu acceso a Gestión TI.\n\n" +
                "Abre este enlace para establecer una contraseña nueva:\n" +
                enlace.href + "\n\n" +
                "El enlace vence en 15 minutos y solo puede utilizarse una vez.\n" +
                "Si no realizaste esta solicitud, ignora este correo."
        });

        console.log("Correo de recuperación aceptado por SMTP.");

    } catch (error) {
        // Invalida el enlace si falla el envío.
        await pool.request()
            .input("hash", sql.Char(64), hash)
            .query(`
                UPDATE dbo.RecuperacionContrasena
                SET usado_en = SYSUTCDATETIME()
                WHERE token_hash = @hash;
            `);

        throw error;
    }
}

router.post(
    "/recuperar",
    limitarSolicitudes,
    (req, res) => {
        const correo = typeof req.body?.correo === "string"
            ? req.body.correo.trim().toLowerCase()
            : "";

        // La respuesta es igual exista o no la cuenta.
        res.status(200).json({
            mensaje: MENSAJE_RECUPERACION
        });

        if (
            correo.length > 150 ||
            !/^[^\s@]+@espoch\.edu\.ec$/i.test(correo)
        ) {
            return;
        }

        // No espera al SMTP antes de responder: evita revelar existencia
        // de cuentas mediante el tiempo de respuesta.
        setImmediate(() => {
            enviarRecuperacion(correo).catch(error => {
                console.error(
                    "No se pudo enviar la recuperación:",
                    error.code || error.message
                );
            });
        });
    }
);

router.post(
    "/restablecer",
    limitarCambios,
    async (req, res) => {
        const { token, contrasena, confirmacion } = req.body || {};

        if (
            typeof token !== "string" ||
            !/^[a-f0-9]{64}$/.test(token)
        ) {
            return res.status(400).json({
                mensaje: MENSAJE_ENLACE
            });
        }

        if (
            typeof contrasena !== "string" ||
            contrasena.length < 12 ||
            Buffer.byteLength(contrasena, "utf8") > 72
        ) {
            return res.status(400).json({
                mensaje:
                    "La contraseña debe tener mínimo 12 caracteres y máximo 72 bytes."
            });
        }

        if (contrasena !== confirmacion) {
            return res.status(400).json({
                mensaje: "Las contraseñas no coinciden."
            });
        }

        let transaccion;
        let iniciada = false;

        try {
            const pool = await conectarBD();
            const tokenHash = hashToken(token);

            const enlace = await pool.request()
                .input("hash", sql.Char(64), tokenHash)
                .query(`
                    SELECT id_usuario
                    FROM dbo.RecuperacionContrasena
                    WHERE token_hash = @hash;
                `);

            if (!enlace.recordset.length) {
                return res.status(400).json({
                    mensaje: MENSAJE_ENLACE
                });
            }

            const idUsuario = enlace.recordset[0].id_usuario;
            const nuevoHash = await bcrypt.hash(contrasena, 12);

            transaccion = new sql.Transaction(pool);
            await transaccion.begin();
            iniciada = true;

            // Bloquea la cuenta para serializar recuperaciones simultáneas.
            const cuenta = await transaccion.request()
                .input("id", sql.Int, idUsuario)
                .query(`
                    SELECT estado, version_sesion
                    FROM dbo.Usuario WITH (UPDLOCK, HOLDLOCK)
                    WHERE id_usuario = @id;
                `);

            const usuario = cuenta.recordset[0];

            if (
                !usuario ||
                !["activo", "activa"].includes(
                    String(usuario.estado).trim().toLowerCase()
                )
            ) {
                await transaccion.rollback();
                iniciada = false;

                return res.status(400).json({
                    mensaje: MENSAJE_ENLACE
                });
            }

            // El consumo y el cambio de contraseña se confirman juntos.
            const consumido = await transaccion.request()
                .input("hash", sql.Char(64), tokenHash)
                .input("version", sql.Int, usuario.version_sesion)
                .query(`
                    UPDATE dbo.RecuperacionContrasena
                    SET usado_en = SYSUTCDATETIME()
                    OUTPUT INSERTED.id_recuperacion
                    WHERE token_hash = @hash
                      AND usado_en IS NULL
                      AND expira_en > SYSUTCDATETIME()
                      AND version_sesion = @version;
                `);

            if (!consumido.recordset.length) {
                await transaccion.rollback();
                iniciada = false;

                return res.status(400).json({
                    mensaje: MENSAJE_ENLACE
                });
            }

            await transaccion.request()
                .input("id", sql.Int, idUsuario)
                .input("hash", sql.VarChar(255), nuevoHash)
                .query(`
                    UPDATE dbo.Usuario
                    SET contrasena_hash = @hash,
                        debe_cambiar_contrasena = 0,
                        version_sesion = version_sesion + 1
                    WHERE id_usuario = @id;

                    UPDATE dbo.RecuperacionContrasena
                    SET usado_en = SYSUTCDATETIME()
                    WHERE id_usuario = @id
                      AND usado_en IS NULL;
                `);

            await transaccion.commit();
            iniciada = false;

            return res.json({
                mensaje: "Contraseña restablecida con éxito"
            });

        } catch (error) {
            if (iniciada) {
                try {
                    await transaccion.rollback();
                } catch {}
            }

            console.error("Error de recuperación:", error.message);

            return res.status(500).json({
                mensaje: "No se pudo restablecer la contraseña."
            });
        }
    }
);

// Desde este punto, todas las rutas requieren administrador.
router.use(
    verificarToken,
    verificarCambioContrasena,
    verificarAdministrador
);

router.get("/cuentas", async (req, res) => {
    try {
        const pool = await conectarBD();

        const resultado = await pool.request().query(`
            SELECT
                U.id_usuario,
                P.nombres,
                P.apellidos,
                P.correo_institucional AS correo,
                U.estado,
                R.nombre AS rol
            FROM dbo.Usuario U
            INNER JOIN dbo.Persona P
                ON P.id_persona = U.id_persona
            LEFT JOIN dbo.UsuarioRol UR
                ON UR.id_usuario = U.id_usuario
            LEFT JOIN dbo.Rol R
                ON R.id_rol = UR.id_rol
            ORDER BY P.apellidos, P.nombres;
        `);

        const cuentas = new Map();

        for (const fila of resultado.recordset) {
            if (!cuentas.has(fila.id_usuario)) {
                cuentas.set(fila.id_usuario, {
                    id_usuario: fila.id_usuario,
                    nombres: fila.nombres,
                    apellidos: fila.apellidos,
                    correo: fila.correo,
                    estado: fila.estado,
                    roles: []
                });
            }

            if (fila.rol) {
                cuentas.get(fila.id_usuario).roles.push(fila.rol);
            }
        }

        return res.json({
            datos: [...cuentas.values()]
        });

    } catch (error) {
        console.error("Error al listar cuentas:", error.message);

        return res.status(500).json({
            mensaje: "No se pudieron cargar las cuentas."
        });
    }
});

router.patch("/cuentas/:id/desactivar", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
        return res.status(400).json({
            mensaje: "Cuenta inválida."
        });
    }

    if (req.body?.confirmar !== true) {
        return res.status(400).json({
            mensaje: "Debes confirmar la desactivación."
        });
    }

    // Evita que el administrador se bloquee a sí mismo.
    if (id === req.usuario.id_usuario) {
        return res.status(400).json({
            mensaje: "No puedes desactivar tu propia cuenta."
        });
    }

    try {
        const pool = await conectarBD();

        const resultado = await pool.request()
            .input("id", sql.Int, id)
            .query(`
                UPDATE dbo.Usuario
                SET estado = 'Inactivo',
                    version_sesion = version_sesion + 1
                OUTPUT INSERTED.id_usuario
                WHERE id_usuario = @id
                  AND LOWER(LTRIM(RTRIM(estado))) IN ('activo', 'activa');
            `);

        if (!resultado.recordset.length) {
            const existe = await pool.request()
                .input("id", sql.Int, id)
                .query(`
                    SELECT estado
                    FROM dbo.Usuario
                    WHERE id_usuario = @id;
                `);

            if (!existe.recordset.length) {
                return res.status(404).json({
                    mensaje: "Cuenta no encontrada."
                });
            }

            if (
                String(existe.recordset[0].estado)
                    .trim().toLowerCase() === "inactivo"
            ) {
                return res.status(409).json({
                    mensaje: "Esta cuenta ya se encuentra inactiva"
                });
            }

            return res.status(409).json({
                mensaje: "El estado actual no permite desactivar la cuenta."
            });
        }

        return res.json({
            mensaje: "Cuenta desactivada con éxito"
        });

    } catch (error) {
        console.error("Error al desactivar:", error.message);

        return res.status(500).json({
            mensaje: "No se pudo desactivar la cuenta."
        });
    }
});

module.exports = router;