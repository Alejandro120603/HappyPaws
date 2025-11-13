const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const databaseFile = path.resolve(__dirname, '..', 'db', 'happypaws.db');
const schemaFile = path.resolve(__dirname, '..', 'db', 'schema.sql');

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

const expectedTables = ['Usuario', 'Refugio', 'Mascota', 'Responsables_de_Refugio'];

connection.serialize(() => {
  connection.run('PRAGMA foreign_keys = ON');

  connection.all("SELECT name FROM sqlite_master WHERE type = 'table'", (err, rows = []) => {
    if (err) {
      console.error('❌ No fue posible verificar las tablas de SQLite:', err.message);
      return;
    }

    const existentes = new Set(rows.map((row) => row.name));
    const faltantes = expectedTables.filter((tabla) => !existentes.has(tabla));

    if (!faltantes.length) {
      console.log('📦 Tablas principales detectadas en la base de datos.');
      return;
    }

    if (!fs.existsSync(schemaFile)) {
      console.error('❌ No se encontró el archivo schema.sql para crear las tablas faltantes.');
      return;
    }

    const schema = fs.readFileSync(schemaFile, 'utf-8');

    connection.exec(schema, (schemaErr) => {
      if (schemaErr) {
        console.error('❌ Error al ejecutar schema.sql:', schemaErr.message);
      } else {
        console.log('📄 schema.sql ejecutado correctamente. Tablas creadas según el esquema proporcionado.');
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
