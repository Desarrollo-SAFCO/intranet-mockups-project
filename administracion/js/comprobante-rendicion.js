/* comprobante-rendicion.js - Lógica del Portal de Autogestión de Firmas de Operarios */

const STORAGE_KEY = 'SafcoRendicionesPasajes';

// Datos por defecto (mismo que rendicion-pasajes.js para redundancia de fallback)
const DEFAULTS = {
    personal: [
        { id: 'alex.quintanilla', nombre: 'Alex Quintanilla', rol: 'supervisor', area: 'SISTEMAS' },
        { id: 'carlos.mendoza', nombre: 'Carlos Mendoza', rol: 'jefe', area: 'SISTEMAS' },
        { id: 'luis.zarat', nombre: 'Luis Zarat', rol: 'rrhh', area: 'RRHH' }
    ],
    operarios: [
        { codigo: '1001', dni: '44648673', nombre: 'Juan Pérez Ramos', cargo: 'Auxiliar de Soporte', area: 'SISTEMAS' },
        { codigo: '1002', dni: '45112233', nombre: 'José Ramírez Rojas', cargo: 'Asistente de Sistemas', area: 'SISTEMAS' },
        { codigo: '1003', dni: '46223344', nombre: 'Pedro Gómez Castro', cargo: 'Técnico de Redes', area: 'SISTEMAS' },
        { codigo: '1004', dni: '47334455', nombre: 'Luis Torres Valenzuela', cargo: 'Analista de Infraestructura', area: 'SISTEMAS' },
        { codigo: '2001', dni: '70809010', nombre: 'Manuel Ramos Soto', cargo: 'Cosechador Operario', area: 'PRODUCCIÓN' },
        { codigo: '2002', dni: '70809020', nombre: 'Sofía Benítez Prado', cargo: 'Embaladora Planta', area: 'PRODUCCIÓN' }
    ],
    config: {
        origen: 'Planta',
        motivoDefault: 'Traslado del personal',
        correlativo: 2
    },
    rendiciones: []
};

let state = structuredClone(DEFAULTS);
let activeOperario = null;
let activePlanilla = null;

// Lienzo de Firma
let canvas = null;
let ctxF = null;
let drawing = false;
let huboTrazo = false;

/* ===================== FORMATOS Y AUXILIARES ===================== */
function soles(n) {
    return 'S/ ' + (n || 0).toFixed(2);
}

function fmtCorto(isoStr) {
    if (!isoStr) return '';
    const parts = isoStr.split('T')[0].split('-');
    return `${parts[2]}/${parts[1]}`;
}

function rangoSemana(isoStr) {
    if (!isoStr) return '';
    const start = new Date(isoStr);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${fmtCorto(start.toISOString())} al ${fmtCorto(end.toISOString())}`;
}

function obtenerDiaNombre(fechaStr) {
    const f = new Date(fechaStr);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[f.getDay()];
}

function cargarDatosEjemplo() {
    const d = new Date();
    // Obtener Miércoles anterior
    const day = d.getDay();
    const diff = (day >= 3) ? (day - 3) : (day + 4);
    const start = new Date(d);
    start.setDate(d.getDate() - diff);
    start.setHours(17, 0, 0, 0);
    
    const sem28 = start.toISOString();
    
    const d28 = [];
    let cur = new Date(start);
    for (let i = 0; i < 7; i++) {
        d28.push({ fecha: cur.toISOString() });
        cur.setDate(cur.getDate() + 1);
    }
    
    const r1 = {
        id: 'RP-2026-00001',
        nroDoc: 'RP-2026-00001',
        semanaInicio: sem28,
        descripcion: 'Pasajes semanales - Sistemas (Soporte Fundo)',
        area: 'SISTEMAS',
        estado: 'Pendiente',
        creada: new Date().toISOString(),
        supervisorId: 'alex.quintanilla',
        supervisorNombre: 'Alex Quintanilla',
        registro: { por: 'Alex Quintanilla', porId: 'alex.quintanilla', fecha: new Date().toISOString(), firma: '' },
        validacion: null,
        pago: null,
        operarios: [
            {
                codigo: '1001',
                nombre: 'Juan Pérez Ramos',
                dni: '44648673',
                cargo: 'Auxiliar de Soporte',
                firma: '',
                comprobantes: [],
                viajes: [
                    { fecha: d28[0].fecha, ruta: 'Salas', origen: 'Planta', tipo: 'Solo ida', monto: 5.0, motivo: 'Revisión Router Salas' },
                    { fecha: d28[2].fecha, ruta: 'Tate', origen: 'Planta', tipo: 'Ida y vuelta', monto: 16.0, motivo: 'Cambio Antena Tate' }
                ]
            },
            {
                codigo: '1002',
                nombre: 'José Ramírez Rojas',
                dni: '45112233',
                cargo: 'Asistente de Sistemas',
                firma: '',
                comprobantes: [],
                viajes: [
                    { fecha: d28[1].fecha, ruta: 'Santiago', origen: 'Planta', tipo: 'Ida y vuelta', monto: 20.0, motivo: 'Mantenimiento PC Santiago' }
                ]
            }
        ]
    };
    
    r1.total = r1.operarios.reduce((s, o) => s + o.viajes.reduce((sv, v) => sv + v.monto, 0), 0);
    state.rendiciones = [r1];
    guardar();
}

/* ===================== CARGA Y PERSISTENCIA ===================== */
function cargar() {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
        try {
            const parsed = JSON.parse(local);
            state = { ...structuredClone(DEFAULTS), ...parsed };
            // Filtrar formatos antiguos
            if (state.rendiciones) {
                state.rendiciones = state.rendiciones.filter(r => r && Array.isArray(r.operarios));
            }
        } catch (e) {
            state = structuredClone(DEFAULTS);
        }
    } else {
        state = structuredClone(DEFAULTS);
    }
    
    // Auto-seed si la base de datos está vacía
    if (!state.rendiciones || state.rendiciones.length === 0) {
        cargarDatosEjemplo();
    }
}

function guardar() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ===================== VISTAS Y NAVEGACIÓN ===================== */
function showPanel(id) {
    document.querySelectorAll('.view-panel').forEach(p => p.style.display = 'none');
    const panel = document.getElementById(id);
    if (panel) panel.style.display = 'block';
}

/* ===================== ACCIONES PORTAL ===================== */
function buscarPorDNI() {
    const dni = document.getElementById('input-dni').value.trim();
    if (!dni || dni.length < 8) {
        Swal.fire('Error', 'Ingrese un DNI válido de 8 dígitos.', 'warning');
        return;
    }
    
    // Buscar si existe el operario
    const op = state.operarios.find(o => String(o.dni) === String(dni));
    if (!op) {
        Swal.fire('No encontrado', 'No se encontró ningún trabajador registrado con el DNI ingresado.', 'error');
        return;
    }
    
    activeOperario = op;
    document.getElementById('op-profile-name').textContent = op.nombre;
    document.getElementById('op-profile-meta').textContent = `${op.cargo} · DNI ${op.dni}`;
    
    renderListadoSemanas();
    showPanel('view-op-dashboard');
}

function renderListadoSemanas() {
    const container = document.getElementById('lista-semanas-operario');
    
    // Buscar planillas donde el operario esté asignado
    const planillas = state.rendiciones.filter(r => 
        r.operarios && r.operarios.some(o => String(o.codigo) === String(activeOperario.codigo))
    );
    
    if (planillas.length === 0) {
        container.innerHTML = '<div class="empty-state-message">No tienes planillas asignadas de movilidad.</div>';
        return;
    }
    
    container.innerHTML = planillas.map(r => {
        const opData = r.operarios.find(o => String(o.codigo) === String(activeOperario.codigo));
        const firmado = !!opData.firma;
        const totalOp = opData.viajes ? opData.viajes.reduce((s, v) => s + v.monto, 0) : 0;
        
        let statusCol = '';
        let actionBtn = '';
        if (firmado) {
            statusCol = `<span style="color:var(--safco-teal); font-weight:700; font-size:0.85rem;"><i class="bx bx-badge-check"></i> Firmado</span>`;
            actionBtn = `<button class="btn-kiosk btn-kiosk-secondary" onclick="verDetallesViajes('${r.id}')" style="width:auto; padding:0.4rem 0.8rem; font-size:0.8rem;"><i class="bx bx-show"></i> Ver Viajes</button>`;
        } else {
            statusCol = `<span style="color:#f59e0b; font-weight:700; font-size:0.85rem;"><i class="bx bx-time"></i> Pendiente</span>`;
            actionBtn = `<button class="btn-kiosk btn-kiosk-warning" onclick="verDetallesViajes('${r.id}')" style="width:auto; padding:0.4rem 0.8rem; font-size:0.8rem;"><i class="bx bx-pen"></i> Firmar Semana</button>`;
        }
        
        return `
            <div class="week-card-item ${firmado ? 'signed' : 'pending'}">
                <div>
                    <strong style="display:block; color:var(--text-title); font-size:0.95rem;">Semana Nisira</strong>
                    <span style="font-size:0.8rem; color:var(--text-muted);">${rangoSemana(r.semanaInicio)}</span>
                    <span style="display:block; font-size:0.8rem; font-weight:600; color:var(--text-title); margin-top:0.25rem;">Total: ${soles(totalOp)}</span>
                </div>
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.4rem;">
                    ${statusCol}
                    ${actionBtn}
                </div>
            </div>
        `;
    }).join('');
}

function verDetallesViajes(planillaId) {
    const r = state.rendiciones.find(x => x.id === planillaId);
    if (!r) return;
    
    activePlanilla = r;
    const opData = r.operarios.find(o => String(o.codigo) === String(activeOperario.codigo));
    const viajes = opData.viajes || [];
    
    document.getElementById('lbl-detalle-semana').textContent = `Semana Nisira: ${rangoSemana(r.semanaInicio)}`;
    
    const tbody = document.getElementById('tbody-detalle-viajes');
    tbody.innerHTML = viajes.length ? viajes.map(v => {
        return `
            <tr>
                <td>${fmtCorto(v.fecha)}</td>
                <td><strong>${obtenerDiaNombre(v.fecha)}</strong></td>
                <td>${v.ruta}</td>
                <td>${v.tipo}</td>
                <td>${v.motivo}</td>
                <td style="text-align:right; font-weight:600;">${soles(v.monto)}</td>
            </tr>
        `;
    }).join('') : '<tr><td colspan="6" class="empty-state-message">No se registraron viajes de movilidad en esta semana.</td></tr>';
    
    const totalOp = viajes.reduce((s, v) => s + v.monto, 0);
    document.getElementById('lbl-detalle-total').textContent = soles(totalOp);
    
    // Checklist de conformidad de días
    const checklist = document.getElementById('kiosk-firma-dias-checklist');
    checklist.innerHTML = viajes.map(v => {
        const dateObj = new Date(v.fecha);
        const diasN = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const diaNombre = diasN[dateObj.getDay()];
        const checked = (!opData.firmaDias || opData.firmaDias.includes(v.fecha)) ? 'checked' : '';
        return `
            <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; cursor:pointer; padding:0.15rem 0;">
                <input type="checkbox" class="kiosk-chk-firma-dia" data-fecha="${v.fecha}" ${checked}>
                <span><strong>${diaNombre} ${fmtCorto(v.fecha)}</strong>: ${v.ruta} (${soles(v.monto)})</span>
            </label>
        `;
    }).join('');
    
    // Configurar Canvas
    setTimeout(() => {
        setupCanvas();
        if (opData.firma) {
            drawExistingFirma(opData.firma);
            document.getElementById('btn-save-firma-digital').disabled = true;
            document.getElementById('btn-save-firma-digital').innerHTML = '<i class="bx bx-check"></i> Ya Firmado';
        } else {
            document.getElementById('btn-save-firma-digital').disabled = false;
            document.getElementById('btn-save-firma-digital').innerHTML = '<i class="bx bx-check-double"></i> Confirmar Firma';
        }
    }, 100);
    
    showPanel('view-op-details');
}

/* ===================== CANVAS DE FIRMA DIGITAL ===================== */
function setupCanvas() {
    canvas = document.getElementById('firma-operario-pad');
    ctxF = canvas.getContext('2d');
    
    // Ajustar dimensiones internas al tamaño visual real
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    ctxF.strokeStyle = '#000000';
    ctxF.lineWidth = 3;
    ctxF.lineCap = 'round';
    ctxF.lineJoin = 'round';
    huboTrazo = false;
    
    // Limpiar canvas físicamente
    ctxF.clearRect(0, 0, canvas.width, canvas.height);
    
    // Eventos Mouse
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    
    // Eventos Táctiles (móviles/tabletas)
    canvas.addEventListener('touchstart', startDrawingTouch);
    canvas.addEventListener('touchmove', drawTouch);
    canvas.addEventListener('touchend', stopDrawing);
}

function startDrawing(e) {
    drawing = true;
    ctxF.beginPath();
    const rect = canvas.getBoundingClientRect();
    ctxF.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function draw(e) {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    ctxF.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctxF.stroke();
    huboTrazo = true;
}

function startDrawingTouch(e) {
    e.preventDefault();
    drawing = true;
    ctxF.beginPath();
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    ctxF.moveTo(t.clientX - rect.left, t.clientY - rect.top);
}

function drawTouch(e) {
    e.preventDefault();
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    ctxF.lineTo(t.clientX - rect.left, t.clientY - rect.top);
    ctxF.stroke();
    huboTrazo = true;
}

function stopDrawing() {
    drawing = false;
}

function clearCanvas() {
    if (!canvas) return;
    ctxF.clearRect(0, 0, canvas.width, canvas.height);
    huboTrazo = false;
    
    // Si ya estaba firmado y queremos limpiar, permitir rehabilitar firma
    const opData = activePlanilla.operarios.find(o => String(o.codigo) === String(activeOperario.codigo));
    if (opData.firma) {
        // Confirmar re-firma
        Swal.fire({
            title: '¿Limpiar firma registrada?',
            text: 'Esto borrará la firma guardada anteriormente en esta planilla.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, borrar',
            cancelButtonText: 'Cancelar'
        }).then(res => {
            if (res.isConfirmed) {
                opData.firma = '';
                guardar();
                document.getElementById('btn-save-firma-digital').disabled = false;
                document.getElementById('btn-save-firma-digital').innerHTML = '<i class="bx bx-check-double"></i> Confirmar Firma';
                setupCanvas();
            }
        });
    }
}

function drawExistingFirma(firmaDataURL) {
    if (!firmaDataURL) return;
    const img = new Image();
    img.src = firmaDataURL;
    img.onload = () => {
        ctxF.drawImage(img, 0, 0, canvas.width, canvas.height);
        huboTrazo = true;
    };
}

function guardarFirmaDigital() {
    if (!huboTrazo) {
        Swal.fire('Firma requerida', 'Por favor, dibuje su firma digital en el cuadro antes de confirmar.', 'warning');
        return;
    }
    
    // Validar días seleccionados
    const checkedBoxes = document.querySelectorAll('.kiosk-chk-firma-dia:checked');
    if (checkedBoxes.length === 0) {
        Swal.fire('Alerta', 'Debe seleccionar al menos un día para firmar la conformidad.', 'warning');
        return;
    }
    const selectedDias = Array.from(checkedBoxes).map(cb => cb.dataset.fecha);
    
    const dataURL = canvas.toDataURL('image/png');
    
    // Buscar operario en la planilla y actualizar
    const rIdx = state.rendiciones.findIndex(r => r.id === activePlanilla.id);
    if (rIdx >= 0) {
        const op = state.rendiciones[rIdx].operarios.find(o => String(o.codigo) === String(activeOperario.codigo));
        if (op) {
            op.firma = dataURL;
            op.firmaDias = selectedDias;
            // No se modifican comprobantes (responsabilidad exclusiva del supervisor)
            
            guardar();
            
            Swal.fire({
                title: 'Conformidad y Firma Guardada',
                text: 'Tu firma de pasajes ha sido registrada con éxito.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                renderListadoSemanas();
                showPanel('view-op-dashboard');
            });
        }
    }
}

/* ===================== INICIALIZACIÓN ===================== */
document.addEventListener('DOMContentLoaded', () => {
    cargar();
    
    // Enlazar botones
    document.getElementById('btn-search-dni').onclick = buscarPorDNI;
    
    document.getElementById('input-dni').onkeypress = (e) => {
        if (e.key === 'Enter') buscarPorDNI();
    };
    
    document.getElementById('btn-back-search').onclick = () => {
        document.getElementById('input-dni').value = '';
        activeOperario = null;
        showPanel('view-dni-search');
    };
    
    document.getElementById('btn-back-dashboard').onclick = () => {
        renderListadoSemanas();
        showPanel('view-op-dashboard');
    };
    
    document.getElementById('btn-clear-canvas').onclick = clearCanvas;
    document.getElementById('btn-save-firma-digital').onclick = guardarFirmaDigital;
});
