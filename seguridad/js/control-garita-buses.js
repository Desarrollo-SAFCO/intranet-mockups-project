/**
 * SAFCO - Lógica de la App Móvil / Tablet para Garita de Seguridad
 * Validación cruzada estricta y resumen numérico simplificado
 */

let garitaMode = 'ingreso'; // 'ingreso' o 'salida'
let selectedBusId = null;

document.addEventListener('DOMContentLoaded', () => {
    initGarita();

    window.addEventListener('safco_transportes_updated', () => {
        renderGaritaData();
    });
});

function initGarita() {
    if (!SafcoTransportesDB.checkAdminAccess()) {
        return;
    }
    populateBusSelector();
    renderGaritaData();
}

function setGaritaMode(mode) {
    garitaMode = mode;
    document.querySelectorAll('.garita-tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === mode);
    });

    populateBusSelector();
    renderGaritaData();
}

function populateBusSelector() {
    const selector = document.getElementById('selectedBusSelect');
    if (!selector) return;

    const programaciones = SafcoTransportesDB.getProgramaciones();
    selector.innerHTML = '';

    const isIngreso = garitaMode === 'ingreso';
    
    // Filtrar programaciones relevantes
    let list = programaciones;
    if (!isIngreso) {
        // En salida, priorizar los que ya ingresaron o están en retorno
        list = programaciones.filter(p => p.ingreso?.inspeccionGarita?.revisado || p.retorno?.iniciado);
    }

    if (list.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No hay unidades disponibles';
        selector.appendChild(opt);
        selectedBusId = null;
        return;
    }

    list.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        
        let statusText = '';
        if (isIngreso) {
            if (p.ingreso?.inspeccionGarita?.revisado) statusText = ' [✅ Ingresado]';
            else if (p.ingreso?.finalizado) statusText = ' [⏳ EN GARITA]';
            else if (p.ingreso?.iniciado) statusText = ' [🚌 En Ruta]';
            else statusText = ' [Programado]';
        } else {
            if (p.retorno?.inspeccionGarita?.revisado) statusText = ' [✅ Salida OK]';
            else if (p.retorno?.iniciado) statusText = ' [⏳ Retorno Activo]';
            else statusText = ' [En Planta]';
        }

        opt.textContent = `${p.placa} - ${p.rutaNombre}${statusText}`;
        selector.appendChild(opt);
    });

    if (!selectedBusId || !list.some(p => p.id === selectedBusId)) {
        selectedBusId = list[0].id;
    }

    selector.value = selectedBusId;

    selector.onchange = (e) => {
        selectedBusId = e.target.value;
        renderGaritaData();
    };
}

function renderGaritaData() {
    const selector = document.getElementById('selectedBusSelect');
    if (selector && selectedBusId) selector.value = selectedBusId;

    const prg = SafcoTransportesDB.getProgramacionById(selectedBusId);
    const content = document.getElementById('garitaBusContent');
    if (!prg) {
        if (content) {
            content.innerHTML = `
                <div style="text-align:center; padding:3rem; color:var(--text-muted);">
                    <i class='bx bx-bus' style="font-size:3rem; opacity:0.3; display:block; margin-bottom:8px;"></i>
                    No hay información disponible para este filtro.
                </div>
            `;
        }
        return;
    }

    const isIngreso = garitaMode === 'ingreso';
    const flow = isIngreso ? prg.ingreso : prg.retorno;

    // Estado del Chofer
    const choferIniciado = flow.iniciado;
    const choferLlegoAGarita = isIngreso ? flow.finalizado : flow.iniciado;
    const isRevisadoGarita = flow.inspeccionGarita?.revisado;
    const countChofer = flow.pasajeros?.length || 0;

    let statusBadgeClass = 'en-camino';
    let statusBadgeText = '🚌 EN CAMINO (No ha llegado)';

    if (isIngreso) {
        if (isRevisadoGarita) {
            statusBadgeClass = 'aprobado';
            statusBadgeText = '✅ INGRESO APROBADO';
        } else if (choferLlegoAGarita) {
            statusBadgeClass = 'en-garita';
            statusBadgeText = '⏳ EN GARITA (Listo p/ validar)';
        } else if (choferIniciado) {
            statusBadgeClass = 'en-camino';
            statusBadgeText = '🚌 EN RUTA (En camino)';
        } else {
            statusBadgeClass = 'en-camino';
            statusBadgeText = 'PROGRAMADO (Sin iniciar)';
        }
    } else {
        // Modo Salida
        if (isRevisadoGarita) {
            statusBadgeClass = 'aprobado';
            statusBadgeText = '✅ SALIDA APROBADA';
        } else if (choferIniciado) {
            statusBadgeClass = 'esperando-salida';
            statusBadgeText = '⏳ EN GARITA SALIDA (Listo p/ validar)';
        } else {
            statusBadgeClass = 'en-camino';
            statusBadgeText = 'EN PLANTA (Esperando salida)';
        }
    }

    const prevRealCount = (flow.inspeccionGarita?.conteoRealGarita !== null && flow.inspeccionGarita?.conteoRealGarita !== undefined)
        ? flow.inspeccionGarita.conteoRealGarita
        : countChofer;

    // Generar UI interactiva simplificada
    content.innerHTML = `
        <div class="bus-summary-card">
            <div class="bus-summary-header">
                <span class="bus-plate-pill">${prg.placa}</span>
                <span class="badge-bus-status ${statusBadgeClass}">${statusBadgeText}</span>
            </div>

            <div class="bus-info-grid">
                <div class="info-field-item">
                    <label>Ruta Asignada</label>
                    <span>${prg.rutaNombre}</span>
                </div>
                <div class="info-field-item">
                    <label>Conductor</label>
                    <span>${prg.choferNombre}</span>
                </div>
                <div class="info-field-item">
                    <label>Empresa de Transporte</label>
                    <span>${prg.empresa}</span>
                </div>
                <div class="info-field-item">
                    <label>Capacidad Máxima</label>
                    <span>${prg.capacidad} Asientos</span>
                </div>
            </div>

            ${!choferLlegoAGarita && !isRevisadoGarita ? `
                <!-- BLOQUEO: Chofer no ha marcado llegada a garita -->
                <div class="lock-warning-banner">
                    <i class='bx bx-time-five'></i>
                    <strong>Esperando llegada del vehículo a Garita</strong>
                    <span>El chofer aún no ha registrado su llegada a planta en su app móvil. La validación se habilitará cuando el conductor presione "Llegada a Planta / Enviar a Garita".</span>
                </div>
            ` : isRevisadoGarita ? `
                <!-- ESTADO: Ya validado -->
                <div class="garita-validated-success-card">
                    <i class='bx bx-check-double' style="font-size:2.2rem; color:#15803d;"></i>
                    <h4>${isIngreso ? 'Ingreso a Planta Conforme' : 'Salida de Planta Conforme'}</h4>
                    <p>
                        Conteo Chofer: <b>${countChofer}</b> | Conteo Garita: <b>${flow.inspeccionGarita.conteoRealGarita}</b><br>
                        Oficial: <b>${flow.inspeccionGarita.guardia || 'Of. Roberto Sánchez'}</b> • Hora: <b>${flow.inspeccionGarita.horaInspeccion || '--:--'}</b>
                    </p>
                    ${flow.inspeccionGarita.observaciones ? `
                        <div style="margin-top:6px; font-size:0.78rem; color:#166534; font-style:italic;">
                            Obs: "${flow.inspeccionGarita.observaciones}"
                        </div>
                    ` : ''}
                </div>
            ` : `
                <!-- FORMULARIO DE VALIDACIÓN HABILITADO -->
                <div class="conteo-validation-box">
                    <div class="conteo-box-item chofer">
                        <label><i class='bx bx-mobile'></i> Reporte del Chofer</label>
                        <div class="conteo-big-display">${countChofer}</div>
                        <small style="font-size:0.72rem; color:#15803d; font-weight:700;">Pasajeros a bordo</small>
                    </div>

                    <div class="conteo-box-item garita">
                        <label><i class='bx bx-user-check'></i> Conteo Físico Real</label>
                        <div style="display:flex; justify-content:center; align-items:center; margin: 4px 0;">
                            <input type="number" id="conteoFisicoGaritaInput" class="input-conteo-touch" value="${prevRealCount}" min="0" max="80">
                        </div>
                        <small style="font-size:0.72rem; color:#b45309; font-weight:700;">Digitar conteo guardia</small>
                    </div>
                </div>

                <div class="obs-input-card">
                    <label for="garitaObsText"><i class='bx bx-comment-detail'></i> Observaciones (Opcional):</label>
                    <textarea id="garitaObsText" class="obs-textarea" rows="2" placeholder="Ej. Conteo conforme, 0 novedades...">${flow.inspeccionGarita?.observaciones || ''}</textarea>
                </div>

                <button class="btn-garita-confirm" onclick="confirmarInspeccionGarita()">
                    <i class='bx bx-check-shield'></i> ${isIngreso ? 'Confirmar y Aprobar Ingreso a Planta' : 'Dar Conformidad / Check de Salida'}
                </button>
            `}
        </div>
    `;
}

function confirmarInspeccionGarita() {
    const prg = SafcoTransportesDB.getProgramacionById(selectedBusId);
    if (!prg) return;

    const isIngreso = garitaMode === 'ingreso';
    const flow = isIngreso ? prg.ingreso : prg.retorno;

    const inputCount = document.getElementById('conteoFisicoGaritaInput');
    const obsText = document.getElementById('garitaObsText')?.value.trim() || '';

    const conteoReal = parseInt(inputCount?.value, 10);
    if (isNaN(conteoReal) || conteoReal < 0) {
        Swal.fire('Atención', 'Por favor digite una cantidad válida para el conteo físico.', 'warning');
        return;
    }

    const conteoChofer = flow.pasajeros?.length || 0;
    const tieneDiscrepancia = (conteoReal !== conteoChofer);

    let msgHtml = `
        <div style="text-align:left; font-size:0.9rem;">
            <p>Se registrará la conformidad para la unidad <b>${prg.placa}</b> (${prg.rutaNombre}).</p>
            <p>• Cantidad Chofer: <b>${conteoChofer}</b></p>
            <p>• Conteo Físico Garita: <b>${conteoReal}</b></p>
            ${tieneDiscrepancia ? `<p style="color:#b91c1c; font-weight:700; background:#fee2e2; padding:6px; border-radius:6px;">⚠️ Discrepancia detectada de ${Math.abs(conteoReal - conteoChofer)} pasajero(s).</p>` : `<p style="color:#15803d; font-weight:700;">✅ Conteos coinciden perfectamente.</p>`}
        </div>
    `;

    Swal.fire({
        title: isIngreso ? '¿Confirmar Ingreso a Planta?' : '¿Confirmar Salida de Planta?',
        html: msgHtml,
        icon: tieneDiscrepancia ? 'warning' : 'question',
        showCancelButton: true,
        confirmButtonColor: '#004a4c',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, Confirmar Check',
        cancelButtonText: 'Cancelar'
    }).then((res) => {
        if (res.isConfirmed) {
            const horaNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            flow.inspeccionGarita = {
                revisado: true,
                horaInspeccion: horaNow,
                guardia: 'Of. Roberto Sánchez',
                conteoRealGarita: conteoReal,
                conforme: !tieneDiscrepancia,
                observaciones: obsText || (tieneDiscrepancia ? `Discrepancia: Chofer (${conteoChofer}) vs Garita (${conteoReal})` : 'Conteo conforme')
            };

            if (isIngreso) {
                prg.estadoGeneral = 'INGRESADO_GARITA';
            } else {
                prg.estadoGeneral = 'SALIDA_APROBADA_GARITA';
            }

            SafcoTransportesDB.saveProgramacion(prg);
            populateBusSelector();
            renderGaritaData();

            Swal.fire({
                icon: 'success',
                title: isIngreso ? 'Ingreso Registrado' : 'Salida Autorizada',
                text: `Se autorizó el pase de la unidad ${prg.placa}.`,
                confirmButtonColor: '#004a4c'
            });
        }
    });
}
