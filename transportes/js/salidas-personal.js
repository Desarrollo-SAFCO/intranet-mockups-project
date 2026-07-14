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
            conductor: "Hugo Morales",
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

// Base de datos de terceros pre-registrados
const MOCK_TERCEROS = [
    { dni: "10101010", nombre: "Juan Pérez", empresa: "Mecánica Torres" },
    { dni: "20202020", nombre: "María Gómez", empresa: "Logística Express" },
    { dni: "30303030", nombre: "Robert Castro", empresa: "Sistemas SAC" }
];

let formSalidaRoutes = [];

function renderSalidaOrderedRoutes() {
    const container = document.getElementById("salidaOrderedRoutesList");
    if (!container) return;
    container.innerHTML = "";

    if (formSalidaRoutes.length === 0) {
        container.innerHTML = `<div class="empty-state-chip" style="font-size:0.8rem; color:#999; font-style:italic; padding:4px;">No hay rutas en el itinerario. Seleccione solicitudes para consolidar.</div>`;
        return;
    }

    formSalidaRoutes.forEach((routeVal, idx) => {
        let labelText = `Parada ${idx}`;
        let badgeBg = '#3b82f6'; // blue
        if (idx === 0) {
            labelText = 'Origen';
            badgeBg = '#22c55e'; // green
        } else if (idx === formSalidaRoutes.length - 1) {
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
        div.style.cssText = "display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem; background: white; border: 1px solid #e2e8f0; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); cursor: move;";
        
        const canDelete = formSalidaRoutes.length > 2;

        div.innerHTML = `
            <i class='bx bx-grid-vertical' style="cursor: grab; color: #94a3b8; font-size: 1.1rem;"></i>
            <span style="padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.65rem; font-weight: 700; min-width: 65px; text-align: center; color: white; background-color: ${badgeBg}; text-transform: uppercase;">${labelText}</span>
            <select class="form-control" style="flex: 1; padding: 0.25rem 0.5rem; font-size: 0.8rem; height: auto;" onchange="updateSalidaRouteValue(${idx}, this.value)">
                ${optionsHtml}
            </select>
            <button type="button" class="btn btn-secondary" style="padding: 0.2rem 0.35rem; line-height: 1; font-size: 0.9rem; display: flex; align-items: center; background-color: #fee2e2; color: #b91c1c; border-color: #fca5a5;" onclick="removeSalidaRouteItem(${idx})" ${!canDelete ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''} title="Eliminar parada"><i class='bx bx-trash'></i></button>
        `;
        container.appendChild(div);
    });
}

function updateSalidaRouteValue(idx, val) {
    formSalidaRoutes[idx] = val;
}

function addSalidaOrderedRouteItem() {
    if (formSalidaRoutes.length > 0) {
        formSalidaRoutes.splice(formSalidaRoutes.length - 1, 0, PREDEFINED_ROUTES[0]);
    } else {
        formSalidaRoutes.push(PREDEFINED_ROUTES[0]);
    }
    renderSalidaOrderedRoutes();
}

function removeSalidaRouteItem(idx) {
    if (formSalidaRoutes.length <= 2) return;
    formSalidaRoutes.splice(idx, 1);
    renderSalidaOrderedRoutes();
}

// HTML5 Drag and Drop logic for route items reordering
let draggedItemIndex = null;

function setupRouteDragAndDrop() {
    const container = document.getElementById("salidaOrderedRoutesList");
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

        // Move inside global formSalidaRoutes
        const movedItem = formSalidaRoutes[draggedItemIndex];
        formSalidaRoutes.splice(draggedItemIndex, 1);
        formSalidaRoutes.splice(targetIndex, 0, movedItem);
        
        renderSalidaOrderedRoutes();
    });
}

// Global state inside form
let currentSelectedSolicitudIds = [];
let currentTerceros = [];
let pendingSolicitudesOfSelectedDate = [];

document.addEventListener("DOMContentLoaded", () => {
    initDatabase();
    renderTabla();
    setupRouteDragAndDrop();
});

// Render list of Departures (Salidas)
function renderTabla() {
    const salidas = JSON.parse(localStorage.getItem("transporte_salidas")) || [];
    const tbody = document.getElementById("salidasTbody");
    tbody.innerHTML = "";

    // Apply Filters (Fecha, Vehiculo, Transporte)
    const filterFecha = document.getElementById("filtroFecha").value;
    const filterVehiculo = document.getElementById("filtroVehiculo").value;
    const filterTransporte = document.getElementById("filtroTransporte").value;

    let filtered = [...salidas];

    if (filterFecha) {
        filtered = filtered.filter(s => s.fecha === filterFecha);
    }
    if (filterVehiculo) {
        filtered = filtered.filter(s => s.vehiculoPlaca === filterVehiculo);
    }
    if (filterTransporte) {
        filtered = filtered.filter(s => s.transporteEmpresa === filterTransporte);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="padding: 2rem; color: #94a3b8; font-style: italic;">No se encontraron registros de salidas con los filtros aplicados.</td></tr>`;
        return;
    }

    // Sort by Date & Time descending
    filtered.sort((a,b) => {
        if(a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha);
        return b.hora.localeCompare(a.hora);
    });

    filtered.forEach(s => {
        let statusBadge = "";
        let rowClass = "";
        let actionButtons = "";

        if (s.estado === "Programada") {
            statusBadge = `<span class="badge-status status-scheduled"><i class='bx bx-calendar-check'></i> Programada</span>`;
            actionButtons = `
                <button class="btn-details-action" onclick="abrirModalDetalles('${s.id}')" title="Ver Detalles / Editar">
                    <i class='bx bx-search-alt'></i> Detalle
                </button>
                <button class="btn-cancel-action" onclick="anularSalida('${s.id}')" title="Anular Salida de Personal">
                    <i class='bx bx-block'></i> Anular
                </button>
            `;
        } else if (s.estado === "Anulada") {
            rowClass = "row-cancelled";
            statusBadge = `<span class="badge-status status-cancelled"><i class='bx bx-trash'></i> Anulada</span>`;
            actionButtons = `
                <button class="btn-details-action" onclick="abrirModalDetalles('${s.id}')" title="Ver Detalles (Lectura)">
                    <i class='bx bx-search'></i> Ver
                </button>
                <button class="btn-cancel-action btn-disabled" disabled title="Salida ya anulada">
                    <i class='bx bx-block'></i> Anular
                </button>
            `;
        }

        const tr = document.createElement("tr");
        if (rowClass) tr.className = rowClass;

        const dateDisplay = formatDate(s.fecha);

        // Sub-badges for requests
        const reqBadges = s.solicitudesAsignadas.map(id => `<span style="background:#eef2f6; border:1px solid #cbd5e1; padding:2px 6px; border-radius:4px; font-weight:600; font-size:0.75rem; margin:1px; display:inline-block;">${id}</span>`).join("");

        // Routes display
        const routesDisplay = s.rutas.join(" → ");

        tr.innerHTML = `
            <td style="font-weight: 700;">${s.id}</td>
            <td>${dateDisplay}</td>
            <td>${s.hora} hs</td>
            <td><strong style="color:var(--safco-red); font-size:1rem;">${s.cantidadPasajeros}</strong></td>
            <td><strong>${s.vehiculoPlaca}</strong><br><span style="font-size:0.75rem; color:#666;">${s.vehiculoModelo}</span></td>
            <td>${s.transporteEmpresa}<br><span style="font-size:0.75rem; color:#666;">Cond: ${s.conductor || 'N/A'}</span></td>
            <td style="text-align: left; font-size: 0.8rem; max-width: 250px;">${routesDisplay}</td>
            <td>${reqBadges}</td>
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

function aplicarFiltros() {
    renderTabla();
}

function limpiarFiltros() {
    document.getElementById("filtroFecha").value = "";
    document.getElementById("filtroVehiculo").value = "";
    document.getElementById("filtroTransporte").value = "";
    renderTabla();
}

// Modal handling
const modal = document.getElementById("modalSalida");

function abrirModalNuevaSalida() {
    document.getElementById("modalTitle").innerText = "Registrar Salida de Personal";
    document.getElementById("salidaIdHidden").value = "";
    
    // Clear dynamic state
    currentSelectedSolicitudIds = [];
    currentTerceros = [];
    formSalidaRoutes = [];
    pendingSolicitudesOfSelectedDate = [];

    // Clear controls
    document.getElementById("formFechaSalida").value = "";
    document.getElementById("formFechaSalida").removeAttribute("disabled");
    
    document.getElementById("solicitudesCountInfo").className = "date-status-info";
    document.getElementById("solicitudesCountInfo").innerText = "Ingrese una fecha para buscar solicitudes pendientes.";
    
    // Hide sub sections
    document.getElementById("solicitudesAgrupadorSection").style.display = "none";
    document.getElementById("integrantesRutasSeccion").style.display = "none";
    document.getElementById("vehiculoTransporteSeccion").style.display = "none";
    document.getElementById("btnGuardarSalida").style.display = "none";

    // Defaults for selects
    document.getElementById("formTransporteEmpresa").value = "Interno SAFCO";
    document.getElementById("formTransporteEmpresa").removeAttribute("disabled");
    toggleTransporteOtro("Interno SAFCO");
    
    document.getElementById("formVehiculoSelect").value = "ABC-123|Toyota Hilux Blanca";
    document.getElementById("formVehiculoSelect").removeAttribute("disabled");
    toggleVehiculoOtro("ABC-123|Toyota Hilux Blanca");
    
    document.getElementById("formConductor").value = "";
    document.getElementById("formConductor").removeAttribute("disabled");
    document.getElementById("formHoraSalidaFinal").value = "08:00";
    document.getElementById("formHoraSalidaFinal").removeAttribute("disabled");
    
    document.getElementById("dniTerceroInput").value = "";

    modal.classList.add("active");
}

function closeModal() {
    modal.classList.remove("active");
}

// Form logic when selecting Date
function cargarSolicitudesPendientesPorFecha(fechaStr) {
    if (!fechaStr) {
        document.getElementById("solicitudesCountInfo").className = "date-status-info";
        document.getElementById("solicitudesCountInfo").innerText = "Ingrese una fecha para buscar solicitudes pendientes.";
        document.getElementById("solicitudesAgrupadorSection").style.display = "none";
        return;
    }

    const solicitudes = JSON.parse(localStorage.getItem("transporte_solicitudes")) || [];
    
    // Filter pending solicitudes for this date
    pendingSolicitudesOfSelectedDate = solicitudes.filter(sol => sol.fecha === fechaStr && sol.estado === "Por Aprobar Salida");
    
    const countInfo = document.getElementById("solicitudesCountInfo");
    const groupingSec = document.getElementById("solicitudesAgrupadorSection");
    const tbody = document.getElementById("solicitudesPendientesTbody");

    tbody.innerHTML = "";

    if (pendingSolicitudesOfSelectedDate.length === 0) {
        countInfo.className = "date-status-info info-empty";
        countInfo.innerHTML = `<i class='bx bx-shield-warning' ></i> No hay solicitudes pendientes para el ${formatDate(fechaStr)}.`;
        groupingSec.style.display = "none";
        
        // Hide next steps
        document.getElementById("integrantesRutasSeccion").style.display = "none";
        document.getElementById("vehiculoTransporteSeccion").style.display = "none";
        document.getElementById("btnGuardarSalida").style.display = "none";
        return;
    }

    countInfo.className = "date-status-info info-found";
    countInfo.innerHTML = `<i class='bx bx-check-shield' ></i> Se encontraron <strong>${pendingSolicitudesOfSelectedDate.length}</strong> solicitudes pendientes.`;
    groupingSec.style.display = "block";

    // Detect if hours match among any pending requests to suggest grouping
    const hourCounts = {};
    pendingSolicitudesOfSelectedDate.forEach(s => {
        hourCounts[s.hora] = (hourCounts[s.hora] || 0) + 1;
    });
    const hasCoincidence = Object.values(hourCounts).some(count => count > 1);

    if (hasCoincidence) {
        document.getElementById("coincidenceMsg").style.display = "flex";
    } else {
        document.getElementById("coincidenceMsg").style.display = "none";
    }

    // Render table
    pendingSolicitudesOfSelectedDate.forEach(sol => {
        const tr = document.createElement("tr");
        
        // Highlight if shares hour with others
        const sharesHour = hourCounts[sol.hora] > 1;
        if (sharesHour) {
            tr.className = "row-matching-hour";
        }

        const isChecked = currentSelectedSolicitudIds.includes(sol.id);

        let rutasText = `<strong>Ini:</strong> ${sol.rutas.inicio}`;
        if (sol.rutas.intermedias && sol.rutas.intermedias.length > 0) {
            rutasText += ` | <strong>Int:</strong> ${sol.rutas.intermedias.join(", ")}`;
        }
        rutasText += ` | <strong>Fin:</strong> ${sol.rutas.fin}`;

        tr.innerHTML = `
            <td>
                <input type="checkbox" style="width:18px; height:18px; cursor:pointer;" 
                       onchange="toggleSolicitudSelection('${sol.id}', this.checked)"
                       ${isChecked ? 'checked' : ''}>
            </td>
            <td style="font-weight: 700; color: var(--safco-green-dark);">${sol.id}</td>
            <td>
                <strong style="color:var(--safco-red);">${sol.hora}</strong>
                ${sharesHour ? '<span style="font-size:0.65rem; background:#f59e0b; color:white; padding:1px 4px; border-radius:3px; margin-left:3px;">Coincide</span>' : ''}
            </td>
            <td style="font-weight: 600; font-size:0.75rem;">${sol.area}</td>
            <td>${sol.responsable}</td>
            <td><span class="badge-count">${sol.integrantes.length} pers.</span></td>
            <td style="text-align: left; font-size: 0.75rem;">${rutasText}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Toggle request selection
function toggleSolicitudSelection(id, isChecked) {
    if (isChecked) {
        if (!currentSelectedSolicitudIds.includes(id)) {
            currentSelectedSolicitudIds.push(id);
        }
    } else {
        currentSelectedSolicitudIds = currentSelectedSolicitudIds.filter(x => x !== id);
    }

    recalcularPasajerosYRutas();
}

// Recalculates combined itinerary, passengers list and total count
function recalcularPasajerosYRutas() {
    const nextStepsSec1 = document.getElementById("integrantesRutasSeccion");
    const nextStepsSec2 = document.getElementById("vehiculoTransporteSeccion");
    const btnGuardar = document.getElementById("btnGuardarSalida");

    if (currentSelectedSolicitudIds.length === 0) {
        nextStepsSec1.style.display = "none";
        nextStepsSec2.style.display = "none";
        btnGuardar.style.display = "none";
        formSalidaRoutes = [];
        return;
    }

    nextStepsSec1.style.display = "block";
    nextStepsSec2.style.display = "block";
    btnGuardar.style.display = "block";

    // 1. Gather all passengers from requests
    let passengers = [];
    let initialTime = "";

    const sortedChecked = pendingSolicitudesOfSelectedDate
        .filter(s => currentSelectedSolicitudIds.includes(s.id))
        .sort((a,b) => a.hora.localeCompare(b.hora));

    if (sortedChecked.length > 0) {
        initialTime = sortedChecked[0].hora;
        // Autofill time final
        const timeInput = document.getElementById("formHoraSalidaFinal");
        if (timeInput && (!timeInput.value || timeInput.value === "08:00" || timeInput.getAttribute("data-auto-set") === "true")) {
            timeInput.value = initialTime;
            timeInput.setAttribute("data-auto-set", "true");
        }
    }

    sortedChecked.forEach(sol => {
        passengers = passengers.concat(sol.integrantes);
    });

    // Unique passengers
    passengers = [...new Set(passengers)];

    // Render passengers list
    const passBox = document.getElementById("passengersFromSolicitudes");
    passBox.innerHTML = "";
    passengers.forEach(p => {
        passBox.insertAdjacentHTML('beforeend', `<span>• ${p}</span>`);
    });

    // Render chips for third-party members
    renderTercerosChips();

    // 2. Build Combined Itinerary Sequence from checked requests
    // (Only if formSalidaRoutes is empty or needs initializing)
    if (formSalidaRoutes.length === 0) {
        let starts = [];
        let intermediates = [];
        let ends = [];
        sortedChecked.forEach(sol => {
            starts.push(sol.rutas.inicio);
            if (sol.rutas.intermedias) intermediates = intermediates.concat(sol.rutas.intermedias);
            ends.push(sol.rutas.fin);
        });
        starts = [...new Set(starts)];
        intermediates = [...new Set(intermediates)];
        ends = [...new Set(ends)];

        // Filter start/end points from intermediates
        intermediates = intermediates.filter(r => !starts.includes(r) && !ends.includes(r));
        formSalidaRoutes = [...starts, ...intermediates, ...ends];
    }

    // Render the ordered list of routes
    renderSalidaOrderedRoutes();

    // Update total count
    const totalCount = passengers.length + currentTerceros.length;
    document.getElementById("totalPassengersLabel").innerText = totalCount;
}

// Terceros (Third-party) management
function renderTercerosChips() {
    const container = document.getElementById("tercerosChips");
    container.innerHTML = "";

    if (currentTerceros.length === 0) {
        container.innerHTML = `<span style="font-size:0.8rem; color:#999; font-style:italic; padding:4px;">Ninguno</span>`;
        return;
    }

    currentTerceros.forEach((t, idx) => {
        const chip = document.createElement("div");
        chip.className = "member-chip";
        chip.innerHTML = `
            <span>${t}</span>
            <i class='bx bx-x delete-chip' onclick="removeTercero(${idx})"></i>
        `;
        container.appendChild(chip);
    });
}

function buscarYAgregarTercero() {
    const inp = document.getElementById("dniTerceroInput");
    const dni = inp.value.trim();

    if (!dni) {
        Swal.fire("Ingresar DNI", "Ingrese un número de DNI de tercero.", "warning");
        return;
    }

    if (dni.length !== 8 || isNaN(dni)) {
        Swal.fire("DNI inválido", "El DNI debe tener 8 dígitos numéricos.", "warning");
        return;
    }

    const tercero = MOCK_TERCEROS.find(t => t.dni === dni);

    if (tercero) {
        const displayName = `${tercero.nombre} (${tercero.empresa})`;
        if (currentTerceros.includes(displayName)) {
            Swal.fire({ toast: true, position: 'top', icon: 'warning', title: 'El tercero ya está agregado.', showConfirmButton: false, timer: 1500 });
            return;
        }
        currentTerceros.push(displayName);
        recalcularPasajerosYRutas();
        inp.value = "";
        
        Swal.fire({ toast: true, position: 'top', icon: 'success', title: `Agregado: ${tercero.nombre}`, showConfirmButton: false, timer: 1500 });
    } else {
        // Not found: ask to register new
        Swal.fire({
            title: 'Tercero no registrado',
            text: `No se encontró el DNI ${dni}. ¿Desea registrar a este nuevo tercero?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, Registrar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#004b40'
        }).then((result) => {
            if (result.isConfirmed) {
                registrarNuevoTercero(dni);
            }
        });
    }
}

function registrarNuevoTercero(dniDefault = "") {
    Swal.fire({
        title: 'Registrar Nuevo Tercero (Externo)',
        html: `
            <div style="display:flex; flex-direction:column; gap:0.75rem; text-align:left;">
                <div>
                    <label style="font-size:0.75rem; font-weight:700; color:#666;">DNI *</label>
                    <input type="text" id="swalDniInput" class="form-control" value="${dniDefault}" maxlength="8" style="width:100%;">
                </div>
                <div>
                    <label style="font-size:0.75rem; font-weight:700; color:#666;">Nombre Completo *</label>
                    <input type="text" id="swalNombreInput" class="form-control" placeholder="Ej: Luis Torres" style="width:100%;">
                </div>
                <div>
                    <label style="font-size:0.75rem; font-weight:700; color:#666;">Empresa / Entidad de Procedencia *</label>
                    <input type="text" id="swalEmpresaInput" class="form-control" placeholder="Ej: Mecánica Torres S.A." style="width:100%;">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar y Agregar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#004b40',
        preConfirm: () => {
            const dniVal = document.getElementById("swalDniInput").value.trim();
            const nameVal = document.getElementById("swalNombreInput").value.trim();
            const empVal = document.getElementById("swalEmpresaInput").value.trim();
            if (!dniVal || !nameVal || !empVal) {
                Swal.showValidationMessage("Todos los campos son obligatorios");
                return false;
            }
            if (dniVal.length !== 8 || isNaN(dniVal)) {
                Swal.showValidationMessage("El DNI debe tener 8 dígitos");
                return false;
            }
            return { dni: dniVal, nombre: nameVal, empresa: empVal };
        }
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            const { dni, nombre, empresa } = result.value;
            
            // Register in mock DB
            MOCK_TERCEROS.push({ dni, nombre, empresa });
            
            // Add to current selection
            const displayName = `${nombre} (${empresa})`;
            currentTerceros.push(displayName);
            recalcularPasajerosYRutas();
            
            document.getElementById("dniTerceroInput").value = "";
            
            Swal.fire({
                toast: true,
                position: 'top',
                icon: 'success',
                title: `Registrado y agregado: ${nombre}`,
                showConfirmButton: false,
                timer: 1500
            });
        }
    });
}

function crearNuevaRuta() {
    Swal.fire({
        title: 'Crear Nueva Ruta/Lugar',
        input: 'text',
        inputLabel: 'Nombre del Lugar/Ruta',
        inputPlaceholder: 'Ej: Fundo Don Lucho',
        showCancelButton: true,
        confirmButtonText: 'Crear y Seleccionar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#004b40',
        inputValidator: (value) => {
            if (!value) {
                return 'Debe ingresar un nombre para la ruta';
            }
            if (PREDEFINED_ROUTES.some(r => r.toLowerCase() === value.trim().toLowerCase())) {
                return 'Esta ruta ya existe';
            }
        }
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            const newRoute = result.value.trim();
            PREDEFINED_ROUTES.push(newRoute);
            
            // Update all dropdowns
            populateSalidasRouteDropdowns();
            
            // Select the new route in the additional dropdown
            const addSelect = document.getElementById("rutaAdicionalInput");
            if (addSelect) {
                addSelect.value = newRoute;
            }
            
            Swal.fire({
                toast: true,
                position: 'top',
                icon: 'success',
                title: `Ruta creada: ${newRoute}`,
                showConfirmButton: false,
                timer: 1500
            });
        }
    });
}

function removeTercero(idx) {
    currentTerceros.splice(idx, 1);
    recalcularPasajerosYRutas();
}

// Additional manual routes
function addRutaAdicional() {
    const inp = document.getElementById("rutaAdicionalInput");
    const val = inp.value.trim();
    if (!val) return;

    if (currentRutasAdicionales.includes(val)) {
        Swal.fire({ toast: true, position: 'top', icon: 'warning', title: 'Ruta ya figura en el itinerario.', showConfirmButton: false, timer: 1500 });
        return;
    }

    currentRutasAdicionales.push(val);
    inp.value = "";
    recalcularPasajerosYRutas();
}

function removeRutaAdicional(name) {
    currentRutasAdicionales = currentRutasAdicionales.filter(x => x !== name);
    recalcularPasajerosYRutas();
}

// Select toggling controls for "OTRO"
function toggleTransporteOtro(val) {
    const inp = document.getElementById("formTransporteEmpresaOtro");
    if (val === "OTRO") {
        inp.style.display = "block";
        inp.setAttribute("required", "true");
    } else {
        inp.style.display = "none";
        inp.removeAttribute("required");
    }
}

function toggleVehiculoOtro(val) {
    const grp = document.getElementById("formVehiculoOtroGroup");
    if (val === "OTRO") {
        grp.style.display = "flex";
        document.getElementById("formVehiculoPlacaOtro").setAttribute("required", "true");
        document.getElementById("formVehiculoModeloOtro").setAttribute("required", "true");
    } else {
        grp.style.display = "none";
        document.getElementById("formVehiculoPlacaOtro").removeAttribute("required");
        document.getElementById("formVehiculoModeloOtro").removeAttribute("required");
    }
}

// Save Departure
function guardarSalida() {
    const idHidden = document.getElementById("salidaIdHidden").value;
    
    // Validations
    const dateVal = document.getElementById("formFechaSalida").value;
    const timeVal = document.getElementById("formHoraSalidaFinal").value;
    const conductor = document.getElementById("formConductor").value.trim();
    
    if (!dateVal || !timeVal || !conductor) {
        Swal.fire("Campos requeridos", "Por favor complete todos los campos requeridos (*).", "warning");
        return;
    }

    if (currentSelectedSolicitudIds.length === 0) {
        Swal.fire("Solicitudes vacías", "Debe agrupar al menos una solicitud para registrar la salida.", "warning");
        return;
    }

    // Vehicle Placa/Modelo resolution
    let vehiculoPlaca = "";
    let vehiculoModelo = "";
    const vehSelectVal = document.getElementById("formVehiculoSelect").value;

    if (vehSelectVal === "OTRO") {
        vehiculoPlaca = document.getElementById("formVehiculoPlacaOtro").value.trim().toUpperCase();
        vehiculoModelo = document.getElementById("formVehiculoModeloOtro").value.trim();
        if (!vehiculoPlaca || !vehiculoModelo) {
            Swal.fire("Datos del vehículo", "Complete la placa y modelo del vehículo adicional.", "warning");
            return;
        }
    } else {
        const parts = vehSelectVal.split("|");
        vehiculoPlaca = parts[0];
        vehiculoModelo = parts[1];
    }

    // Transport Empresa resolution
    let transporteEmpresa = "";
    const transSelectVal = document.getElementById("formTransporteEmpresa").value;
    if (transSelectVal === "OTRO") {
        transporteEmpresa = document.getElementById("formTransporteEmpresaOtro").value.trim();
        if (!transporteEmpresa) {
            Swal.fire("Empresa de transporte", "Especifique el nombre de la empresa de transporte.", "warning");
            return;
        }
    } else {
        transporteEmpresa = transSelectVal;
    }

    const salidas = JSON.parse(localStorage.getItem("transporte_salidas")) || [];
    const solicitudes = JSON.parse(localStorage.getItem("transporte_solicitudes")) || [];

    // Calculate final sequence of covered routes based on ordered routes array
    const sortedChecked = pendingSolicitudesOfSelectedDate
        .filter(s => currentSelectedSolicitudIds.includes(s.id))
        .sort((a,b) => a.hora.localeCompare(b.hora));

    if (formSalidaRoutes.length < 2) {
        Swal.fire("Itinerario incompleto", "El itinerario debe tener al menos Origen y Destino.", "warning");
        return;
    }
    const finalRutasSecuencia = [...formSalidaRoutes];

    // Gather passenger names count
    let passengers = [];
    sortedChecked.forEach(sol => {
        passengers = passengers.concat(sol.integrantes);
    });
    passengers = [...new Set(passengers)];
    const totalPassengersCount = passengers.length + currentTerceros.length;

    if (idHidden) {
        // Edit Mode: (We only support updating vehicles/conductors/terceros/additional routes)
        const idx = salidas.findIndex(s => s.id === idHidden);
        if (idx > -1) {
            salidas[idx].vehiculoPlaca = vehiculoPlaca;
            salidas[idx].vehiculoModelo = vehiculoModelo;
            salidas[idx].transporteEmpresa = transporteEmpresa;
            salidas[idx].conductor = conductor;
            salidas[idx].hora = timeVal;
            salidas[idx].integrantesTerceros = [...currentTerceros];
            salidas[idx].cantidadPasajeros = totalPassengersCount;
            salidas[idx].rutas = finalRutasSecuencia;
            
            localStorage.setItem("transporte_salidas", JSON.stringify(salidas));
            
            Swal.fire({
                icon: 'success',
                title: 'Salida Actualizada',
                text: 'Los detalles de la salida se guardaron con éxito.',
                timer: 1500,
                showConfirmButton: false
            });
        }
    } else {
        // Create Mode
        // Generate new ID (SAL-00X)
        let lastNum = 0;
        salidas.forEach(s => {
            const num = parseInt(s.id.split("-")[1]);
            if (num > lastNum) lastNum = num;
        });
        const newId = `SAL-${String(lastNum + 1).padStart(3, '0')}`;

        const newSalida = {
            id: newId,
            fecha: dateVal,
            hora: timeVal,
            cantidadPasajeros: totalPassengersCount,
            vehiculoPlaca: vehiculoPlaca,
            vehiculoModelo: vehiculoModelo,
            transporteEmpresa: transporteEmpresa,
            conductor: conductor,
            rutas: finalRutasSecuencia,
            solicitudesAsignadas: [...currentSelectedSolicitudIds],
            integrantesTerceros: [...currentTerceros],
            estado: "Programada"
        };

        salidas.push(newSalida);
        localStorage.setItem("transporte_salidas", JSON.stringify(salidas));

        // CRITICAL STEP: Update solicitudes statuses to "Asignada"
        currentSelectedSolicitudIds.forEach(solId => {
            const sIdx = solicitudes.findIndex(x => x.id === solId);
            if (sIdx > -1) {
                solicitudes[sIdx].estado = "Asignada";
                solicitudes[sIdx].salidaId = newId;
            }
        });
        localStorage.setItem("transporte_solicitudes", JSON.stringify(solicitudes));

        Swal.fire({
            icon: 'success',
            title: 'Salida Registrada',
            text: `Se programó la salida ${newId} con ${totalPassengersCount} pasajeros totales.`,
            timer: 1800,
            showConfirmButton: false
        });
    }

    closeModal();
    renderTabla();
}

// Anular (Cancel) Departure
function anularSalida(id) {
    Swal.fire({
        title: '¿Está seguro de anular la salida?',
        text: `La salida ${id} cambiará a "Anulada". Todas las solicitudes de transporte vinculadas regresarán al estado "Por Aprobar Salida" para poder volver a ser programadas.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#b80a0a',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, Anular Salida',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const salidas = JSON.parse(localStorage.getItem("transporte_salidas")) || [];
            const solicitudes = JSON.parse(localStorage.getItem("transporte_solicitudes")) || [];
            
            const idx = salidas.findIndex(s => s.id === id);
            
            if (idx > -1) {
                salidas[idx].estado = "Anulada";
                
                // Return associated requests to "Por Aprobar Salida"
                const assignedReqs = salidas[idx].solicitudesAsignadas || [];
                assignedReqs.forEach(reqId => {
                    const sIdx = solicitudes.findIndex(x => x.id === reqId);
                    if (sIdx > -1) {
                        solicitudes[sIdx].estado = "Por Aprobar Salida";
                        solicitudes[sIdx].salidaId = null;
                    }
                });
                
                localStorage.setItem("transporte_salidas", JSON.stringify(salidas));
                localStorage.setItem("transporte_solicitudes", JSON.stringify(solicitudes));
                
                Swal.fire({
                    icon: 'success',
                    title: 'Salida Anulada',
                    text: 'Las solicitudes vinculadas han sido liberadas.',
                    timer: 1500,
                    showConfirmButton: false
                });
                
                renderTabla();
            }
        }
    });
}

// Details / Edit Modal Load
function abrirModalDetalles(id) {
    const salidas = JSON.parse(localStorage.getItem("transporte_salidas")) || [];
    const s = salidas.find(x => x.id === id);
    if (!s) return;

    abrirModalNuevaSalida(); // Clear and prep controls

    document.getElementById("modalTitle").innerText = `Detalles de la Salida: ${s.id}`;
    document.getElementById("salidaIdHidden").value = s.id;

    // Load initial values
    document.getElementById("formFechaSalida").value = s.fecha;
    document.getElementById("formFechaSalida").setAttribute("disabled", "true"); // block date edits

    // Setup simulated database lookup for checked items
    const solicitudes = JSON.parse(localStorage.getItem("transporte_solicitudes")) || [];
    
    // Filter requests: those that are in s.solicitudesAsignadas
    // To allow viewing them in the list, merge already assigned ones with pending ones of same date
    const assignedOfThisSalida = solicitudes.filter(x => s.solicitudesAsignadas.includes(x.id));
    const pendingOfThisDate = solicitudes.filter(x => x.fecha === s.fecha && x.estado === "Por Aprobar Salida");
    
    pendingSolicitudesOfSelectedDate = [...assignedOfThisSalida, ...pendingOfThisDate];
    currentSelectedSolicitudIds = [...s.solicitudesAsignadas];

    // Load sub list
    const groupingSec = document.getElementById("solicitudesAgrupadorSection");
    groupingSec.style.display = "block";
    
    // Load date info text
    const countInfo = document.getElementById("solicitudesCountInfo");
    countInfo.className = "date-status-info info-found";
    countInfo.innerHTML = `<i class='bx bx-check-shield' ></i> Modo Edición/Consulta de Salida.`;

    // Render table
    const tbody = document.getElementById("solicitudesPendientesTbody");
    tbody.innerHTML = "";
    pendingSolicitudesOfSelectedDate.forEach(sol => {
        const tr = document.createElement("tr");
        const isChecked = currentSelectedSolicitudIds.includes(sol.id);
        
        let rutasText = `<strong>Ini:</strong> ${sol.rutas.inicio}`;
        if (sol.rutas.intermedias && sol.rutas.intermedias.length > 0) {
            rutasText += ` | <strong>Int:</strong> ${sol.rutas.intermedias.join(", ")}`;
        }
        rutasText += ` | <strong>Fin:</strong> ${sol.rutas.fin}`;

        // Disable checkboxes in details/edit to avoid partial desynchronization during mockup
        tr.innerHTML = `
            <td>
                <input type="checkbox" style="width:18px; height:18px; cursor:not-allowed;" 
                       disabled checked>
            </td>
            <td style="font-weight: 700; color: var(--safco-green-dark);">${sol.id}</td>
            <td><strong style="color:var(--safco-red);">${sol.hora}</strong></td>
            <td style="font-weight: 600; font-size:0.75rem;">${sol.area}</td>
            <td>${sol.responsable}</td>
            <td><span class="badge-count">${sol.integrantes.length} pers.</span></td>
            <td style="text-align: left; font-size: 0.75rem;">${rutasText}</td>
        `;
        tbody.appendChild(tr);
    });

    // Populate Terceros
    currentTerceros = [...s.integrantesTerceros];
    
    // Load routes directly into the ordered routes list
    formSalidaRoutes = [...s.rutas];
    renderSalidaOrderedRoutes();

    recalcularPasajerosYRutas();

    // Load vehicle details
    const selectVeh = document.getElementById("formVehiculoSelect");
    const matchedOpt = Array.from(selectVeh.options).some(o => o.value.startsWith(s.vehiculoPlaca));
    if (matchedOpt) {
        selectVeh.value = `${s.vehiculoPlaca}|${s.vehiculoModelo}`;
        toggleVehiculoOtro(`${s.vehiculoPlaca}|${s.vehiculoModelo}`);
    } else {
        selectVeh.value = "OTRO";
        toggleVehiculoOtro("OTRO");
        document.getElementById("formVehiculoPlacaOtro").value = s.vehiculoPlaca;
        document.getElementById("formVehiculoModeloOtro").value = s.vehiculoModelo;
    }

    // Load transport details
    const selectTrans = document.getElementById("formTransporteEmpresa");
    const matchedTransOpt = Array.from(selectTrans.options).some(o => o.value === s.transporteEmpresa);
    if (matchedTransOpt) {
        selectTrans.value = s.transporteEmpresa;
        toggleTransporteOtro(s.transporteEmpresa);
    } else {
        selectTrans.value = "OTRO";
        toggleTransporteOtro("OTRO");
        document.getElementById("formTransporteEmpresaOtro").value = s.transporteEmpresa;
    }

    document.getElementById("formConductor").value = s.conductor || "";
    document.getElementById("formHoraSalidaFinal").value = s.hora;

    // If annulled, lock all controls
    if (s.estado === "Anulada") {
        document.getElementById("btnGuardarSalida").style.display = "none";
        
        // Disable inputs
        document.querySelectorAll("#modalSalida input, #modalSalida select, #modalSalida button:not(.btn-close-modal):not(.btn-secondary)").forEach(el => {
            el.setAttribute("disabled", "true");
        });
        
        Swal.fire({
            toast: true,
            position: 'top',
            icon: 'info',
            title: 'Modo lectura (Salida Anulada)',
            showConfirmButton: false,
            timer: 2000
        });
    } else {
        document.getElementById("btnGuardarSalida").style.display = "block";
    }
}
