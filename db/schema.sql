PRAGMA foreign_keys = ON;

CREATE TABLE Usuario (
    idusuario INTEGER PRIMARY KEY AUTOINCREMENT,
    nombrecomp TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    telefono TEXT,
    ciudad TEXT
);

CREATE TABLE Refugio (
    idrefugio INTEGER PRIMARY KEY AUTOINCREMENT,
    nombreref TEXT NOT NULL,
    direccionref TEXT,
    horarioatenc TEXT,
    tiporef TEXT
);

CREATE TABLE Mascota (
    idmascota INTEGER PRIMARY KEY AUTOINCREMENT,
    idrefugio INTEGER NOT NULL,
    nombremasc TEXT NOT NULL,
    especie TEXT NOT NULL,
    raza TEXT NOT NULL,
    sexo TEXT NOT NULL,
    edady INTEGER NOT NULL,
    FOREIGN KEY (idrefugio) REFERENCES Refugio(idrefugio)
);

CREATE TABLE Responsables_de_Refugio (
    idres INTEGER PRIMARY KEY,
    nombreres TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    telefono TEXT,
    direccionres TEXT,
    FOREIGN KEY (idres) REFERENCES Refugio(idrefugio)
);
