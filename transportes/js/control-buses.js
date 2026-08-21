/**
 * SAFCO - Lógica del Módulo Central de Control de Transportes de Personal
 */

let allProgramaciones = [];
let currentFilter = {
    fecha: '',
    turno: '',
    busqueda: '',
    estado: ''
};

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

    // Establecer fecha de hoy por defecto
    const today = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById('filtroFecha');
    if (fechaInput) fechaInput.value = today;
    currentFilter.fecha = today;

    // Poblar selects del modal de programación
    populateModalSelects();

    loadData();
}

function loadData() {
    allProgramaciones = SafcoTransportesDB.getProgramaciones();
    updateDashboardKPIs();
    renderTable();
}

function updateDashboardKPIs() {
    const totalServicios = allProgramaciones.length;
    const enPlanta = allProgramaciones.filter(p => p.ingreso?.inspeccionGarita?.revisado && !p.retorno?.finalizado).length;
    
    // Total de pasajeros transportados
    let totalPaxIda = 0;
    let totalPaxRetorno = 0;
    let totalIncidencias = 0;

    allProgramaciones.forEach(p => {
        const paxIda = p.ingreso?.pasajeros?.length || 0;
        const paxRet = p.retorno?.pasajeros?.length || 0;
        totalPaxIda += paxIda;
        totalPaxRetorno += paxRet;

        // Incidencias
        const incIda = (p.ingreso?.pasajeros || []).filter(item => !item.esRutaCorrecta).length;
        const incRet = (p.retorno?.pasajeros || []).filter(item => item.sinIngresoPrevio).length;
        totalIncidencias += (incIda + incRet);
    });

    document.getElementById('kpiTotalServicios').textContent = totalServicios;
    document.getElementById('kpiBusesEnPlanta').textContent = enPlanta;
    document.getElementById('kpiTotalPasajeros').textContent = `${totalPaxIda} Ida / ${totalPaxRetorno} Ret.`;
    document.getElementById('kpiIncidenciasRuta').textContent = totalIncidencias;
}

function renderTable() {
    const tbody = document.getElementById('programacionesTbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filtered = allProgramaciones.filter(p => {
        if (currentFilter.fecha && p.fecha !== currentFilter.fecha) return false;
        if (currentFilter.turno && p.turno !== currentFilter.turno) return false;
        if (currentFilter.estado && p.estadoGeneral !== currentFilter.estado) return false;
        if (currentFilter.busqueda) {
            const q = currentFilter.busqueda.toLowerCase();
            const matchRuta = p.rutaNombre.toLowerCase().includes(q);
            const matchPlaca = p.placa.toLowerCase().includes(q);
            const matchChofer = p.choferNombre.toLowerCase().includes(q);
            if (!matchRuta && !matchPlaca && !matchChofer) return false;
        }
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center; padding: 2rem; color: var(--text-muted);">
                    <i class='bx bx-search-alt' style="font-size:2rem; opacity:0.4; display:block; margin-bottom:4px;"></i>
                    No se encontraron servicios de transporte para los filtros aplicados.
                </td>
            </tr>
        `;
        return;
    }

    filtered.forEach(p => {
        const tr = document.createElement('tr');

        // Estado Badge
        let badgeClass = 'programado';
        let badgeLabel = 'PROGRAMADO';
        switch (p.estadoGeneral) {
            case 'EN_RUTA_IDA':
                badgeClass = 'en-ruta';
                badgeLabel = '🚌 EN RUTA (IDA)';
                break;
            case 'LLEGADA_PLANTA':
                badgeClass = 'llegada';
                badgeLabel = '⏳ EN GARITA (IDA)';
                break;
            case 'INGRESADO_GARITA':
                badgeClass = 'ingresado';
                badgeLabel = '✅ EN PLANTA';
                break;
            case 'EN_RUTA_RETORNO':
                badgeClass = 'retorno';
                badgeLabel = '🚌 EN RETORNO';
                break;
            case 'SALIDA_APROBADA_GARITA':
                badgeClass = 'ingresado';
                badgeLabel = '✅ SALIDA AUTORIZADA';
                break;
            case 'FINALIZADO':
                badgeClass = 'finalizado';
                badgeLabel = '🏁 FINALIZADO';
                break;
        }

        // Pasajeros Ida (Chofer vs Garita)
        const idaChofer = p.ingreso?.pasajeros?.length || 0;
        const idaGarita = p.ingreso?.inspeccionGarita?.revisado ? p.ingreso.inspeccionGarita.conteoRealGarita : '-';
        const idaIncidencias = (p.ingreso?.pasajeros || []).filter(item => !item.esRutaCorrecta).length;

        // Pasajeros Retorno (Chofer vs Garita)
        const retChofer = p.retorno?.pasajeros?.length || 0;
        const retGarita = p.retorno?.inspeccionGarita?.revisado ? p.retorno.inspeccionGarita.conteoRealGarita : '-';
        const retIncidencias = (p.retorno?.pasajeros || []).filter(item => item.sinIngresoPrevio).length;

        tr.innerHTML = `
            <td><b style="color:var(--safco-teal);">${p.id}</b></td>
            <td>
                <div><b>${p.turno.split(' ')[0]}</b></div>
                <small style="color:var(--text-muted);">${p.fecha}</small>
            </td>
            <td>
                <div style="font-weight:700;">${p.rutaNombre}</div>
                <small style="color:var(--text-muted); font-size:0.75rem;">Cap: ${p.capacidad} pax</small>
            </td>
            <td>
                <span style="font-family:monospace; font-weight:800; background:#e2e8f0; padding:2px 6px; border-radius:4px;">${p.placa}</span>
            </td>
            <td>
                <div>${p.choferNombre}</div>
                <small style="color:var(--text-muted);">${p.empresa}</small>
            </td>
            <td>
                <div><b>${idaChofer}</b> / ${p.capacidad} <span style="font-size:0.75rem; color:var(--text-muted);">(Garita: ${idaGarita})</span></div>
                ${idaIncidencias > 0 ? `<small style="color:#b45309; font-weight:700;">⚠️ ${idaIncidencias} otra ruta</small>` : `<small style="color:#15803d;">Ruta OK</small>`}
            </td>
            <td>
                <div><b>${retChofer}</b> / ${p.capacidad} <span style="font-size:0.75rem; color:var(--text-muted);">(Garita: ${retGarita})</span></div>
                ${retIncidencias > 0 ? `<small style="color:#b91c1c; font-weight:700;">⛔ ${retIncidencias} sin ingreso</small>` : `<small style="color:var(--text-muted);">-</small>`}
            </td>
            <td>
                <span class="badge-tbl ${badgeClass}">${badgeLabel}</span>
            </td>
            <td>
                <div class="row-actions-group">
                    <button class="btn-icon-action view-btn" title="Ver Detalle de Pasajeros e Inspección" onclick="abrirModalDetallePasajeros('${p.id}')">
                        <i class='bx bx-user-check'></i>
                    </button>
                    <a href="chofer-transporte-app.html" target="_blank" class="btn-icon-action" title="Abrir en App Chofer">
                        <i class='bx bx-mobile'></i>
                    </a>
                    <button class="btn-icon-action" style="color:#d80000;" title="Eliminar Programación" onclick="eliminarProgramacion('${p.id}')">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function aplicarFiltros() {
    currentFilter.fecha = document.getElementById('filtroFecha')?.value || '';
    currentFilter.turno = document.getElementById('filtroTurno')?.value || '';
    currentFilter.busqueda = document.getElementById('filtroBusqueda')?.value || '';
    currentFilter.estado = document.getElementById('filtroEstado')?.value || '';
    renderTable();
}

function limpiarFiltros() {
    document.getElementById('filtroFecha').value = '';
    document.getElementById('filtroTurno').value = '';
    document.getElementById('filtroBusqueda').value = '';
    document.getElementById('filtroEstado').value = '';
    currentFilter = { fecha: '', turno: '', busqueda: '', estado: '' };
    renderTable();
}

// Modal de Nueva Programación
function abrirModalNuevaProgramacion() {
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
            opt.textContent = `${r.nombre} (${r.paraderos.split('➔')[0].trim()} ➔ Planta)`;
            rutaSelect.appendChild(opt);
        });
    }

    if (vehiculoSelect) {
        vehiculoSelect.innerHTML = '<option value="">-- Seleccione Vehículo y Conductor --</option>';
        vehiculos.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.id;
            opt.textContent = `${v.placa} - ${v.choferNombre} (Cap: ${v.capacidad} | ${v.empresa})`;
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

    const newId = `PRG-${new Date().getFullYear()}-${String(allProgramaciones.length + 1).padStart(3, '0')}`;

    const newPrg = {
        id: newId,
        fecha: fecha,
        turno: turno,
        rutaId: rutaId,
        rutaNombre: rutaObj ? rutaObj.nombre : 'Ruta Asignada',
        vehiculoId: vehiculoId,
        placa: vehiculoObj.placa,
        empresa: vehiculoObj.empresa,
        capacidad: vehiculoObj.capacidad,
        choferId: vehiculoObj.choferId,
        choferNombre: vehiculoObj.choferNombre,
        choferDni: vehiculoObj.choferDni,
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
    };

    SafcoTransportesDB.saveProgramacion(newPrg);
    cerrarModalProgramacion();
    loadData();

    Swal.fire({
        icon: 'success',
        title: 'Servicio Programado',
        text: `Se programó la unidad ${newPrg.placa} para la ${newPrg.rutaNombre}.`,
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

    // Resumen Superior
    const totalChofer = flow?.pasajeros?.length || 0;
    const garitaConteo = flow?.inspeccionGarita?.revisado ? flow.inspeccionGarita.conteoRealGarita : 'Pendiente';
    const guardiaName = flow?.inspeccionGarita?.guardia || '-';

    document.getElementById('detalleResumenChofer').textContent = `${totalChofer} Pasajeros`;
    document.getElementById('detalleResumenGarita').textContent = `${garitaConteo}`;
    document.getElementById('detalleResumenOficial').textContent = guardiaName;

    // Tabla de Pasajeros
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

function eliminarProgramacion(id) {
    Swal.fire({
        title: '¿Eliminar Servicio?',
        text: 'Esta acción removerá la programación y sus registros de abordaje asociados.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d80000',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, Eliminar',
        cancelButtonText: 'Cancelar'
    }).then((res) => {
        if (res.isConfirmed) {
            allProgramaciones = allProgramaciones.filter(p => p.id !== id);
            SafcoTransportesDB.saveProgramaciones(allProgramaciones);
            loadData();
            Swal.fire('Eliminado', 'El servicio fue removido con éxito.', 'success');
        }
    });
}

function resetMockDemoData() {
    Swal.fire({
        title: '¿Restablecer Datos de Demostración?',
        text: 'Se cargarán nuevamente las programaciones y colaboradores de prueba.',
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
