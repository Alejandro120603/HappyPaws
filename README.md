# HappyPaws 2.0

## 🐾 Descripción
HappyPaws es una aplicación web para gestionar procesos de adopción de mascotas a través de refugios certificados. El proyecto incluye un frontend estático optimizado para la experiencia de adoptantes y responsables, y un backend en Node.js que expone una API REST para registrar usuarios, refugios y mascotas.

## 🏗️ Arquitectura del proyecto
```
HappyPaws/
├── backend/      # API REST en Express + SQLite
├── frontend/     # Sitio estático (HTML, CSS y JavaScript vanilla)
└── db/           # Esquema, seeds y base de datos SQLite
```

## 🗄️ Migración completa a SQLite
El proyecto dejó de depender de PostgreSQL, MySQL o contenedores Docker y ahora utiliza exclusivamente SQLite.

- **Archivo de base de datos**: `db/happypaws.db`
- **Conector**: [`sqlite3`](https://www.npmjs.com/package/sqlite3)
- **Activación de llaves foráneas**: se ejecuta `PRAGMA foreign_keys = ON` al iniciar el backend.

### Cómo aplicar el esquema inicial
```bash
sqlite3 db/happypaws.db < db/schema.sql
```

### Cómo cargar datos de ejemplo
```bash
sqlite3 db/happypaws.db < db/seed.sql
```

Puedes ejecutar los comandos anteriores tantas veces como sea necesario (si quieres reiniciar la base, elimina primero `db/happypaws.db`).

## ▶️ Puesta en marcha del backend
```bash
cd backend
npm install    # instala express, cors y sqlite3
npm start      # inicia el servidor en http://localhost:3000
```
> Si el registro oficial de npm está bloqueado en tu entorno, instala las dependencias desde un mirror accesible.

El backend expone todas las rutas bajo `/api` y se conecta automáticamente a `db/happypaws.db`.

## 🌐 Servir el frontend
El frontend es estático; puedes abrir `frontend/index.html` o `frontend/usuario.html` directamente en el navegador. Las peticiones apuntan a `http://localhost:3000/api`.

## 📚 Documentación de la API
Todas las respuestas se devuelven en formato JSON.

### Usuarios
| Método | URL | Descripción |
|--------|-----|-------------|
| `POST` | `/api/usuarios/register` | Crear un nuevo usuario adoptante. |
| `POST` | `/api/usuarios/login` | Iniciar sesión de un usuario. |
| `GET` | `/api/usuarios/:id` | Obtener datos de un usuario. |
| `PUT` | `/api/usuarios/:id` | Actualizar nombre, ciudad o teléfono del usuario. |

**Ejemplo – Registro**
```http
POST /api/usuarios/register
Content-Type: application/json

{
  "nombre": "Ana Pérez",
  "email": "ana@example.com",
  "password": "secreto",
  "telefono": "555-123-4567",
  "ciudad": "Monterrey"
}
```
**Respuesta**
```json
{
  "mensaje": "Cuenta creada con éxito",
  "usuario": {
    "idusuario": 3,
    "nombrecomp": "Ana Pérez",
    "email": "ana@example.com",
    "telefono": "555-123-4567",
    "ciudad": "Monterrey"
  }
}
```

### Refugios
| Método | URL | Descripción |
|--------|-----|-------------|
| `GET` | `/api/refugios` | Lista todos los refugios registrados. |
| `GET` | `/api/refugios/:id` | Obtiene la información de un refugio. |
| `POST` | `/api/refugios/register` | Crea un nuevo refugio y su responsable. |
| `POST` | `/api/refugios/login` | Autentica a un responsable de refugio. |
| `GET` | `/api/refugios/:id/mascotas` | Devuelve las mascotas asociadas a un refugio. |

**Ejemplo – Registro de refugio**
```http
POST /api/refugios/register
Content-Type: application/json

{
  "nombreRefugio": "Refugio Patitas",
  "email": "contacto@patitas.mx",
  "password": "seguro123",
  "telefono": "555-888-9999",
  "ciudad": "CDMX",
  "responsable": "Laura Ruiz"
}
```

### Mascotas
| Método | URL | Descripción |
|--------|-----|-------------|
| `GET` | `/api/mascotas` | Lista todas las mascotas disponibles. |
| `GET` | `/api/mascotas/:id` | Detalle de una mascota específica. |
| `POST` | `/api/mascotas` | Crea una nueva mascota asociada a un refugio. |
| `DELETE` | `/api/mascotas/:id` | Elimina una mascota. |

**Respuesta típica de listado**
```json
[
  {
    "idmascota": 2,
    "nombre": "Rex",
    "especie": "Reptil",
    "raza": "Iguana verde",
    "sexo": "Macho",
    "edad": 3,
    "ciudad": "Monterrey",
    "idrefugio": 2,
    "img_url": "https://via.placeholder.com/260x200?text=A%C3%B1adir+Imagen"
  }
]
```

### Responsables
| Método | URL | Descripción |
|--------|-----|-------------|
| `GET` | `/api/responsables` | Lista todos los responsables de refugios. |
| `GET` | `/api/responsables/:id` | Información detallada de un responsable. |
| `PUT` | `/api/responsables/:id` | Actualiza teléfono, ciudad, nombre o contraseña. |

**Ejemplo – Actualización de responsable**
```http
PUT /api/responsables/1
Content-Type: application/json

{
  "telefono": "555-111-2222",
  "ciudad": "Guadalajara",
  "responsable": "Ana López"
}
```

## 🛠️ Desarrollo local
1. Crea (o reinicia) la base de datos con los comandos de migración y seed indicados arriba.
2. Instala dependencias del backend (`npm install` dentro de `backend/`).
3. Ejecuta `npm start` para iniciar el servidor Express.
4. Abre los archivos HTML dentro de `frontend/` en tu navegador y prueba el flujo completo.
5. Si necesitas variables de entorno, crea un archivo `.env` (está ignorado por Git) y lee las variables desde `process.env`.

## 🤝 Contribuciones
- Mantén los endpoints bajo `backend/api/`.
- Asegúrate de que cualquier nueva consulta utilice `db/happypaws.db` y respete los nombres de tablas definidos en `db/schema.sql`.
- Evita introducir dependencias externas para la base de datos: SQLite es el único motor soportado.
