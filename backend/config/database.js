const path = require("path");
const sql = require("mssql/msnodesqlv8");

require("dotenv").config({
    path: path.join(__dirname, "..", ".env")
});

const variablesObligatorias = [
    "DB_SERVER",
    "DB_DATABASE",
    "DB_USER",
    "DB_PASSWORD"
];

for (const variable of variablesObligatorias) {
    if (!process.env[variable]) {
        throw new Error(`Falta configurar ${variable} en backend/.env`);
    }
}

// Protege los valores que forman parte de la cadena ODBC.
function valorODBC(valor) {
    return `{${String(valor).replace(/}/g, "}}")}}`;
}

const config = {
    connectionString: [
        `Driver=${valorODBC(
            process.env.DB_DRIVER || "ODBC Driver 18 for SQL Server"
        )}`,
        `Server=${valorODBC(process.env.DB_SERVER)}`,
        `Database=${valorODBC(process.env.DB_DATABASE)}`,
        `UID=${valorODBC(process.env.DB_USER)}`,
        `PWD=${valorODBC(process.env.DB_PASSWORD)}`,
        "Trusted_Connection=No",
        "Encrypt=Yes",
        "TrustServerCertificate=Yes"
    ].join(";") + ";",

    connectionTimeout: 15000,
    requestTimeout: 30000,

    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

async function conectarBD() {
    return sql.connect(config);
}

module.exports = {
    conectarBD,
    sql
};