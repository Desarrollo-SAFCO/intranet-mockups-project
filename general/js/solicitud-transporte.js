// --- MOCK DATABASE SEEDING ---
function initDatabase() {
    const defaultSolicitudes = [
        {
            id: "SOL-001",
            fecha: "2026-06-30",
            hora: "08:30",
            responsable: "Alex Quintanilla",
            area: "SISTEMAS",
            integrantes: ["Alex Quintanilla", "Juan Perez", "Robert Castro"],
            rutas: {
                inicio: "Sede Principal",
                intermedias: ["Garita Central"],
                fin: "Fundo El Pino"
            },
            estado: "Asignada",
            salidaId: "SAL-001"
        },
        {
            id: "SOL-002",
            fecha: "2026-06-30",
            hora: "08:30",
            responsable: "Pedro Gomez",
            area: "SISTEMAS",
            integrantes: ["Pedro Gomez", "Luis Torres"],
            rutas: {
                inicio: "Sede Principal",
                intermedias: [],
                fin: "Fundo El Pino"
            },
            estado: "Asignada",
            salidaId: "SAL-001"
        },
        {
            id: "SOL-003",
            fecha: "2026-07-01",
            hora: "10:00",
            responsable: "Alex Quintanilla",
            area: "SISTEMAS",
            integrantes: ["Alex Quintanilla", "Maria Gomez", "Sofia Paz"],
            rutas: {
                inicio: "Sede Principal",
                intermedias: ["Almacén Frio"],
                fin: "Garita 3"
            },
            estado: "Por Aprobar Salida",
            salidaId: null
        },
        {
            id: "SOL-004",
            fecha: "2026-07-01",
            hora: "10:00",
            responsable: "Carlos Mendoza",
            area: "SEGURIDAD",
            integrantes: ["Carlos Mendoza", "Julio Silva"],
            rutas: {
                inicio: "Garita Central",
                intermedias: [],
                fin: "Fundo El Pino"
            },
            estado: "Por Aprobar Salida",
            salidaId: null
        },
        {
            id: "SOL-005",
            fecha: "2026-07-02",
            hora: "07:30",
            responsable: "Ana Rodríguez",
            area: "FRIO Y DESPACHO",
            integrantes: ["Ana Rodríguez", "José Ramos"],
            rutas: {
                inicio: "Almacén Frio",
                intermedias: ["Fundo Huacachina"],
                fin: "Sede Principal"
            },
            estado: "Por Aprobar Salida",
            salidaId: null
        },
        {
            id: "SOL-006",
            fecha: "2026-07-02",
            hora: "14:00",
            responsable: "Luis Zarat",
            area: "RECURSOS HUMANOS",
            integrantes: ["Luis Zarat", "Clara Benitez", "Marcos Orellana"],
            rutas: {
                inicio: "Sede Principal",
                intermedias: [],
                fin: "Fundo Huacachina"
            },
            estado: "Por Aprobar Salida",
            salidaId: null
        }
    ];

    const defaultSalidas = [
        {
            id: "SAL-001",
            fecha: "2026-06-30",
            hora: "08:30",
            cantidadPasajeros: 5,
            vehiculoPlaca: "ABC-123",
            vehiculoModelo: "Toyota Hilux Blanca",
            transporteEmpresa: "Interno SAFCO",
            rutas: ["Sede Principal", "Garita Central", "Fundo El Pino"],
            solicitudesAsignadas: ["SOL-001", "SOL-002"],
            integrantesTerceros: [],
            estado: "Programada"
        }
    ];

    if (!localStorage.getItem("transporte_solicitudes")) {
        localStorage.setItem("transporte_solicitudes", JSON.stringify(defaultSolicitudes));
    }
    if (!localStorage.getItem("transporte_salidas")) {
        localStorage.setItem("transporte_salidas", JSON.stringify(defaultSalidas));
    }
}

// User-to-Area Mapping
const USER_AREA_MAP = {
    "alex.quintanilla": "SISTEMAS",
    "carlos.mendoza": "SEGURIDAD",
    "ana.rodriguez": "FRIO Y DESPACHO",
    "luis.zarat": "RECURSOS HUMANOS"
};

// Base de datos de trabajadores con DNI y Área para el mockup
const MOCK_EMPLOYEES = [
    { dni: "11111111", nombre: "Alex Quintanilla", area: "SISTEMAS" },
    { dni: "22222222", nombre: "Robert Castro", area: "SISTEMAS" },
    { dni: "33333333", nombre: "Juan Perez", area: "SISTEMAS" },
    { dni: "44444444", nombre: "Carlos Mendoza", area: "SEGURIDAD" },
    { dni: "55555555", nombre: "Julio Silva", area: "SEGURIDAD" },
    { dni: "66666666", nombre: "Ana Rodríguez", area: "FRIO Y DESPACHO" },
    { dni: "77777777", nombre: "José Ramos", area: "FRIO Y DESPACHO" },
    { dni: "88888888", nombre: "Luis Zarat", area: "RECURSOS HUMANOS" },
    { dni: "99999999", nombre: "Clara Benitez", area: "RECURSOS HUMANOS" }
];

// Rutas predefinidas del sistema
const PREDEFINED_ROUTES = [
    "Sede Principal",
    "Garita Central",
    "Fundo El Pino",
    "Fundo Huacachina",
    "Almacén Frio",
    "Garita 3",
    "Control de Calidad"
];

function fillDni(dni) {
    const inp = document.getElementById("dniIntegranteInput");
    if (inp) {
        inp.value = dni;
        inp.focus();
    }
}

function populateResponsableDropdown(selectedVal = "") {
    const respSelect = document.getElementById("formResponsable");
    if (!respSelect) return;

    respSelect.innerHTML = "";
    // Filter employees by active area (only display employees from the active area)
    const employeesInArea = MOCK_EMPLOYEES.filter(emp => emp.area === activeArea);
    
    employeesInArea.forEach(emp => {
        const opt = document.createElement("option");
        opt.value = emp.nombre;
        opt.textContent = emp.nombre;
        respSelect.appendChild(opt);
    });

    if (selectedVal) {
        respSelect.value = selectedVal;
    } else if (employeesInArea.length > 0) {
        respSelect.value = employeesInArea[0].nombre;
    }
}

let formRoutes = [];

function renderOrderedRoutes() {
    const container = document.getElementById("orderedRoutesList");
    if (!container) return;
    container.innerHTML = "";

    if (formRoutes.length === 0) {
        container.innerHTML = `<div class="empty-state-chip">No hay rutas agregadas. Debería tener al menos origen y destino.</div>`;
        return;
    }

    formRoutes.forEach((routeVal, idx) => {
        let labelText = `Parada ${idx}`;
        let badgeBg = '#3b82f6'; // blue
        if (idx === 0) {
            labelText = 'Origen';
            badgeBg = '#22c55e'; // green
        } else if (idx === formRoutes.length - 1) {
            labelText = 'Destino';
            badgeBg = '#ef4444'; // red
        }

        // Generate select options
        let optionsHtml = "";
        PREDEFINED_ROUTES.forEach(r => {
            const isSelected = r === routeVal ? "selected" : "";
            optionsHtml += `<option value="${r}" ${isSelected}>${r}</option>`;
        });

        const div = document.createElement("div");
        div.className = "ordered-route-item";
        div.setAttribute("draggable", "true");
        div.setAttribute("data-index", idx);
        div.style.cssText = "display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: white; border: 1px solid #e2e8f0; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); cursor: move;";
        
        const canDelete = formRoutes.length > 2;

        div.innerHTML = `
            <i class='bx bx-grid-vertical' style="cursor: grab; color: #94a3b8; font-size: 1.2rem;"></i>
            <span style="padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 700; min-width: 80px; text-align: center; color: white; background-color: ${badgeBg}; text-transform: uppercase;">${labelText}</span>
            <select class="form-control" style="flex: 1;" onchange="updateFormRouteValue(${idx}, this.value)">
                ${optionsHtml}
            </select>
            <button type="button" class="btn btn-secondary" style="padding: 0.25rem 0.4rem; line-height: 1; font-size: 1rem; display: flex; align-items: center; background-color: #fee2e2; color: #b91c1c; border-color: #fca5a5;" onclick="removeFormRouteItem(${idx})" ${!canDelete ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''} title="Eliminar parada"><i class='bx bx-trash'></i></button>
        `;
        container.appendChild(div);
    });
}

function updateFormRouteValue(idx, val) {
    formRoutes[idx] = val;
}

function addOrderedRouteItem() {
    // Add new stop right before destination
    if (formRoutes.length > 0) {
        formRoutes.splice(formRoutes.length - 1, 0, PREDEFINED_ROUTES[0]);
    } else {
        formRoutes.push(PREDEFINED_ROUTES[0]);
    }
    renderOrderedRoutes();
}

function removeFormRouteItem(idx) {
    if (formRoutes.length <= 2) return;
    formRoutes.splice(idx, 1);
    renderOrderedRoutes();
}

// HTML5 Drag and Drop logic for route items reordering
let draggedItemIndex = null;

function setupRouteDragAndDrop() {
    const container = document.getElementById("orderedRoutesList");
    if (!container) return;

    container.addEventListener("dragstart", (e) => {
        const item = e.target.closest(".ordered-route-item");
        if (!item) return;
        draggedItemIndex = parseInt(item.getAttribute("data-index"));
        item.style.opacity = "0.4";
        e.dataTransfer.effectAllowed = "move";
    });

    container.addEventListener("dragend", (e) => {
        const item = e.target.closest(".ordered-route-item");
        if (item) item.style.opacity = "1";
        draggedItemIndex = null;
        
        container.querySelectorAll(".ordered-route-item").forEach(el => {
            el.style.borderTop = "";
            el.style.borderBottom = "";
        });
    });

    container.addEventListener("dragover", (e) => {
        e.preventDefault();
        const targetItem = e.target.closest(".ordered-route-item");
        if (!targetItem || draggedItemIndex === null) return;
        
        const targetIndex = parseInt(targetItem.getAttribute("data-index"));
        if (targetIndex === draggedItemIndex) return;

        const rect = targetItem.getBoundingClientRect();
        const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
        
        container.querySelectorAll(".ordered-route-item").forEach(el => {
            el.style.borderTop = "";
            el.style.borderBottom = "";
        });
        
        if (next) {
            targetItem.style.borderBottom = "2px dashed var(--safco-red)";
        } else {
            targetItem.style.borderTop = "2px dashed var(--safco-red)";
        }
    });

    container.addEventListener("drop", (e) => {
        e.preventDefault();
        const targetItem = e.target.closest(".ordered-route-item");
        if (!targetItem || draggedItemIndex === null) return;

        const targetIndex = parseInt(targetItem.getAttribute("data-index"));
        if (targetIndex === draggedItemIndex) return;

        // Move inside global formRoutes
        const movedItem = formRoutes[draggedItemIndex];
        formRoutes.splice(draggedItemIndex, 1);
        formRoutes.splice(targetIndex, 0, movedItem);
        
        renderOrderedRoutes();
    });
}

let currentSimulatedUser = "alex.quintanilla";
let activeArea = "SISTEMAS";
let currentIntegrantes = [];

document.addEventListener("DOMContentLoaded", () => {
    initDatabase();
    
    // Check if session has a user
    const sessionData = localStorage.getItem("userSession");
    if (sessionData) {
        try {
            const data = JSON.parse(sessionData);
            const userMapped = data.user.toLowerCase().trim();
            currentSimulatedUser = userMapped;
            activeArea = USER_AREA_MAP[userMapped] || "SISTEMAS";
        } catch (e) {
            console.error("Error reading userSession", e);
        }
    } else {
        // Set default session if none exists
        localStorage.setItem("userSession", JSON.stringify({ user: currentSimulatedUser, role: 'Inspector', area: activeArea }));
    }

    updateHeaderArea();
    renderTabla();
    setupRouteDragAndDrop();
});

function updateHeaderArea() {
    const label = document.getElementById("activeAreaLabel");
    if (label) label.textContent = activeArea;
}

// Rendering Solicitudes Table
function renderTabla() {
    const solicitudes = JSON.parse(localStorage.getItem("transporte_solicitudes")) || [];
    const tbody = document.getElementById("solicitudesTbody");
    tbody.innerHTML = "";

    // 1. Filter by Active Area (Required: "solo solicitudes de la misma area")
    let filtered = solicitudes.filter(sol => sol.area === activeArea);

    // 2. Apply Page Filters (Fecha, Ruta, Estado)
    const filterFecha = document.getElementById("filtroFecha").value;
    const filterRuta = document.getElementById("filtroRuta").value.toLowerCase().trim();
    const filterEstado = document.getElementById("filtroEstado").value;

    if (filterFecha) {
        filtered = filtered.filter(sol => sol.fecha === filterFecha);
    }
    if (filterRuta) {
        filtered = filtered.filter(sol => {
            const allRutas = [
                sol.rutas.inicio, 
                ...sol.rutas.intermedias, 
                sol.rutas.fin
            ].map(r => r.toLowerCase());
            return allRutas.some(r => r.includes(filterRuta));
        });
    }
    if (filterEstado) {
        filtered = filtered.filter(sol => sol.estado === filterEstado);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="padding: 2rem; color: #94a3b8; font-style: italic;">No se encontraron solicitudes para esta área con los filtros aplicados.</td></tr>`;
        return;
    }

    // Render Rows
    filtered.forEach(sol => {
        let statusBadge = "";
        let rowClass = "";
        let actionButtons = "";

        if (sol.estado === "Por Aprobar Salida") {
            statusBadge = `<span class="badge-status status-pending"><i class='bx bx-time'></i> Por Aprobar Salida</span>`;
            actionButtons = `
                <button class="btn-edit-action" onclick="abrirModalModificar('${sol.id}')" title="Modificar Solicitud">
                    <i class='bx bx-edit'></i>
                </button>
                <button class="btn-cancel-action" onclick="anularSolicitud('${sol.id}')" title="Anular Solicitud">
                    <i class='bx bx-trash'></i>
                </button>
            `;
        } else if (sol.estado === "Asignada") {
            rowClass = "row-assigned";
            statusBadge = `<span class="badge-status status-assigned"><i class='bx bx-check-circle'></i> Asignada</span>
                           <a href="#" onclick="verDetallesSalida('${sol.salidaId}')" class="assigned-details-link">Ver Salida: ${sol.salidaId}</a>`;
            actionButtons = `
                <button class="btn-edit-action btn-disabled" disabled title="No se puede modificar (Ya asignada)">
                    <i class='bx bx-edit'></i>
                </button>
                <button class="btn-cancel-action btn-disabled" disabled title="No se puede anular (Ya asignada)">
                    <i class='bx bx-trash'></i>
                </button>
            `;
        } else if (sol.estado === "Anulada") {
            rowClass = "row-cancelled";
            statusBadge = `<span class="badge-status status-cancelled"><i class='bx bx-x-circle'></i> Anulada</span>`;
            actionButtons = `
                <button class="btn-edit-action btn-disabled" disabled title="No se puede modificar (Anulada)">
                    <i class='bx bx-edit'></i>
                </button>
                <button class="btn-cancel-action btn-disabled" disabled title="Ya está anulada">
                    <i class='bx bx-trash'></i>
                </button>
            `;
        }

        const tr = document.createElement("tr");
        if (rowClass) tr.className = rowClass;

        // Rutas format
        let rutasText = `<strong>Ini:</strong> ${sol.rutas.inicio}`;
        if (sol.rutas.intermedias && sol.rutas.intermedias.length > 0) {
            rutasText += `<br><strong>Int:</strong> ${sol.rutas.intermedias.join(", ")}`;
        }
        rutasText += `<br><strong>Fin:</strong> ${sol.rutas.fin}`;

        // Date format helper (standard display format)
        const dateDisplay = formatDate(sol.fecha);

        tr.innerHTML = `
            <td style="font-weight: 700;">${sol.id}</td>
            <td>${dateDisplay}</td>
            <td>${sol.hora}</td>
            <td>${sol.responsable}</td>
            <td>
                <div style="font-size: 0.8rem; text-align: left; max-height: 80px; overflow-y: auto;">
                    ${sol.integrantes.map(m => `• ${m}`).join("<br>")}
                </div>
            </td>
            <td style="text-align: left; font-size: 0.8rem;">${rutasText}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="btn-action-group">
                    ${actionButtons}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Filter Actions
function aplicarFiltros() {
    renderTabla();
}

function limpiarFiltros() {
    document.getElementById("filtroFecha").value = "";
    document.getElementById("filtroRuta").value = "";
    document.getElementById("filtroEstado").value = "";
    renderTabla();
}

// Modal handling
const modal = document.getElementById("modalSolicitud");

function abrirModalNuevaSolicitud() {
    document.getElementById("modalTitle").innerText = "Nueva Solicitud de Transporte";
    document.getElementById("solicitudIdHidden").value = "";
    
    // Clear inputs and set defaults
    document.getElementById("formFecha").value = new Date().toISOString().substring(0, 10);
    document.getElementById("formHora").value = "08:00";
    
    populateResponsableDropdown();
    
    // Default routes: Origen and Destino
    formRoutes = ["Sede Principal", "Fundo Huacachina"];
    renderOrderedRoutes();
    
    // Default integrantes: the selected responsible person
    const selectedResp = document.getElementById("formResponsable").value;
    currentIntegrantes = selectedResp ? [selectedResp] : [];
    renderIntegrantesChips();

    document.getElementById("dniIntegranteInput").value = "";

    enableFormInputs();
    modal.classList.add("active");
}

function abrirModalModificar(id) {
    const solicitudes = JSON.parse(localStorage.getItem("transporte_solicitudes")) || [];
    const sol = solicitudes.find(s => s.id === id);
    if (!sol) return;

    if (sol.estado !== "Por Aprobar Salida") {
        Swal.fire("Error", "Solo se pueden modificar solicitudes pendientes.", "error");
        return;
    }

    document.getElementById("modalTitle").innerText = `Modificar Solicitud: ${sol.id}`;
    document.getElementById("solicitudIdHidden").value = sol.id;
    
    document.getElementById("formFecha").value = sol.fecha;
    document.getElementById("formHora").value = sol.hora;
    
    populateResponsableDropdown(sol.responsable);
    
    // Load ordered routes
    formRoutes = [sol.rutas.inicio, ...(sol.rutas.intermedias || []), sol.rutas.fin];
    renderOrderedRoutes();
    
    currentIntegrantes = [...sol.integrantes];
    renderIntegrantesChips();

    document.getElementById("dniIntegranteInput").value = "";
    enableFormInputs();

    modal.classList.add("active");
}

function closeModal() {
    modal.classList.remove("active");
}

function enableFormInputs() {
    document.querySelectorAll("#modalSolicitud input, #modalSolicitud select, #modalSolicitud button").forEach(el => {
        el.removeAttribute("disabled");
    });
}

// Integrantes functions
function renderIntegrantesChips() {
    const container = document.getElementById("membersChips");
    const countBadge = document.getElementById("integrantesCountBadge");
    
    container.innerHTML = "";
    countBadge.innerText = `${currentIntegrantes.length} integrante${currentIntegrantes.length === 1 ? '' : 's'}`;

    if (currentIntegrantes.length === 0) {
        container.innerHTML = `<div class="empty-state-chip">No hay integrantes agregados.</div>`;
        return;
    }

    currentIntegrantes.forEach((member, idx) => {
        const chip = document.createElement("div");
        chip.className = "member-chip";
        chip.innerHTML = `
            <span>${member}</span>
            <i class='bx bx-x delete-chip' onclick="removeIntegrante(${idx})"></i>
        `;
        container.appendChild(chip);
    });
}

function buscarYAgregarIntegrante() {
    const inp = document.getElementById("dniIntegranteInput");
    const dni = inp.value.trim();
    
    if (!dni) {
        Swal.fire("Ingresar DNI", "Por favor ingrese un número de DNI para buscar.", "warning");
        return;
    }
    
    if (dni.length !== 8 || isNaN(dni)) {
        Swal.fire("DNI inválido", "El DNI debe tener exactamente 8 dígitos numéricos.", "warning");
        return;
    }

    const employee = MOCK_EMPLOYEES.find(emp => emp.dni === dni);

    if (!employee) {
        Swal.fire({
            icon: 'error',
            title: 'No encontrado',
            text: `No se encontró ningún trabajador registrado con el DNI ${dni}.`,
            confirmButtonColor: '#b80a0a'
        });
        return;
    }

    // AREA CHECK: Must belong to activeArea
    if (employee.area !== activeArea) {
        Swal.fire({
            icon: 'error',
            title: 'Área no corresponde',
            html: `El trabajador <strong>${employee.nombre}</strong> pertenece al área de <strong>${employee.area}</strong>.<br><br>Solo se permite agregar integrantes del área de <strong>${activeArea}</strong>.`,
            confirmButtonColor: '#b80a0a'
        });
        return;
    }

    // Check duplicates
    if (currentIntegrantes.includes(employee.nombre)) {
        Swal.fire({
            toast: true,
            position: 'top',
            icon: 'warning',
            title: 'El trabajador ya se encuentra agregado.',
            showConfirmButton: false,
            timer: 1500
        });
        return;
    }

    currentIntegrantes.push(employee.nombre);
    renderIntegrantesChips();
    inp.value = "";
    
    Swal.fire({
        toast: true,
        position: 'top',
        icon: 'success',
        title: `Agregado: ${employee.nombre}`,
        showConfirmButton: false,
        timer: 1500
    });
}

function removeIntegrante(index) {
    currentIntegrantes.splice(index, 1);
    renderIntegrantesChips();
}

// Guardar Solicitud
function guardarSolicitud() {
    const fecha = document.getElementById("formFecha").value;
    const hora = document.getElementById("formHora").value;
    const responsable = document.getElementById("formResponsable").value.trim();

    if (!fecha || !hora || !responsable) {
        Swal.fire("Campos requeridos", "Por favor complete todos los campos marcados con (*).", "warning");
        return;
    }

    if (formRoutes.length < 2) {
        Swal.fire("Rutas requeridas", "Debe registrar al menos un Origen y un Destino.", "warning");
        return;
    }

    if (currentIntegrantes.length === 0) {
        Swal.fire("Integrantes requeridos", "Debe agregar al menos un integrante de salida.", "warning");
        return;
    }

    // Capture routes from ordered array
    const rutaInicio = formRoutes[0];
    const rutaFin = formRoutes[formRoutes.length - 1];
    const intermedias = formRoutes.slice(1, -1);

    const solicitudes = JSON.parse(localStorage.getItem("transporte_solicitudes")) || [];
    const hiddenId = document.getElementById("solicitudIdHidden").value;

    if (hiddenId) {
        // Edit Mode
        const idx = solicitudes.findIndex(s => s.id === hiddenId);
        if (idx > -1) {
            // Update fields but preserve state and area
            solicitudes[idx].fecha = fecha;
            solicitudes[idx].hora = hora;
            solicitudes[idx].responsable = responsable;
            solicitudes[idx].integrantes = [...currentIntegrantes];
            solicitudes[idx].rutas = {
                inicio: rutaInicio,
                intermedias: intermedias,
                fin: rutaFin
            };
            
            localStorage.setItem("transporte_solicitudes", JSON.stringify(solicitudes));
            
            Swal.fire({
                icon: 'success',
                title: '¡Actualizado!',
                text: 'La solicitud se modificó con éxito.',
                timer: 1500,
                showConfirmButton: false
            });
        }
    } else {
        // Create Mode
        // Generate new ID (SOL-00X)
        let lastNum = 0;
        solicitudes.forEach(s => {
            const num = parseInt(s.id.split("-")[1]);
            if (num > lastNum) lastNum = num;
        });
        const newId = `SOL-${String(lastNum + 1).padStart(3, '0')}`;

        const newSol = {
            id: newId,
            fecha: fecha,
            hora: hora,
            responsable: responsable,
            area: activeArea, // Area of the simulated user logged in
            integrantes: [...currentIntegrantes],
            rutas: {
                inicio: rutaInicio,
                intermedias: intermedias,
                fin: rutaFin
            },
            estado: "Por Aprobar Salida",
            salidaId: null
        };

        solicitudes.push(newSol);
        localStorage.setItem("transporte_solicitudes", JSON.stringify(solicitudes));

        Swal.fire({
            icon: 'success',
            title: '¡Registrado!',
            text: `La solicitud ${newId} ha sido creada en estado "Por Aprobar Salida".`,
            timer: 1500,
            showConfirmButton: false
        });
    }

    closeModal();
    renderTabla();
}

// Anular Solicitud
function anularSolicitud(id) {
    Swal.fire({
        title: '¿Está seguro de anular?',
        text: `La solicitud ${id} cambiará a estado "Anulada" y no podrá asociarse a salidas.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#b80a0a',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, Anular',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const solicitudes = JSON.parse(localStorage.getItem("transporte_solicitudes")) || [];
            const idx = solicitudes.findIndex(s => s.id === id);
            
            if (idx > -1) {
                if (solicitudes[idx].estado === "Asignada") {
                    Swal.fire("Error", "No se puede anular una solicitud que ya está asignada a una salida de personal.", "error");
                    return;
                }
                
                solicitudes[idx].estado = "Anulada";
                localStorage.setItem("transporte_solicitudes", JSON.stringify(solicitudes));
                
                Swal.fire({
                    icon: 'success',
                    title: 'Anulada',
                    text: 'La solicitud ha sido anulada.',
                    timer: 1500,
                    showConfirmButton: false
                });
                renderTabla();
            }
        }
    });
}

// Redirect view to details of Salida
function verDetallesSalida(salidaId) {
    const salidas = JSON.parse(localStorage.getItem("transporte_salidas")) || [];
    const salida = salidas.find(s => s.id === salidaId);
    if (!salida) {
        Swal.fire({
            title: "Salida no encontrada",
            text: `No se encontró información activa de la salida ${salidaId}. Puede haber sido anulada o reprogramada.`,
            icon: "warning",
            confirmButtonColor: "#b80a0a"
        });
        return;
    }

    // Build routes timeline HTML
    let routesHtml = "";
    salida.rutas.forEach((r, idx) => {
        let dotClassBg = '#3b82f6'; // intermediate
        let label = 'Parada Intermedia';
        if (idx === 0) {
            dotClassBg = '#4ade80'; // start
            label = 'Origen (Partida)';
        } else if (idx === salida.rutas.length - 1) {
            dotClassBg = '#ef4444'; // end
            label = 'Destino Final (Llegada)';
        }
        routesHtml += `
            <div style="display: flex; align-items: flex-start; gap: 0.75rem; position: relative; margin-bottom: 0.75rem;">
                <div style="width: 22px; height: 22px; border-radius: 50%; background-color: ${dotClassBg}; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: white; font-weight: bold; z-index: 2;">
                    ${idx + 1}
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #1e293b; font-size: 0.85rem;">${r}</div>
                    <div style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: bold;">${label}</div>
                </div>
            </div>
        `;
    });

    // Gather all passengers from assigned requests + terceros
    const solicitudes = JSON.parse(localStorage.getItem("transporte_solicitudes")) || [];
    let passengers = [];
    const assignedReqs = solicitudes.filter(x => salida.solicitudesAsignadas.includes(x.id));
    assignedReqs.forEach(r => {
        passengers = passengers.concat(r.integrantes);
    });
    passengers = [...new Set(passengers)];
    const terceros = salida.integrantesTerceros || [];

    let passengersHtml = passengers.map(p => `<div style="padding: 0.25rem 0.5rem; background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; border-radius: 4px; font-size: 0.78rem; margin: 2px; display: inline-block; font-weight: 600;">• ${p}</div>`).join(" ");
    let tercerosHtml = terceros.map(t => `<div style="padding: 0.25rem 0.5rem; background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; border-radius: 4px; font-size: 0.78rem; margin: 2px; display: inline-block; font-weight: 600;">• ${t}</div>`).join(" ");

    Swal.fire({
        title: `Hoja de Ruta - Salida ${salida.id}`,
        html: `
            <div style="font-family: inherit; font-size: 0.9rem; color: #334155; text-align: left;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; background: #f8fafc; padding: 0.75rem; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 1rem; font-size: 0.82rem;">
                    <div><strong>Fecha Programada:</strong> ${formatDate(salida.fecha)}</div>
                    <div><strong>Hora de Salida:</strong> ${salida.hora} hs</div>
                    <div><strong>Vehículo Asignado:</strong> ${salida.vehiculoPlaca} (${salida.vehiculoModelo})</div>
                    <div><strong>Conductor:</strong> ${salida.conductor || 'No asignado'}</div>
                    <div><strong>Empresa Transp.:</strong> ${salida.transporteEmpresa}</div>
                    <div><strong>Estado Salida:</strong> <span style="color: ${salida.estado === 'Anulada' ? '#b91c1c' : '#16a34a'}; font-weight: bold; text-transform: uppercase;">${salida.estado}</span></div>
                </div>

                <div style="font-weight: 700; color: #004b40; margin-bottom: 0.5rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.25rem; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px;">Itinerario de Paradas</div>
                <div style="padding-left: 0.25rem; margin-bottom: 1rem;">
                    ${routesHtml}
                </div>

                <div style="font-weight: 700; color: #004b40; margin-bottom: 0.5rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.25rem; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px;">Pasajeros a Bordo (${passengers.length + terceros.length})</div>
                <div style="margin-bottom: 0.5rem; max-height: 120px; overflow-y: auto;">
                    ${passengersHtml}
                    ${tercerosHtml ? `<div style="margin-top: 0.35rem;">${tercerosHtml}</div>` : ''}
                </div>
            </div>
        `,
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#b80a0a',
        width: '520px'
    });
}
