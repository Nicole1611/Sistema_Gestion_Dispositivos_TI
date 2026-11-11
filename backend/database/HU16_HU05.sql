USE GestionDispositivosTI;
GO

-- Agregar la versión de sesión a las cuentas.
IF COL_LENGTH('dbo.Usuario', 'version_sesion') IS NULL
BEGIN
    ALTER TABLE dbo.Usuario
    ADD version_sesion INT NOT NULL
        CONSTRAINT DF_Usuario_VersionSesion DEFAULT (0)
        WITH VALUES;
END;
GO

-- Crear la tabla para recuperar contraseñas.
IF OBJECT_ID('dbo.RecuperacionContrasena', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RecuperacionContrasena (
        id_recuperacion INT IDENTITY(1,1) PRIMARY KEY,
        id_usuario INT NOT NULL,
        token_hash CHAR(64) NOT NULL,
        version_sesion INT NOT NULL,

        creado_en DATETIME2 NOT NULL
            DEFAULT SYSUTCDATETIME(),

        expira_en DATETIME2 NOT NULL,
        usado_en DATETIME2 NULL,

        CONSTRAINT FK_Recuperacion_Usuario
            FOREIGN KEY (id_usuario)
            REFERENCES dbo.Usuario(id_usuario),

        CONSTRAINT UQ_Recuperacion_Token
            UNIQUE (token_hash)
    );

    CREATE INDEX IX_Recuperacion_Usuario
        ON dbo.RecuperacionContrasena(id_usuario);
END;
GO

-- Comprobar los cambios.
SELECT
    id_usuario,
    estado,
    version_sesion
FROM dbo.Usuario;

SELECT *
FROM dbo.RecuperacionContrasena;
GO