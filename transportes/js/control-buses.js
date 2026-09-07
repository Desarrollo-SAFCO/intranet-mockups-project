/**
 * SAFCO - Lógica del Módulo Central de Control de Transportes de Personal
 * Gestión Jerárquica: Cabeceras Semanales de Flota (Master) y Detalle Diario (Detail)
 */

let allCabeceras = [];
let allProgramaciones = [];

let currentFilter = {
    campana: '',
    empresa: '',
    sucursal: '',
    semana: '',
    transportista: '',
    turno: '',
    busqueda: '',
    estado: ''
};

// Estado del Modal Wizard de Programación Semanal
let currentWizardStep = 1; // 1 = Cabecera, 2 = Detalle Diario

let semanalCabecera = {
    id: '',
    campanaId: 'AR26',
    campanaNombre: 'AR26 - Campaña Arándano 2026',
    empresaId: 'ASP',
    empresaNombre: 'ASP (Agrícola SAFCO Perú)',
    sucursal: 'Packing Safco',
    semanaIso: '',
    semanaMondayDate: null,
    transportistaId: 'TRP-01',
    transportistaNombre: 'Multiservicios Raúl E.I.R.L.'
};

let semanalDetalleDias = []; // Array de 7 días (0..6)
let activeModalDayIndex = 0; // 0 = Lunes, ... 6 = Domingo

const DIAS_SEMANA_NOMBRES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DIAS_SEMANA_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

document.addEventListener('DOMContentLoaded', () => {
    initTransportesModule();

    window.addEventListener('safco_transportes_updated', () => {
        loadData();
    });
});

function initTransportesModule() {
    if (!SafcoTransportesDB.checkAdminAccess()) {
        return;
    }

    const today = new Date();
    const currentWeekIso = getISOWeekString(today);

    const semanaInput = document.getElementById('filtroSemana');
    if (semanaInput) semanaInput.value = currentWeekIso;
    currentFilter.semana = currentWeekIso;

    populateMainFilters();
    populateModalSelects();

    loadData();
}

function loadData() {
    allCabeceras = SafcoTransportesDB.getCabeceras();
    allProgramaciones = SafcoTransportesDB.getProgramaciones();
    updateDashboardKPIs();
    renderTable();
}

// --------------------------------------------------------------------------
// UTILIDADES DE FECHA Y SEMANAS ISO
// --------------------------------------------------------------------------

function formatISO(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getMondayOf(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function getISOWeekString(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getMondayFromISOWeek(weekStr) {
    if (!weekStr || !weekStr.includes('-W')) {
        return getMondayOf(new Date());
    }
    const parts = weekStr.split('-W');
    const year = parseInt(parts[0], 10);
    const week = parseInt(parts[1], 10);

    const simple = new Date(year, 0, 4);
    const day = simple.getDay() || 7;
    const diff = (week - 1) * 7 - (day - 1);
    const monday = new Date(year, 0, 4 + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function getWeekDaysArray(mondayDate) {
    const days = [];
    const todayISO = formatISO(new Date());

    for (let i = 0; i < 7; i++) {
        const d = new Date(mondayDate);
        d.setDate(mondayDate.getDate() + i);
        const iso = formatISO(d);
        days.push({
            index: i,
            dateObj: d,
            iso: iso,
            dayNameLong: DIAS_SEMANA_NOMBRES[i],
            dayNameShort: DIAS_SEMANA_CORTOS[i],
            dayNum: d.getDate(),
            monthShort: d.toLocaleDateString('es-PE', { month: 'short' }).replace('.', ''),
            isToday: iso === todayISO
        });
    }
    return days;
}

function formatWeekRangeLabel(mondayDate) {
    const sundayDate = new Date(mondayDate);
    sundayDate.setDate(mondayDate.getDate() + 6);

    const monDay = mondayDate.getDate();
    const monMonth = mondayDate.toLocaleDateString('es-PE', { month: 'short' });
    const sunDay = sundayDate.getDate();
    const sunMonth = sundayDate.toLocaleDateString('es-PE', { month: 'short' });
    const year = sundayDate.getFullYear();

    return `${monDay} ${monMonth} al ${sunDay} ${sunMonth} ${year}`;
}

// --------------------------------------------------------------------------
// FILTROS Y TABLA PRINCIPAL (CABECERAS SEMANALES)
// --------------------------------------------------------------------------

function populateMainFilters() {
    const campanas = SafcoTransportesDB.getCampanas();
    const transportistas = SafcoTransportesDB.getTransportistas();

    const campanaSelect = document.getElementById('filtroCampana');
    if (campanaSelect) {
        campanaSelect.innerHTML = '<option value="">TODAS LAS CAMPAÑAS</option>';
        campanas.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.nombre;
            campanaSelect.appendChild(opt);
        });
    }

    const trpSelect = document.getElementById('filtroTransportista');
    if (trpSelect) {
        trpSelect.innerHTML = '<option value="">TODOS LOS TRANSPORTISTAS</option>';
        transportistas.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.nombre;
            trpSelect.appendChild(opt);
        });
    }

    onFiltroEmpresaChange();
}

function onFiltroEmpresaChange() {
    const empVal = document.getElementById('filtroEmpresa')?.value;
    const sucSelect = document.getElementById('filtroSucursal');
    if (!sucSelect) return;

    sucSelect.innerHTML = '<option value="">TODAS LAS SUCURSALES</option>';
    if (empVal) {
        const sucursales = SafcoTransportesDB.getSucursalesByEmpresa(empVal);
        sucursales.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s;
            sucSelect.appendChild(opt);
        });
    }
    aplicarFiltros();
}

function updateDashboardKPIs() {
    const totalCabeceras = allCabeceras.length;
    const totalServicios = allProgramaciones.length;
    const enPlanta = allProgramaciones.filter(p => p.ingreso?.inspeccionGarita?.revisado && !p.retorno?.finalizado).length;
    
    let totalPaxIda = 0;
    let totalPaxRetorno = 0;
    let totalIncidencias = 0;

    allProgramaciones.forEach(p => {
        const paxIda = p.ingreso?.pasajeros?.length || 0;
        const paxRet = p.retorno?.pasajeros?.length || 0;
        totalPaxIda += paxIda;
        totalPaxRetorno += paxRet;

        const incIda = (p.ingreso?.pasajeros || []).filter(item => !item.esRutaCorrecta).length;
        const incRet = (p.retorno?.pasajeros || []).filter(item => item.sinIngresoPrevio).length;
        totalIncidencias += (incIda + incRet);
    });

    document.getElementById('kpiTotalServicios').textContent = `${totalCabeceras} Sem. (${totalServicios} Buses)`;
    document.getElementById('kpiBusesEnPlanta').textContent = enPlanta;
    document.getElementById('kpiTotalPasajeros').textContent = `${totalPaxIda} Ida / ${totalPaxRetorno} Ret.`;
    document.getElementById('kpiIncidenciasRuta').textContent = totalIncidencias;
}

function renderTable() {
    const tbody = document.getElementById('cabecerasTbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filtered = allCabeceras.filter(c => {
        if (currentFilter.campana && c.campanaId && c.campanaId !== currentFilter.campana) return false;
        if (currentFilter.empresa && c.empresaId && c.empresaId !== currentFilter.empresa) return false;
        if (currentFilter.sucursal && c.sucursal && c.sucursal !== currentFilter.sucursal) return false;
        if (currentFilter.transportista && c.transportistaId && c.transportistaId !== currentFilter.transportista) return false;
        if (currentFilter.semana && c.semanaIso && c.semanaIso !== currentFilter.semana) return false;
        if (currentFilter.busqueda) {
            const q = currentFilter.busqueda.toLowerCase();
            const matchId = c.id?.toLowerCase().includes(q);
            const matchTrp = c.transportistaNombre?.toLowerCase().includes(q);
            const matchSuc = c.sucursal?.toLowerCase().includes(q);
            if (!matchId && !matchTrp && !matchSuc) return false;
        }
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding: 2.5rem 1rem; color: var(--text-muted);">
                    <i class='bx bx-search-alt' style="font-size:2.4rem; opacity:0.35; display:block; margin-bottom:6px;"></i>
                    No se encontraron cabeceras de programación para los filtros aplicados (${currentFilter.semana ? `Semana ${currentFilter.semana}` : 'Todas las semanas'}).
                </td>
            </tr>
        `;
        return;
    }

    filtered.forEach(c => {
        const tr = document.createElement('tr');

        // Obtener viajes vinculados a esta cabecera
        const trips = SafcoTransportesDB.getProgramacionesByCabeceraId(c.id);
        const totalBuses = trips.length;
        let totalSeats = 0;
        trips.forEach(t => totalSeats += (t.capacidad || 0));

        const campana = c.campanaId || 'AR26';
        const empresa = c.empresaId || 'ASP';
        const sucursal = c.sucursal || 'Packing Safco';
        const rango = c.semanaRango || formatWeekRangeLabel(getMondayFromISOWeek(c.semanaIso));

        tr.innerHTML = `
            <td><b style="color:var(--safco-teal); font-family:monospace; font-size:0.95rem;">${c.id}</b></td>
            <td>
                <div><span style="background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px; font-weight:800; font-size:0.75rem;">${campana}</span> <b>${empresa}</b></div>
                <small style="color:var(--text-muted); font-size:0.75rem;"><i class='bx bx-map-pin'></i> ${sucursal}</small>
            </td>
            <td>
                <div><b style="color:var(--safco-teal);">${c.semanaIso}</b></div>
                <small style="color:var(--text-muted); font-weight:600;">${rango}</small>
            </td>
            <td>
                <div style="font-weight:700; color:var(--text-main); font-size:0.85rem;">${c.transportistaNombre}</div>
            </td>
            <td>
                <span class="badge-tbl ingresado" style="font-weight:800; font-size:0.8rem;">
                    <i class='bx bx-bus'></i> ${totalBuses} ${totalBuses === 1 ? 'Servicio' : 'Servicios'}
                </span>
            </td>
            <td>
                <b style="color:var(--safco-teal); font-size:0.9rem;">${totalSeats} Asientos</b>
            </td>
            <td>
                <span class="badge-tbl programado" style="font-weight:800; background:#dcfce7; color:#15803d; border-color:#86efac;">
                    ✅ ${c.estado || 'ACTIVO'}
                </span>
            </td>
            <td style="text-align:center;">
                <div class="row-actions-group" style="justify-content:center;">
                    <button class="btn-icon-action view-btn" title="Ver Detalle de la Flota Semanal" onclick="abrirModalVerDetalleCabecera('${c.id}')">
                        <i class='bx bx-show'></i>
                    </button>
                    <button class="btn-icon-action" style="color:#d80000;" title="Eliminar Cabecera y sus viajes" onclick="eliminarCabecera('${c.id}')">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function aplicarFiltros() {
    currentFilter.campana = document.getElementById('filtroCampana')?.value || '';
    currentFilter.empresa = document.getElementById('filtroEmpresa')?.value || '';
    currentFilter.sucursal = document.getElementById('filtroSucursal')?.value || '';
    currentFilter.transportista = document.getElementById('filtroTransportista')?.value || '';
    currentFilter.semana = document.getElementById('filtroSemana')?.value || '';
    currentFilter.turno = document.getElementById('filtroTurno')?.value || '';
    currentFilter.busqueda = document.getElementById('filtroBusqueda')?.value || '';
    currentFilter.estado = document.getElementById('filtroEstado')?.value || '';
    renderTable();
}

function limpiarFiltros() {
    document.getElementById('filtroCampana').value = '';
    document.getElementById('filtroEmpresa').value = '';
    document.getElementById('filtroSucursal').value = '';
    document.getElementById('filtroTransportista').value = '';
    document.getElementById('filtroSemana').value = '';
    document.getElementById('filtroTurno').value = '';
    document.getElementById('filtroBusqueda').value = '';
    currentFilter = { campana: '', empresa: '', sucursal: '', transportista: '', semana: '', turno: '', busqueda: '', estado: '' };
    renderTable();
}

// --------------------------------------------------------------------------
// MODAL PARA VER EL DETALLE COMPLETO DE UNA CABECERA
// --------------------------------------------------------------------------

function abrirModalVerDetalleCabecera(cabeceraId) {
    const cab = SafcoTransportesDB.getCabeceraById(cabeceraId);
    if (!cab) return;

    const trips = SafcoTransportesDB.getProgramacionesByCabeceraId(cabeceraId);

    document.getElementById('viewCabeceraIdBadge').textContent = cab.id;
    document.getElementById('viewCampanaEmpresa').textContent = `${cab.campanaId} | ${cab.empresaId}`;
    document.getElementById('viewSucursal').textContent = cab.sucursal;
    document.getElementById('viewSemanaRange').textContent = `${cab.semanaIso} (${cab.semanaRango || ''})`;
    document.getElementById('viewTransportista').textContent = cab.transportistaNombre;

    document.getElementById('verCabeceraModalTitle').innerHTML = `<i class='bx bx-calendar-check'></i> Detalle Semanal: ${cab.id}`;
    document.getElementById('verCabeceraModalSubtitle').textContent = `Transportista: ${cab.transportistaNombre} • Sucursal: ${cab.sucursal}`;

    let totalSeats = 0;
    trips.forEach(t => totalSeats += (t.capacidad || 0));
    document.getElementById('viewCabeceraTotalCounter').textContent = `Total: ${trips.length} servicios asignados (${totalSeats} asientos totales ofertados)`;

    const tbody = document.getElementById('viewCabeceraTripsTbody');
    tbody.innerHTML = '';

    if (trips.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center; padding:2rem; color:var(--text-muted);">
                    No hay viajes registrados para esta cabecera.
                </td>
            </tr>
        `;
    } else {
        trips.forEach(t => {
            const tr = document.createElement('tr');
            const d = new Date(t.fecha + 'T00:00:00');
            const dayName = DIAS_SEMANA_NOMBRES[(d.getDay() + 6) % 7];

            let estadoBadge = `<span class="badge-tbl programado">PROGRAMADO</span>`;
            if (t.estadoGeneral === 'INGRESADO_GARITA') {
                estadoBadge = `<span class="badge-tbl ingresado">✅ EN PLANTA</span>`;
            } else if (t.estadoGeneral === 'EN_RUTA_IDA') {
                estadoBadge = `<span class="badge-tbl en-ruta">🚌 EN RUTA</span>`;
            }

            tr.innerHTML = `
                <td><b style="color:var(--safco-teal);">${t.id}</b></td>
                <td><b>${dayName}</b> <small style="color:var(--text-muted);">(${t.fecha})</small></td>
                <td><span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-weight:700;">${t.turno.split(' ')[0]}</span></td>
                <td>
                    <span style="font-family:monospace; font-weight:800; background:#0f172a; color:#fff; padding:2px 6px; border-radius:4px;">${t.placa}</span>
                </td>
                <td><b style="color:var(--safco-teal);">${t.capacidad} Asientos</b></td>
                <td><b>${t.rutaNombre}</b></td>
                <td>${t.personasRutaAsignadas || 35} pax</td>
                <td>${t.choferNombre}</td>
                <td>${estadoBadge}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    document.getElementById('modalVerDetalleCabecera').classList.add('active');
}

function cerrarModalVerDetalleCabecera() {
    document.getElementById('modalVerDetalleCabecera').classList.remove('active');
}

function eliminarCabecera(id) {
    Swal.fire({
        title: `¿Eliminar Cabecera ${id}?`,
        text: 'Se eliminará la cabecera semanal y todos los servicios de flota asignados a ella.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d80000',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, Eliminar Cabecera',
        cancelButtonText: 'Cancelar'
    }).then((res) => {
        if (res.isConfirmed) {
            SafcoTransportesDB.deleteCabecera(id);
            loadData();
            Swal.fire('Eliminado', 'La cabecera semanal fue eliminada exitosamente.', 'success');
        }
    });
}

// --------------------------------------------------------------------------
// MODAL WIZARD DE PROGRAMACIÓN SEMANAL (PASO A PASO)
// --------------------------------------------------------------------------

function abrirModalProgramacionSemanal() {
    currentWizardStep = 1;
    initModalSemanalData();
    setWizardStepView(1);
    document.getElementById('modalProgramacionSemanal').classList.add('active');
}

function cerrarModalProgramacionSemanal() {
    document.getElementById('modalProgramacionSemanal').classList.remove('active');
    loadData();
}

function initModalSemanalData() {
    // 1. Poblar Campañas
    const campanas = SafcoTransportesDB.getCampanas();
    const campanaSelect = document.getElementById('semanalCampanaSelect');
    if (campanaSelect) {
        campanaSelect.innerHTML = '';
        campanas.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.nombre;
            campanaSelect.appendChild(opt);
        });
        campanaSelect.value = 'AR26';
    }

    // 2. Poblar Empresas y Sucursales
    const empresaSelect = document.getElementById('semanalEmpresaSelect');
    if (empresaSelect) empresaSelect.value = 'ASP';
    onModalEmpresaChange();

    // 3. Poblar Semana ISO
    const currentWeekIso = getISOWeekString(new Date());
    const weekInput = document.getElementById('semanalWeekInput');
    if (weekInput) {
        weekInput.value = currentWeekIso;
    }
    onModalWeekInputChange();

    // 4. Poblar Transportistas
    const transportistas = SafcoTransportesDB.getTransportistas();
    const trpSelect = document.getElementById('semanalTransportistaSelect');
    if (trpSelect) {
        trpSelect.innerHTML = '';
        transportistas.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = `${t.nombre} (Flota: ${t.vehiculos.length} buses)`;
            trpSelect.appendChild(opt);
        });
        if (transportistas.length > 0) trpSelect.value = transportistas[0].id;
    }
    onModalTransportistaChange();

    setupSemanalDetalleDias();
    activeModalDayIndex = 0;
}

function setWizardStepView(stepNumber) {
    currentWizardStep = stepNumber;
    const step1Pane = document.getElementById('wizardStep1Container');
    const step2Pane = document.getElementById('wizardStep2Container');
    const ind1 = document.getElementById('stepIndicator1');
    const ind2 = document.getElementById('stepIndicator2');
    const div1 = document.getElementById('stepDivider');

    if (stepNumber === 1) {
        if (step1Pane) step1Pane.style.display = 'block';
        if (step2Pane) step2Pane.style.display = 'none';

        if (ind1) ind1.className = 'step-item active';
        if (ind2) ind2.className = 'step-item';
        if (div1) div1.className = 'step-divider';
    } else {
        if (step1Pane) step1Pane.style.display = 'none';
        if (step2Pane) step2Pane.style.display = 'block';

        if (ind1) ind1.className = 'step-item completed';
        if (ind2) ind2.className = 'step-item active';
        if (div1) div1.className = 'step-divider active';
    }
}

function onModalEmpresaChange() {
    const empVal = document.getElementById('semanalEmpresaSelect')?.value || 'ASP';
    const sucSelect = document.getElementById('semanalSucursalSelect');
    if (!sucSelect) return;

    sucSelect.innerHTML = '';
    const sucursales = SafcoTransportesDB.getSucursalesByEmpresa(empVal);
    sucursales.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        sucSelect.appendChild(opt);
    });

    onModalCabeceraChange();
}

function onModalWeekInputChange() {
    const weekVal = document.getElementById('semanalWeekInput')?.value || getISOWeekString(new Date());
    const monday = getMondayFromISOWeek(weekVal);
    semanalCabecera.semanaIso = weekVal;
    semanalCabecera.semanaMondayDate = monday;

    const refBox = document.getElementById('modalWeekDaysReferenceBox');
    if (refBox) {
        const days = getWeekDaysArray(monday);
        refBox.innerHTML = days.map(d => `
            <span class="ref-day-pill ${d.isToday ? 'is-today' : ''}">
                ${d.dayNameShort} ${d.dayNum}/${d.monthShort}
            </span>
        `).join('');
    }

    setupSemanalDetalleDias();
    renderModalDetalleDaysTabs();
    renderActiveDayPanel();
    updateModalSummaryStats();
}

function onModalTransportistaChange() {
    const trpId = document.getElementById('semanalTransportistaSelect')?.value;
    const trpObj = SafcoTransportesDB.getTransportistaById(trpId);

    semanalCabecera.transportistaId = trpId;
    semanalCabecera.transportistaNombre = trpObj ? trpObj.nombre : 'Transportista';

    populateAddBusFormSelects(trpObj);
}

function onModalCabeceraChange() {
    const campanaSelect = document.getElementById('semanalCampanaSelect');
    const empresaSelect = document.getElementById('semanalEmpresaSelect');
    const sucSelect = document.getElementById('semanalSucursalSelect');

    semanalCabecera.campanaId = campanaSelect?.value || 'AR26';
    semanalCabecera.campanaNombre = campanaSelect?.options[campanaSelect.selectedIndex]?.text || 'AR26 - Arándano 2026';
    semanalCabecera.empresaId = empresaSelect?.value || 'ASP';
    semanalCabecera.empresaNombre = empresaSelect?.options[empresaSelect.selectedIndex]?.text || 'ASP (Agrícola SAFCO Perú)';
    semanalCabecera.sucursal = sucSelect?.value || 'Packing Safco';
}

function avanzarAPaso2() {
    onModalCabeceraChange();
    onModalWeekInputChange();
    onModalTransportistaChange();

    if (!semanalCabecera.campanaId || !semanalCabecera.empresaId || !semanalCabecera.sucursal || !semanalCabecera.semanaIso || !semanalCabecera.transportistaId) {
        Swal.fire('Atención', 'Por favor complete todos los campos de la cabecera antes de continuar.', 'warning');
        return;
    }

    // Generar ID único de Cabecera
    const weekNum = semanalCabecera.semanaIso.replace('-', '');
    const randNum = String(Math.floor(10 + Math.random() * 90));
    semanalCabecera.id = `CAB-${weekNum}-${semanalCabecera.empresaId}-${randNum}`;

    document.getElementById('createdCabeceraIdBadge').textContent = semanalCabecera.id;
    document.getElementById('sumCampanaEmpresa').textContent = `${semanalCabecera.campanaId} | ${semanalCabecera.empresaId}`;
    document.getElementById('sumSucursal').textContent = semanalCabecera.sucursal;
    document.getElementById('sumSemanaRange').textContent = `${semanalCabecera.semanaIso} (${formatWeekRangeLabel(semanalCabecera.semanaMondayDate)})`;
    document.getElementById('sumTransportista').textContent = semanalCabecera.transportistaNombre;

    setWizardStepView(2);
    switchModalDetalleDay(0);
    updateModalSummaryStats();
}

function volverAPaso1() {
    setWizardStepView(1);
}

function setupSemanalDetalleDias() {
    const monday = semanalCabecera.semanaMondayDate || getMondayOf(new Date());
    const days = getWeekDaysArray(monday);

    if (!semanalDetalleDias || semanalDetalleDias.length !== 7) {
        semanalDetalleDias = days.map(d => ({
            dayIndex: d.index,
            dayNameLong: d.dayNameLong,
            dayNameShort: d.dayNameShort,
            dateISO: d.iso,
            dayNum: d.dayNum,
            monthShort: d.monthShort,
            vehicles: []
        }));
    } else {
        days.forEach((d, idx) => {
            semanalDetalleDias[idx].dateISO = d.iso;
            semanalDetalleDias[idx].dayNum = d.dayNum;
            semanalDetalleDias[idx].monthShort = d.monthShort;
        });
    }
}

function populateAddBusFormSelects(trpObj) {
    if (!trpObj) {
        const trpId = document.getElementById('semanalTransportistaSelect')?.value;
        trpObj = SafcoTransportesDB.getTransportistaById(trpId);
    }

    const vehiculoSelect = document.getElementById('addBusVehiculoSelect');
    const choferSelect = document.getElementById('addBusChoferSelect');
    const rutaSelect = document.getElementById('addBusRutaSelect');

    if (vehiculoSelect && trpObj) {
        vehiculoSelect.innerHTML = '';
        trpObj.vehiculos.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.id;
            opt.dataset.cap = v.capacidad;
            opt.dataset.placa = v.placa;
            opt.dataset.tipo = v.tipo;
            opt.textContent = `${v.placa} - ${v.tipo} (${v.capacidad} Asientos)`;
            vehiculoSelect.appendChild(opt);
        });
    }

    if (choferSelect && trpObj) {
        choferSelect.innerHTML = '';
        trpObj.choferes.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.dataset.nombre = c.nombre;
            opt.dataset.dni = c.dni;
            opt.textContent = `${c.nombre} (DNI: ${c.dni})`;
            choferSelect.appendChild(opt);
        });
    }

    if (rutaSelect) {
        rutaSelect.innerHTML = '';
        const rutas = SafcoTransportesDB.getRutas();
        rutas.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.id;
            opt.dataset.nombre = r.nombre;
            opt.dataset.pax = r.personasAsignadas || 35;
            opt.textContent = `${r.nombre} (${r.personasAsignadas || 35} Personas asignadas)`;
            rutaSelect.appendChild(opt);
        });
    }
}

function renderModalDetalleDaysTabs() {
    const tabsContainer = document.getElementById('modalDetalleDaysTabs');
    if (!tabsContainer || !semanalDetalleDias) return;

    tabsContainer.innerHTML = '';

    semanalDetalleDias.forEach(d => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `tab-day-btn ${d.dayIndex === activeModalDayIndex ? 'active' : ''}`;
        btn.onclick = () => switchModalDetalleDay(d.dayIndex);

        btn.innerHTML = `
            <span>${d.dayNameShort} ${d.dayNum}</span>
            <span class="tab-day-count-badge">${d.vehicles ? d.vehicles.length : 0}</span>
        `;
        tabsContainer.appendChild(btn);
    });
}

function switchModalDetalleDay(dayIndex) {
    activeModalDayIndex = dayIndex;
    renderModalDetalleDaysTabs();
    renderActiveDayPanel();
}

function renderActiveDayPanel() {
    const activeDay = semanalDetalleDias[activeModalDayIndex];
    if (!activeDay) return;

    const pillLabel = document.getElementById('badgeDayPillLabel');
    const dateLabel = document.getElementById('activeDayDateLabel');
    const counterLabel = document.getElementById('activeDayBusCounter');
    const targetDayName = document.getElementById('addBusTargetDayName');

    if (pillLabel) pillLabel.textContent = activeDay.dayNameLong.toUpperCase();
    if (dateLabel) dateLabel.textContent = `${activeDay.dayNum}/${activeDay.monthShort} (${activeDay.dateISO})`;
    if (counterLabel) counterLabel.textContent = `${activeDay.vehicles.length} ${activeDay.vehicles.length === 1 ? 'Vehículo asignado' : 'Vehículos asignados'}`;
    if (targetDayName) targetDayName.textContent = activeDay.dayNameLong;

    const tbody = document.getElementById('tableDayVehiclesTbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!activeDay.vehicles || activeDay.vehicles.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:1.8rem 1rem; color:var(--text-muted);">
                    <i class='bx bx-bus' style="font-size:1.8rem; opacity:0.4; display:block; margin-bottom:4px;"></i>
                    No hay unidades asignadas para el <b>${activeDay.dayNameLong}</b>.<br>
                    <small>Utilice el formulario superior para agregar los buses de este día.</small>
                </td>
            </tr>
        `;
        return;
    }

    activeDay.vehicles.forEach((v, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${idx + 1}</b></td>
            <td>
                <span style="font-family:monospace; font-weight:800; background:#0f172a; color:#fff; padding:2px 6px; border-radius:4px;">${v.placa}</span>
                <div style="font-size:0.72rem; color:var(--text-muted);">${v.tipo}</div>
            </td>
            <td><b style="color:var(--safco-teal);">${v.capacidad} Asientos</b></td>
            <td>
                <div style="font-weight:700;">${v.rutaNombre}</div>
            </td>
            <td><b>${v.personasRutaAsignadas} personas</b></td>
            <td>
                <div><b>${v.choferNombre}</b></div>
                <small style="color:var(--text-muted);">DNI: ${v.choferDni}</small>
            </td>
            <td><span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-weight:700;">${v.turno.split(' ')[0]}</span></td>
            <td style="text-align:center;">
                <button type="button" class="btn-delete-row-day" onclick="eliminarVehiculoDeDia(${idx})" title="Quitar este vehículo del ${activeDay.dayNameLong}">
                    <i class='bx bx-trash'></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function agregarVehiculoAlDiaActivo() {
    const vehiculoSelect = document.getElementById('addBusVehiculoSelect');
    const choferSelect = document.getElementById('addBusChoferSelect');
    const rutaSelect = document.getElementById('addBusRutaSelect');
    const turnoSelect = document.getElementById('addBusTurnoSelect');

    if (!vehiculoSelect?.value || !choferSelect?.value || !rutaSelect?.value || !turnoSelect?.value) {
        Swal.fire('Atención', 'Por favor seleccione todos los campos del vehículo, conductor, ruta y turno.', 'warning');
        return;
    }

    const optVeh = vehiculoSelect.options[vehiculoSelect.selectedIndex];
    const optChofer = choferSelect.options[choferSelect.selectedIndex];
    const optRuta = rutaSelect.options[rutaSelect.selectedIndex];

    const activeDay = semanalDetalleDias[activeModalDayIndex];

    const yaAsignado = activeDay.vehicles.some(v => v.vehiculoId === vehiculoSelect.value && v.turno === turnoSelect.value);
    if (yaAsignado) {
        Swal.fire('Atención', `El vehículo ${optVeh.dataset.placa} ya se encuentra asignado al ${activeDay.dayNameLong} en el turno ${turnoSelect.value.split(' ')[0]}.`, 'warning');
        return;
    }

    const newVehicleItem = {
        vehiculoId: vehiculoSelect.value,
        placa: optVeh.dataset.placa,
        tipo: optVeh.dataset.tipo,
        capacidad: parseInt(optVeh.dataset.cap, 10),
        choferId: choferSelect.value,
        choferNombre: optChofer.dataset.nombre,
        choferDni: optChofer.dataset.dni,
        rutaId: rutaSelect.value,
        rutaNombre: optRuta.dataset.nombre,
        personasRutaAsignadas: parseInt(optRuta.dataset.pax, 10),
        turno: turnoSelect.value
    };

    activeDay.vehicles.push(newVehicleItem);

    renderModalDetalleDaysTabs();
    renderActiveDayPanel();
    updateModalSummaryStats();
}

function eliminarVehiculoDeDia(indexInDay) {
    const activeDay = semanalDetalleDias[activeModalDayIndex];
    if (!activeDay) return;

    activeDay.vehicles.splice(indexInDay, 1);
    renderModalDetalleDaysTabs();
    renderActiveDayPanel();
    updateModalSummaryStats();
}

function clonarDiaActual(mode) {
    const activeDay = semanalDetalleDias[activeModalDayIndex];
    if (!activeDay || !activeDay.vehicles || activeDay.vehicles.length === 0) {
        Swal.fire('Atención', `El <b>${activeDay ? activeDay.dayNameLong : 'día'}</b> no tiene vehículos asignados para replicar. Primero agregue al menos un bus.`, 'info');
        return;
    }

    const targetIndices = mode === 'LV' ? [0, 1, 2, 3, 4] : [0, 1, 2, 3, 4, 5, 6];
    const targetLabel = mode === 'LV' ? 'Lunes a Viernes (5 Días)' : 'Toda la Semana (Lunes a Domingo - 7 Días)';

    Swal.fire({
        title: `¿Replicar unidades a ${targetLabel}?`,
        html: `Se copiarán los <b>${activeDay.vehicles.length} vehículo(s)</b> configurados en el <b>${activeDay.dayNameLong}</b> hacia los demás días seleccionados.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#004a4c',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, Replicar',
        cancelButtonText: 'Cancelar'
    }).then((res) => {
        if (res.isConfirmed) {
            targetIndices.forEach(idx => {
                semanalDetalleDias[idx].vehicles = activeDay.vehicles.map(v => ({ ...v }));
            });

            renderModalDetalleDaysTabs();
            renderActiveDayPanel();
            updateModalSummaryStats();

            Swal.fire({
                icon: 'success',
                title: 'Replicación Exitosa',
                html: `Se han configurado <b>${activeDay.vehicles.length} vehículo(s)</b> por cada día en <b>${targetLabel}</b>.`,
                confirmButtonColor: '#004a4c'
            });
        }
    });
}

function updateModalSummaryStats() {
    let totalServices = 0;
    let totalSeats = 0;

    semanalDetalleDias.forEach(d => {
        const count = d.vehicles ? d.vehicles.length : 0;
        totalServices += count;
        if (d.vehicles) {
            d.vehicles.forEach(v => {
                totalSeats += v.capacidad;
            });
        }
    });

    const badgeBuses = document.getElementById('summaryTotalBusesBadge');
    const badgeSeats = document.getElementById('summaryTotalSeatsBadge');

    if (badgeBuses) badgeBuses.textContent = `${totalServices} Servicios`;
    if (badgeSeats) badgeSeats.textContent = `${totalSeats} Asientos Totales`;
}

function guardarTodaLaProgramacionSemanal() {
    let totalServices = 0;
    semanalDetalleDias.forEach(d => totalServices += (d.vehicles ? d.vehicles.length : 0));

    if (totalServices === 0) {
        Swal.fire('Atención', 'No ha asignado ningún vehículo en los días de la semana. Agregue al menos un bus.', 'warning');
        return;
    }

    // 1. Guardar la Cabecera Semanal
    const newCabecera = {
        id: semanalCabecera.id,
        campanaId: semanalCabecera.campanaId,
        campanaNombre: semanalCabecera.campanaNombre,
        empresaId: semanalCabecera.empresaId,
        empresaNombre: semanalCabecera.empresaNombre,
        sucursal: semanalCabecera.sucursal,
        semanaIso: semanalCabecera.semanaIso,
        semanaRango: formatWeekRangeLabel(semanalCabecera.semanaMondayDate),
        transportistaId: semanalCabecera.transportistaId,
        transportistaNombre: semanalCabecera.transportistaNombre,
        fechaCreacion: formatISO(new Date()),
        usuarioCreacion: "ADMIN",
        estado: "ACTIVO"
    };

    SafcoTransportesDB.saveCabecera(newCabecera);

    // 2. Guardar los viajes individuales
    const currentProgramaciones = SafcoTransportesDB.getProgramaciones();
    let nextNum = currentProgramaciones.length + 1;

    const newPrgs = [];

    semanalDetalleDias.forEach(day => {
        if (day.vehicles && day.vehicles.length > 0) {
            day.vehicles.forEach(v => {
                const id = `PRG-${new Date().getFullYear()}-${String(nextNum++).padStart(3, '0')}`;
                newPrgs.push({
                    id: id,
                    cabeceraId: semanalCabecera.id,
                    campanaId: semanalCabecera.campanaId,
                    campanaNombre: semanalCabecera.campanaNombre,
                    empresaId: semanalCabecera.empresaId,
                    empresaNombre: semanalCabecera.empresaNombre,
                    sucursal: semanalCabecera.sucursal,
                    transportistaId: semanalCabecera.transportistaId,
                    transportistaNombre: semanalCabecera.transportistaNombre,
                    semanaIso: semanalCabecera.semanaIso,
                    fecha: day.dateISO,
                    turno: v.turno,
                    rutaId: v.rutaId,
                    rutaNombre: v.rutaNombre,
                    personasRutaAsignadas: v.personasRutaAsignadas,
                    vehiculoId: v.vehiculoId,
                    placa: v.placa,
                    empresa: semanalCabecera.transportistaNombre,
                    capacidad: v.capacidad,
                    choferId: v.choferId,
                    choferNombre: v.choferNombre,
                    choferDni: v.choferDni,
                    estadoGeneral: 'PROGRAMADO',
                    ingreso: {
                        iniciado: false,
                        pasajeros: [],
                        totalChofer: 0,
                        inspeccionGarita: { revisado: false }
                    },
                    retorno: {
                        iniciado: false,
                        pasajeros: [],
                        totalChofer: 0,
                        inspeccionGarita: { revisado: false }
                    }
                });
            });
        }
    });

    SafcoTransportesDB.addProgramacionesBatch(newPrgs);

    Swal.fire({
        icon: 'success',
        title: 'Programación Semanal Guardada',
        html: `
            <div style="text-align:left; font-size:0.9rem;">
                <p><b>ID Cabecera:</b> <code style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-weight:800;">${semanalCabecera.id}</code></p>
                <p>Se registraron con éxito <b>${newPrgs.length} servicios de transporte</b> para la semana.</p>
                <p>• <b>Campaña:</b> ${semanalCabecera.campanaId}</p>
                <p>• <b>Empresa / Sucursal:</b> ${semanalCabecera.empresaId} - ${semanalCabecera.sucursal}</p>
                <p>• <b>Transportista:</b> ${semanalCabecera.transportistaNombre}</p>
                <p>• <b>Semana:</b> ${semanalCabecera.semanaIso}</p>
            </div>
        `,
        confirmButtonColor: '#004a4c'
    }).then(() => {
        cerrarModalProgramacionSemanal();
    });
}

// --------------------------------------------------------------------------
// MODAL INDIVIDUAL (1 DÍA) Y MODAL DE PASAJEROS
// --------------------------------------------------------------------------

function abrirModalNuevaProgramacion() {
    const today = new Date().toISOString().split('T')[0];
    const inputFecha = document.getElementById('progFechaInput');
    if (inputFecha) inputFecha.value = today;
    document.getElementById('modalProgramacion').classList.add('active');
}

function cerrarModalProgramacion() {
    document.getElementById('modalProgramacion').classList.remove('active');
}

function populateModalSelects() {
    const rutas = SafcoTransportesDB.getRutas();
    const vehiculos = SafcoTransportesDB.getVehiculos();

    const rutaSelect = document.getElementById('progRutaSelect');
    const vehiculoSelect = document.getElementById('progVehiculoSelect');

    if (rutaSelect) {
        rutaSelect.innerHTML = '<option value="">-- Seleccione una Ruta --</option>';
        rutas.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.id;
            opt.textContent = `${r.nombre} (${r.personasAsignadas || 35} Personas)`;
            rutaSelect.appendChild(opt);
        });
    }

    if (vehiculoSelect) {
        vehiculoSelect.innerHTML = '<option value="">-- Seleccione Vehículo y Conductor --</option>';
        vehiculos.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.id;
            opt.textContent = `${v.placa} - ${v.choferNombre} (Cap: ${v.capacidad} Asientos | ${v.empresa})`;
            vehiculoSelect.appendChild(opt);
        });
    }
}

function guardarNuevaProgramacion(e) {
    if (e) e.preventDefault();

    const fecha = document.getElementById('progFechaInput').value;
    const turno = document.getElementById('progTurnoSelect').value;
    const rutaId = document.getElementById('progRutaSelect').value;
    const vehiculoId = document.getElementById('progVehiculoSelect').value;

    if (!fecha || !turno || !rutaId || !vehiculoId) {
        Swal.fire('Atención', 'Por favor complete todos los campos requeridos.', 'warning');
        return;
    }

    const rutaObj = SafcoTransportesDB.getRutas().find(r => r.id === rutaId);
    const vehiculoObj = SafcoTransportesDB.getVehiculos().find(v => v.id === vehiculoId);

    const weekIso = getISOWeekString(new Date(fecha + 'T00:00:00'));
    const cabeceraId = `CAB-IND-${fecha}`;

    const newPrg = {
        id: `PRG-${new Date().getFullYear()}-${String(allProgramaciones.length + 1).padStart(3, '0')}`,
        cabeceraId: cabeceraId,
        campanaId: "AR26",
        campanaNombre: "AR26 - Campaña Arándano 2026",
        empresaId: "ASP",
        empresaNombre: "ASP (Agrícola SAFCO Perú)",
        sucursal: "Packing Safco",
        transportistaId: "TRP-01",
        transportistaNombre: vehiculoObj.empresa,
        semanaIso: weekIso,
        fecha: fecha,
        turno: turno,
        rutaId: rutaId,
        rutaNombre: rutaObj ? rutaObj.nombre : 'Ruta Asignada',
        personasRutaAsignadas: rutaObj?.personasAsignadas || 35,
        vehiculoId: vehiculoId,
        placa: vehiculoObj.placa,
        empresa: vehiculoObj.empresa,
        capacidad: vehiculoObj.capacidad,
        choferId: vehiculoObj.choferId,
        choferNombre: vehiculoObj.choferNombre,
        choferDni: vehiculoObj.choferDni,
        estadoGeneral: 'PROGRAMADO',
        ingreso: { iniciado: false, pasajeros: [], totalChofer: 0, inspeccionGarita: { revisado: false } },
        retorno: { iniciado: false, pasajeros: [], totalChofer: 0, inspeccionGarita: { revisado: false } }
    };

    // Crear o actualizar cabecera correspondiente
    const newCabecera = {
        id: cabeceraId,
        campanaId: "AR26",
        campanaNombre: "AR26 - Campaña Arándano 2026",
        empresaId: "ASP",
        empresaNombre: "ASP (Agrícola SAFCO Perú)",
        sucursal: "Packing Safco",
        semanaIso: weekIso,
        semanaRango: fecha,
        transportistaId: "TRP-01",
        transportistaNombre: vehiculoObj.empresa,
        fechaCreacion: fecha,
        usuarioCreacion: "ADMIN",
        estado: "ACTIVO"
    };

    SafcoTransportesDB.saveCabecera(newCabecera);
    SafcoTransportesDB.saveProgramacion(newPrg);
    cerrarModalProgramacion();
    loadData();

    Swal.fire({
        icon: 'success',
        title: 'Servicio Programado',
        text: `Se programó la unidad ${newPrg.placa} para la ${newPrg.rutaNombre} (${fecha}).`,
        confirmButtonColor: '#004a4c'
    });
}

// Modal de Detalle de Pasajeros
let detalleModalPrgId = null;
let detalleModalTab = 'ingreso';

function abrirModalDetallePasajeros(id) {
    detalleModalPrgId = id;
    detalleModalTab = 'ingreso';
    renderModalDetalleContent();
    document.getElementById('modalDetallePasajeros').classList.add('active');
}

function cerrarModalDetallePasajeros() {
    document.getElementById('modalDetallePasajeros').classList.remove('active');
}

function switchDetalleModalTab(tab) {
    detalleModalTab = tab;
    document.querySelectorAll('.modal-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    renderModalDetalleContent();
}

function renderModalDetalleContent() {
    const prg = SafcoTransportesDB.getProgramacionById(detalleModalPrgId);
    if (!prg) return;

    document.getElementById('detalleModalTitle').textContent = `Pasajeros: ${prg.rutaNombre} (${prg.placa})`;
    document.getElementById('detalleModalSubtitle').textContent = `Chofer: ${prg.choferNombre} • Fecha: ${prg.fecha} • Turno: ${prg.turno}`;

    const isIngreso = detalleModalTab === 'ingreso';
    const flow = isIngreso ? prg.ingreso : prg.retorno;

    const totalChofer = flow?.pasajeros?.length || 0;
    const garitaConteo = flow?.inspeccionGarita?.revisado ? flow.inspeccionGarita.conteoRealGarita : 'Pendiente';
    const guardiaName = flow?.inspeccionGarita?.guardia || '-';

    document.getElementById('detalleResumenChofer').textContent = `${totalChofer} Pasajeros`;
    document.getElementById('detalleResumenGarita').textContent = `${garitaConteo}`;
    document.getElementById('detalleResumenOficial').textContent = guardiaName;

    const tbody = document.getElementById('detallePasajerosTbody');
    tbody.innerHTML = '';

    const list = flow?.pasajeros || [];
    if (list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:1.5rem; color:var(--text-muted);">
                    No hay registros de subida para este viaje aún.
                </td>
            </tr>
        `;
        return;
    }

    list.forEach((p, idx) => {
        const tr = document.createElement('tr');
        let tagHtml = `<span style="color:#15803d; font-weight:700;">🟢 Correcto</span>`;

        if (isIngreso && !p.esRutaCorrecta) {
            tagHtml = `<span style="background:#fef3c7; color:#b45309; padding:2px 6px; border-radius:4px; font-weight:700; font-size:0.75rem;">🟡 ${p.observacion || 'Ruta no habitual'}</span>`;
        } else if (!isIngreso && p.sinIngresoPrevio) {
            tagHtml = `<span style="background:#fee2e2; color:#b91c1c; padding:2px 6px; border-radius:4px; font-weight:700; font-size:0.75rem;">🔴 Sin Ingreso Matutino</span>`;
        }

        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td><b>${p.dni}</b></td>
            <td>
                <div style="font-weight:700;">${p.nombres}</div>
                <small style="color:var(--text-muted);">${p.fotocheck || '-'}</small>
            </td>
            <td>${p.area || '-'}</td>
            <td>${p.horaAbordaje || '--:--'}</td>
            <td>${tagHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

function resetMockDemoData() {
    Swal.fire({
        title: '¿Restablecer Datos de Demostración?',
        text: 'Se cargarán nuevamente las cabeceras, programaciones y colaboradores de prueba.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#004a4c',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, Restablecer'
    }).then((res) => {
        if (res.isConfirmed) {
            SafcoTransportesDB.resetToDefault();
            loadData();
            Swal.fire('Listo', 'Datos restaurados exitosamente.', 'success');
        }
    });
}
