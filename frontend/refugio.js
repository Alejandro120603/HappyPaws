// refugio.js

// ======================================================
// === CONSTANTES Y VARIABLES ===
// ======================================================
const URL_BASE = 'http://localhost:3000/api';

// ===== Variables de sesión =====
let refugioActivo = JSON.parse(localStorage.getItem("refugioActivo")) || null;

// ====== Referencias a secciones ======
const inicioSection = document.getElementById("inicioSection");
const loginSection = document.getElementById("loginSection");
const registroSection = document.getElementById("registroSection");
const panelRefugio = document.getElementById("panelRefugio");
const perfilRefugio = document.getElementById("perfilRefugio");

// ======================================================
// === FUNCIONES DE UTILIDAD Y VISTA ===
// ======================================================

function mostrarAlerta(mensaje, tipo = "info") {
    const colores = { success: "#c1f4d3", error: "#f8caca", info: "#d7e7ff" };
    const alerta = document.createElement("div");
    alerta.textContent = mensaje;
    Object.assign(alerta.style, {
        position: "fixed", top: "20px", right: "20px", padding: "12px 18px",
        borderRadius: "10px", background: colores[tipo] || "#eee",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)", zIndex: "9999", fontWeight: "600",
        transition: "all 0.4s ease",
    });
    document.body.appendChild(alerta);
    setTimeout(() => {
        alerta.style.opacity = "0";
        alerta.style.transform = "translateY(-10px)";
        setTimeout(() => alerta.remove(), 400);
    }, 2500);
}

function ocultarTodo() {
  [inicioSection, loginSection, registroSection, panelRefugio].forEach(
    (s) => (s.style.display = "none")
  );
}

function mostrarSolo(seccionActiva) {
  ocultarTodo();
  seccionActiva.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function mostrarLogin() { mostrarSolo(loginSection); }
function mostrarRegistro() { mostrarSolo(registroSection); }
function mostrarInicio() { mostrarSolo(inicioSection); }

function mostrarSeccion(seccion) {
  document.querySelectorAll(".subpanel").forEach((sec) => (sec.style.display = "none"));

  const id = "seccion" + seccion.charAt(0).toUpperCase() + seccion.slice(1);
  const target = document.getElementById(id);

  if (target) target.style.display = "block";

  const menu = document.getElementById("dropdownMenu");
  if (menu) menu.classList.remove("show");

  if (seccion === 'mascotas') {
      mostrarMascotasRefugio();
  } else if (seccion === 'solicitudes') {
      mostrarSolicitudesRefugio();
  }
}

function toggleMenu() {
  const menu = document.getElementById("dropdownMenu");
  menu.classList.toggle("show");
}

window.addEventListener("click", function (e) {
  const menu = document.getElementById("dropdownMenu");
  const btn = document.querySelector(".menu-btn");
  if (menu && btn && !btn.contains(e.target) && !menu.contains(e.target)) {
    menu.classList.remove("show");
  }
});

function mostrarPanelRefugio() {
  ocultarTodo();
  panelRefugio.style.display = "block";

  const refugio = JSON.parse(localStorage.getItem("refugioActivo"));
  perfilRefugio.innerHTML = `
    <p><strong>Nombre:</strong> ${refugio.nombre}</p>
    <p><strong>Email:</strong> ${refugio.email}</p>
    <p><strong>Teléfono:</strong> ${refugio.telefono || "No registrado"}</p>
    <p><strong>Ciudad:</strong> ${refugio.ciudad || "No especificada"}</p>
    <p><strong>Responsable:</strong> ${refugio.responsable || "No registrado"}</p>
  `;

  mostrarSeccion("principal");

  if (refugio) {
    document.getElementById("cfgTelefono").value = refugio.telefono || "";
    document.getElementById("cfgCiudad").value = refugio.ciudad || "";
    document.getElementById("cfgResponsable").value = refugio.responsable || "";
  }
}


// ======================================================
// === AUTENTICACIÓN Y CONFIGURACIÓN (API) ===
// ======================================================
async function registrarRefugio() {
    const nombreRefugio = document.getElementById("nombreRefugio").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const ciudad = document.getElementById("ciudad").value.trim(); 
    const responsable = document.getElementById("responsable").value.trim(); 

    if (!nombreRefugio || !email || !password || !responsable) {
        return mostrarAlerta("Por favor completa los campos obligatorios.", "error");
    }

    const nuevoRefugio = { nombreRefugio, email, password, telefono, ciudad, responsable };

    try {
        const respuesta = await fetch(`${URL_BASE}/refugio/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoRefugio)
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            mostrarAlerta("Registro exitoso 🐾 Ahora puedes iniciar sesión.", "success");
            mostrarLogin();
            document.getElementById("registroForm").reset();
        } else {
            mostrarAlerta(datos.error || datos.mensaje || "Error desconocido al registrar. Verifique logs del servidor.", "error");
        }

    } catch (error) {
        console.error("Error de fetch al registrar refugio:", error);
        mostrarAlerta("Error de conexión con el servidor. ¿Docker está activo?", "error");
    }
}

async function iniciarSesion() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
        return mostrarAlerta("Completa todos los campos.", "error");
    }

    try {
        const respuesta = await fetch(`${URL_BASE}/refugio/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            const r = datos.refugio;

            const refugioMapeado = {
                idRes: r.idres,           
                nombre: r.nombreres,      
                email: r.email,
                telefono: r.telefono,     
                ciudad: r.direccionres,   
                responsable: r.nombreres,
            };

            localStorage.setItem("refugioActivo", JSON.stringify(refugioMapeado));
            refugioActivo = refugioMapeado;
            
            mostrarAlerta(datos.mensaje || `¡Bienvenido, ${r.nombreres}! 💙`, "success");
            setTimeout(mostrarPanelRefugio, 800);
        } else {
            mostrarAlerta(datos.error || "Credenciales incorrectas.", "error");
        }
    } catch (error) {
        console.error("Error de fetch en login de refugio:", error);
        mostrarAlerta("Error de conexión con el servidor. ¿Docker está activo?", "error");
    }
}

async function guardarConfiguracion(ev) {
    ev.preventDefault();

    const pass1 = document.getElementById("cfgPass1").value.trim();
    const pass2 = document.getElementById("cfgPass2").value.trim();
    const telefono = document.getElementById("cfgTelefono").value.trim();
    const ciudad = document.getElementById("cfgCiudad").value.trim();
    const responsable = document.getElementById("cfgResponsable").value.trim();

    if (pass1 || pass2) {
        if (pass1.length < 6) return mostrarAlerta("La contraseña debe tener al menos 6 caracteres.", "error");
        if (pass1 !== pass2) return mostrarAlerta("Las contraseñas no coinciden.", "error");
    }

    let ra = JSON.parse(localStorage.getItem("refugioActivo"));
    if (!ra || !ra.idRes) return mostrarAlerta("No hay sesión activa o ID de responsable.", "error");

    const datosAEnviar = {
        telefono: telefono || null,
        ciudad: ciudad || null,
        responsable: responsable || null,
        password: pass1 || undefined
    };

    try {
        const respuesta = await fetch(`${URL_BASE}/refugio/config/${ra.idRes}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosAEnviar)
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            const r = datos.refugio; 

            ra.telefono = r.telefono;
            ra.ciudad = r.direccionres; 
            ra.responsable = r.nombreres;
            ra.nombre = r.nombreres; 

            localStorage.setItem("refugioActivo", JSON.stringify(ra));
            refugioActivo = ra;

            document.getElementById("cfgPass1").value = "";
            document.getElementById("cfgPass2").value = "";
            mostrarPanelRefugio(); 

            mostrarAlerta(datos.message || "Configuración guardada correctamente.", "success");
        } else {
            mostrarAlerta(datos.error || datos.message || "Error al actualizar la configuración.", "error");
        }

    } catch (error) {
        console.error("Error de fetch al guardar configuración:", error);
        mostrarAlerta("Error de conexión con el servidor.", "error");
    }
}

function cerrarSesion() {
  localStorage.removeItem("refugioActivo");
  mostrarInicio();
  mostrarAlerta("Sesión cerrada correctamente.", "info");
}


// ======================================================
// === GESTIÓN DE MASCOTAS (API CRUD) ===
// ======================================================

function abrirFormularioMascota() {
  document.getElementById("modalMascota").style.display = "flex";
}

function cerrarModalMascota() {
  document.getElementById("modalMascota").style.display = "none";
  document.getElementById("formMascota").reset();
}

async function guardarMascota(event) {
    event.preventDefault();

    const ra = JSON.parse(localStorage.getItem("refugioActivo"));
    if (!ra || !ra.idRes) { 
        return mostrarAlerta("Error: No se pudo identificar al refugio activo.", "error");
    }

    const nombre = document.getElementById("nombreMascota").value.trim();
    const edad = document.getElementById("edadMascota").value.trim();
    
    // DUMMY DATA para campos requeridos por la DB:
    const especie = 'Perro'; 
    const raza = 'Mestizo';  
    const sexo = 'Hembra';  
    const edadNumero = parseInt(edad.split(' ')[0]) || 0;

    const nuevaMascota = {
        idRefugio: ra.idRes, 
        nombre: nombre,
        edad: edadNumero, 
        especie: especie, 
        raza: raza,
        sexo: sexo
    };

    try {
        const respuesta = await fetch(`${URL_BASE}/mascotas/nueva`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevaMascota)
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            mostrarAlerta(datos.mensaje || "Mascota registrada correctamente 🐶", "success");
            cerrarModalMascota();
            mostrarSeccion('mascotas'); 
        } else {
            mostrarAlerta(datos.error || "Error al registrar la mascota en la base de datos.", "error");
        }

    } catch (error) {
        console.error("Error de fetch al registrar mascota:", error);
        mostrarAlerta("Error de conexión con el servidor. ¿Docker está activo?", "error");
    }
}

// Muestra las mascotas del refugio activo (API READ)
async function mostrarMascotasRefugio() {
  const lista = document.getElementById("listaMascotasRefugio");
  const ra = JSON.parse(localStorage.getItem("refugioActivo"));
  
  if (!ra || !ra.idRes) {
      lista.innerHTML = "<p>Error: ID de refugio no encontrado.</p>";
      return;
  }
  
  lista.innerHTML = "<h4>Cargando tus mascotas... 🐾</h4>";
  
  try {
      const respuesta = await fetch(`${URL_BASE}/mascotas`);
      const mascotasPublicas = await respuesta.json();

      if (!respuesta.ok) {
          throw new Error(mascotasPublicas.error || "Error al obtener lista pública.");
      }
      
      // 🚨 CORRECCIÓN: Convertir ambos IDs a String para la comparación
      const idRefugioActivoStr = String(ra.idRes); 

      // Filtramos por el campo idrefugio (la clave que devuelve PostgreSQL)
      const propias = mascotasPublicas.filter(m => String(m.idrefugio) === idRefugioActivoStr); 

      if (!propias.length) {
          lista.innerHTML = "<p>No tienes mascotas registradas aún 🐾</p>";
          return;
      }
      
      lista.innerHTML = propias
          .map(
              (m) => `
              <div class="tarjeta-mascota">
                  <img src="${m.img_url || 'https://via.placeholder.com/150'}" alt="${m.nombre}" class="foto-mascota">
                  <h4>${m.nombre}</h4>
                  <p><strong>Especie:</strong> ${m.especie}</p>
                  <p><strong>Edad:</strong> ${m.edad} años</p>
                  <p><strong>Raza:</strong> ${m.raza}</p>
                  <p><strong>Estado:</strong> En Adopción</p>
                  <div class="tarjeta-acciones">
                      <button onclick="editarMascota(${m.idmascota})">Editar</button>
                      <button onclick="eliminarMascota(${m.idmascota})" class="btn-eliminar">Eliminar</button>
                  </div>
              </div>
          `
          )
          .join("");

  } catch (error) {
      console.error("Error al cargar mascotas del refugio:", error);
      lista.innerHTML = `<p style="color:red;">Error al cargar: ${error.message}</p>`;
  }
}

async function eliminarMascota(idMascota) {
    if (!confirm(`¿Estás seguro de eliminar la mascota con ID ${idMascota}? Esta acción es irreversible.`)) {
        return;
    }
    
    try {
        const respuesta = await fetch(`${URL_BASE}/mascotas/${idMascota}`, {
            method: 'DELETE',
        });
        
        const datos = await respuesta.json();
        
        if (respuesta.ok) {
            mostrarAlerta(datos.message || `Mascota ID ${idMascota} eliminada.`, "success");
            mostrarMascotasRefugio(); 
        } else {
            mostrarAlerta(datos.message || datos.error || "Error al eliminar la mascota.", "error");
        }
        
    } catch (error) {
        console.error("Error de fetch al eliminar mascota:", error);
        mostrarAlerta("Error de conexión con el servidor. ¿Docker está activo?", "error");
    }
}

function editarMascota(idMascota) {
    mostrarAlerta(`Abriendo edición para Mascota ID ${idMascota}. Lógica de formulario PUT pendiente.`, "info");
}

async function mostrarSolicitudesRefugio() {
    const lista = document.getElementById("listaSolicitudesRefugio");
    const ra = JSON.parse(localStorage.getItem("refugioActivo"));
  
    if (!ra || !ra.idRes) {
        lista.innerHTML = "<p>Error: ID de refugio no encontrado.</p>";
        return;
    }
    
    lista.innerHTML = "<h4>Cargando solicitudes... 💌</h4>";
    
    try {
        const respuesta = await fetch(`${URL_BASE}/solicitudes/${ra.idRes}`); 
        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.error || "Error al obtener lista de solicitudes.");
        }
        
        const solicitudes = datos.data;

        if (!solicitudes || !solicitudes.length) {
            lista.innerHTML = "<p>No hay solicitudes pendientes en este momento. 🐾</p>";
            return;
        }
        
        lista.innerHTML = solicitudes
            .map(
                (s) => `
                <div class="solicitud-card ${s.estado.toLowerCase()}">
                    <p><strong>Mascota:</strong> ${s.mascota_nombre}</p>
                    <p><strong>Adoptante:</strong> ${s.usuario_nombre} (${s.usuario_email})</p>
                    <p><strong>Fecha:</strong> ${new Date(s.fechasolicitud).toLocaleDateString()}</p>
                    <p><strong>Estado:</strong> <span class="estado-tag">${s.estado}</span></p>
                    <button onclick="verDetalleSolicitud(${s.idsolicitud})">Ver Detalle</button>
                </div>
            `
            )
            .join("");

    } catch (error) {
        lista.innerHTML = `<p style="color:red;">Error al cargar solicitudes. Verifica la tabla Solicitudes.</p>`;
    }
}


// ======================================================
// === AUTOEJECUCIÓN AL CARGAR ===
// ======================================================
window.onload = () => {
  if (refugioActivo) {
    mostrarPanelRefugio();
    mostrarAlerta(`Bienvenido de nuevo, ${refugioActivo.nombre}`, "info");
  } else {
    mostrarInicio();
  }
};