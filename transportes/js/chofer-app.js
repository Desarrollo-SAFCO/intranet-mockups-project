/**
 * SAFCO - Lógica de la Aplicación Móvil para Chofer / Conductor
 */

let currentTripId = "PRG-2026-001";
let currentMode = "ingreso"; // 'ingreso' o 'retorno'

document.addEventListener('DOMContentLoaded', () => {
    initChoferApp();
    
    // Escuchar actualizaciones externas (ej. si Garita aprueba)
    window.addEventListener('safco_transportes_updated', () => {
        renderTripData();
    });
});

function initChoferApp() {
    if (!SafcoTransportesDB.checkAdminAccess()) {
        return;
    }
    populateTripSelector();
    renderTripData();
}

function populateTripSelector() {
    const selector = document.getElementById('selectedTrip');
    if (!selector) return;

    const programaciones = SafcoTransportesDB.getProgramaciones();
    selector.innerHTML = '';

    programaciones.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.rutaNombre} - ${p.placa} (${p.choferNombre.split(' ')[0]})`;
        selector.appendChild(opt);
    });

    selector.value = currentTripId;
    selector.addEventListener('change', (e) => {
        currentTripId = e.target.value;
        renderTripData();
    });
}

function switchTripTab(mode) {
    currentMode = mode;
    document.querySelectorAll('.trip-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === mode);
    });

    const headerTitle = document.getElementById('tripSectionTitle');
    if (headerTitle) {
        headerTitle.textContent = mode === 'ingreso' ? '1. Abordaje de Ingreso (Ida a Planta)' : '2. Abordaje de Retorno (Salida de Planta)';
    }

    renderTripData();
}

function renderTripData() {
    const prg = SafcoTransportesDB.getProgramacionById(currentTripId);
    if (!prg) return;

    // Header info
    document.getElementById('driverName').textContent = prg.choferNombre;
    document.getElementById('driverVehicleInfo').textContent = `${prg.placa} • ${prg.empresa} • Cap. ${prg.capacidad}`;
    document.getElementById('routeNameHeader').textContent = prg.rutaNombre;

    // Datos del modo actual
    const tripFlow = currentMode === 'ingreso' ? prg.ingreso : prg.retorno;
    const isIngreso = currentMode === 'ingreso';

    // Status Badge
    const statusBadge = document.getElementById('generalStatusBadge');
    if (isIngreso) {
        if (!tripFlow.iniciado) {
            statusBadge.className = 'badge-status programado';
            statusBadge.textContent = 'PROGRAMADO (IDA)';
        } else if (tripFlow.iniciado && !tripFlow.finalizado) {
            statusBadge.className = 'badge-status en-ruta';
            statusBadge.textContent = 'EN RUTA (IDA)';
        } else if (tripFlow.finalizado && !tripFlow.inspeccionGarita?.revisado) {
            statusBadge.className = 'badge-status llegada';
            statusBadge.textContent = 'EN GARITA / ESPERA';
        } else {
            statusBadge.className = 'badge-status aprobado';
            statusBadge.textContent = 'INGRESADO A PLANTA';
        }
    } else {
        if (!tripFlow.iniciado) {
            statusBadge.className = 'badge-status programado';
            statusBadge.textContent = 'EN ESPERA (RETORNO)';
        } else if (tripFlow.iniciado && !tripFlow.finalizado) {
            statusBadge.className = 'badge-status retorno';
            statusBadge.textContent = 'EN RUTA (RETORNO)';
        } else if (tripFlow.finalizado && !tripFlow.inspeccionGarita?.revisado) {
            statusBadge.className = 'badge-status llegada';
            statusBadge.textContent = 'EN GARITA SALIDA';
        } else {
            statusBadge.className = 'badge-status aprobado';
            statusBadge.textContent = 'RETORNO COMPLETADO';
        }
    }

    // Contadores
    const count = tripFlow.pasajeros.length;
    document.getElementById('currentPassengerCount').textContent = count;
    document.getElementById('maxCapacityDisplay').textContent = `/ ${prg.capacidad} asientos`;

    const percentage = Math.min(100, Math.round((count / prg.capacidad) * 100));
    document.getElementById('capacityProgressFill').style.width = `${percentage}%`;

    // Render Lista de Pasajeros
    renderPassengerList(tripFlow.pasajeros, isIngreso, prg);

    // Render Botón de Acción Principal
    renderActionButton(tripFlow, isIngreso, prg);
}

function renderPassengerList(pasajeros, isIngreso, prg) {
    const container = document.getElementById('passengerListContainer');
    const emptyState = document.getElementById('emptyPassengersMsg');
    container.innerHTML = '';

    if (!pasajeros || pasajeros.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // Lista invertida (los últimos arriba)
    [...pasajeros].reverse().forEach((p, idx) => {
        const item = document.createElement('div');
        let cardClass = 'passenger-item-pill ok-route';
        let badgeHtml = `<span class="badge-flag ok">Ruta OK</span>`;

        if (isIngreso) {
            if (!p.esRutaCorrecta) {
                cardClass = 'passenger-item-pill warn-route';
                badgeHtml = `<span class="badge-flag warn">⚠️ Ruta No Habitual</span>`;
            }
        } else {
            // En Retorno: Si no tuvo registro de ingreso
            if (p.sinIngresoPrevio) {
                cardClass = 'passenger-item-pill danger-route';
                badgeHtml = `<span class="badge-flag danger">⚠️ Sin Ingreso Previo</span>`;
            }
        }

        item.className = cardClass;
        item.innerHTML = `
            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(p.nombres)}&background=004a4c&color=fff&size=64" class="passenger-mini-avatar" alt="Avatar">
            <div class="passenger-details-col">
                <div class="passenger-name-text">${p.nombres}</div>
                <div class="passenger-sub-info">
                    <span>DNI: <b>${p.dni}</b></span>
                    <span>•</span>
                    <span>${p.area}</span>
                    <span>•</span>
                    <span>${p.horaAbordaje || '--:--'}</span>
                </div>
            </div>
            ${badgeHtml}
        `;
        container.appendChild(item);
    });
}

function renderActionButton(tripFlow, isIngreso, prg) {
    const actionContainer = document.getElementById('tripActionContainer');
    actionContainer.innerHTML = '';

    if (isIngreso) {
        if (!tripFlow.iniciado) {
            actionContainer.innerHTML = `
                <button class="btn-primary-action" onclick="iniciarRutaIda()">
                    <i class='bx bx-play-circle'></i> Iniciar Recorrido de Ida
                </button>
            `;
        } else if (tripFlow.iniciado && !tripFlow.finalizado) {
            actionContainer.innerHTML = `
                <button class="btn-primary-action" style="background:#004a4c;" onclick="finalizarRutaIda()">
                    <i class='bx bx-check-shield'></i> 📍 Llegada a Garita (Notificar a Seguridad)
                </button>
            `;
        } else if (tripFlow.finalizado && !tripFlow.inspeccionGarita?.revisado) {
            actionContainer.innerHTML = `
                <div style="text-align:center; padding: 0.75rem; color: #b45309; font-weight: 700; font-size: 0.85rem; background: #fef3c7; border: 1px solid #fde68a; border-radius: 12px;">
                    <i class='bx bx-time-five'></i> En Garita de Planta: Esperando check del oficial de seguridad...
                </div>
            `;
        } else {
            actionContainer.innerHTML = `
                <div style="text-align:center; padding: 0.6rem; color: #15803d; font-weight: 700; font-size: 0.85rem; background: #dcfce7; border-radius: 12px; margin-bottom: 6px;">
                    <i class='bx bx-check-circle'></i> Ingreso Aprobado por Seguridad
                </div>
                <button class="btn-secondary-action" onclick="switchTripTab('retorno')">
                    Ir al Flujo de Retorno ➔
                </button>
            `;
        }
    } else {
        // Modo Retorno
        const garitaAproboSalida = prg.retorno?.inspeccionGarita?.revisado;

        if (!tripFlow.iniciado) {
            actionContainer.innerHTML = `
                <button class="btn-primary-action" style="background:#7c3aed;" onclick="iniciarRutaRetorno()">
                    <i class='bx bx-bus'></i> Iniciar Recorrido de Retorno
                </button>
            `;
        } else if (tripFlow.iniciado && !garitaAproboSalida) {
            actionContainer.innerHTML = `
                <div style="text-align:center; padding: 0.75rem; color: #6b21a8; font-weight: 700; font-size: 0.82rem; background: #f3e8ff; border: 1px solid #e9d5ff; border-radius: 12px; margin-bottom:6px;">
                    <i class='bx bx-shield-quarter'></i> ⏳ En Garita de Salida: Esperando check de seguridad...
                </div>
                <button class="btn-primary-action" style="background:#94a3b8; cursor:not-allowed;" disabled>
                    <i class='bx bx-lock-alt'></i> Finalizar Servicio (Requiere Check Garita)
                </button>
            `;
        } else if (tripFlow.iniciado && garitaAproboSalida && !tripFlow.finalizado) {
            actionContainer.innerHTML = `
                <div style="text-align:center; padding: 0.5rem; color: #15803d; font-weight: 700; font-size: 0.8rem; background: #dcfce7; border-radius: 10px; margin-bottom:6px;">
                    <i class='bx bx-check-double'></i> Conformidad de Garita de Salida Recibida
                </div>
                <button class="btn-primary-action" style="background:#004a4c;" onclick="finalizarRutaRetorno()">
                    <i class='bx bx-check-circle'></i> 🏁 Finalizar Servicio de Retorno (Culminar)
                </button>
            `;
        } else {
            actionContainer.innerHTML = `
                <div style="text-align:center; padding: 0.75rem; color: #15803d; font-weight: 700; font-size: 0.85rem; background: #dcfce7; border-radius: 12px;">
                    <i class='bx bx-check-double'></i> Servicio de Retorno Culminado Exitosamente
                </div>
            `;
        }
    }
}

// Iniciar y Finalizar Rutas
function iniciarRutaIda() {
    const prg = SafcoTransportesDB.getProgramacionById(currentTripId);
    if (!prg) return;

    prg.ingreso.iniciado = true;
    prg.ingreso.horaInicio = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    prg.estadoGeneral = 'EN_RUTA_IDA';

    SafcoTransportesDB.saveProgramacion(prg);
    renderTripData();

    Swal.fire({
        icon: 'success',
        title: '¡Ruta de Ida Iniciada!',
        text: 'Puede comenzar a escanear los fotochecks o ingresar los DNIs de los pasajeros.',
        confirmButtonColor: '#004a4c'
    });
}

function finalizarRutaIda() {
    const prg = SafcoTransportesDB.getProgramacionById(currentTripId);
    if (!prg) return;

    const count = prg.ingreso.pasajeros.length;

    Swal.fire({
        title: '¿Confirmar Llegada a Planta?',
        html: `Se registrará la llegada a Garita de Planta con un total de <b>${count} pasajeros</b> a bordo.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#004a4c',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, Llegamos a Planta',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            prg.ingreso.finalizado = true;
            prg.ingreso.horaLlegada = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            prg.ingreso.totalChofer = count;
            prg.estadoGeneral = 'LLEGADA_PLANTA';

            SafcoTransportesDB.saveProgramacion(prg);
            renderTripData();

            Swal.fire({
                icon: 'success',
                title: 'Llegada Registrada',
                text: 'La unidad ahora figura lista para revisión física por parte del oficial de Garita.',
                confirmButtonColor: '#004a4c'
            });
        }
    });
}

function iniciarRutaRetorno() {
    const prg = SafcoTransportesDB.getProgramacionById(currentTripId);
    if (!prg) return;

    prg.retorno.iniciado = true;
    prg.retorno.horaInicio = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    prg.estadoGeneral = 'EN_RUTA_RETORNO';

    SafcoTransportesDB.saveProgramacion(prg);
    renderTripData();

    Swal.fire({
        icon: 'success',
        title: '¡Ruta de Retorno Iniciada!',
        text: 'Proceda al escaneo y registro de subida de los colaboradores para el retorno.',
        confirmButtonColor: '#7c3aed'
    });
}

function finalizarRutaRetorno() {
    const prg = SafcoTransportesDB.getProgramacionById(currentTripId);
    if (!prg) return;

    if (!prg.retorno?.inspeccionGarita?.revisado) {
        Swal.fire({
            icon: 'warning',
            title: 'Conformidad de Garita Pendiente',
            text: 'El oficial de seguridad en Garita debe validar el conteo de salida antes de culminar el servicio.',
            confirmButtonColor: '#004a4c'
        });
        return;
    }

    const count = prg.retorno.pasajeros.length;

    Swal.fire({
        title: '¿Culminar Servicio de Retorno?',
        html: `Se registrará la finalización del servicio de transporte con <b>${count} pasajeros</b> trasladados.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#004a4c',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, Culminar Servicio',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            prg.retorno.finalizado = true;
            prg.retorno.horaFinalizado = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            prg.retorno.totalChofer = count;
            prg.estadoGeneral = 'FINALIZADO';

            SafcoTransportesDB.saveProgramacion(prg);
            renderTripData();

            Swal.fire({
                icon: 'success',
                title: 'Servicio de Retorno Culminado',
                text: 'El ciclo completo de transporte ha finalizado con éxito.',
                confirmButtonColor: '#004a4c'
            });
        }
    });
}

// Búsqueda y Escaneo de Pasajeros
function handleManualDniSubmit(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('manualDniInput');
    if (!input || !input.value.trim()) return;

    procesarPasajero(input.value.trim());
    input.value = '';
}

function procesarPasajero(query) {
    const prg = SafcoTransportesDB.getProgramacionById(currentTripId);
    if (!prg) return;

    const tripFlow = currentMode === 'ingreso' ? prg.ingreso : prg.retorno;

    if (!tripFlow.iniciado) {
        Swal.fire({
            icon: 'warning',
            title: 'Ruta no iniciada',
            text: 'Debe presionar "Iniciar Recorrido" antes de registrar pasajeros.',
            confirmButtonColor: '#004a4c'
        });
        return;
    }

    if (tripFlow.finalizado) {
        Swal.fire({
            icon: 'info',
            title: 'Ruta ya finalizada',
            text: 'Este viaje ya fue cerrado.',
            confirmButtonColor: '#004a4c'
        });
        return;
    }

    // Verificar si ya alcanzó la capacidad
    if (tripFlow.pasajeros.length >= prg.capacidad) {
        Swal.fire({
            icon: 'error',
            title: 'Capacidad Máxima Alcanzada',
            text: `El bus ya tiene ocupados los ${prg.capacidad} asientos disponibles.`,
            confirmButtonColor: '#d80000'
        });
        return;
    }

    // Buscar colaborador
    const colab = SafcoTransportesDB.findColaboradorByDniOrFotocheck(query);
    if (!colab) {
        Swal.fire({
            icon: 'error',
            title: 'Colaborador No Encontrado',
            text: `No se encontró ningún registro para el DNI/Fotocheck "${query}".`,
            confirmButtonColor: '#d80000'
        });
        return;
    }

    // Verificar si ya está abordado en este viaje
    const alreadyBoarded = tripFlow.pasajeros.some(p => p.dni === colab.dni);
    if (alreadyBoarded) {
        Swal.fire({
            icon: 'warning',
            title: 'Pasajero Ya Registrado',
            text: `${colab.nombres} ${colab.apellidos} ya fue marcado como abordado en este viaje.`,
            confirmButtonColor: '#f59e0b'
        });
        return;
    }

    const horaNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // LÓGICA SEGÚN MODO
    if (currentMode === 'ingreso') {
        // Modo Ingreso (Ida)
        const esRutaCorrecta = (colab.rutaAsignada === prg.rutaId);

        if (esRutaCorrecta) {
            // Pasajero normal de la ruta
            tripFlow.pasajeros.push({
                dni: colab.dni,
                nombres: `${colab.nombres} ${colab.apellidos}`,
                area: colab.area,
                rutaAsignada: colab.rutaAsignada,
                esRutaCorrecta: true,
                horaAbordaje: horaNow,
                fotocheck: colab.fotocheck
            });
            tripFlow.totalChofer = tripFlow.pasajeros.length;
            SafcoTransportesDB.saveProgramacion(prg);
            renderTripData();

            // Toast rápido de éxito
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1800,
                timerProgressBar: true
            });
            Toast.fire({
                icon: 'success',
                title: `✅ ${colab.nombres} abordó (Ruta OK)`
            });
        } else {
            // Pasajero de OTRA ruta -> Alerta Ámbar pero permitir abordaje
            const rutaAsigObj = SafcoTransportesDB.getRutas().find(r => r.id === colab.rutaAsignada);
            const nombreRutaAsig = rutaAsigObj ? rutaAsigObj.nombre : colab.rutaAsignada;

            Swal.fire({
                title: '⚠️ Pasajero de Otra Ruta',
                html: `
                    <div style="text-align: left; font-size: 0.9rem;">
                        <p><b>Colaborador:</b> ${colab.nombres} ${colab.apellidos}</p>
                        <p><b>DNI:</b> ${colab.dni} | <b>Área:</b> ${colab.area}</p>
                        <p style="color: #b45309; font-weight: 700; margin-top: 6px;">
                            📍 Ruta Asignada: ${nombreRutaAsig}
                        </p>
                        <p style="color: #004a4c; font-weight: 700;">
                            🚌 Bus Actual: ${prg.rutaNombre}
                        </p>
                        <p style="margin-top: 8px; font-size: 0.82rem; color: #64748b;">
                            El sistema permite el abordaje registrando la observación correspondiente.
                        </p>
                    </div>
                `,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#f59e0b',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Permitir Abordaje',
                cancelButtonText: 'Cancelar'
            }).then((res) => {
                if (res.isConfirmed) {
                    tripFlow.pasajeros.push({
                        dni: colab.dni,
                        nombres: `${colab.nombres} ${colab.apellidos}`,
                        area: colab.area,
                        rutaAsignada: colab.rutaAsignada,
                        esRutaCorrecta: false,
                        horaAbordaje: horaNow,
                        fotocheck: colab.fotocheck,
                        observacion: `Ruta asignada: ${nombreRutaAsig} (Permitido por chofer)`
                    });
                    tripFlow.totalChofer = tripFlow.pasajeros.length;
                    SafcoTransportesDB.saveProgramacion(prg);
                    renderTripData();

                    Swal.fire({
                        icon: 'info',
                        title: 'Abordaje Registrado con Advertencia',
                        text: `${colab.nombres} subió al bus con reporte de ruta no habitual.`,
                        confirmButtonColor: '#004a4c',
                        timer: 2000
                    });
                }
            });
        }
    } else {
        // Modo Retorno (Salida)
        // Verificar si el colaborador subió en el viaje de ingreso
        const ingresoPasajeros = prg.ingreso?.pasajeros || [];
        const tuvoIngreso = ingresoPasajeros.some(p => p.dni === colab.dni);

        if (tuvoIngreso) {
            // Retorno Normal (Tuvo ingreso previo)
            tripFlow.pasajeros.push({
                dni: colab.dni,
                nombres: `${colab.nombres} ${colab.apellidos}`,
                area: colab.area,
                rutaAsignada: colab.rutaAsignada,
                sinIngresoPrevio: false,
                horaAbordaje: horaNow,
                fotocheck: colab.fotocheck
            });
            tripFlow.totalChofer = tripFlow.pasajeros.length;
            SafcoTransportesDB.saveProgramacion(prg);
            renderTripData();

            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1800
            });
            Toast.fire({
                icon: 'success',
                title: `✅ ${colab.nombres} (Retorno Confirmado)`
            });
        } else {
            // Retorno de pasajero que NO tuvo ingreso previo -> Alerta Roja pero permitir abordaje
            Swal.fire({
                title: '⚠️ Sin Registro de Ingreso Previo',
                html: `
                    <div style="text-align: left; font-size: 0.9rem;">
                        <p><b>Colaborador:</b> ${colab.nombres} ${colab.apellidos}</p>
                        <p><b>DNI:</b> ${colab.dni} | <b>Área:</b> ${colab.area}</p>
                        <p style="color: #b91c1c; font-weight: 700; margin-top: 6px; background: #fee2e2; padding: 6px; border-radius: 6px;">
                            ⛔ Este trabajador no figura en el registro de subida de la mañana (Ida).
                        </p>
                        <p style="margin-top: 8px; font-size: 0.82rem; color: #64748b;">
                            ¿Desea autorizar el abordaje de retorno de todas formas? Se marcará en rojo para trazabilidad de Recursos Humanos.
                        </p>
                    </div>
                `,
                icon: 'error',
                showCancelButton: true,
                confirmButtonColor: '#d80000',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Autorizar Abordaje Retorno',
                cancelButtonText: 'Cancelar'
            }).then((res) => {
                if (res.isConfirmed) {
                    tripFlow.pasajeros.push({
                        dni: colab.dni,
                        nombres: `${colab.nombres} ${colab.apellidos}`,
                        area: colab.area,
                        rutaAsignada: colab.rutaAsignada,
                        sinIngresoPrevio: true,
                        horaAbordaje: horaNow,
                        fotocheck: colab.fotocheck,
                        observacion: `Sin registro de ingreso en la ida (Autorizado en retorno)`
                    });
                    tripFlow.totalChofer = tripFlow.pasajeros.length;
                    SafcoTransportesDB.saveProgramacion(prg);
                    renderTripData();

                    Swal.fire({
                        icon: 'warning',
                        title: 'Retorno Registrado con Observación',
                        text: `${colab.nombres} registrado con etiqueta roja de 'Sin Ingreso'.`,
                        confirmButtonColor: '#004a4c',
                        timer: 2000
                    });
                }
            });
        }
    }
}

// Simulaciones rápidas de escaneo
function demoScanCorrectRoute() {
    // Buscar un colaborador de la ruta asignada que no haya subido
    const prg = SafcoTransportesDB.getProgramacionById(currentTripId);
    if (!prg) return;

    const tripFlow = currentMode === 'ingreso' ? prg.ingreso : prg.retorno;
    const colabs = SafcoTransportesDB.getColaboradores();
    
    const target = colabs.find(c => c.rutaAsignada === prg.rutaId && !tripFlow.pasajeros.some(p => p.dni === c.dni));
    if (target) {
        procesarPasajero(target.dni);
    } else {
        Swal.fire('Info', 'Todos los pasajeros de la ruta ya fueron abordados.', 'info');
    }
}

function demoScanOtherRoute() {
    // Buscar colaborador de OTRA ruta
    const prg = SafcoTransportesDB.getProgramacionById(currentTripId);
    if (!prg) return;

    const tripFlow = currentMode === 'ingreso' ? prg.ingreso : prg.retorno;
    const colabs = SafcoTransportesDB.getColaboradores();
    
    const target = colabs.find(c => c.rutaAsignada !== prg.rutaId && !tripFlow.pasajeros.some(p => p.dni === c.dni));
    if (target) {
        procesarPasajero(target.dni);
    } else {
        Swal.fire('Info', 'No hay colaboradores de otra ruta pendientes de prueba.', 'info');
    }
}

function demoScanNoEntryReturn() {
    // Buscar colaborador que NO esté en la lista de ingreso
    const prg = SafcoTransportesDB.getProgramacionById(currentTripId);
    if (!prg) return;

    const ingresoDnis = (prg.ingreso?.pasajeros || []).map(p => p.dni);
    const colabs = SafcoTransportesDB.getColaboradores();
    
    const target = colabs.find(c => !ingresoDnis.includes(c.dni));
    if (target) {
        procesarPasajero(target.dni);
    } else {
        Swal.fire('Info', 'Todos los colaboradores tienen ingreso registrado.', 'info');
    }
}
