
IF DB_ID('GestionDispositivosTI') IS NULL
BEGIN
    CREATE DATABASE GestionDispositivosTI;
END;
GO

USE GestionDispositivosTI;
GO

-- ==========================================
-- 1. TABLA ROLES
-- ==========================================

IF OBJECT_ID('Roles', 'U') IS NULL
BEGIN
    CREATE TABLE Roles (
        IdRol INT IDENTITY(1,1) PRIMARY KEY,
        NombreRol VARCHAR(30) NOT NULL UNIQUE,
        Descripcion VARCHAR(150)
    );
END;
GO

-- Insertar roles solamente si no existen

IF NOT EXISTS (SELECT 1 FROM Roles WHERE NombreRol = 'Administrador')
    INSERT INTO Roles (NombreRol, Descripcion)
    VALUES ('Administrador', 'Gestiona y administra el sistema');

IF NOT EXISTS (SELECT 1 FROM Roles WHERE NombreRol = 'Docente')
    INSERT INTO Roles (NombreRol, Descripcion)
    VALUES ('Docente', 'Usuario docente de la carrera de TI');

IF NOT EXISTS (SELECT 1 FROM Roles WHERE NombreRol = 'Estudiante')
    INSERT INTO Roles (NombreRol, Descripcion)
    VALUES ('Estudiante', 'Usuario estudiante de la carrera de TI');

IF NOT EXISTS (SELECT 1 FROM Roles WHERE NombreRol = 'Tecnico')
    INSERT INTO Roles (NombreRol, Descripcion)
    VALUES ('Tecnico', 'Responsable de la gestión técnica de dispositivos');
GO

-- ==========================================
-- 2. TABLA USUARIOS
-- ==========================================

IF OBJECT_ID('Usuarios', 'U') IS NULL
BEGIN
    CREATE TABLE Usuarios (
        IdUsuario INT IDENTITY(1,1) PRIMARY KEY,
        Nombres VARCHAR(100) NOT NULL,
        Apellidos VARCHAR(100) NOT NULL,
        Cedula VARCHAR(10) NOT NULL UNIQUE,
        CorreoInstitucional VARCHAR(150) NOT NULL UNIQUE,
        ContrasenaHash VARCHAR(255) NOT NULL,
        IdRol INT NOT NULL,
        Estado BIT NOT NULL DEFAULT 1,
        FechaRegistro DATETIME NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_Usuarios_Roles
        FOREIGN KEY (IdRol) REFERENCES Roles(IdRol)
    );
END;
GO

-- ==========================================
-- 3. TABLA DOCENTES
-- ==========================================

IF OBJECT_ID('Docentes', 'U') IS NULL
BEGIN
    CREATE TABLE Docentes (
        IdDocente INT IDENTITY(1,1) PRIMARY KEY,
        IdUsuario INT NOT NULL UNIQUE,

        CONSTRAINT FK_Docentes_Usuarios
        FOREIGN KEY (IdUsuario) REFERENCES Usuarios(IdUsuario)
    );
END;
GO

-- ==========================================
-- 4. TABLA ESTUDIANTES
-- ==========================================

IF OBJECT_ID('Estudiantes', 'U') IS NULL
BEGIN
    CREATE TABLE Estudiantes (
        IdEstudiante INT IDENTITY(1,1) PRIMARY KEY,
        IdUsuario INT NOT NULL UNIQUE,
        CodigoMatricula VARCHAR(30) NOT NULL UNIQUE,
        Carrera VARCHAR(100) NOT NULL,
        Semestre VARCHAR(20) NULL,

        CONSTRAINT FK_Estudiantes_Usuarios
        FOREIGN KEY (IdUsuario) REFERENCES Usuarios(IdUsuario)
    );
END;
GO

-- ==========================================
-- 5. CONSULTAS DE VERIFICACIÓN
-- ==========================================

SELECT * FROM Roles;
SELECT * FROM Usuarios;
SELECT * FROM Docentes;
SELECT * FROM Estudiantes;
GO
