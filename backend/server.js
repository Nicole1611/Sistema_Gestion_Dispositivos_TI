
const express = require('express');
const cors = require('cors');
const { poolPromise } = require('./config/db');
const usuariosRoutes = require('./routers/usuariosRoutes');
const docentesRoutes = require('./routers/docentesRoutes');

const app = express();

// Configuración de middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));
// Rutas de usuarios
app.use('/api/usuarios', usuariosRoutes);
// Rutas de docentes
app.use('/api/docentes', docentesRoutes);

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
    }
}

iniciarServidor();
