
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { conectarBD } = require("./config/database");
const authRoutes = require("./routers/auth.routes");
const dashboardRoutes = require("./routers/dashboard.routes");
const { verificarToken } = require("./middlewares/auth.middleware");
const { verificarRol } = require("./middlewares/verificarRol");

const app = express();
const PORT = 3000;

// Configuración de middlewares
app.use(cors());
app.use(express.json());

// Ruta principal
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


// Rutas de autenticación
app.use("/api/auth", authRoutes);


// Rutas de dachboard
app.use("/api/dashboard", dashboardRoutes);

// Iniciar servidor
async function iniciarServidor() {
    try {
        await conectarBD();

        app.listen(PORT, () => {
            console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("No se pudo iniciar el servidor.");
    }
}

iniciarServidor();
