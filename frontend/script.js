// ======================================================
// 🐾 HappyPaws - Control de usuario (inicio, login y panel)
// ======================================================

let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
let usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo")) || null;

// ======================================================
// === SECCIONES ===
const inicioSection = document.getElementById("inicioSection");
const loginSection = document.getElementById("loginSection");
const registroSection = document.getElementById("registroSection");
const panelUsuario = document.getElementById("panelUsuario");

// ======================================================
// === FUNCIÓN GENÉRICA DE MOSTRAR SECCIONES ===
function mostrarSolo(seccionActiva) {
  [inicioSection, loginSection, registroSection, panelUsuario].forEach(
    (s) => (s.style.display = "none")
  );
  seccionActiva.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ======================================================
// === CAMBIO DE SECCIONES ===
function mostrarInicio() { mostrarSolo(inicioSection); }
function mostrarLogin() { mostrarSolo(loginSection); }
function mostrarRegistro() { mostrarSolo(registroSection); }

// ======================================================
// === REGISTRO DE NUEVO USUARIO ===
function registrarUsuario() {
  const nombre = document.getElementById("nombreComp").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const ciudad = document.getElementById("ciudad").value.trim();

  if (!nombre || !email || !password)
    return mostrarAlerta("Por favor completa los campos obligatorios.", "error");

  if (usuarios.find((u) => u.email === email))
    return mostrarAlerta("Este correo ya está registrado.", "error");

  const nuevoUsuario = {
    idUsuario: Date.now(),
    nombre,
    email,
    password,
    telefono,
    ciudad,
  };

  usuarios.push(nuevoUsuario);
  localStorage.setItem("usuarios", JSON.stringify(usuarios));

  mostrarAlerta("Cuenta creada con éxito 🐾 Ahora puedes iniciar sesión.", "success");
  mostrarLogin();
}

// ======================================================
// === INICIO DE SESIÓN ===
function iniciarSesion() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password)
    return mostrarAlerta("Por favor completa todos los campos.", "error");

  const usuario = usuarios.find((u) => u.email === email && u.password === password);

  if (!usuario)
    return mostrarAlerta("Credenciales incorrectas. Verifica tu correo y contraseña.", "error");

  usuarioActivo = usuario;
  localStorage.setItem("usuarioActivo", JSON.stringify(usuario));

  mostrarAlerta(`¡Bienvenido, ${usuario.nombre}! 🐶`, "success");
  mostrarPanelUsuario();
}

// ======================================================
// === REFUGIOS REGISTRADOS ===
const refugios = [
  {
    id: 1,
    nombre: "Refugio Esperanza",
    contacto: "contacto@refugioesperanza.org",
    telefono: "8112345678",
    ciudad: "Monterrey",
    redes: {
      facebook: "https://facebook.com/refugioesperanza",
      instagram: "https://instagram.com/refugioesperanza"
    },
    descripcion: "Más de 10 años rescatando peluditos y encontrando hogares amorosos 💕",
    logo: "https://i.imgur.com/3nU8gPp.png"
  },
  {
    id: 2,
    nombre: "Huellitas del Corazón",
    contacto: "huellitas@gmail.com",
    telefono: "5578912345",
    ciudad: "CDMX",
    redes: {
      facebook: "https://facebook.com/huellitasmx",
      instagram: "https://instagram.com/huellitasmx"
    },
    descripcion: "Rescatamos perros y gatos en situación de calle para darles una segunda oportunidad 🐾",
    logo: "https://i.imgur.com/7dYfIuZ.png"
  }
];

// ======================================================
// === MASCOTAS DISPONIBLES ===
const mascotas = [
  {
    nombre: "Luna",
    especie: "Perro",
    raza: "Labrador",
    edad: "3 años",
    ciudad: "Monterrey",
    historia: "Luna fue rescatada de un lote baldío. Es juguetona, protectora y muy cariñosa.",
    refugioId: 1,
    img: "https://nupec.com/wp-content/uploads/2020/07/Captura-de-pantalla-2020-07-24-a-las-17.33.44.png"
  },
  {
    nombre: "Milo",
    especie: "Gato",
    raza: "Siamés",
    edad: "2 meses",
    ciudad: "Guadalajara",
    historia: "Milo es curioso y muy sociable. Se adapta rápido y le encantan los juguetes con plumas.",
    refugioId: 2,
    img: "https://i.redd.it/tips-on-how-to-properly-care-for-a-siamese-cat-v0-xw2srmf601xe1.jpg?width=1536&format=pjpg&auto=webp&s=36867f9f56735fd3e55661fe9676cafe5bd06a03"
  },
  {
    nombre: "Rocky",
    especie: "Perro",
    raza: "Pitbull",
    edad: "4 años",
    ciudad: "CDMX",
    historia: "Rocky vivió en la calle, pero se lleva muy bien con niños y otros perros.",
    refugioId: 2,
    img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRK3VYxQCktLRPpUSU8UiFBE0_GHM7ipKm4GUPMxNV2Gw2SB8kLTZW8mQdvqA3wnze7x9gzaDlBQLtLOd18luISqlwQJYaCC5Tv6Z9AQCE&s=10"
  },
  {
    nombre: "Nina",
    especie: "Conejo",
    raza: "Mini Lop",
    edad: "1 año",
    ciudad: "Tampico",
    historia: "Nina es una conejita muy tranquila y limpia, ideal para interiores.",
    refugioId: 1,
    img: "https://conejosenanossiero.com/wp-content/uploads/2021/05/IMG_9295-min.jpg"
  }
];

// ======================================================
// === PANEL DE USUARIO ===
function mostrarPanelUsuario() {
  document.querySelector("#perfilSection").style.display = "none";
  document.querySelector("#solicitudesSection").style.display = "none";
  document.querySelector("#detalleMascotaSection").style.display = "none";
  mostrarSolo(panelUsuario);

  if (!usuarioActivo) return;
  document.getElementById("userName").textContent = usuarioActivo.nombre;
  document.getElementById("nombreUsuario").textContent = usuarioActivo.nombre;
  document.querySelector(".mascotas").style.display = "block";
  mostrarMascotas();
}

// ======================================================
// === MOSTRAR MASCOTAS ===
function mostrarMascotas(listaFiltrada = mascotas) {
  const lista = document.getElementById("listaMascotas");
  lista.innerHTML = "";

  listaFiltrada.forEach((m, i) => {
    const card = document.createElement("div");
    card.classList.add("hp-pet");
    card.style.animationDelay = `${i * 0.1}s`;
    card.innerHTML = `
      <img src="${m.img}" alt="${m.nombre}" class="hp-pet__img" />
      <div class="hp-pet__body">
        <h4 class="hp-pet__name">${m.nombre}</h4>
        <p class="hp-pet__meta">${m.especie} • ${m.raza}</p>
        <p class="hp-pet__meta">Edad: ${m.edad}</p>
        <p class="hp-pet__location">📍 ${m.ciudad}</p>
      </div>
    `;
    card.addEventListener("click", () => verMascota(m));
    lista.appendChild(card);
  });

  document.getElementById("sinMascotas").style.display = listaFiltrada.length ? "none" : "block";
}

// ======================================================
// === FILTRO DE MASCOTAS ===
function filtrarMascotas() {
  const query = document.getElementById("buscarMascota").value.toLowerCase().trim();

  if (!query) return mostrarMascotas();

  const filtradas = mascotas.filter(m => {
    const refugio = refugios.find(r => r.id === m.refugioId);
    const refugioNombre = refugio ? refugio.nombre.toLowerCase() : "";

    // Se puede buscar por nombre, especie, raza, ciudad o refugio
    const texto = `${m.nombre} ${m.especie} ${m.raza} ${m.ciudad} ${refugioNombre}`.toLowerCase();
    return texto.includes(query);
  });

  mostrarMascotas(filtradas);
}

// ======================================================
// === DETALLE DE MASCOTA ===
function verMascota(mascota) {
  const lista = document.querySelector(".mascotas");
  const detalleSection = document.getElementById("detalleMascotaSection");
  lista.style.display = "none";
  detalleSection.style.display = "block";

  const detalle = document.getElementById("detalleMascota");
  const refugio = refugios.find(r => r.id === mascota.refugioId);

  detalle.innerHTML = `
    <div class="detalle-card">
      <img src="${mascota.img}" alt="${mascota.nombre}" class="detalle-img">
      <h2>${mascota.nombre}</h2>
      <p><strong>Especie:</strong> ${mascota.especie}</p>
      <p><strong>Raza:</strong> ${mascota.raza}</p>
      <p><strong>Edad:</strong> ${mascota.edad}</p>
      <p><strong>Ciudad:</strong> ${mascota.ciudad}</p>
      <hr>
      <p><em>${mascota.historia}</em></p>

      ${refugio ? `
        <div class="refugio-info">
          <h3>🏠 Refugio: ${refugio.nombre}</h3>
          <p>${refugio.descripcion}</p>
          <p><strong>📧</strong> ${refugio.contacto}</p>
          <p><strong>📱</strong> ${refugio.telefono}</p>
          <p><strong>📍</strong> ${refugio.ciudad}</p>
          <p>
            <a href="${refugio.redes.facebook}" target="_blank">Facebook</a> |
            <a href="${refugio.redes.instagram}" target="_blank">Instagram</a>
          </p>
        </div>` : `<p class="hp-muted">Refugio no disponible</p>`}
      <button class="hp-pet__btn" onclick="adoptar('${mascota.nombre}')">Adoptar</button>
    </div>
  `;
}

function volverALista() {
  const lista = document.querySelector(".mascotas");
  const detalleSection = document.getElementById("detalleMascotaSection");
  detalleSection.style.display = "none";
  lista.style.display = "block";
}

// ======================================================
// === SOLICITUDES DE ADOPCIÓN ===
let solicitudes = JSON.parse(localStorage.getItem("solicitudes")) || [];

function adoptar(nombreMascota) {
  if (!usuarioActivo)
    return mostrarAlerta("Inicia sesión para enviar una solicitud 💌", "info");

  const fecha = new Date().toLocaleDateString();
  const solicitud = { usuario: usuarioActivo.email, mascota: nombreMascota, estado: "Pendiente", fecha };
  solicitudes.push(solicitud);
  localStorage.setItem("solicitudes", JSON.stringify(solicitudes));
  mostrarAlerta(`Has enviado una solicitud de adopción por ${nombreMascota} 💌`, "success");
}

function mostrarSolicitudes() {
  const contenedor = document.getElementById("listaSolicitudes");
  contenedor.innerHTML = "";

  const misSolicitudes = solicitudes.filter(s => s.usuario === usuarioActivo.email);
  if (misSolicitudes.length === 0)
    return contenedor.innerHTML = `<p class="hp-muted">Aún no has enviado solicitudes 🐾</p>`;

  misSolicitudes.forEach((s, i) => {
    const card = document.createElement("div");
    card.classList.add("solicitud-card");
    card.innerHTML = `
      <p><strong>${i + 1}.</strong> Mascota: <b>${s.mascota}</b></p>
      <p>📅 ${s.fecha}</p>
      <p>Estado: <span class="estado ${s.estado.toLowerCase()}">${s.estado}</span></p>
      <button class="hp-btn hp-btn--danger hp-btn--small" onclick="eliminarSolicitud(${i})">Eliminar</button>
    `;
    contenedor.appendChild(card);
  });
}

function eliminarSolicitud(index) {
  const misSolicitudes = solicitudes.filter(s => s.usuario === usuarioActivo.email);
  const solicitud = misSolicitudes[index];
  solicitudes = solicitudes.filter(s => s !== solicitud);
  localStorage.setItem("solicitudes", JSON.stringify(solicitudes));
  mostrarSolicitudes();
  mostrarAlerta("Solicitud eliminada 🗑️", "info");
}

function irAMisSolicitudes() {
  document.querySelector("#panelUsuario").style.display = "none";
  document.querySelector("#perfilSection").style.display = "none";
  document.querySelector("#solicitudesSection").style.display = "block";
  mostrarSolicitudes();
}

function volverAlPanel() {
  document.querySelector("#solicitudesSection").style.display = "none";
  document.querySelector("#perfilSection").style.display = "none";
  document.querySelector("#panelUsuario").style.display = "block";
}

// ======================================================
// === PERFIL DEL USUARIO ===
function irAPerfil() {
  const usuario = JSON.parse(localStorage.getItem("usuarioActivo"));
  if (!usuario) return mostrarAlerta("Inicia sesión primero 💌", "info");

  document.querySelector("#panelUsuario").style.display = "none";
  document.querySelector("#solicitudesSection").style.display = "none";
  document.querySelector("#perfilSection").style.display = "block";

  document.getElementById("perfilNombreVista").textContent = usuario.nombre || "—";
  document.getElementById("perfilCorreoVista").textContent = usuario.email || "—";
  document.getElementById("perfilTelefonoVista").textContent = usuario.telefono || "—";
  document.getElementById("perfilCiudadVista").textContent = usuario.ciudad || "—";
}

function mostrarEdicionPerfil() {
  const usuario = JSON.parse(localStorage.getItem("usuarioActivo"));
  if (!usuario) return;

  document.getElementById("perfilVista").style.display = "none";
  document.getElementById("perfilForm").style.display = "block";

  document.getElementById("perfilNombre").value = usuario.nombre || "";
  document.getElementById("perfilTelefono").value = usuario.telefono || "";
  document.getElementById("perfilCiudad").value = usuario.ciudad || "";
}

function guardarPerfil() {
  const nombre = document.getElementById("perfilNombre").value.trim();
  const telefono = document.getElementById("perfilTelefono").value.trim();
  const ciudad = document.getElementById("perfilCiudad").value.trim();

  if (!nombre) return mostrarAlerta("El nombre no puede estar vacío.", "error");

  let usuario = JSON.parse(localStorage.getItem("usuarioActivo"));
  usuario.nombre = nombre;
  usuario.telefono = telefono;
  usuario.ciudad = ciudad;

  let lista = JSON.parse(localStorage.getItem("usuarios")) || [];
  lista = lista.map(u => u.email === usuario.email ? usuario : u);
  localStorage.setItem("usuarios", JSON.stringify(lista));
  localStorage.setItem("usuarioActivo", JSON.stringify(usuario));

  mostrarAlerta("Perfil actualizado correctamente 💾", "success");
  cancelarEdicionPerfil();
  irAPerfil();
}

function cancelarEdicionPerfil() {
  document.getElementById("perfilVista").style.display = "block";
  document.getElementById("perfilForm").style.display = "none";
}

// ======================================================
// === CERRAR SESIÓN ===
function cerrarSesion() {
  localStorage.removeItem("usuarioActivo");
  usuarioActivo = null;
  mostrarAlerta("Sesión cerrada correctamente 🐾", "info");
  setTimeout(() => location.reload(), 1000);
}

// ======================================================
// === ALERTAS BONITAS ===
function mostrarAlerta(mensaje, tipo = "info") {
  const colores = {
    success: "#c1f4d3",
    error: "#f8caca",
    info: "#d7e7ff",
  };
  const alerta = document.createElement("div");
  alerta.textContent = mensaje;
  Object.assign(alerta.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "12px 18px",
    borderRadius: "10px",
    background: colores[tipo] || "#eee",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    zIndex: "9999",
    fontWeight: "600",
    transition: "all 0.4s ease",
  });
  document.body.appendChild(alerta);

  setTimeout(() => {
    alerta.style.opacity = "0";
    alerta.style.transform = "translateY(-10px)";
    setTimeout(() => alerta.remove(), 400);
  }, 2500);
}

// ======================================================
// === AL CARGAR LA PÁGINA ===
window.onload = () => {
  usuarioActivo ? mostrarPanelUsuario() : mostrarInicio();
};
