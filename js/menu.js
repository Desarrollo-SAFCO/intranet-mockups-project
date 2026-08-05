document.addEventListener("DOMContentLoaded", () => {
    // Aplicar filtrado de permisos según usuario activo
    applyRolePermissions();

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

// Aplicar permisos de visibilidad en el Menú Lateral según la Sesión
function applyRolePermissions() {
    const sessionData = localStorage.getItem("userSession");
    let user = "admin";
    let scope = "ALL";

    if (sessionData) {
        try {
            const data = JSON.parse(sessionData);
            user = (data.user || "admin").toLowerCase();
            scope = data.scope || (user === "produccion" ? "PRODUCCION" : (user === "calidad" ? "CALIDAD" : "ALL"));

            const displayEl = document.getElementById("displayUser");
            if (displayEl) displayEl.textContent = data.user.toUpperCase();
            
            const selectEl = document.getElementById("topbarSimUserSelect");
            if (selectEl) selectEl.value = data.user;
        } catch (e) {
            console.error("Error leyendo sesión:", e);
        }
    }

    const menuItems = document.querySelectorAll('.sidebar-menu > li[data-module]');
    menuItems.forEach(item => {
        const mod = item.getAttribute('data-module');
        if (scope === 'PRODUCCION' || user === 'produccion') {
            item.style.display = (mod === 'PRODUCCION') ? '' : 'none';
        } else if (scope === 'CALIDAD' || user === 'calidad') {
            item.style.display = (mod === 'CALIDAD') ? '' : 'none';
        } else {
            item.style.display = ''; // Admin ve todo
        }
    });

    // Ajustar página inicial del Iframe según el rol
    const iframe = document.querySelector(".content-iframe");
    if (iframe) {
        const currentSrc = iframe.src || "";
        if (scope === 'PRODUCCION' || user === 'produccion') {
            if (!currentSrc.includes('/produccion/')) {
                iframe.src = "produccion/asignacion-mesas.html";
            }
        } else if (scope === 'CALIDAD' || user === 'calidad') {
            if (!currentSrc.includes('/calidad/')) {
                iframe.src = "calidad/asignacion-implementos.html";
            }
        }
    }
}

// Cambiar el usuario simulado de sesión y actualizar el Iframe
function changeSimulatedUser(username) {
    const USER_CONFIG_MAP = {
        "produccion": { role: 'Jefe de Producción', area: 'PRODUCCION', scope: 'PRODUCCION' },
        "calidad": { role: 'Inspector de Calidad', area: 'CALIDAD', scope: 'CALIDAD' },
        "admin": { role: 'Administrador General', area: 'SISTEMAS', scope: 'ALL' },
        "alex.quintanilla": { role: 'Jefe de Sistemas', area: 'SISTEMAS', scope: 'ALL' },
        "carlos.mendoza": { role: 'Jefe de Seguridad', area: 'SEGURIDAD', scope: 'ALL' },
        "ana.rodriguez": { role: 'Supervisor de Frío', area: 'FRIO Y DESPACHO', scope: 'ALL' },
        "luis.zarat": { role: 'Analista de RRHH', area: 'RECURSOS HUMANOS', scope: 'ALL' }
    };
    
    const config = USER_CONFIG_MAP[username] || { role: 'Administrador', area: 'SISTEMAS', scope: 'ALL' };
    
    localStorage.setItem("userSession", JSON.stringify({
        user: username,
        role: config.role,
        area: config.area,
        scope: config.scope
    }));
    
    // Aplicar los nuevos permisos al menú
    applyRolePermissions();
    
    // Recargar el iframe con la página correspondiente
    const iframe = document.querySelector(".content-iframe");
    if (iframe) {
        if (config.scope === 'PRODUCCION') {
            iframe.src = "produccion/asignacion-mesas.html";
        } else if (config.scope === 'CALIDAD') {
            iframe.src = "calidad/asignacion-implementos.html";
        } else {
            iframe.src = "dashboard.html";
        }
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
