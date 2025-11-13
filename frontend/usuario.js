// usuario.js

// ===========================================
// CONFIGURACIÓN DE API
// ===========================================
const URL_BASE = 'http://localhost:3000/api'; 

let usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo"));

// [IMPLEMENTACIÓN DE FUNCIONES DE UTILIDAD: mostrarAlerta, ocultarTodosLosPaneles, etc.]

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

function ocultarTodosLosPaneles() {
    const secciones = [
        'inicioSection', 'loginSection', 'registroSection', 
        'panelUsuario', 'solicitudesSection', 'perfilSection',
        'detalleMascotaSection'
    ];
    secciones.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function mostrarPanel(idPanel) {
    ocultarTodosLosPaneles();
    const panel = document.getElementById(idPanel);
    if (panel) {
        panel.style.display = idPanel === 'panelUsuario' ? 'flex' : 'block'; 
    }
}

function mostrarLogin() { mostrarPanel('loginSection'); }
function mostrarRegistro() { mostrarPanel('registroSection'); }
function volverAlPanel() { mostrarPanel('panelUsuario'); }

function mostrarPanelUsuario() {
    if (usuarioActivo) {
        mostrarPanel('panelUsuario');
    } else {
        mostrarPanel('inicioSection');
    }
}

function irAPerfil() {
    mostrarPanel('perfilSection');
    if (usuarioActivo) {
        document.getElementById('perfilNombreVista').textContent = usuarioActivo.nombreComp || 'No especificado';
        document.getElementById('perfilCorreoVista').textContent = usuarioActivo.email || 'No especificado';
        document.getElementById('perfilTelefonoVista').textContent = usuarioActivo.telefono || 'No especificado';
        document.getElementById('perfilCiudadVista').textContent = usuarioActivo.ciudad || 'No especificado';
        
        document.getElementById('perfilNombre').value = usuarioActivo.nombreComp || '';
        document.getElementById('perfilTelefono').value = usuarioActivo.telefono || '';
        document.getElementById('perfilCiudad').value = usuarioActivo.ciudad || '';
        
        document.getElementById('perfilVista').style.display = 'block';
        document.getElementById('perfilForm').style.display = 'none';
    }
}
function mostrarEdicionPerfil() {
    document.getElementById('perfilVista').style.display = 'none';
    document.getElementById('perfilForm').style.display = 'block';
}
function cancelarEdicionPerfil() {
    document.getElementById('perfilVista').style.display = 'block';
    document.getElementById('perfilForm').style.display = 'none';
}
function irAMisSolicitudes() {
    mostrarPanel('solicitudesSection');
}


// ===========================================
// AUTENTICACIÓN (API)
// ===========================================

async function registrarUsuario() {
    const nombreComp = document.getElementById("nombreComp").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const telefono = document.getElementById("telefono").value;
    const ciudad = document.getElementById("ciudad").value;

    const nuevoUsuario = { nombre: nombreComp, email, password, telefono, ciudad }; 

    try {
        const respuesta = await fetch(`${URL_BASE}/registro`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoUsuario)
        });

        const datos = await respuesta.json();

        if (respuesta.ok) { 
            mostrarAlerta(`${datos.mensaje}. Por favor, inicia sesión.`, "success");
            mostrarLogin();
            document.getElementById("registroForm").reset();
        } else {
            mostrarAlerta(datos.error || datos.mensaje || "Error desconocido al registrar.", "error");
        }
    } catch (error) {
        mostrarAlerta("Error de conexión con el servidor. ¿Docker está corriendo?", "error");
    }
}

async function iniciarSesion() {
    const loginEmail = document.getElementById("loginEmail").value;
    const loginPassword = document.getElementById("loginPassword").value;

    const credenciales = { email: loginEmail, password: loginPassword };

    try {
        const respuesta = await fetch(`${URL_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credenciales)
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            const r = datos.usuario;
            
            // Mapear claves de PostgreSQL (minúsculas) a CamelCase
            const usuarioCorregido = {
                idUsuario: r.idusuario,
                nombreComp: r.nombrecomp,
                email: r.email,
                telefono: r.telefono,
                ciudad: r.ciudad     
            };

            localStorage.setItem("usuarioActivo", JSON.stringify(usuarioCorregido));
            usuarioActivo = usuarioCorregido; 
            
            document.getElementById("nombreUsuario").textContent = usuarioActivo.nombreComp;
            document.getElementById("userName").textContent = usuarioActivo.nombreComp;
            
            mostrarAlerta(datos.mensaje || `¡Bienvenido, ${r.nombrecomp}!`, "success");
            mostrarPanel('panelUsuario');
            mostrarMascotas(); 
            
        } else {
            mostrarAlerta(`Fallo en el inicio de sesión: ${datos.error || datos.mensaje}`, "error");
        }
    } catch (error) {
        mostrarAlerta("Error de conexión con el servidor.", "error");
    }
}

async function guardarPerfil() {
    if (!usuarioActivo || !usuarioActivo.idUsuario) {
        return mostrarAlerta("Error: No hay un usuario activo para actualizar.", "error");
    }
    
    const id = usuarioActivo.idUsuario;
    const nombreComp = document.getElementById("perfilNombre").value;
    const telefono = document.getElementById("perfilTelefono").value;
    const ciudad = document.getElementById("perfilCiudad").value;

    const datosActualizados = { nombreComp, telefono, ciudad };

    try {
        const respuesta = await fetch(`${URL_BASE}/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosActualizados)
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            const u = datos.usuario;
            
            // Actualizar objeto local con datos devueltos (minúsculas/CamelCase)
            usuarioActivo.nombreComp = u.nombreComp || u.nombrecomp;
            usuarioActivo.telefono = u.telefono;
            usuarioActivo.ciudad = u.ciudad;
            
            localStorage.setItem("usuarioActivo", JSON.stringify(usuarioActivo));
            
            mostrarAlerta(datos.message || "Perfil actualizado con éxito. 🎉", "success");
            irAPerfil(); 
        } else {
            mostrarAlerta(`Error al guardar perfil: ${datos.message || datos.error}`, "error");
        }
    } catch (error) {
        mostrarAlerta("Error de conexión con el servidor.", "error");
    }
}

function cerrarSesion() {
  localStorage.removeItem("usuarioActivo");
  mostrarAlerta("Sesión cerrada correctamente 🐾", "info");
  window.location.reload(); 
}

// ===========================================
// LISTADO DE MASCOTAS (API)
// ===========================================

async function mostrarMascotas() {
    const lista = document.getElementById("listaMascotas");
    lista.innerHTML = '<h4>Cargando mascotas... 🐾</h4>';

    try {
        const response = await fetch(`${URL_BASE}/mascotas`);
        const datos = await response.json();

        if (response.ok) {
            lista.innerHTML = "";
            
            if (datos && datos.length > 0) {
                datos.forEach(m => {
                    const card = document.createElement("div");
                    card.classList.add("mascota-card");
                    
                    card.innerHTML = `
                        <img src="${m.img_url}" alt="${m.nombre}">
                        <h4>${m.nombre}</h4>
                        <p>${m.especie} • ${m.raza}</p>
                        <p>Edad: ${m.edad} años</p>
                        <p>📍 ${m.ciudad}</p>
                        <button class="adoptar-btn" onclick="adoptar('${m.nombre}', ${m.idmascota})">Adoptar</button>
                    `;
                    lista.appendChild(card);
                });
                document.getElementById("sinMascotas").style.display = 'none';
            } else {
                document.getElementById("sinMascotas").style.display = 'block';
            }
        } else {
            lista.innerHTML = `Error al cargar: ${datos.message || datos.error}`;
        }
    } catch (error) {
        lista.innerHTML = 'Error de conexión con la API de mascotas.';
    }
}

// 🚨 FUNCIÓN CRÍTICA: ENVÍO DE SOLICITUD DE ADOPCIÓN
async function adoptar(nombreMascota, idMascota) {
    if (!usuarioActivo || !usuarioActivo.idUsuario) {
        return mostrarAlerta("Debes iniciar sesión para enviar una solicitud de adopción.", "error");
    }

    const mensajeUsuario = prompt(`Escribe un breve mensaje para el refugio sobre por qué quieres adoptar a ${nombreMascota}:`);
    
    if (mensajeUsuario === null) { 
        return;
    }

    const solicitud = {
        idMascota: idMascota,
        idUsuario: usuarioActivo.idUsuario,
        mensajeUsuario: mensajeUsuario || 'Interesado en adoptar.',
    };

    try {
        const respuesta = await fetch(`${URL_BASE}/solicitudes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(solicitud)
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            mostrarAlerta(datos.mensaje || `¡Solicitud enviada por ${nombreMascota}! 💌`, "success");
        } else {
            mostrarAlerta(datos.error || "Error al enviar la solicitud.", "error");
        }
    } catch (error) {
        mostrarAlerta("Error de conexión al enviar solicitud.", "error");
    }
}

function filtrarMascotas() {
    // Lógica pendiente de filtros
}

// ===========================================
// AUTOEJECUCIÓN
// ===========================================

window.onload = function () {
    if (usuarioActivo && usuarioActivo.nombreComp) {
        document.getElementById("nombreUsuario").textContent = usuarioActivo.nombreComp;
        document.getElementById("userName").textContent = usuarioActario.nombreComp;
        
        mostrarPanel('panelUsuario');
        mostrarMascotas(); 
    } else {
        mostrarPanel('inicioSection');
    }
    // Lógica del menú desplegable (si la tienes aquí)
};