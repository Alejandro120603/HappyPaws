// === CONTROL DEL MENÚ DESPLEGABLE ===
const menuToggle = document.getElementById("menu-toggle");
const dropdownMenu = document.getElementById("dropdown-menu");

menuToggle.addEventListener("click", () => {
  const isOpen = dropdownMenu.style.display === "block";
  dropdownMenu.style.display = isOpen ? "none" : "block";
  menuToggle.textContent = isOpen ? "☰" : "✖";
});

// Cerrar si se hace clic fuera
window.addEventListener("click", (e) => {
  if (!menuToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
    dropdownMenu.style.display = "none";
    menuToggle.textContent = "☰";
  }
});
