const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const express = require("express");
const cors = require("cors");

const { conectarBD } = require("./config/database");

const authRoutes = require("./routers/auth.routes");
const estudiantesRoutes = require("./routers/estudiantes.routes");
const dispositivosRoutes = require("./routers/dispositivos.routes");
const docentesRoutes = require("./routers/docentes.routes");
const usuariosRoutes = require("./routers/usuarios.routes");
const dashboardRoutes = require("./routers/dashboard.routes");

const {
    verificarToken
} = require("./middlewares/auth.middleware");

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        mensaje: "API de Gestión de Dispositivos TI funcionando."
    });
});

app.get("/api/auth/verificar", verificarToken, (req, res) => {
    res.status(200).json({
        mensaje: "Token válido. Acceso permitido.",
        usuario: req.usuario
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/estudiantes", estudiantesRoutes);
app.use("/api/dispositivos", dispositivosRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/docentes", docentesRoutes);
app.use("/api/usuarios", usuariosRoutes);

async function iniciarServidor() {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error(
                "Falta configurar JWT_SECRET en backend/.env."
            );
        }

        const pool = await conectarBD();

        const resultado = await pool.request().query(`
            SELECT
                DB_NAME() AS baseDatos,
                SUSER_SNAME() AS usuario;
        `);

        console.log("Conexión exitosa con SQL Server.");
        console.table(resultado.recordset);

        const servidor = app.listen(PORT, () => {
            console.log(
                `Servidor ejecutándose en http://localhost:${PORT}`
            );
        });

        servidor.on("error", async (error) => {
            console.error(
                "No se pudo abrir el puerto del servidor:",
                error.message
            );

            await pool.close();
            process.exitCode = 1;
        });

    } catch (error) {
        console.error("No se pudo iniciar el servidor.");
        console.error(error.message);
        process.exitCode = 1;
    }
}

iniciarServidor();