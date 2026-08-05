/**
 * shared.js - Utilidades globales para el Mockup
 */

// Verificador de Sesión (Prevenir acceso a páginas protegidas si no hay mock login)
function checkAuth() {
    const session = localStorage.getItem("userSession");
    const path = window.location.pathname;
    const isLoginPage = path.endsWith("index.html") || path.endsWith("/");
    if (!session && !isLoginPage) {
        let redirectPath = "index.html";
        if (path.includes("/produccion/") || path.includes("/calidad/") || path.includes("/administracion/") || path.includes("/transportes/") || path.includes("/seguridad/") || path.includes("/frio/") || path.includes("/general/")) {
            redirectPath = "../index.html";
        }
        window.location.href = redirectPath;
    }
}

// Cerrar sesión
function logout(e) {
    if (e && e.preventDefault) e.preventDefault();
    localStorage.removeItem("userSession");
    let redirectPath = "index.html";
    const path = window.location.pathname;
    if (path.includes("/produccion/") || path.includes("/calidad/") || path.includes("/administracion/") || path.includes("/transportes/") || path.includes("/seguridad/") || path.includes("/frio/") || path.includes("/general/")) {
        redirectPath = "../index.html";
    }
    window.location.href = redirectPath;
}

// Formatear una fecha YYYY-MM-DD para viz (ej: 26/03/2026)
function formatDate(dateString) {
    if(!dateString) return "";
    const parts = dateString.split("-");
    if(parts.length < 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Función mock para generar un ID aleatorio basico
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Manejador del Acordeón del menú (Niveles desplegables)
function toggleSubmenu(e, element) {
    e.preventDefault();
    const parentItem = element.parentElement;
    
    // Opcional: Cerrar los hermanos para que solo uno esté abierto a la vez
    // Array.from(parentItem.parentElement.children).forEach(sibling => {
    //     if (sibling !== parentItem) sibling.classList.remove("expanded");
    // });

    parentItem.classList.toggle("expanded");
}

// Ocultar/Mostrar la Barra Lateral en el modo Iframe SPA
function toggleSidebar() {
    const sidebar = document.getElementById("mainSidebar");
    if (sidebar) {
        sidebar.classList.toggle("hidden");
    }
}

// Ocultar/Mostrar Menú Flotante del Usuario
function toggleUserMenu() {
    const popup = document.getElementById("userPopup");
    if(popup) {
        popup.classList.toggle("active");
    }
}

// Cerrar popup al hacer click fuera
window.addEventListener('click', function(e) {
    const container = document.querySelector('.user-menu-container');
    const popup = document.getElementById('userPopup');
    if (container && popup && !container.contains(e.target)) {
        popup.classList.remove('active');
    }
});
