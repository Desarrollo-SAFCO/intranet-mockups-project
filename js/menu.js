document.addEventListener("DOMContentLoaded", () => {
    // Validar sesión antes de mostrar el menú
    // En un caso real comentamos checkAuth si queremos que se vea local sin interactuar primero
    // checkAuth();

    // Recuperar el nombre de usuario de la sesión simulada
    const sessionData = localStorage.getItem("userSession");
    if(sessionData) {
        try {
            const data = JSON.parse(sessionData);
            const displayEl = document.getElementById("displayUser");
            if (displayEl) displayEl.textContent = data.user.toUpperCase();
            
            const selectEl = document.getElementById("topbarSimUserSelect");
            if (selectEl) selectEl.value = data.user;
        } catch (e) {
            console.error("Error leyendo sesión:", e);
        }
    }

    // Colapsar sidebar por defecto al iniciar en móvil/tablet
    const sidebar = document.getElementById("mainSidebar");
    if (window.innerWidth <= 768 && sidebar) {
        sidebar.classList.add("hidden");
    }

    // Cerrar sidebar automáticamente al seleccionar una página en móvil/tablet
    const links = document.querySelectorAll('.sidebar-link:not(.has-submenu)');
    links.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768 && sidebar) {
                sidebar.classList.add("hidden");
            }
        });
    });

    // Cerrar sidebar al hacer click fuera en el documento principal
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && sidebar && !sidebar.classList.contains('hidden')) {
            const toggleBtn = document.querySelector('.menu-toggle');
            if (!sidebar.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target))) {
                sidebar.classList.add("hidden");
            }
        }
    });

    // Cerrar sidebar al hacer click dentro del iframe
    const iframe = document.querySelector(".content-iframe");
    if (iframe) {
        iframe.onload = () => {
            try {
                iframe.contentWindow.document.addEventListener('click', () => {
                    if (window.innerWidth <= 768 && sidebar && !sidebar.classList.contains('hidden')) {
                        sidebar.classList.add("hidden");
                    }
                });
            } catch (err) {
                console.warn("No se pudo enlazar click al iframe (CORS):", err);
            }
        };
    }
});

// Cambiar el usuario simulado de sesión y actualizar el Iframe
function changeSimulatedUser(username) {
    const USER_AREA_MAP = {
        "alex.quintanilla": "SISTEMAS",
        "carlos.mendoza": "SEGURIDAD",
        "ana.rodriguez": "FRIO Y DESPACHO",
        "luis.zarat": "RECURSOS HUMANOS"
    };
    
    const area = USER_AREA_MAP[username] || "SISTEMAS";
    localStorage.setItem("userSession", JSON.stringify({ user: username, role: 'Inspector', area: area }));
    
    // Actualizar nombre mostrado en topbar
    const displayEl = document.getElementById("displayUser");
    if (displayEl) displayEl.textContent = username.toUpperCase();
    
    // Recargar el iframe activo para propagar el cambio
    const iframe = document.querySelector(".content-iframe");
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.location.reload();
    }
}

// --- MODO TABLET KIOSCO / EXPANDIR CANVAS (Pura manipulación CSS para Capacitor/Hybrid) ---
function toggleKioskTabletMode() {
    const isKiosk = document.body.classList.toggle("kiosk-tablet-mode");
    return isKiosk;
}

// Escuchar mensaje seguro postMessage desde iframes para manipular el layout de menu.html
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'TOGGLE_TABLET_KIOSK') {
        const isKiosk = toggleKioskTabletMode();
        try {
            if (event.source && event.source.postMessage) {
                event.source.postMessage({ type: 'TABLET_KIOSK_STATUS', isKiosk: isKiosk }, '*');
            }
        } catch (e) {
            console.warn('PostMessage reply warning:', e);
        }
    }
});

window.toggleKioskTabletMode = toggleKioskTabletMode;
