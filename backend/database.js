const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const databaseFile = path.resolve(__dirname, '..', 'db', 'happypaws.db');

const connection = new sqlite3.Database(
  databaseFile,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) {
      console.error('❌ Error al conectar con SQLite:', err.message);
    } else {
      console.log('✅ Conectado a la base de datos SQLite en', databaseFile);
    }
  }
);

const tableStatements = [
  `CREATE TABLE IF NOT EXISTS usuarios (
    idusuario INTEGER PRIMARY KEY AUTOINCREMENT,
    nombrecomp TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    telefono TEXT,
    ciudad TEXT,
    fecha_registro TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS refugios (
    idrefugio INTEGER PRIMARY KEY AUTOINCREMENT,
    nombreref TEXT NOT NULL,
    direccionref TEXT,
    horarioatenc TEXT,
    tiporef TEXT,
    telefono TEXT,
    email TEXT UNIQUE
  )`,
  `CREATE TABLE IF NOT EXISTS responsables (
    idres INTEGER PRIMARY KEY AUTOINCREMENT,
    idrefugio INTEGER NOT NULL,
    nombreres TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    telefono TEXT,
    direccionres TEXT,
    FOREIGN KEY (idrefugio) REFERENCES refugios(idrefugio) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS mascotas (
    idmascota INTEGER PRIMARY KEY AUTOINCREMENT,
    id_refugio INTEGER NOT NULL,
    id_responsable INTEGER,
    nombremasc TEXT NOT NULL,
    especie TEXT NOT NULL,
    raza TEXT NOT NULL,
    sexo TEXT NOT NULL,
    edady INTEGER NOT NULL DEFAULT 0,
    img_url TEXT,
    FOREIGN KEY (id_refugio) REFERENCES refugios(idrefugio) ON DELETE CASCADE,
    FOREIGN KEY (id_responsable) REFERENCES responsables(idres) ON DELETE SET NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sesiones (
    idsesion INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    creado_en TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(idusuario) ON DELETE CASCADE
  )`,
];

connection.serialize(() => {
  connection.run('PRAGMA foreign_keys = ON');

  let pendientes = tableStatements.length;

  tableStatements.forEach((sql) => {
    connection.run(sql, (err) => {
      if (err) {
        console.error('❌ Error al crear tabla:', err.message);
        console.error('   SQL:', sql);
      }

      pendientes -= 1;
      if (pendientes === 0) {
        console.log('📦 Tablas de SQLite verificadas/creadas correctamente.');
      }
    });
  });
});

function logDbError(method, sql, params, err) {
  console.error(`❌ [DB:${method}] ${err.message}`);
  console.error('   SQL:', sql);
  if (params && params.length) {
    console.error('   Parámetros:', params);
  }
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    connection.run(sql, params, function (err) {
      if (err) {
        logDbError('run', sql, params, err);
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    connection.get(sql, params, (err, row) => {
      if (err) {
        logDbError('get', sql, params, err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    connection.all(sql, params, (err, rows) => {
      if (err) {
        logDbError('all', sql, params, err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = {
  run,
  get,
  all,
  connection,
};
