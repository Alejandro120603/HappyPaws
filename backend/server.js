// server.js

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = 3000;

// --- 1. Configuración de la Conexión a la DB (PostgreSQL) ---
const pool = new Pool({
  user: process.env.DB_USER || 'happypaws_user',
  host: process.env.DB_HOST || 'postgres', 
  database: process.env.DB_NAME || 'happypawsnvo', 
  password: process.env.DB_PASS || 'supersecretpassword',
  port: 5432,
});

// Verificación de conexión a PostgreSQL
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ ERROR: No se pudo conectar a PostgreSQL. Verifica el host y Docker.', err.stack);
    } else {
        console.log('✅ Conexión exitosa a la base de datos PostgreSQL.');
        release();
    }
});

// Middleware
app.use(cors()); 
app.use(express.json()); 

// --- 2. Ruta de prueba ---
app.get('/', (req, res) => {
  res.send('Servidor HappyPaws Backend funcionando.');
});

// ======================================================
// === ENDPOINTS DE MASCOTAS Y ADOPTANTES (Usuario, Mascota) ===
// ======================================================

// 3. CREATE: Registrar un nuevo adoptante (Usuario)
app.post('/api/registro', async (req, res) => {
  const { nombre, email, password, telefono, ciudad } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const checkUser = await pool.query('SELECT 1 FROM Usuario WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      return res.status(409).json({ error: 'Este correo ya está registrado.' });
    }

    // NOTA: Usamos nombres de columna en minúsculas en el RETURNING para asegurar compatibilidad con PG
    const consulta = 'INSERT INTO Usuario (nombrecomp, email, password, telefono, ciudad) VALUES ($1, $2, $3, $4, $5) RETURNING idusuario, nombrecomp, email, telefono, ciudad;';
    const resultado = await pool.query(consulta, [nombre, email, password, telefono, ciudad]);

    res.status(201).json({ 
      mensaje: 'Cuenta creada con éxito', 
      usuario: resultado.rows[0] 
    });

  } catch (error) {
    console.error('Error al registrar usuario:', error.stack);
    res.status(500).json({ error: 'Error interno del servidor al registrar.' });
  }
});

// 4. READ/LOGIN: Iniciar sesión del adoptante (Usuario)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Debe proporcionar email y contraseña.' });
  }

  try {
    // Usamos nombres de columna en minúsculas en el SELECT
    const consulta = 'SELECT idusuario, nombrecomp, email, password, telefono, ciudad FROM Usuario WHERE email = $1';
    const resultado = await pool.query(consulta, [email]);
    
    if (resultado.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    const usuario = resultado.rows[0];
    
    if (usuario.password.trim() !== password.trim()) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    delete usuario.password; 

    res.json({ 
      mensaje: `¡Bienvenido, ${usuario.nombrecomp}!`,
      usuario: usuario 
    });

  } catch (error) {
    console.error('Error en el login:', error.stack);
    res.status(500).json({ error: 'Error interno del servidor al iniciar sesión.' });
  }
});

// 6. READ: Obtener todas las mascotas (Listado Público)
app.get('/api/mascotas', async (req, res) => {
  try {
    // 🚨 CORREGIDO: SELECT de columnas en minúsculas/sin CamelCase
    const consulta = 'SELECT M.idmascota, M.nombremasc, M.especie, M.raza, M.sexo, M.edady, R.nombreref, R.direccionref, M.idrefugio FROM Mascota M JOIN Refugio R ON M.idrefugio = R.idrefugio ORDER BY M.idmascota DESC';
    const resultado = await pool.query(consulta);

    // Mapeo de los resultados
    const mascotasFormateadas = resultado.rows.map(m => ({
        idMascota: m.idmascota, 
        nombre: m.nombremasc, 
        especie: m.especie,
        raza: m.raza,
        edad: m.edady, 
        ciudad: m.direccionref, 
        idRefugio: m.idrefugio, 
        img_url: 'https://via.placeholder.com/260x200?text=Añadir+Imagen'
    }));

    res.json(mascotasFormateadas);
  } catch (error) {
    console.error('Error al obtener mascotas:', error.stack);
    res.status(500).json({ error: 'Error interno del servidor al consultar mascotas' });
  }
});

// 7. CREATE: Registrar una nueva mascota
app.post('/api/mascotas/nueva', async (req, res) => {
    const { idRefugio, nombre, edad, especie, raza, sexo } = req.body;
    
    const nombreMasc = nombre;
    const edadY = parseInt(edad); 

    if (!idRefugio || !nombreMasc || !especie || !raza || !sexo || isNaN(edadY)) {
        return res.status(400).json({ error: 'Faltan datos obligatorios para la mascota.' });
    }

    try {
        // 🚨 CORREGIDO: INSERT de columnas en minúsculas
        const consulta = 'INSERT INTO Mascota (idrefugio, nombremasc, especie, raza, sexo, edady) VALUES ($1, $2, $3, $4, $5, $6) RETURNING idmascota, nombremasc;';
        const params = [idRefugio, nombreMasc, especie, raza, sexo, edadY];

        const resultado = await pool.query(consulta, params);

        res.status(201).json({ 
            mensaje: 'Mascota registrada con éxito', 
            mascota: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error al registrar mascota:', error.stack);
        res.status(500).json({ error: 'Error interno del servidor al registrar la mascota.' });
    }
});


// ======================================================
// === ENDPOINTS DE REFUGIOS (Responsables_de_Refugio) ===
// ======================================================

// 10. CREATE: Registrar un nuevo refugio/responsable (Flujo de 2 Pasos)
app.post('/api/refugio/registro', async (req, res) => {
  const { nombreRefugio, email, password, telefono, ciudad, responsable } = req.body; 

  if (!nombreRefugio || !email || !password || !responsable) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }

  try {
    // Paso 1: Verificar email del Responsable
    const checkRes = await pool.query('SELECT 1 FROM Responsables_de_Refugio WHERE email = $1', [email]);
    if (checkRes.rows.length > 0) {
      return res.status(409).json({ error: 'Este correo ya está registrado como responsable.' });
    }

    // --- PRIMERA INSERCIÓN: Crear la entidad Refugio (Para resolver el FK) ---
    const consultaRefugio = 'INSERT INTO Refugio (nombreref, direccionref, horarioatenc, tiporef) VALUES ($1, $2, $3, $4) RETURNING idrefugio;';
    const paramsRefugio = [nombreRefugio, ciudad, '9:00 AM - 5:00 PM', 'General'];
    const resultadoRefugio = await pool.query(consultaRefugio, paramsRefugio);
    const idRefugioNuevo = resultadoRefugio.rows[0].idrefugio; // ID del nuevo refugio

    // --- SEGUNDA INSERCIÓN: Crear el Responsable ---
    // 🚨 CORREGIDO: INSERT de columnas en minúsculas y usa el ID generado del refugio
    const consultaResponsable = 'INSERT INTO Responsables_de_Refugio (idres, nombreres, email, password, telefono, direccionres) VALUES ($1, $2, $3, $4, $5, $6) RETURNING idres, nombreres, email, telefono, direccionres';
    const paramsResponsable = [idRefugioNuevo, responsable, email, password, telefono, ciudad];
    const resultadoResponsable = await pool.query(consultaResponsable, paramsResponsable);

    res.status(201).json({ 
      mensaje: 'Responsable y Refugio creados con éxito.', 
      refugio: resultadoResponsable.rows[0] 
    });

  } catch (error) {
    console.error('Error en el proceso de registro de refugio:', error.stack);
    res.status(500).json({ error: 'Error interno del servidor al registrar.' });
  }
});

// 11. READ/LOGIN: Iniciar sesión del responsable
app.post('/api/refugio/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (correo y contraseña).' });
  }

  try {
    // 🚨 CORREGIDO: SELECT de columnas en minúsculas
    const consulta = 'SELECT idres, nombreres, email, password, telefono, direccionres FROM Responsables_de_Refugio WHERE email = $1';
    const resultado = await pool.query(consulta, [email]);
    
    if (resultado.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    const refugio = resultado.rows[0];
    
    if (refugio.password.trim() !== password.trim()) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    delete refugio.password; 

    res.json({ 
      mensaje: `¡Bienvenido al panel, ${refugio.nombreres}!`,
      refugio: refugio 
    });

  } catch (error) {
    console.error('Error en el login del responsable:', error.stack);
    res.status(500).json({ error: 'Error interno del servidor al iniciar sesión.' });
  }
});

// [Se omiten los demás endpoints (UPDATE Usuario, DELETE Mascota, etc.) por brevedad. Asegúrate de tenerlos todos en minúsculas.]

// --- 14. Iniciar Servidor ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor HappyPaws escuchando en http://localhost:${PORT}`);
});