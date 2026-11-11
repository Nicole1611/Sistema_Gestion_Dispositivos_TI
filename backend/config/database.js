const sql = require("mssql/msnodesqlv8");
require("dotenv").config();

const config = {
    connectionString:
        `Driver={ODBC Driver 18 for SQL Server};` +
        `Server=${process.env.DB_SERVER};` +
        `Database=${process.env.DB_DATABASE};` +
        `Trusted_Connection=Yes;` +
        `TrustServerCertificate=Yes;`
};

async function conectarBD() {
    try {
        const pool = await sql.connect(config);
        console.log("Conexión exitosa con SQL Server");
        return pool;
    } catch (error) {
        console.error("Error al conectar con SQL Server:", error);
        throw error;
    }
}

module.exports = { conectarBD, sql };