
const express = require('express');
const cors = require('cors');
const { poolPromise } = require('./config/db');
const usuariosRoutes = require('./routers/usuariosRoutes');
const docentesRoutes = require('./routers/docentesRoutes');
const estudiantesRoutes = require('./routers/estudiantesRoutes');
const app = express();

// Configuración de middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));
// Rutas de usuarios
app.use('/api/usuarios', usuariosRoutes);
// Rutas de docentes
app.use('/api/docentes', docentesRoutes);
// Rutas de estudiantes
app.use('/api/estudiantes', estudiantesRoutes);
// Ruta inicial
app.get('/api/estado', (req, res) => {
    res.json({
        mensaje: 'Servidor funcionando correctamente',
        sistema: 'Gestión de Dispositivos TI'
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
    try {
        await poolPromise;

        app.listen(PORT, () => {
            console.log(`Servidor iniciado en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('No se pudo iniciar el servidor:', error.message);
        process.exit(1);
=======
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { conectarBD } = require("./config/database");
const authRoutes = require("./routers/auth.routes");
const estudiantesRoutes = require("./routers/estudiantes.routes");
const dispositivosRoutes = require("./routers/dispositivos.routes");
const docentesRoutes = require("./routers/docentes.routes");
const usuariosRoutes = require("./routers/usuarios.routes");
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

// Rutas de estudiantes
app.use("/api/estudiantes", estudiantesRoutes);

// Rutas de dispositivos
app.use("/api/dispositivos", dispositivosRoutes);

// Rutas de dashboard
app.use("/api/dashboard", dashboardRoutes);

// Rutas de docentes
app.use("/api/docentes", docentesRoutes);

//Ruta de usuarios
app.use("/api/usuarios", usuariosRoutes);

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
