
const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: '127.0.0.1',
    port: 1433,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('Conexión con SQL Server exitosa');
        return pool;
    })
    .catch(error => {
        console.error('Error de conexión con SQL Server:', error.message);
        throw error;
    });

module.exports = {
    sql,
    poolPromise
};
