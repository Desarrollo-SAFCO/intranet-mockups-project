/* rendicion-pasajes.js - Lógica de consolidación por semana y wizard paso a paso */

/* ===================== BASE DE DATOS Y ESTADO ===================== */
const STORAGE_KEY = 'SafcoPasajesState';

const DEFAULTS = {
  config: {
    empresa: 'Agrícola SAFCO Perú S.A.',
    ruc: '20515552872',
    motivoDefault: 'Traslado del personal a fundos',
    origen: 'Planta',
    tarifas: {
      'Salas': 5.0,
      'Parcona': 6.5,
      'Subtanjalla': 5.0,
      'Tate': 8.0,
      'Santiago': 10.0
    },
    correlativo: 0,
    areas: ['SISTEMAS', 'SEGURIDAD', 'FRIO Y DESPACHO', 'RECURSOS HUMANOS']
  },
  operarios: [
    // SISTEMAS
    { codigo: '1001', dni: '44648673', nombre: 'Juan Pérez Ramos', cargo: 'Auxiliar de Soporte', area: 'SISTEMAS' },
    { codigo: '1002', dni: '45112233', nombre: 'José Ramírez Rojas', cargo: 'Asistente de Sistemas', area: 'SISTEMAS' },
    // SEGURIDAD
    { codigo: '1003', dni: '46220011', nombre: 'Carlos Gómez Castro', cargo: 'Agente de Vigilancia', area: 'SEGURIDAD' },
    { codigo: '1004', dni: '47330099', nombre: 'Mario Vargas Peña', cargo: 'Supervisor de Seguridad', area: 'SEGURIDAD' },
    // FRIO Y DESPACHO
    { codigo: '1005', dni: '48440088', nombre: 'Pedro Quispe Loayza', cargo: 'Operario de Frío', area: 'FRIO Y DESPACHO' },
    { codigo: '1006', dni: '49550077', nombre: 'Sofía Mendoza Altamirano', cargo: 'Estibador de Despacho', area: 'FRIO Y DESPACHO' },
    // RECURSOS HUMANOS
    { codigo: '1007', dni: '44112244', nombre: 'María Choque Cruz', cargo: 'Asistente Social', area: 'RECURSOS HUMANOS' }
  ],
  personal: [
    { id: 'alex.quintanilla', nombre: 'Alex Quintanilla', rol: 'supervisor', area: 'SISTEMAS' },
    { id: 'ana.rodriguez', nombre: 'Ana Rodríguez', rol: 'supervisor', area: 'FRIO Y DESPACHO' },
    { id: 'carlos.mendoza', nombre: 'Carlos Mendoza', rol: 'jefe', area: 'SEGURIDAD' },
    { id: 'luis.zarat', nombre: 'Luis Zarat', rol: 'rrhh', area: 'RECURSOS HUMANOS' }
  ],
  rendiciones: [],
  sesion: { personaId: 'alex.quintanilla' }
};

let state = structuredClone(DEFAULTS);
let filtroRRHH = 'por_pagar';

// Filtros y ordenamiento en el Dashboard
let filtroSemanaVal = 'todos';
let filtroEstadoVal = 'todos';
let sortCostoDir = 'desc'; // 'desc' | 'asc'

// Estado del Asistente (Wizard)
let currentStep = 1;
let wizData = null; // { id, anio, semanaInicio, descripcion, operarios: [...] }
let activeOpViajesCodigo = null; // Operario siendo editado en el submodal de viajes
let docActualId = null;

/* ===================== INDEXEDDB (FOTOS Y YAPES) ===================== */
const DB_NAME = 'SafcoPasajesDB';
const STORE_NAME = 'comprobantes';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

function idbClear() {
    return openDB().then(db => {
        return new Promise(res => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).clear();
            tx.oncomplete = () => res(true);
        });
    });
}

const _imgSaved = new Map();

async function ensureImgs(r) {
    const db = await openDB();
    for (const op of r.operarios) {
        const key = `${r.id}_${op.codigo}`;
        if (!op.comprobantes || op.comprobantes.length === 0) {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(key);
            const data = await new Promise(res => {
                req.onsuccess = () => res(req.result);
                req.onerror = () => res(null);
            });
            if (data) {
                op.comprobantes = data;
            }
        }
    }
}

/* ===================== PERSISTENCIA LOCAL STORAGE ===================== */
async function guardar() {
    const db = await openDB();
    const cleanState = structuredClone(state);
    
    // Mover imágenes a IndexedDB para no saturar LocalStorage (máx 5MB)
    for (const r of cleanState.rendiciones) {
        if (r.operarios) {
            for (const op of r.operarios) {
                const key = `${r.id}_${op.codigo}`;
                if (op.comprobantes && op.comprobantes.length) {
                    const tx = db.transaction(STORE_NAME, 'readwrite');
                    const store = tx.objectStore(STORE_NAME);
                    store.put(op.comprobantes, key);
                    op.comprobantesCount = op.comprobantes.length;
                    op.comprobantes = []; // Vaciar en localStorage
                }
            }
        }
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanState));
}

function cargar() {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
        try {
            const parsed = JSON.parse(local);
            state = { ...structuredClone(DEFAULTS), ...parsed };
            // Filtrar planillas con formato antiguo incompatible
            if (state.rendiciones) {
                state.rendiciones = state.rendiciones.filter(r => r && Array.isArray(r.operarios));
            }
        } catch(e) {
            state = structuredClone(DEFAULTS);
        }
    } else {
        state = structuredClone(DEFAULTS);
    }
}

/* ===================== SESIÓN SIMULADA ===================== */
function persona() {
    return state.personal.find(p => p.id === state.sesion.personaId) || state.personal[0];
}

function rol() {
    return persona().role || persona().rol; 
}

function syncWithTopbarSession() {
    const sessionStr = localStorage.getItem("userSession");
    if (sessionStr) {
        try {
            const s = JSON.parse(sessionStr);
            if (s && s.username) {
                const match = state.personal.find(p => p.id.split('@')[0] === s.username.split('@')[0]);
                if (match) {
                    state.sesion.personaId = match.id;
                } else {
                    let rolSim = 'supervisor';
                    if (s.role === 'JEFE_AREA') rolSim = 'jefe';
                    if (s.role === 'RRHH') rolSim = 'rrhh';
                    
                    const nuevo = {
                        id: s.username,
                        nombre: s.fullName || s.username,
                        rol: rolSim,
                        area: s.area || 'SISTEMAS'
                    };
                    state.personal.push(nuevo);
                    state.sesion.personaId = nuevo.id;
                }
                guardar();
            }
        } catch(e) {
            console.warn("Error leyendo sesión del topbar:", e);
        }
    }
}

/* ===================== UTILIDADES Y FECHAS ===================== */
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function uid() { return 'u-' + Math.random().toString(36).substring(2, 9); }
function soles(n) { return 'S/ ' + (parseFloat(n) || 0).toFixed(2); }

function fmtCorto(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
}

function fmtDia(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
}

function fmtHora(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return fmtDia(iso) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function annio(iso) {
    return new Date(iso).getFullYear();
}

function inicioSemana(fecha) {
    const d = new Date(fecha);
    const day = d.getDay();
    const diff = (day >= 3 ? day - 3 : day + 4);
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function semanaARendir() {
    const enCurso = inicioSemana(new Date());
    enCurso.setDate(enCurso.getDate() - 7); // La semana inmediata anterior
    return enCurso.toISOString();
}

function rangoSemana(iso) {
    const ini = new Date(iso);
    const fin = new Date(iso);
    fin.setDate(fin.getDate() + 6);
    return `${fmtCorto(ini.toISOString())} al ${fmtCorto(fin.toISOString())}`;
}

function diasDeSemana(iso) {
    const out = [];
    const base = new Date(iso);
    const N = ['Mié', 'Jue', 'Vie', 'Sáb', 'Dom', 'Lun', 'Mar'];
    for (let i = 0; i < 7; i++) {
        const d = new Date(base);
        d.setDate(d.getDate() + i);
        d.setHours(12, 0, 0, 0);
        out.push({ fecha: d.toISOString(), lbl: N[i] });
    }
    return out;
}

function nuevoNroDoc(iso) {
    state.config.correlativo = (state.config.correlativo || 0) + 1;
    return 'RP-' + annio(iso) + '-' + String(state.config.correlativo).padStart(5, '0');
}

function obtenerSemanasNisira(year) {
    const weeks = [];
    let d = new Date(year, 0, 1);
    while (d.getDay() !== 3) {
        d.setDate(d.getDate() + 1);
    }
    let num = 1;
    while (d.getFullYear() === year) {
        const start = new Date(d);
        const end = new Date(d);
        end.setDate(end.getDate() + 6);
        weeks.push({
            num: num,
            start: start.toISOString(),
            end: end.toISOString(),
            lbl: `Semana ${String(num).padStart(2, '0')} (${fmtCorto(start.toISOString())} al ${fmtCorto(end.toISOString())})`
        });
        d.setDate(d.getDate() + 7);
        num++;
    }
    return weeks.reverse();
}

function diasYaRendidos(codigo, exceptRendId) {
    const s = new Set();
    state.rendiciones.filter(r => r.id !== exceptRendId && r.estado !== 'rechazada')
        .forEach(r => {
            if (r.operarios) {
                const op = r.operarios.find(o => String(o.codigo) === String(codigo));
                if (op && op.viajes) {
                    op.viajes.forEach(v => s.add(v.fecha.slice(0, 10)));
                }
            } else if (String(r.operarioCodigo) === String(codigo) && r.items) {
                r.items.forEach(i => s.add(i.fecha.slice(0, 10)));
            }
        });
    return s;
}

function flagsDeOperario(rId, op) {
    const f = [];
    const ya = diasYaRendidos(op.codigo, rId);
    const choque = (op.viajes || []).filter(v => ya.has(v.fecha.slice(0, 10))).map(v => fmtCorto(v.fecha));
    if (choque.length) {
        f.push('Doble pago: ya rindió el ' + choque.join(', '));
    }
    return f;
}

/* ===================== RENDER ELEMENTOS ===================== */
function render() {
    const p = persona();
    
    // Ocultar barra de simulación si es Alex Quintanilla directamente
    const syncBar = document.getElementById('role-sync-bar');
    if (syncBar) {
        syncBar.style.display = (p.id === 'alex.quintanilla') ? 'none' : 'flex';
    }
    
    // Mostrar/ocultar botón Nueva Rendición en la cabecera según rol de supervisor
    const btnNew = document.getElementById('btn-nueva-rendicion');
    if (btnNew) {
        btnNew.style.display = (rol() === 'supervisor') ? 'inline-flex' : 'none';
    }
    
    // Sincronizar UI de persona activa
    document.getElementById('displayPersonaName').textContent = p.nombre;
    document.getElementById('displayPersonaRolArea').textContent = `${cap(p.rol)} · ${p.area}`;
    
    const selR = document.getElementById('sel-rol');
    if (selR.options.length !== state.personal.length) {
        selR.innerHTML = state.personal.map(x => `<option value="${x.id}">${x.nombre} (${cap(x.rol)})</option>`).join('');
    }
    selR.value = p.id;
    
    renderNav();
    
    // Renderizar vistas correspondientes
    renderRegistrar(); 
    renderEnvios(); 
    renderValidar(); 
    renderRRHH(); 
    renderConfig();
}

const TABS = {
    supervisor: [
        { id: 'registrar', icon: 'bx-edit', title: 'Registrar Rendición' }
    ],
    jefe: [
        { id: 'validar', icon: 'bx-check-double', title: 'Validar Rendiciones' }
    ],
    rrhh: [
        { id: 'rrhh', icon: 'bx-wallet', title: 'RRHH · Pagos' }
    ]
};

function renderNav() {
    const userTabs = TABS[rol()] || TABS['supervisor'];
    const nav = document.getElementById('tabs-navigation');
    const actual = document.querySelector('.view-section.activa')?.id.replace('v-', '') || '';
    const validos = userTabs.map(t => t.id);
    
    if (userTabs.length <= 1) {
        nav.style.display = 'none';
    } else {
        nav.style.display = 'flex';
        nav.innerHTML = userTabs.map(t => {
            let badge = '';
            if (t.id === 'validar') {
                const count = state.rendiciones.filter(r => r.estado === 'enviada').length;
                if (count) badge = `<span class="badge-tab">${count}</span>`;
            }
            if (t.id === 'rrhh') {
                const count = state.rendiciones.filter(r => r.estado === 'validada').length;
                if (count) badge = `<span class="badge-tab">${count}</span>`;
            }
            return `<button class="tab-button" data-v="${t.id}"><i class='bx ${t.icon}'></i> ${t.title} ${badge}</button>`;
        }).join('');
        
        nav.querySelectorAll('.tab-button').forEach(b => {
            b.onclick = () => setView(b.dataset.v);
        });
    }
    
    if (!validos.includes(actual)) {
        setView(validos[0]);
    } else {
        marcarNav(actual);
    }
}

function setView(v) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('activa'));
    const el = document.getElementById('v-' + v);
    if (el) el.classList.add('activa');
    marcarNav(v);
    window.scrollTo(0, 0);
}

function marcarNav(v) {
    document.querySelectorAll('#tabs-navigation .tab-button').forEach(b => {
        b.classList.toggle('active', b.dataset.v === v);
    });
}

/* ===================== VISTA: REGISTRAR (Bandeja Planillas) ===================== */
function renderRegistrar() {
    // Rellenar filtro de semanas
    const fSem = document.getElementById('filtro-semana');
    if (fSem && !fSem.dataset.init) {
        const weeks = obtenerSemanasNisira(2026).concat(obtenerSemanasNisira(2025));
        fSem.innerHTML = '<option value="todos">Todas las semanas</option>' + weeks.map(w => `<option value="${w.start}">${w.lbl}</option>`).join('');
        fSem.dataset.init = '1';
        fSem.value = filtroSemanaVal;
        fSem.onchange = e => { filtroSemanaVal = e.target.value; renderRegistrar(); };
    }
    
    const fEst = document.getElementById('filtro-estado');
    if (fEst && !fEst.dataset.init) {
        fEst.dataset.init = '1';
        fEst.value = filtroEstadoVal;
        fEst.onchange = e => { filtroEstadoVal = e.target.value; renderRegistrar(); };
    }

    // Filtrar y ordenar consolidados
    let list = state.rendiciones.filter(r => r.area === persona().area);
    if (filtroSemanaVal !== 'todos') {
        list = list.filter(r => r.semanaInicio === filtroSemanaVal);
    }
    if (filtroEstadoVal !== 'todos') {
        list = list.filter(r => r.estado === filtroEstadoVal);
    }
    
    if (sortCostoDir) {
        list.sort((a, b) => {
            return sortCostoDir === 'asc' ? (a.total - b.total) : (b.total - a.total);
        });
    }

    const tbody = document.getElementById('tbody-consolidados');
    tbody.innerHTML = list.length ? list.map(r => {
        const estClass = {
            'Pendiente': 'pill-enviada',
            'Validada': 'pill-validada',
            'Pagada': 'pill-pagada',
            'Anulado': 'pill-rechazada'
        }[r.estado] || 'pill-enviada';
        
        const badgeFirma = r.registro && r.registro.firma ? '🗸 Supervisor' : '';
        const badgeJefe = r.validacion && r.validacion.firma ? '🗸 Jefatura' : '';
        
        let actionButtons = '';
        if (r.estado === 'Pendiente') {
            actionButtons = `
                <button class="btn-sync" onclick="abrirWizard('${r.id}')" title="Editar detalles, firmas y sustento"><i class="bx bx-edit"></i> Editar</button>
                <button class="btn-sync" style="background-color:var(--safco-teal-light); color:white; border-color:var(--safco-teal-light)" onclick="enviarAPension('${r.id}')"><i class="bx bx-paper-plane"></i> Enviar</button>
                <button class="btn-sync" style="color:var(--safco-red)" onclick="anularRendicion('${r.id}')">Anular</button>
            `;
        } else {
            actionButtons = `
                <button class="btn-sync" onclick="verDocumentoConsolidado('${r.id}')"><i class="bx bx-file"></i> Ver Documento</button>
                ${r.estado !== 'Pagada' && r.estado !== 'Anulado' ? `<button class="btn-sync" style="color:var(--safco-red)" onclick="anularRendicion('${r.id}')">Anular</button>` : ''}
            `;
        }

        return `
            <tr>
                <td data-label="ID"><strong>${r.nroDoc || r.id}</strong></td>
                <td data-label="Semana">${rangoSemana(r.semanaInicio)}</td>
                <td data-label="Descripción / Motivo">
                    <div style="font-weight:600">${r.descripcion}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted)">Creada por ${r.supervisorNombre || 'Supervisor'}</div>
                </td>
                <td data-label="Operarios">
                    <span style="background-color: var(--safco-teal-light); color: white; border-radius: 50%; width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; box-shadow: var(--shadow-sm);">
                        ${r.operarios.length}
                    </span>
                </td>
                <td data-label="Costo Total" style="font-weight:700">${soles(r.total)}</td>
                <td data-label="Estado">
                    <span class="pill-status ${estClass}">${r.estado}</span>
                    <span style="font-size:0.7rem; color:var(--text-muted); display:block">${badgeFirma} ${badgeJefe}</span>
                </td>
                <td data-label="Acciones" style="text-align:right">
                    <div style="display:flex; gap:0.25rem; justify-content:flex-end; flex-wrap:wrap">
                        ${actionButtons}
                    </div>
                </td>
            </tr>
        `;
    }).join('') : `<tr><td colspan="7" class="empty-state-message">No se encontraron planillas registradas. Presiona "Nueva Rendición" para empezar.</td></tr>`;
}

function enviarAPension(id) {
    const r = state.rendiciones.find(x => x.id === id);
    if (!r) return;
    
    if (!r.registro || !r.registro.firma) {
        Swal.fire('Error', 'Para enviar la planilla a aprobación, el Supervisor debe firmarla primero (Paso 3 del editor).', 'error');
        return;
    }
    
    Swal.fire({
        title: '¿Enviar Planilla a Aprobación?',
        text: 'La planilla será enviada al Jefe de Área. Ya no podrá modificar los operarios ni los viajes.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: 'var(--safco-teal)',
        confirmButtonText: 'Sí, enviar',
        cancelButtonText: 'Cancelar'
    }).then(res => {
        if (res.isConfirmed) {
            r.estado = 'enviada'; // Enviar a validación de Jefe
            guardar();
            render();
            Swal.fire('Enviada', 'Planilla enviada con éxito.', 'success');
        }
    });
}

function anularRendicion(id) {
    Swal.fire({
        title: '¿Anular Planilla?',
        text: 'Esta acción anulará por completo la rendición de pasajes y no se podrá procesar para pago.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--safco-red)',
        confirmButtonText: 'Sí, anular',
        cancelButtonText: 'Cancelar'
    }).then(res => {
        if (res.isConfirmed) {
            const r = state.rendiciones.find(x => x.id === id);
            if (r) {
                r.estado = 'Anulado';
                guardar();
                render();
                Swal.fire('Anulada', 'La planilla ha sido anulada.', 'success');
            }
        }
    });
}

/* ===================== LÓGICA DEL ASISTENTE (WIZARD) ===================== */
function autoCompletarDescripcionWiz() {
    const selW = document.getElementById('wiz-week');
    if (!selW) return;
    const optText = selW.options[selW.selectedIndex]?.text || '';
    const parts = optText.split(' ');
    // Obtener "Semana XX"
    const semPart = parts[0] + ' ' + (parts[1] || '').split('(')[0].trim();
    const area = persona().area;
    document.getElementById('wiz-desc').value = `Rendición de gastos ${semPart} - ${area}`;
}

function irAPasoWizard(step) {
    if (!wizData) return;
    
    if (step > 1) {
        const desc = document.getElementById('wiz-desc').value.trim();
        if (!desc) {
            Swal.fire('Alerta', 'Debe ingresar una descripción explicativa para la planilla en el Paso 1.', 'warning');
            mostrarPaso(1);
            return;
        }
        wizData.semanaInicio = document.getElementById('wiz-week').value;
        wizData.descripcion = desc;
    }
    
    if (step === 3) {
        if (wizData.operarios.length === 0) {
            Swal.fire('Alerta', 'Debe agregar al menos un operario en el Paso 2.', 'warning');
            mostrarPaso(2);
            return;
        }
        const incompleto = wizData.operarios.find(o => !o.viajes || o.viajes.length === 0);
        if (incompleto) {
            Swal.fire('Alerta', `El operario ${incompleto.nombre} no tiene viajes configurados. Defina sus viajes antes de ir a firmas.`, 'warning');
            mostrarPaso(2);
            return;
        }
    }
    
    if (currentStep === 1) {
        wizData.semanaInicio = document.getElementById('wiz-week').value;
        wizData.descripcion = document.getElementById('wiz-desc').value.trim();
    }
    
    mostrarPaso(step);
}

function abrirWizard(id = null) {
    currentStep = 1;
    if (id) {
        const r = state.rendiciones.find(x => x.id === id);
        wizData = structuredClone(r);
        document.getElementById('wizard-title').textContent = 'Editar Planilla de Pasajes Semanal';
    } else {
        const weeks = obtenerSemanasNisira(2026);
        const tempIso = weeks[0].start;
        const newId = nuevoNroDoc(tempIso);
        wizData = {
            id: newId,
            nroDoc: newId,
            anio: 2026,
            semanaInicio: tempIso,
            descripcion: '',
            operarios: [],
            total: 0,
            estado: 'Pendiente',
            area: persona().area,
            supervisorId: persona().id,
            supervisorNombre: persona().nombre,
            registro: { por: persona().nombre, porId: persona().id, fecha: '', firma: '' },
            validacion: null,
            pago: null
        };
        document.getElementById('wizard-title').textContent = 'Nueva Planilla de Pasajes Semanal';
    }
    
    document.getElementById('wiz-anio').value = wizData.anio;
    cargarSemanasWiz();
    document.getElementById('wiz-week').value = wizData.semanaInicio;
    
    if (!id) {
        autoCompletarDescripcionWiz();
    } else {
        document.getElementById('wiz-desc').value = wizData.descripcion;
    }
    
    mostrarPaso(1);
    document.getElementById('modal-wizard').classList.add('activa');
}

function cerrarWizard() {
    document.getElementById('modal-wizard').classList.remove('activa');
    wizData = null;
}

function cargarSemanasWiz() {
    const anio = parseInt(document.getElementById('wiz-anio').value) || 2026;
    const weeks = obtenerSemanasNisira(anio);
    const sel = document.getElementById('wiz-week');
    sel.innerHTML = weeks.map(w => `<option value="${w.start}">${w.lbl}</option>`).join('');
}

function mostrarPaso(step) {
    currentStep = step;
    
    for (let i = 1; i <= 3; i++) {
        const ind = document.getElementById('step-ind-' + i);
        if (ind) ind.classList.toggle('active', i === step);
        const sec = document.getElementById('wizard-step-' + i);
        if (sec) sec.classList.toggle('active', i === step);
    }
    
    const btnPrev = document.getElementById('wiz-btn-prev');
    const btnNext = document.getElementById('wiz-btn-next');
    
    if (step === 1) {
        btnPrev.style.display = 'none';
        btnNext.innerHTML = 'Siguiente <i class="bx bx-chevron-right"></i>';
    } else if (step === 2) {
        btnPrev.style.display = '';
        btnNext.innerHTML = 'Siguiente <i class="bx bx-chevron-right"></i>';
        renderPaso2();
    } else if (step === 3) {
        btnPrev.style.display = '';
        btnNext.innerHTML = 'Guardar y Finalizar <i class="bx bx-check-circle"></i>';
        renderPaso3();
    }
}

// Paso 2: Render de Operarios
function renderPaso2() {
    const tbody = document.getElementById('tbody-wiz-operarios');
    tbody.innerHTML = wizData.operarios.length ? wizData.operarios.map(op => {
        const viajesCount = op.viajes ? op.viajes.length : 0;
        const subtotal = op.viajes ? op.viajes.reduce((s, v) => s + v.monto, 0) : 0;
        
        let resumen = '';
        if (viajesCount === 0) {
            resumen = '<span style="color:var(--safco-red); font-weight:600">¡Sin configurar viajes!</span>';
        } else {
            const diasAbr = op.viajes.map(v => {
                const f = new Date(v.fecha);
                const diasN = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                return diasN[f.getDay()];
            }).join(', ');
            resumen = `<span style="font-weight:600">${viajesCount} viaje(s)</span> (${diasAbr})`;
        }
        
        // Banderas de alertas
        const alertFlags = flagsDeOperario(wizData.id, op).map(f => `<div class="flag-alert" style="font-size:0.7rem; padding:0.15rem; margin-top:2px"><i class="bx bx-error"></i> ${f}</div>`).join('');

        return `
            <tr>
                <td data-label="Operario"><strong>${op.nombre}</strong></td>
                <td data-label="DNI">${op.dni}</td>
                <td data-label="Cargo">${op.cargo}</td>
                <td data-label="Resumen de Viajes">
                    <div>${resumen}</div>
                    ${alertFlags}
                </td>
                <td data-label="Subtotal" style="text-align:center; font-weight:700">${soles(subtotal)}</td>
                <td data-label="Acción" style="text-align:right">
                    <button class="btn-sync" onclick="abrirSubmodalViajes('${op.codigo}')"><i class="bx bx-time"></i> Viajes</button>
                    <button class="btn-sync" style="color:var(--safco-red)" onclick="quitarOperarioWiz('${op.codigo}')">Quitar</button>
                </td>
            </tr>
        `;
    }).join('') : '<tr><td colspan="6" class="empty-state-message">No se han añadido operarios a esta planilla. Presione "Agregar Operario" en la parte superior.</td></tr>';
}

function quitarOperarioWiz(cod) {
    wizData.operarios = wizData.operarios.filter(o => String(o.codigo) !== String(cod));
    renderPaso2();
}

/* ===================== SUBMODAL: SELECCIONAR OPERARIOS ===================== */
function abrirSelectorOperarios() {
    const buscador = document.getElementById('wiz-search-op');
    buscador.value = '';
    
    renderSelectorOperarios();
    document.getElementById('modal-selector-ops').classList.add('activa');
    
    buscador.oninput = () => renderSelectorOperarios(buscador.value.trim());
}

function cerrarSelectorOperarios() {
    document.getElementById('modal-selector-ops').classList.remove('activa');
}

function renderSelectorOperarios(query = '') {
    const listDiv = document.getElementById('wiz-ops-select-list');
    const area = persona().area;
    
    // Filtrar operarios que pertenezcan al área y NO estén agregados ya en wizData
    const agregadosCodigos = new Set(wizData.operarios.map(o => String(o.codigo)));
    let lista = state.operarios.filter(o => o.area === area && !agregadosCodigos.has(String(o.codigo)));
    
    if (query) {
        const q = query.toLowerCase();
        lista = lista.filter(o => o.nombre.toLowerCase().includes(q) || o.dni.includes(q));
    }
    
    listDiv.innerHTML = lista.length ? lista.map(o => `
        <div class="operario-item" style="padding:0.4rem 0.5rem; margin-bottom:0.25rem" onclick="toggleCheckboxDiv('${o.codigo}')">
            <input type="checkbox" id="chk-sel-op-${o.codigo}" data-cod="${o.codigo}" style="margin-right:0.5rem" onclick="event.stopPropagation()">
            <div class="op-details">
                <span class="op-name" style="font-size:0.85rem">${o.nombre}</span>
                <span class="op-meta" style="font-size:0.75rem">DNI ${o.dni} · ${o.cargo}</span>
            </div>
        </div>
    `).join('') : '<div class="empty-state-message">No quedan operarios disponibles por añadir.</div>';
}

function toggleCheckboxDiv(cod) {
    const chk = document.getElementById('chk-sel-op-' + cod);
    if (chk) chk.checked = !chk.checked;
}

function agregarOperariosSeleccionados() {
    const checkboxes = document.querySelectorAll('#wiz-ops-select-list input[type="checkbox"]:checked');
    checkboxes.forEach(chk => {
        const cod = chk.dataset.cod;
        const o = state.operarios.find(x => String(x.codigo) === String(cod));
        if (o) {
            wizData.operarios.push({
                codigo: o.codigo,
                nombre: o.nombre,
                dni: o.dni,
                cargo: o.cargo,
                firma: '',
                comprobantes: [],
                viajes: []
            });
        }
    });
    
    cerrarSelectorOperarios();
    renderPaso2();
}

/* ===================== SUBMODAL: CONFIGURACIÓN DE VIAJES DIARIOS ===================== */
function abrirSubmodalViajes(opCod) {
    activeOpViajesCodigo = opCod;
    const op = wizData.operarios.find(o => String(o.codigo) === String(opCod));
    document.getElementById('viajes-op-title').textContent = `Configuración de Pasajes: ${op.nombre}`;
    
    // Cargar los 7 días de la semana activa
    const dias = diasDeSemana(wizData.semanaInicio);
    const tbody = document.getElementById('tbody-viajes-dias');
    
    tbody.innerHTML = dias.map((d, index) => {
        // Buscar si ya tiene viaje en este día
        const v = op.viajes ? op.viajes.find(x => x.fecha.slice(0, 10) === d.fecha.slice(0, 10)) : null;
        const viajó = !!v;
        
        const ruta = viajó ? v.ruta : 'Salas';
        const costo = viajó ? v.monto / (v.tipo === 'Ida y vuelta' ? 2 : 1) : 5.0; // guardamos el costo unitario por viaje
        const tipo = viajó ? v.tipo : 'Solo ida';
        const motivo = viajó ? v.motivo : state.config.motivoDefault;
        
        return `
            <tr id="viaje-row-${index}" data-fecha="${d.fecha}">
                <td data-label="¿Viajó?" style="text-align:center">
                    <input type="checkbox" id="v-viajo-${index}" ${viajó ? 'checked' : ''} onchange="toggleViajesInputs(${index})">
                </td>
                <td data-label="Día">
                    <div style="font-weight:600">${d.lbl}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted)">${fmtCorto(d.fecha)}</div>
                </td>
                <td data-label="Ruta Destino">
                    <input type="text" id="v-ruta-${index}" class="material-select-custom" value="${ruta}" ${!viajó ? 'disabled' : ''} style="padding:0.3rem 0.5rem; font-size:0.8rem">
                </td>
                <td data-label="Costo Viaje">
                    <input type="number" step="0.5" id="v-costo-${index}" class="material-select-custom" value="${costo}" ${!viajó ? 'disabled' : ''} style="padding:0.3rem 0.5rem; font-size:0.8rem">
                </td>
                <td data-label="Tipo">
                    <select id="v-tipo-${index}" class="material-select-custom" ${!viajó ? 'disabled' : ''} style="padding:0.3rem 0.5rem; font-size:0.8rem">
                        <option value="Solo ida" ${tipo === 'Solo ida' ? 'selected' : ''}>Solo ida</option>
                        <option value="Ida y vuelta" ${tipo === 'Ida y vuelta' ? 'selected' : ''}>Ida y vuelta</option>
                    </select>
                </td>
                <td data-label="Motivo / Tarea">
                    <input type="text" id="v-motivo-${index}" class="material-select-custom" value="${motivo}" ${!viajó ? 'disabled' : ''} style="padding:0.3rem 0.5rem; font-size:0.8rem">
                </td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('modal-viajes-op').classList.add('activa');
}

function toggleViajesInputs(index) {
    const checked = document.getElementById(`v-viajo-${index}`).checked;
    document.getElementById(`v-ruta-${index}`).disabled = !checked;
    document.getElementById(`v-costo-${index}`).disabled = !checked;
    document.getElementById(`v-tipo-${index}`).disabled = !checked;
    document.getElementById(`v-motivo-${index}`).disabled = !checked;
}

function cerrarSubmodalViajes() {
    document.getElementById('modal-viajes-op').classList.remove('activa');
    activeOpViajesCodigo = null;
}

function aplicarValoresDefectoViajes() {
    const ruta = document.getElementById('wiz-def-ruta').value.trim() || 'Salas';
    const costo = parseFloat(document.getElementById('wiz-def-cost').value) || 5.0;
    const tipo = document.getElementById('wiz-def-tipo').value;
    const motivo = document.getElementById('wiz-def-motivo').value.trim() || 'Traslado del personal';
    
    for (let i = 0; i < 7; i++) {
        const chk = document.getElementById(`v-viajo-${i}`);
        if (chk && chk.checked) {
            document.getElementById(`v-ruta-${i}`).value = ruta;
            document.getElementById(`v-costo-${i}`).value = costo;
            document.getElementById(`v-tipo-${i}`).value = tipo;
            document.getElementById(`v-motivo-${i}`).value = motivo;
        }
    }
}

function guardarSubmodalViajes() {
    const op = wizData.operarios.find(o => String(o.codigo) === String(activeOpViajesCodigo));
    const viajes = [];
    
    for (let i = 0; i < 7; i++) {
        const chk = document.getElementById(`v-viajo-${i}`);
        if (chk && chk.checked) {
            const row = document.getElementById(`viaje-row-${i}`);
            const fecha = row.dataset.fecha;
            const ruta = document.getElementById(`v-ruta-${i}`).value.trim() || 'Salas';
            const costoUnit = parseFloat(document.getElementById(`v-costo-${i}`).value) || 0;
            const tipo = document.getElementById(`v-tipo-${i}`).value;
            const motivo = document.getElementById(`v-motivo-${i}`).value.trim() || 'Traslado';
            
            const factor = tipo === 'Ida y vuelta' ? 2 : 1;
            viajes.push({
                fecha,
                ruta,
                origen: state.config.origen,
                tipo,
                monto: costoUnit * factor, // guardar costo final consolidado
                motivo
            });
        }
    }
    
    op.viajes = viajes;
    cerrarSubmodalViajes();
    renderPaso2();
}

/* ===================== PASO 3: FIRMAS Y SUSTENTO ===================== */
function renderPaso3() {
    document.getElementById('wiz-sup-name').textContent = wizData.supervisorNombre;
    
    // Status de firma de supervisor
    const divSupFirma = document.getElementById('wiz-sup-firma-status');
    if (wizData.registro && wizData.registro.firma) {
        divSupFirma.innerHTML = `<span style="color:var(--safco-teal); font-weight:600"><i class="bx bx-check-double"></i> Firmado el ${fmtHora(wizData.registro.fecha)}</span>`;
        document.getElementById('wiz-btn-firma-sup').textContent = 'Cambiar Firma';
    } else {
        divSupFirma.innerHTML = `<span style="color:var(--text-muted); font-style:italic">Planilla pendiente de firma del supervisor</span>`;
        document.getElementById('wiz-btn-firma-sup').textContent = 'Firmar Planilla';
    }
    
    // Lista de operarios para firmas y yapes
    const container = document.getElementById('wiz-ops-sustento-list');
    container.innerHTML = wizData.operarios.map(op => {
        const vbFirma = op.firma ? `<span style="color:var(--safco-teal); font-weight:600"><i class="bx bx-check"></i> Firmado</span>` : `<span style="color:var(--text-muted); font-style:italic">Pendiente</span>`;
        const countY = op.comprobantesCount || (op.comprobantes ? op.comprobantes.length : 0);
        const vbYape = countY ? `<span style="color:var(--safco-teal); font-weight:600"><i class="bx bx-image"></i> ${countY} Recibo(s)</span>` : `<span style="color:var(--text-muted); font-style:italic">Sin capturas</span>`;
        
        return `
            <div class="op-config-card" style="background-color:white;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem">
                    <div>
                        <strong style="color:var(--text-title); font-size:0.9rem">${op.nombre}</strong>
                        <span style="font-size:0.75rem; display:block; color:var(--text-muted)">DNI ${op.dni} · ${op.cargo} · Total: ${soles(op.viajes.reduce((s, v) => s + v.monto, 0))}</span>
                    </div>
                    <div style="display:flex; gap:0.4rem">
                        <button class="btn-sync" onclick="firmarOperarioWiz('${op.codigo}')"><i class="bx bx-pen"></i> Firma Operario</button>
                        <button class="btn-sync" onclick="subirComprobanteOperarioWiz('${op.codigo}')"><i class="bx bx-upload"></i> Recibo Yape</button>
                    </div>
                </div>
                <div style="display:flex; gap:1.5rem; font-size:0.8rem; border-top: 1px solid #f1f5f9; padding-top:0.35rem; margin-top:0.35rem">
                    <div>Firma: ${vbFirma}</div>
                    <div>Yape: ${vbYape}</div>
                </div>
            </div>
        `;
    }).join('');
}

async function firmarSupervisorWiz() {
    const firma = await pedirFirma('Firma del Supervisor / Coordinador');
    if (firma !== null) {
        wizData.registro = {
            por: persona().nombre,
            porId: persona().id,
            fecha: new Date().toISOString(),
            firma: firma
        };
        renderPaso3();
    }
}

async function firmarOperarioWiz(cod) {
    const op = wizData.operarios.find(o => String(o.codigo) === String(cod));
    const resultado = await pedirFirma('Firma del Operario: ' + op.nombre, op);
    if (resultado !== null) {
        if (typeof resultado === 'string') {
            op.firma = resultado;
            op.firmaDias = op.viajes ? op.viajes.map(v => v.fecha) : [];
        } else {
            op.firma = resultado.dataURL;
            op.firmaDias = resultado.dias;
        }
        renderPaso3();
    }
}

async function subirComprobanteOperarioWiz(cod) {
    const op = wizData.operarios.find(o => String(o.codigo) === String(cod));
    activeYapeOp = op;
    activeYapeSlots = generarSlotsYape(op);
    
    // Cargar fotos desde IndexedDB para pre-hidratar
    const db = await openDB();
    const key = `${wizData.id || 'temp'}_${op.codigo}`;
    if (!op.comprobantes || op.comprobantes.length === 0) {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        const data = await new Promise(res => {
            req.onsuccess = () => res(req.result);
            req.onerror = () => res(null);
        });
        if (data) op.comprobantes = data;
    }
    
    // Si era formato antiguo (simple array de strings), vaciar
    if (op.comprobantes && op.comprobantes.length > 0 && typeof op.comprobantes[0] === 'string') {
        op.comprobantes = [];
    }
    
    activeYapeComps = structuredClone(op.comprobantes || []);
    
    document.getElementById('comp-titulo').textContent = `Sustentos Yape: ${op.nombre}`;
    document.getElementById('comp-hint').textContent = `Sube los comprobantes para cada tramo de la semana.`;
    
    renderYapeSlots();
    document.getElementById('modal-comp').classList.add('activa');
}

function guardarBorradorWizard() {
    if (!wizData) return;
    
    if (currentStep === 1) {
        wizData.semanaInicio = document.getElementById('wiz-week').value;
        wizData.descripcion = document.getElementById('wiz-desc').value.trim();
    }
    
    if (!wizData.descripcion) {
        Swal.fire('Alerta', 'Debe ingresar una descripción para poder guardar la planilla.', 'warning');
        return;
    }
    
    // Calcular costo acumulado hasta el momento
    wizData.total = wizData.operarios.reduce((s, o) => s + (o.viajes ? o.viajes.reduce((sv, v) => sv + v.monto, 0) : 0), 0);
    
    const rIdx = state.rendiciones.findIndex(r => r.id === wizData.id);
    if (rIdx >= 0) {
        state.rendiciones[rIdx] = structuredClone(wizData);
    } else {
        state.rendiciones.push(structuredClone(wizData));
    }
    
    guardar();
    cerrarWizard();
    render();
    
    Swal.fire('Borrador Guardado', 'Se ha guardado el progreso de la planilla. Puedes continuar editándola en cualquier momento.', 'success');
}

/* Manejador de botones del wizard modal */
function configurarWizardBotones() {
    document.getElementById('btn-nueva-rendicion').onclick = () => abrirWizard();
    
    document.getElementById('step-ind-1').onclick = () => irAPasoWizard(1);
    document.getElementById('step-ind-2').onclick = () => irAPasoWizard(2);
    document.getElementById('step-ind-3').onclick = () => irAPasoWizard(3);
    
    document.getElementById('wiz-anio').onchange = () => {
        wizData.anio = parseInt(document.getElementById('wiz-anio').value) || 2026;
        cargarSemanasWiz();
        wizData.semanaInicio = document.getElementById('wiz-week').value;
        autoCompletarDescripcionWiz();
    };
    
    document.getElementById('wiz-week').onchange = () => {
        wizData.semanaInicio = document.getElementById('wiz-week').value;
        autoCompletarDescripcionWiz();
    };
    
    document.getElementById('wiz-btn-add-op').onclick = abrirSelectorOperarios;
    document.getElementById('wiz-btn-confirm-ops').onclick = agregarOperariosSeleccionados;
    document.getElementById('wiz-btn-firma-sup').onclick = firmarSupervisorWiz;
    
    document.getElementById('wiz-btn-save-draft').onclick = guardarBorradorWizard;
    document.getElementById('wiz-btn-cancel').onclick = cerrarWizard;
    
    document.getElementById('wiz-btn-prev').onclick = () => {
        if (currentStep > 1) mostrarPaso(currentStep - 1);
    };
    
    document.getElementById('wiz-btn-next').onclick = () => {
        if (currentStep === 1) {
            wizData.semanaInicio = document.getElementById('wiz-week').value;
            wizData.descripcion = document.getElementById('wiz-desc').value.trim();
            
            if (!wizData.descripcion) {
                Swal.fire('Alerta', 'Debe agregar una descripción explicativa para la planilla.', 'warning');
                return;
            }
            
            if (!wizData.id) {
                wizData.id = 'RP-' + annio(wizData.semanaInicio) + '-' + String(Date.now()).slice(-5);
                wizData.creada = new Date().toISOString();
            }
            mostrarPaso(2);
        } else if (currentStep === 2) {
            if (wizData.operarios.length === 0) {
                Swal.fire('Alerta', 'Debe agregar al menos un operario a la planilla.', 'warning');
                return;
            }
            const incompleto = wizData.operarios.find(o => !o.viajes || o.viajes.length === 0);
            if (incompleto) {
                Swal.fire('Alerta', `El operario ${incompleto.nombre} no tiene configurado ningún viaje. Por favor defina sus viajes o quítelo de la lista.`, 'warning');
                return;
            }
            mostrarPaso(3);
        } else if (currentStep === 3) {
            // Guardar planilla
            if (!wizData.registro || !wizData.registro.firma) {
                Swal.fire('Firma Requerida', 'El Supervisor debe firmar la planilla en el paso 3 antes de finalizar.', 'warning');
                return;
            }
            
            // Buscar si ya existe
            const rIdx = state.rendiciones.findIndex(r => r.id === wizData.id);
            wizData.total = wizData.operarios.reduce((s, o) => s + (o.viajes ? o.viajes.reduce((sv, v) => sv + v.monto, 0) : 0), 0);
            
            if (rIdx >= 0) {
                state.rendiciones[rIdx] = structuredClone(wizData);
            } else {
                state.rendiciones.push(structuredClone(wizData));
            }
            
            guardar();
            cerrarWizard();
            render();
            
            Swal.fire('Planilla Guardada', 'Se ha guardado la planilla de pasajes semanales en estado Pendiente. Recuerda que debes presionar "Enviar" en la bandeja para enviarla a aprobación.', 'success');
        }
    };
}

/* ===================== VISTA: MIS ENVIOS ===================== */
function renderEnvios() {
    const listDiv = document.getElementById('lista-envios');
    const supervisores = state.rendiciones.filter(r => r.area === persona().area && r.estado !== 'Pendiente');
    
    listDiv.innerHTML = supervisores.length ? supervisores.map(r => {
        return rendiCard(r, `
            <button class="btn-sync" onclick="verDocumentoConsolidado('${r.id}')"><i class="bx bx-file"></i> Ver PDF A4</button>
        `);
    }).join('') : '<div class="empty-state-message">No has enviado ninguna planilla a aprobación todavía.</div>';
}

/* ===================== VISTA: VALIDAR (JEFE DE ÁREA) ===================== */
function renderValidar() {
    const listDiv = document.getElementById('lista-validar');
    const pendientes = state.rendiciones.filter(r => r.estado === 'enviada');
    
    listDiv.innerHTML = pendientes.length ? pendientes.map(r => {
        return rendiCard(r, `
            <button class="btn-sync" style="background-color:var(--safco-teal); color:white; border-color:var(--safco-teal)" onclick="validarConsolidado('${r.id}')"><i class="bx bx-badge-check"></i> Firmar y Validar</button>
            <button class="btn-sync" style="color:var(--safco-red)" onclick="rechazarConsolidado('${r.id}')"><i class="bx bx-x"></i> Rechazar</button>
            <button class="btn-sync" onclick="verDocumentoConsolidado('${r.id}')"><i class="bx bx-file"></i> Auditoría A4</button>
        `);
    }).join('') : '<div class="empty-state-message">No tienes planillas pendientes de aprobación.</div>';
}

async function validarConsolidado(id) {
    const r = state.rendiciones.find(x => x.id === id);
    if (!r) return;
    
    const firma = await pedirFirma('Firma de Validación (Jefe de Área)');
    if (firma !== null) {
        r.estado = 'validada';
        r.validacion = {
            por: persona().nombre,
            porId: persona().id,
            rol: 'jefe',
            fecha: new Date().toISOString(),
            firma: firma
        };
        guardar();
        render();
        Swal.fire('Planilla Aprobada', 'Has validado el consolidado de pasajes. Se ha enviado al departamento de RRHH para su desembolso.', 'success');
    }
}

async function rechazarConsolidado(id) {
    const r = state.rendiciones.find(x => x.id === id);
    if (!r) return;
    
    const { value: nota } = await Swal.fire({
        title: 'Rechazar Planilla Semanal',
        input: 'textarea',
        inputLabel: 'Indique el motivo del rechazo para conocimiento del supervisor:',
        inputPlaceholder: 'Ej. Error en los costos del operario Juan Pérez...',
        showCancelButton: true,
        confirmButtonColor: 'var(--safco-red)',
        confirmButtonText: 'Confirmar Rechazo',
        cancelButtonText: 'Cancelar'
    });
    
    if (nota) {
        r.estado = 'Pendiente'; // Devuelve al supervisor en estado borrador
        r.rechazo = {
            por: persona().nombre,
            fecha: new Date().toISOString(),
            nota: nota
        };
        guardar();
        render();
        Swal.fire('Rechazada', 'La planilla ha sido devuelta al supervisor.', 'info');
    }
}

/* ===================== VISTA: RRHH & PAGOS ===================== */
function renderRRHH() {
    // Calcular KPIs
    const list = state.rendiciones;
    const pagadas = list.filter(r => r.estado === 'Pagada');
    const pendientes = list.filter(r => r.estado === 'validada');
    
    const totalDesembolsado = pagadas.reduce((s, r) => s + r.total, 0);
    const totalPendiente = pendientes.reduce((s, r) => s + r.total, 0);
    const countOps = list.reduce((s, r) => s + r.operarios.length, 0);
    
    const container = document.getElementById('kpis-container');
    if (container) {
        container.innerHTML = `
            <div class="kpi-card text-center">
                <div class="kpi-num" style="color:var(--safco-teal)">${soles(totalDesembolsado)}</div>
                <div class="kpi-lbl">Total Desembolsado (Histórico)</div>
            </div>
            <div class="kpi-card text-center">
                <div class="kpi-num" style="color:var(--safco-red)">${soles(totalPendiente)}</div>
                <div class="kpi-lbl">Fondos por Desembolsar</div>
            </div>
            <div class="kpi-card text-center">
                <div class="kpi-num">${countOps}</div>
                <div class="kpi-lbl">Pasajeros Consolidados</div>
            </div>
        `;
    }
    
    // Renderizar chips de filtro
    const chipsDiv = document.getElementById('chips-rrhh');
    if (chipsDiv) {
        if (!chipsDiv.dataset.init) {
            chipsDiv.dataset.init = '1';
            chipsDiv.innerHTML = `
                <button class="filter-chip ${filtroRRHH === 'por_pagar' ? 'active' : ''}" data-f="por_pagar">Pendientes de Pago (${pendientes.length})</button>
                <button class="filter-chip ${filtroRRHH === 'pagadas' ? 'active' : ''}" data-f="pagadas">Pagadas (${pagadas.length})</button>
                <button class="filter-chip ${filtroRRHH === 'todas' ? 'active' : ''}" data-f="todas">Todas</button>
            `;
            chipsDiv.onclick = e => {
                const chip = e.target.closest('.filter-chip');
                if (!chip) return;
                filtroRRHH = chip.dataset.f;
                chipsDiv.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c.dataset.f === filtroRRHH));
                renderRRHH();
            };
        }
    }
    
    // Filtrar lista
    let filtradas = [];
    if (filtroRRHH === 'por_pagar') {
        filtradas = pendientes;
    } else if (filtroRRHH === 'pagadas') {
        filtradas = pagadas;
    } else {
        filtradas = list.filter(r => r.estado === 'validada' || r.estado === 'Pagada');
    }
    
    const listDiv = document.getElementById('lista-rrhh');
    listDiv.innerHTML = filtradas.length ? filtradas.map(r => {
        let action = '';
        if (r.estado === 'validada') {
            action = `<button class="btn-sync" style="background-color:var(--safco-teal); color:white; border-color:var(--safco-teal)" onclick="pagarConsolidado('${r.id}')"><i class="bx bx-coin-stack"></i> Registrar Pago / Transferencia</button>`;
        }
        return rendiCard(r, `
            ${action}
            <button class="btn-sync" onclick="verDocumentoConsolidado('${r.id}')"><i class="bx bx-file"></i> Revisar Sustentos A4</button>
        `);
    }).join('') : '<div class="empty-state-message">No se encontraron planillas contables en esta bandeja.</div>';
}

function pagarConsolidado(id) {
    Swal.fire({
        title: '¿Confirmar Pago de Planilla?',
        text: 'Se registrará la salida de caja y transferencia bancaria de la planilla. Esta acción es irreversible.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--safco-teal)',
        confirmButtonText: 'Sí, pagar',
        cancelButtonText: 'Cancelar'
    }).then(res => {
        if (res.isConfirmed) {
            const r = state.rendiciones.find(x => x.id === id);
            if (r) {
                r.estado = 'Pagada';
                r.pago = {
                    por: persona().nombre,
                    porId: persona().id,
                    fecha: new Date().toISOString()
                };
                guardar();
                
                // Forzar reconstrucción de chips
                const chipsDiv = document.getElementById('chips-rrhh');
                if (chipsDiv) chipsDiv.dataset.init = '';
                
                render();
                Swal.fire('Pagada', 'La planilla ha sido marcada como Pagada con éxito.', 'success');
            }
        }
    });
}

/* Card Genérico de Planilla */
function rendiCard(r, acciones) {
    const pill = {
        'Pendiente': '<span class="pill-status pill-enviada"><i class="bx bx-time"></i> Pendiente</span>',
        'enviada': '<span class="pill-status pill-enviada"><i class="bx bx-paper-plane"></i> Enviada a Jefe</span>',
        'validada': '<span class="pill-status pill-validada"><i class="bx bx-check-circle"></i> Validada</span>',
        'Pagada': '<span class="pill-status pill-pagada"><i class="bx bx-coin-stack"></i> Pagada</span>',
        'Anulado': '<span class="pill-status pill-rechazada"><i class="bx bx-x-circle"></i> Anulada</span>'
    }[r.estado] || `<span class="pill-status pill-enviada">${r.estado}</span>`;
    
    let bita = '<div class="item-bitacora" style="margin-top:0.5rem; font-size:0.8rem; color:var(--text-muted)">';
    if (r.registro && r.registro.fecha) bita += `<div><i class="bx bx-user-plus"></i> Registró: ${r.registro.por} el ${fmtHora(r.registro.fecha)}</div>`;
    if (r.validacion && r.validacion.fecha) bita += `<div><i class="bx bx-badge-check"></i> Validó: ${r.validacion.por} el ${fmtHora(r.validacion.fecha)}</div>`;
    if (r.pago && r.pago.fecha) bita += `<div><i class="bx bx-credit-card"></i> Pagó: ${r.pago.por} el ${fmtHora(r.pago.fecha)}</div>`;
    if (r.rechazo && r.rechazo.fecha) bita += `<div style="color:var(--safco-red)"><i class="bx bx-x"></i> Rechazó: ${r.rechazo.por} el ${fmtHora(r.rechazo.fecha)} — Motivo: ${r.rechazo.nota}</div>`;
    bita += '</div>';

    return `
        <div class="rendicion-item-card state-${r.estado}" style="border-left-width: 4px; padding:1.25rem;">
            <div class="item-top-row" style="display:flex; justify-content:space-between; align-items:start; flex-wrap:wrap; gap:0.5rem">
                <div>
                    <h4 class="op-name" style="margin:0; font-size:1.05rem">${r.descripcion}</h4>
                    <span class="op-meta" style="font-size:0.8rem; color:var(--text-muted)">ID: ${r.nroDoc || r.id} · Semana: ${rangoSemana(r.semanaInicio)} · Área: ${r.area}</span>
                </div>
                <div style="text-align:right">
                    <span style="font-size:1.15rem; font-weight:700; color:var(--text-title); display:block">${soles(r.total)}</span>
                    ${pill}
                </div>
            </div>
            
            <div style="margin-top:0.75rem; border-top:1px solid #f1f5f9; padding-top:0.75rem">
                <strong style="font-size:0.85rem">Operarios Consolidados (${r.operarios.length}):</strong>
                <div style="display:flex; flex-wrap:wrap; gap:0.25rem; margin-top:0.35rem">
                    ${r.operarios.map(op => `<span class="badge-tab" style="margin:0; background-color:#f1f5f9; color:var(--text-title); border:none; font-size:0.75rem">${op.nombre} (${soles(op.viajes.reduce((s, v) => s + v.monto, 0))})</span>`).join('')}
                </div>
            </div>
            
            ${bita}
            
            <div class="item-actions-row no-print" style="margin-top:1rem; display:flex; gap:0.4rem; justify-content:flex-end; border-top:1px solid #f1f5f9; padding-top:0.75rem">
                ${acciones}
            </div>
        </div>
    `;
}

/* ===================== VISTA: CONFIGURACIÓN ===================== */
function renderConfig() {
    const o = document.getElementById('cfg-origen');
    if (o && document.activeElement !== o) o.value = state.config.origen || 'Planta';
    
    const m = document.getElementById('cfg-motivo');
    if (m && document.activeElement !== m) m.value = state.config.motivoDefault || 'Traslado del personal';
    
    // Listado de rutas
    const rList = document.getElementById('lista-rutas');
    if (rList) {
        rList.innerHTML = Object.entries(state.config.tarifas).map(([n, c]) => `
            <div class="config-row-item" style="display:flex; justify-content:space-between; align-items:center; padding:0.4rem 0.5rem; border-bottom:1px solid var(--border-color); font-size:0.85rem">
                <span><strong>${state.config.origen} → ${n}</strong></span>
                <div>
                    <span style="font-weight:600; margin-right:0.75rem">${soles(c)}</span>
                    <button class="btn-link" style="color:var(--safco-red)" onclick="borrarRuta('${n}')">Quitar</button>
                </div>
            </div>
        `).join('');
    }
    
    // Listado de áreas
    const aList = document.getElementById('lista-areas');
    if (aList) {
        aList.innerHTML = (state.config.areas || []).map(a => `
            <div class="config-row-item" style="display:flex; justify-content:space-between; align-items:center; padding:0.4rem 0.5rem; border-bottom:1px solid var(--border-color); font-size:0.85rem">
                <span>${a}</span>
                <button class="btn-link" style="color:var(--safco-red)" onclick="borrarArea('${a}')">Quitar</button>
            </div>
        `).join('');
    }
    
    // Listado de personal directivo
    const pList = document.getElementById('lista-personal');
    if (pList) {
        pList.innerHTML = state.personal.map(p => `
            <div class="config-row-item" style="display:flex; justify-content:space-between; align-items:center; padding:0.4rem 0.5rem; border-bottom:1px solid var(--border-color); font-size:0.85rem">
                <span><strong>${p.nombre}</strong> <span style="font-size:0.75rem; color:var(--text-muted)">(${cap(p.rol)} · ${p.area})</span></span>
                <button class="btn-link" style="color:var(--safco-red)" onclick="borrarPersonal('${p.id}')">Quitar</button>
            </div>
        `).join('');
    }
    
    // Listado maestro de operarios
    const opList = document.getElementById('lista-ops-cfg');
    if (opList) {
        opList.innerHTML = state.operarios.map(o => `
            <div class="config-row-item" style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem; border-bottom:1px solid var(--border-color); font-size:0.85rem">
                <div>
                    <strong>${o.nombre}</strong> <span style="font-size:0.75rem; color:var(--text-muted)">DNI ${o.dni} · ${o.cargo}</span>
                    <div style="font-size:0.7rem; color:var(--safco-teal)">Área: ${o.area}</div>
                </div>
                <button class="btn-link" style="color:var(--safco-red)" onclick="borrarOperario('${o.codigo}')">Quitar</button>
            </div>
        `).join('');
    }
}

function borrarRuta(n) {
    delete state.config.tarifas[n];
    guardar();
    render();
}

function borrarArea(a) {
    state.config.areas = (state.config.areas || []).filter(x => x !== a);
    guardar();
    render();
}

function borrarPersonal(id) {
    if (state.personal.filter(x => x.rol === 'jefe' || x.rol === 'rrhh').length <= 2 && id === state.sesion.personaId) {
        Swal.fire('Error', 'No puedes eliminarte a ti mismo si eres el único personal directivo restante.', 'error');
        return;
    }
    state.personal = state.personal.filter(x => x.id !== id);
    guardar();
    render();
}

function borrarOperario(cod) {
    state.operarios = state.operarios.filter(o => o.codigo !== cod);
    guardar();
    render();
}

function agregarRuta() {
    Swal.fire({
        title: 'Agregar Nueva Ruta',
        html: `
            <input id="swal-ruta-dest" class="swal2-input" placeholder="Destino (Ej. Parcona)">
            <input id="swal-ruta-monto" type="number" step="0.5" class="swal2-input" placeholder="Costo S/.">
        `,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: 'var(--safco-teal)',
        preConfirm: () => {
            const dest = document.getElementById('swal-ruta-dest').value.trim();
            const costo = parseFloat(document.getElementById('swal-ruta-monto').value);
            if (!dest) { Swal.showValidationMessage('Ingrese el destino'); return false; }
            if (isNaN(costo) || costo <= 0) { Swal.showValidationMessage('Ingrese un costo mayor a cero'); return false; }
            return { dest, costo };
        }
    }).then(res => {
        if (res.isConfirmed) {
            state.config.tarifas[res.value.dest] = res.value.costo;
            guardar();
            render();
            Swal.fire('Agregada', 'Ruta guardada con éxito.', 'success');
        }
    });
}

function agregarArea() {
    Swal.fire({
        title: 'Agregar Nueva Área',
        input: 'text',
        inputPlaceholder: 'Ej. EMPAQUE',
        confirmButtonText: 'Agregar',
        confirmButtonColor: 'var(--safco-teal)',
        preConfirm: (v) => {
            if (!v || !v.trim()) { Swal.showValidationMessage('Debe ingresar un nombre'); return false; }
            return v.trim().toUpperCase();
        }
    }).then(res => {
        if (res.isConfirmed) {
            state.config.areas.push(res.value);
            guardar();
            render();
            Swal.fire('Agregada', 'Área guardada.', 'success');
        }
    });
}

function agregarPersonal() {
    Swal.fire({
        title: 'Registrar Directivo',
        html: `
            <input id="swal-p-id" class="swal2-input" placeholder="User ID (ej. carlos.mendoza)">
            <input id="swal-p-nombre" class="swal2-input" placeholder="Nombre completo">
            <select id="swal-p-rol" class="swal2-input">
                <option value="supervisor">Supervisor</option>
                <option value="jefe">Jefe de Área</option>
                <option value="rrhh">Recursos Humanos (RRHH)</option>
            </select>
            <select id="swal-p-area" class="swal2-input">
                ${state.config.areas.map(a => `<option value="${a}">${a}</option>`).join('')}
            </select>
        `,
        confirmButtonColor: 'var(--safco-teal)',
        preConfirm: () => {
            const id = document.getElementById('swal-p-id').value.trim();
            const nombre = document.getElementById('swal-p-nombre').value.trim();
            const rol = document.getElementById('swal-p-rol').value;
            const area = document.getElementById('swal-p-area').value;
            if (!id || !nombre) { Swal.showValidationMessage('Complete todos los campos'); return false; }
            return { id, nombre, rol, area };
        }
    }).then(res => {
        if (res.isConfirmed) {
            state.personal.push(res.value);
            guardar();
            render();
            Swal.fire('Registrado', 'Personal administrativo registrado.', 'success');
        }
    });
}

function agregarOperario() {
    Swal.fire({
        title: 'Registrar Nuevo Operario',
        html: `
            <input id="swal-op-name" class="swal2-input" placeholder="Nombre Completo">
            <input id="swal-op-dni" class="swal2-input" placeholder="DNI (8 dígitos)">
            <input id="swal-op-cargo" class="swal2-input" placeholder="Cargo / Puesto (ej. Estibador)">
            <select id="swal-op-area" class="swal2-input">
                ${state.config.areas.map(a => `<option value="${a}">${a}</option>`).join('')}
            </select>
        `,
        confirmButtonColor: 'var(--safco-teal)',
        preConfirm: () => {
            const nombre = document.getElementById('swal-op-name').value.trim();
            const dni = document.getElementById('swal-op-dni').value.trim();
            const cargo = document.getElementById('swal-op-cargo').value.trim();
            const area = document.getElementById('swal-op-area').value;
            if (!nombre || !dni || !cargo) { Swal.showValidationMessage('Todos los campos son obligatorios'); return false; }
            if (dni.length !== 8 || isNaN(dni)) { Swal.showValidationMessage('El DNI debe tener 8 dígitos numéricos'); return false; }
            return { nombre, dni, cargo, area };
        }
    }).then(res => {
        if (res.isConfirmed) {
            const op = res.value;
            op.codigo = 'op-' + Date.now();
            state.operarios.push(op);
            guardar();
            render();
            Swal.fire('Registrado', 'Operario guardado en la base de datos.', 'success');
        }
    });
}

/* ===================== FIRMA DIGITAL (Canvas Pad) ===================== */
let firmaResolve = null, dibujando = false, ctxF = null, huboTrazo = false;

function initPad() {
    const c = document.getElementById('firma-pad');
    const r = c.getBoundingClientRect();
    c.width = r.width;
    c.height = r.height;
    
    ctxF = c.getContext('2d');
    ctxF.lineWidth = 2.4;
    ctxF.lineCap = 'round';
    ctxF.strokeStyle = '#15324f';
    huboTrazo = false;
    
    const pos = e => {
        const b = c.getBoundingClientRect();
        const t = e.touches ? e.touches[0] : e;
        return { x: t.clientX - b.left, y: t.clientY - b.top };
    };
    
    const start = e => {
        e.preventDefault();
        dibujando = true;
        huboTrazo = true;
        const p = pos(e);
        ctxF.beginPath();
        ctxF.moveTo(p.x, p.y);
    };
    
    const move = e => {
        if (!dibujando) return;
        e.preventDefault();
        const p = pos(e);
        ctxF.lineTo(p.x, p.y);
        ctxF.stroke();
    };
    
    const end = () => { dibujando = false; };
    
    c.onmousedown = start;
    c.onmousemove = move;
    window.onmouseup = end;
    
    c.ontouchstart = start;
    c.ontouchmove = move;
    c.ontouchend = end;
}

function pedirFirma(titulo, op = null) {
    return new Promise(res => {
        firmaResolve = res;
        document.getElementById('firma-titulo').textContent = titulo;
        
        const wrapper = document.getElementById('firma-dias-wrapper');
        const checklist = document.getElementById('firma-dias-checklist');
        
        if (op && op.viajes && op.viajes.length) {
            wrapper.style.display = 'block';
            checklist.innerHTML = op.viajes.map((v, i) => {
                const dateObj = new Date(v.fecha);
                const diasN = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const diaNombre = diasN[dateObj.getDay()];
                const checked = (!op.firmaDias || op.firmaDias.includes(v.fecha)) ? 'checked' : '';
                return `
                    <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.8rem; cursor:pointer; padding:0.15rem 0; font-family:'Inter',sans-serif;">
                        <input type="checkbox" class="chk-firma-dia" data-fecha="${v.fecha}" ${checked}>
                        <span><strong>${diaNombre} ${fmtCorto(v.fecha)}</strong>: ${v.ruta} (${soles(v.monto)})</span>
                    </label>
                `;
            }).join('');
        } else {
            wrapper.style.display = 'none';
            checklist.innerHTML = '';
        }
        
        document.getElementById('modal-firma').classList.add('activa');
        setTimeout(initPad, 50);
    });
}

function cerrarFirma(val) {
    document.getElementById('modal-firma').classList.remove('activa');
    if (firmaResolve) {
        firmaResolve(val);
        firmaResolve = null;
    }
}

/* ===================== CASILLEROS ESTRUCTURADOS YAPE ===================== */
let activeYapeOp = null;
let activeYapeSlots = [];
let activeYapeComps = [];

function generarSlotsYape(op) {
    const slots = [];
    if (!op.viajes) return slots;
    
    op.viajes.forEach(v => {
        const dateObj = new Date(v.fecha);
        const diasN = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const diaNombre = diasN[dateObj.getDay()];
        
        if (v.tipo === 'Ida y vuelta') {
            const montoMitad = v.monto / 2;
            slots.push({
                key: `${v.fecha}_ida`,
                label: `${diaNombre} ${fmtCorto(v.fecha)} (Ida)`,
                monto: montoMitad
            });
            slots.push({
                key: `${v.fecha}_vuelta`,
                label: `${diaNombre} ${fmtCorto(v.fecha)} (Vuelta)`,
                monto: montoMitad
            });
        } else {
            slots.push({
                key: `${v.fecha}_ida`,
                label: `${diaNombre} ${fmtCorto(v.fecha)} (Ida)`,
                monto: v.monto
            });
        }
    });
    return slots;
}

function renderYapeSlots() {
    const container = document.getElementById('comp-slots-container');
    if (!container) return;
    
    container.innerHTML = activeYapeSlots.map(s => {
        const comp = activeYapeComps.find(c => c.slotKey === s.key);
        const hasImg = !!(comp && comp.img);
        
        return `
            <div class="yape-slot-row" style="display:flex; justify-content:space-between; align-items:center; border: 1px solid var(--border-color); padding: 0.6rem 0.8rem; border-radius: var(--radius-sm); background-color: white; gap: 1rem; font-family:'Inter',sans-serif;">
                <div style="flex:1; text-align:left;">
                    <span style="font-size:0.85rem; font-weight:700; color:var(--text-title); display:block;">${s.label}</span>
                    <span style="font-size:0.75rem; color:var(--safco-teal-light); font-weight:600;">Importe: ${soles(s.monto)}</span>
                </div>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <div id="yape-preview-${s.key}" class="yape-preview-box" onclick="triggerYapeUpload('${s.key}')" style="width:55px; height:55px; border:2px dashed var(--border-color); border-radius: var(--radius-sm); display:flex; align-items:center; justify-content:center; cursor:pointer; overflow:hidden; background-color:#fafbfc; position:relative;">
                        ${hasImg ? `<img src="${comp.img}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="bx bx-plus" style="font-size:1.4rem; color:#94a3b8;"></i>`}
                    </div>
                    <input type="file" id="yape-file-${s.key}" accept="image/*" style="display:none" onchange="procesarFotoTramo('${s.key}', this)">
                    <button class="btn-sync" style="color:var(--safco-red); background:none; border:none; padding:0.25rem; display:${hasImg ? 'inline-block' : 'none'};" id="yape-btn-del-${s.key}" onclick="eliminarFotoTramo('${s.key}')">
                        <i class="bx bx-trash" style="font-size:1.25rem"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function triggerYapeUpload(slotKey) {
    const input = document.getElementById(`yape-file-${slotKey}`);
    if (input) input.click();
}

async function procesarFotoTramo(slotKey, input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const preview = document.getElementById(`yape-preview-${slotKey}`);
        const delBtn = document.getElementById(`yape-btn-del-${slotKey}`);
        
        if (preview) {
            preview.innerHTML = '<span style="font-size:0.65rem; color:var(--text-muted);">...</span>';
        }
        
        const dataUrl = await resizeImg(file);
        if (dataUrl) {
            const idx = activeYapeComps.findIndex(c => c.slotKey === slotKey);
            if (idx >= 0) {
                activeYapeComps[idx].img = dataUrl;
            } else {
                activeYapeComps.push({ slotKey, img: dataUrl });
            }
            
            if (preview) {
                preview.innerHTML = `<img src="${dataUrl}" style="width:100%; height:100%; object-fit:cover;">`;
            }
            if (delBtn) delBtn.style.display = 'inline-block';
        } else {
            Swal.fire('Error', 'No se pudo procesar la imagen.', 'error');
            renderYapeSlots();
        }
    }
    input.value = '';
}

function eliminarFotoTramo(slotKey) {
    activeYapeComps = activeYapeComps.filter(c => c.slotKey !== slotKey);
    
    const preview = document.getElementById(`yape-preview-${slotKey}`);
    if (preview) {
        preview.innerHTML = `<i class="bx bx-plus" style="font-size:1.4rem; color:#94a3b8;"></i>`;
    }
    
    const delBtn = document.getElementById(`yape-btn-del-${slotKey}`);
    if (delBtn) delBtn.style.display = 'none';
}

/* ===================== COMPROBANTES YAPE ===================== */
let compTemp = [], compResolve = null;

function resizeImg(file) {
    return new Promise(res => {
        const fr = new FileReader();
        fr.onload = () => {
            const img = new Image();
            img.onload = () => {
                const maxW = 900;
                const sc = Math.min(1, maxW / img.width);
                const w = Math.round(img.width * sc);
                const h = Math.round(img.height * sc);
                
                const cv = document.createElement('canvas');
                cv.width = w;
                cv.height = h;
                cv.getContext('2d').drawImage(img, 0, 0, w, h);
                try {
                    res(cv.toDataURL('image/jpeg', 0.72));
                } catch(e) {
                    res(null);
                }
            };
            img.onerror = () => res(null);
            img.src = fr.result;
        };
        fr.onerror = () => res(null);
        fr.readAsDataURL(file);
    });
}

function renderCompGrid(editable) {
    const g = document.getElementById('comp-grid');
    g.innerHTML = compTemp.length ? compTemp.map((src, i) => `
        <div class="comp-preview-thumb">
            <img src="${src}">
            ${editable ? `<div class="btn-remove-thumb" data-i="${i}">✕</div>` : ''}
        </div>`
    ).join('') : '<span class="empty-state-message">No hay imágenes adjuntas.</span>';
}

function pedirComprobantes(titulo, esperadas) {
    return new Promise(res => {
        compResolve = res;
        document.getElementById('comp-titulo').textContent = titulo;
        document.getElementById('comp-hint').textContent = `Se esperan ${esperadas} imagen(es) de comprobante Yape (una por viaje).`;
        document.getElementById('comp-file-label').style.display = '';
        document.getElementById('comp-listo').style.display = '';
        document.getElementById('comp-cancelar').textContent = 'Omitir / Guardar';
        renderCompGrid(true);
        document.getElementById('modal-comp').classList.add('activa');
    });
}

/* ===================== PDF PRINT & SHARE LOGIC ===================== */
async function generarPDFBlob(id) {
    const r = state.rendiciones.find(x => x.id === id);
    if (!r) return null;
    
    if (!(window.jspdf && window.html2canvas)) {
        Swal.fire('Error', 'No se cargaron las librerías PDF.', 'error');
        return null;
    }
    
    await ensureImgs(r);
    
    const cont = document.createElement('div');
    cont.id = 'pdf-render-temp';
    cont.style.cssText = 'position:fixed; left:-10000px; top:0; width:794px; background:#fff; font-family: Arial, sans-serif;';
    cont.innerHTML = docHTML(r);
    document.body.appendChild(cont);
    
    try {
        await Promise.all([...cont.querySelectorAll('img')].map(im => im.complete ? 0 : new Promise(res => { im.onload = im.onerror = res; })));
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pw = pdf.internal.pageSize.getWidth();
        const ph = pdf.internal.pageSize.getHeight();
        
        const sheets = cont.querySelectorAll('.sheet');
        for (let idx = 0; idx < sheets.length; idx++) {
            if (idx > 0) pdf.addPage();
            const canvas = await html2canvas(sheets[idx], { scale: 2, backgroundColor: '#fff' });
            let w = pw, h = canvas.height * (pw / canvas.width);
            if (h > ph) {
                const s = ph / h;
                w *= s;
                h = ph;
            }
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, w, h);
        }
        
        const nombre = `Planilla-Pasajes-${r.nroDoc || r.id}.pdf`;
        return { blob: pdf.output('blob'), nombre };
    } catch(e) {
        console.error("Generar PDF error:", e);
        return null;
    } finally {
        cont.remove();
    }
}

async function verDocumentoConsolidado(id) {
    Swal.fire({
        title: 'Generando Documento A4',
        text: 'Por favor espere mientras procesamos las firmas y comprobantes...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });
    
    const r = state.rendiciones.find(x => x.id === id);
    if (!r) { Swal.close(); return; }
    await ensureImgs(r);
    
    document.getElementById('doc-body').innerHTML = docHTML(r);
    docActualId = id;
    
    Swal.close();
    document.getElementById('modal-doc').classList.add('activa');
}

async function compartirPDF(id) {
    Swal.fire({
        title: 'Generando PDF',
        text: 'Procesando archivo...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });
    
    const res = await generarPDFBlob(id);
    Swal.close();
    
    if (!res) return;
    
    const file = new File([res.blob], res.nombre, { type: 'application/pdf' });
    try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Planilla de pasajes SAFCO', text: `Planilla N° ${id}` });
            return;
        }
    } catch(e) {}
    
    const a = document.createElement('a');
    a.href = URL.createObjectURL(res.blob);
    a.download = res.nombre;
    a.click();
}

async function imprimirDoc(id) {
    Swal.fire({
        title: 'Imprimiendo Documento',
        text: 'Generando el formato imprimible...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });
    
    const res = await generarPDFBlob(id);
    Swal.close();
    
    if (!res) return;
    
    const url = URL.createObjectURL(res.blob);
    const w = window.open(url, '_blank');
    if (!w) {
        const a = document.createElement('a');
        a.href = url;
        a.download = res.nombre;
        a.click();
    }
}

// Estructura HTML del Documento Oficial Imprimible (RG + CP por operario)
function docHTML(r) {
    const c = state.config;
    const logoSvg = `
        <svg viewBox="0 0 100 45" width="80" height="35" style="fill:#005c53">
            <rect x="5" y="5" width="20" height="35" rx="3" fill="#15324f" />
            <polygon points="15,10 28,22 15,35" fill="#528385"/>
            <text x="36" y="24" font-family="'Inter', sans-serif" font-size="15" font-weight="800" fill="#15324f">SAFCO</text>
            <text x="36" y="34" font-family="'Inter', sans-serif" font-size="8" font-weight="500" fill="#528385">AGRICOLA</text>
        </svg>
    `;
    
    const fRend = fmtDia(r.creada);
    
    // 1. Hoja 1: Rendición de Gastos de Movilidad (Consolidado de operarios)
    const opFilas = r.operarios.map((op, idx) => {
        const countViajes = op.viajes ? op.viajes.length : 0;
        const totalOp = op.viajes ? op.viajes.reduce((s, v) => s + v.monto, 0) : 0;
        return `
            <tr>
                <td style="text-align:center">${idx + 1}</td>
                <td>${op.nombre}</td>
                <td style="text-align:center">${op.dni}</td>
                <td>${op.cargo}</td>
                <td style="text-align:center">${countViajes}</td>
                <td style="text-align:right; font-weight:700">${soles(totalOp)}</td>
            </tr>
        `;
    }).join('');
    
    const bitacora = `
        <div class="sello-bitacora">
            <strong>CONTROL INTRA-MOCK</strong><br>
            REG: ${r.registro ? r.registro.por.slice(0, 10) : ''}<br>
            VAL: ${r.validacion ? r.validacion.por.slice(0, 10) : 'Pend.'}<br>
            PAG: ${r.pago ? r.pago.por.slice(0, 10) : 'Pend.'}
        </div>
    `;

    const firmaImg = f => f ? `<img src="${f}" style="max-height:44px; max-width:140px;">` : '<span style="color:#bbb; font-size:10px; font-style:italic">Firma no registrada</span>';

    const rgSheet = `
    <div class="sheet fmt-rg" style="padding:1.5cm 1.5cm; position:relative; min-height:29.7cm; width:21cm; box-sizing:border-box; background:white;">
        <div class="cp-head" style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #000; padding-bottom:10px; margin-bottom:15px">
            ${logoSvg}
            <div class="t" style="text-align:right">
                <div style="font-weight:800; font-size:13px; color:#15324f">${c.empresa.toUpperCase()}</div>
                <div style="font-size:10px; color:#528385">R.U.C. N° ${c.ruc}</div>
            </div>
        </div>
        
        <h3 style="text-align:center; font-weight:800; font-size:15px; margin: 1.5rem 0; color:#15324f; border:none; padding:0">RENDICIÓN DE GASTOS DE MOVILIDAD LOCAL</h3>
        
        <table class="cp-info" style="width:100%; font-size:11px; margin-bottom:1.5rem; border-collapse:collapse">
            <tr>
                <td style="width:18%; font-weight:700; padding:3px 0">RESPONSABLE:</td>
                <td style="border-bottom:1px solid #ddd; padding:3px 0">${r.supervisorNombre}</td>
                <td style="width:18%; font-weight:700; padding:3px 0; text-align:right">FECHA LIQ:</td>
                <td style="border-bottom:1px solid #ddd; padding:3px 0; padding-left:10px">${fRend}</td>
            </tr>
            <tr>
                <td style="font-weight:700; padding:3px 0">ÁREA / SECTOR:</td>
                <td style="border-bottom:1px solid #ddd; padding:3px 0">${r.area}</td>
                <td style="font-weight:700; padding:3px 0; text-align:right">DOCUMENTO:</td>
                <td style="border-bottom:1px solid #ddd; padding:3px 0; padding-left:10px; font-weight:700; color:#005c53">${r.nroDoc || r.id}</td>
            </tr>
            <tr>
                <td style="font-weight:700; padding:3px 0">DESCRIPCIÓN:</td>
                <td colspan="3" style="border-bottom:1px solid #ddd; padding:3px 0">${r.descripcion}</td>
            </tr>
        </table>
        
        <table class="cp-items" style="width:100%; border-collapse:collapse; font-size:10px; margin-bottom:2rem">
            <thead>
                <tr style="background-color:#e2e8f0; border-top:1px solid #000; border-bottom:1px solid #000">
                    <th style="padding:6px; text-align:center; width:40px">N°</th>
                    <th style="padding:6px">APELLIDOS Y NOMBRES</th>
                    <th style="padding:6px; text-align:center; width:90px">DNI</th>
                    <th style="padding:6px">CARGO</th>
                    <th style="padding:6px; text-align:center; width:70px">CANT. VIAJES</th>
                    <th style="padding:6px; text-align:right; width:80px">TOTAL GASTO</th>
                </tr>
            </thead>
            <tbody>
                ${opFilas}
                <tr style="border-top:1.5px solid #000; font-weight:700; background-color:#f1f5f9">
                    <td colspan="4" style="padding:8px">TOTAL GENERAL PLANILLA:</td>
                    <td style="padding:8px; text-align:center">${r.operarios.reduce((s, o) => s + (o.viajes ? o.viajes.length : 0), 0)}</td>
                    <td style="padding:8px; text-align:right; font-size:12px; color:#005c53">${soles(r.total)}</td>
                </tr>
            </tbody>
        </table>
        
        <div style="font-size:10px; margin-bottom:4rem">
            <strong>SON: </strong> ${enLetras(r.total)}
        </div>
        
        <div class="cp-firmas" style="display:flex; justify-content:space-between; margin-top:2.5rem; font-size:10px">
            <div class="fb" style="text-align:center; width:30%">
                <div class="box" style="height:50px; border-bottom:1px solid #000; display:flex; align-items:center; justify-content:center">${firmaImg(r.registro ? r.registro.firma : '')}</div>
                <div class="lnn" style="margin-top:5px; font-weight:700">SUPERVISOR / REGISTRO</div>
            </div>
            <div class="fb" style="text-align:center; width:30%">
                <div class="box" style="height:50px; border-bottom:1px solid #000; display:flex; align-items:center; justify-content:center">${firmaImg(r.validacion ? r.validacion.firma : '')}</div>
                <div class="lnn" style="margin-top:5px; font-weight:700">V°B° JEFATURA ÁREA</div>
            </div>
            <div class="fb" style="text-align:center; width:30%">
                <div class="box" style="height:50px; border-bottom:1px solid #000; display:flex; align-items:center; justify-content:center">${r.pago ? `<span style="color:#005c53; font-weight:700">PAGADO (CONTABILIDAD)</span>` : ''}</div>
                <div class="lnn" style="margin-top:5px; font-weight:700">V°B° RRHH / CONTABILIDAD</div>
            </div>
        </div>
        ${bitacora}
    </div>`;

    // 2. Páginas consecuentes: Comprobante de Movilidad por cada operario
    const cpSheets = r.operarios.map(op => {
        const rows = (op.viajes || []).map(v => `
            <tr>
                <td style="padding:5px; text-align:center; border:1px solid #ddd">${fmtDia(v.fecha)}</td>
                <td style="padding:5px; border:1px solid #ddd">${v.motivo}</td>
                <td style="padding:5px; border:1px solid #ddd">${v.origen}</td>
                <td style="padding:5px; border:1px solid #ddd">${v.ruta}</td>
                <td style="padding:5px; text-align:right; border:1px solid #ddd">${soles(v.monto)}</td>
            </tr>
        `).join('');
        
        const totalOp = op.viajes ? op.viajes.reduce((s, v) => s + v.monto, 0) : 0;
        
        return `
        <div class="sheet fmt-cp" style="padding:1.5cm 1.5cm; position:relative; min-height:29.7cm; width:21cm; box-sizing:border-box; background:white; page-break-before:always">
            <div class="cp-head" style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #000; padding-bottom:8px; margin-bottom:12px">
                ${logoSvg}
                <div style="text-align:right">
                    <div style="font-weight:700; font-size:11px; color:#15324f">${c.empresa.toUpperCase()}</div>
                    <div style="font-size:9px">R.U.C. N° ${c.ruc}</div>
                </div>
            </div>
            
            <h4 style="text-align:center; font-weight:800; font-size:12px; margin: 1rem 0; color:#15324f; border:none; padding:0">COMPROBANTE PARA REGISTRO DE MOVILIDAD LOCAL</h4>
            
            <table style="width:100%; font-size:10px; margin-bottom:1rem; border-collapse:collapse">
                <tr>
                    <td style="width:18%; font-weight:700; padding:2px 0">TRABAJADOR:</td>
                    <td style="border-bottom:1px solid #ddd; padding:2px 0">${op.nombre}</td>
                    <td style="width:18%; font-weight:700; padding:2px 0; text-align:right">FECHA REND:</td>
                    <td style="border-bottom:1px solid #ddd; padding:2px 0; padding-left:10px">${fRend}</td>
                </tr>
                <tr>
                    <td style="font-weight:700; padding:2px 0">DNI:</td>
                    <td style="border-bottom:1px solid #ddd; padding:2px 0">${op.dni}</td>
                    <td style="font-weight:700; padding:2px 0; text-align:right">PLANILLA N°:</td>
                    <td style="border-bottom:1px solid #ddd; padding:2px 0; padding-left:10px; font-weight:700; color:#005c53">${r.nroDoc || r.id}</td>
                </tr>
                <tr>
                    <td style="font-weight:700; padding:2px 0">CARGO / ÁREA:</td>
                    <td colspan="3" style="border-bottom:1px solid #ddd; padding:2px 0">${op.cargo} / ${r.area}</td>
                </tr>
            </table>
            
            <table style="width:100%; border-collapse:collapse; font-size:9px; margin-bottom:1rem">
                <thead>
                    <tr style="background-color:#e2e8f0; font-weight:700">
                        <th style="padding:5px; text-align:center; border:1px solid #aaa">FECHA</th>
                        <th style="padding:5px; border:1px solid #aaa">MOTIVO / TAREA REALIZADA</th>
                        <th style="padding:5px; border:1px solid #aaa">ORIGEN</th>
                        <th style="padding:5px; border:1px solid #aaa">DESTINO</th>
                        <th style="padding:5px; text-align:right; width:80px; border:1px solid #aaa">IMPORTE S/.</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                    <tr style="font-weight:700; background-color:#f1f5f9">
                        <td colspan="4" style="padding:6px; border:1px solid #aaa; text-align:right">TOTAL TRABAJADOR:</td>
                        <td style="padding:6px; border:1px solid #aaa; text-align:right; color:#005c53">${soles(totalOp)}</td>
                    </tr>
                </tbody>
            </table>
            
            <div style="font-size:9px; margin-bottom:3rem">
                <strong>SON: </strong> ${enLetras(totalOp)}
            </div>
            
            <div style="display:flex; justify-content:space-between; margin-top:2.5rem; font-size:9px">
                <div style="text-align:center; width:45%">
                    <div style="height:44px; border-bottom:1px solid #000; display:flex; align-items:center; justify-content:center">${firmaImg(r.validacion ? r.validacion.firma : '')}</div>
                    <div style="margin-top:5px; font-weight:700">V°B° JEFATURA</div>
                </div>
                <div style="text-align:center; width:45%">
                    <div style="height:44px; border-bottom:1px solid #000; display:flex; align-items:center; justify-content:center">${firmaImg(op.firma)}</div>
                    <div style="margin-top:5px; font-weight:700">FIRMA DEL COLABORADOR</div>
                </div>
            </div>
            
            <!-- Sustentos Yapes Anexos para este operario si existen -->
            ${op.comprobantes && op.comprobantes.length ? `
                <div style="margin-top:2rem; border-top: 1px dashed #aaa; padding-top:1rem">
                    <strong style="font-size:10px; display:block; margin-bottom:0.5rem">ANEXO CAPTURAS YAPE - SUSTENTOS:</strong>
                    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px">
                        ${op.comprobantes.map(c => {
                            const src = c && typeof c === 'object' ? c.img : c;
                            return src ? `<img src="${src}" style="width:100%; border:1px solid #ddd; max-height:220px; object-fit:contain">` : '';
                        }).join('')}
                    </div>
                </div>
            ` : ''}
        </div>`;
    }).join('');

    return rgSheet + cpSheets;
}

/* ===================== FORMATO IMPORTACIÓN / EXPORTACIÓN EXCEL ===================== */
function exportarExcel(soloSemana) {
    const rs = state.rendiciones.filter(r => r.area === persona().area);
    if (!rs.length) {
        Swal.fire('Info', 'No hay planillas de pasajes para exportar en este filtro.', 'info');
        return;
    }
    
    const est = { Pendiente: 'Pendiente', enviada: 'Enviada a Jefe', validada: 'Validada', Pagada: 'Pagada', Anulado: 'Anulado' };
    const cols = ['Planilla ID', 'Estado', 'Descripción', 'Supervisor', 'Área Nisira', 'Trabajador', 'DNI', 'Cargo', 'Fecha Viaje', 'Ruta Origen', 'Ruta Destino', 'Tipo de Viaje', 'Importe S/', 'Motivo Gasto', 'Fecha Creación'];
    const filas = [];
    
    rs.forEach(r => {
        r.operarios.forEach(op => {
            (op.viajes || []).forEach(v => {
                filas.push([
                    r.nroDoc || r.id, est[r.estado] || r.estado, r.descripcion, r.supervisorNombre, r.area,
                    op.nombre, op.dni, op.cargo, fmtDia(v.fecha), v.origen, v.ruta, v.tipo,
                    v.monto.toFixed(2), v.motivo, fmtDia(r.creada)
                ]);
            });
        });
    });
    
    const esc = v => {
        v = String(v == null ? '' : v);
        return /[";\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    };
    
    const csv = 'sep=;\r\n' + [cols].concat(filas).map(row => row.map(esc).join(';')).join('\r\n');
    const blob = new Blob([String.fromCharCode(0xFEFF) + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Consolidado_Pasajes_${persona().area}.csv`;
    a.click();
}

async function exportarJSON() {
    for (const r of state.rendiciones) {
        await ensureImgs(r);
    }
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Respaldo-Consolidados-Pasajes.json';
    a.click();
}

async function importarJSON(file) {
    const fr = new FileReader();
    fr.onload = async () => {
        try {
            const parsed = JSON.parse(fr.result);
            await idbClear();
            _imgSaved.clear();
            state = { ...structuredClone(DEFAULTS), ...parsed };
            guardar();
            render();
            Swal.fire('Importado', 'Copia de seguridad restaurada correctamente.', 'success');
        } catch(e) {
            Swal.fire('Error', 'Archivo no válido.', 'error');
        }
    };
    fr.readAsText(file);
}

function resetearBaseDatos() {
    Swal.fire({
        title: '¿Resetear Base de Datos?',
        text: 'Se eliminarán todos los registros y se restaurarán los valores iniciales de fábrica.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--safco-red)',
        confirmButtonText: 'Sí, resetear',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem(STORAGE_KEY);
            idbClear();
            _imgSaved.clear();
            state = structuredClone(DEFAULTS);
            render();
            Swal.fire('Reseteado', 'La base de datos fue restaurada.', 'success');
        }
    });
}

/* ===================== CARGA DE DATOS DEMO (CONSOLIDADOS SEMANALES) ===================== */
function cargarDatosEjemplo(silencioso) {
    const sup = state.personal.find(p => p.id === 'alex.quintanilla');
    const jefe = state.personal.find(p => p.rol === 'jefe');
    const rrhh = state.personal.find(p => p.rol === 'rrhh');
    
    const sem28 = '2026-07-08T17:00:00.000Z'; // Nisira W28
    const sem27 = '2026-07-01T17:00:00.000Z'; // Nisira W27
    
    const d28 = diasDeSemana(sem28);
    const d27 = diasDeSemana(sem27);
    
    // Firma demo
    const firmaDemo = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="46">
            <path d="M10,35 C30,10 60,40 100,15" fill="none" stroke="#15324f" stroke-width="2.5"/>
            <text x="25" y="42" font-family="cursive" font-size="10" fill="#528385">Demo Signature</text>
        </svg>`);

    const r1 = {
        id: 'RP-2026-00001',
        nroDoc: 'RP-2026-00001',
        semanaInicio: sem28,
        descripcion: 'Pasajes semanales - Sistemas (Soporte Fundo)',
        area: 'SISTEMAS',
        estado: 'Pendiente',
        creada: new Date().toISOString(),
        supervisorId: sup.id,
        supervisorNombre: sup.nombre,
        registro: { por: sup.nombre, porId: sup.id, fecha: new Date().toISOString(), firma: firmaDemo },
        validacion: null,
        pago: null,
        operarios: [
            {
                codigo: '1001',
                nombre: 'Juan Pérez Ramos',
                dni: '44648673',
                cargo: 'Auxiliar de Soporte',
                firma: firmaDemo,
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

    const r2 = {
        id: 'RP-2026-00002',
        nroDoc: 'RP-2026-00002',
        semanaInicio: sem27,
        descripcion: 'Pasajes de campo - Sistemas (Cableado Fundo)',
        area: 'SISTEMAS',
        estado: 'Pagada',
        creada: new Date(Date.now() - 7 * 24 * 36e5).toISOString(),
        supervisorId: sup.id,
        supervisorNombre: sup.nombre,
        registro: { por: sup.nombre, porId: sup.id, fecha: new Date().toISOString(), firma: firmaDemo },
        validacion: { por: jefe.nombre, porId: jefe.id, fecha: new Date().toISOString(), firma: firmaDemo },
        pago: { por: rrhh.nombre, porId: rrhh.id, fecha: new Date().toISOString() },
        operarios: [
            {
                codigo: '1001',
                nombre: 'Juan Pérez Ramos',
                dni: '44648673',
                cargo: 'Auxiliar de Soporte',
                firma: firmaDemo,
                comprobantes: [],
                viajes: [
                    { fecha: d27[0].fecha, ruta: 'Parcona', origen: 'Planta', tipo: 'Solo ida', monto: 6.5, motivo: 'Soporte Fibra Parcona' },
                    { fecha: d27[3].fecha, ruta: 'Santiago', origen: 'Planta', tipo: 'Solo ida', monto: 10.0, motivo: 'Revisión Switch' }
                ]
            }
        ]
    };
    
    r2.total = r2.operarios.reduce((s, o) => s + o.viajes.reduce((sv, v) => sv + v.monto, 0), 0);

    state.rendiciones = [r1, r2];
    guardar();
    render();
    
    if (!silencioso) {
        Swal.fire('Datos de Ejemplo Cargados', 'Se cargaron planillas consolidadas de prueba en el Dashboard.', 'success');
    }
}

/* ===================== INICIALIZACIÓN Y ENLACES DE EVENTOS ===================== */
function enlazarEventos() {
    document.getElementById('sel-rol').onchange = e => {
        state.sesion.personaId = e.target.value;
        guardar();
        render();
    };
    
    document.getElementById('btn-sync').onclick = () => {
        syncWithTopbarSession();
        render();
        Swal.fire('Sincronizado', 'Rol de sesión sincronizado con el topbar.', 'success');
    };
    
    document.getElementById('btn-xls-sem').onclick = () => exportarExcel(true);
    document.getElementById('btn-xls-all').onclick = () => exportarExcel(false);
    document.getElementById('btn-export').onclick = exportarJSON;
    document.getElementById('btn-import').onclick = () => document.getElementById('file-import').click();
    document.getElementById('file-import').onchange = e => {
        if (e.target.files[0]) importarJSON(e.target.files[0]);
    };
    document.getElementById('btn-reset').onclick = resetearBaseDatos;
    document.getElementById('btn-seed').onclick = () => cargarDatosEjemplo(false);
    
    // Canvas firmas
    document.getElementById('firma-limpiar').onclick = () => {
        const c = document.getElementById('firma-pad');
        ctxF.clearRect(0, 0, c.width, c.height);
        huboTrazo = false;
    };
    document.getElementById('firma-cancelar').onclick = () => cerrarFirma(null);
    document.getElementById('firma-omitir').onclick = () => {
        Swal.fire({
            title: '¿Confirmar sin firma?',
            text: 'La firma digital quedará en blanco para firma en físico.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar'
        }).then(res => {
            if (res.isConfirmed) cerrarFirma('');
        });
    };
    document.getElementById('firma-guardar').onclick = () => {
        if (!huboTrazo) {
            Swal.fire('Alerta', 'Dibuja la firma antes de guardar.', 'warning');
            return;
        }
        
        const wrapper = document.getElementById('firma-dias-wrapper');
        const dataURL = document.getElementById('firma-pad').toDataURL('image/png');
        
        if (wrapper && wrapper.style.display === 'block') {
            const checkedBoxes = document.querySelectorAll('.chk-firma-dia:checked');
            if (checkedBoxes.length === 0) {
                Swal.fire('Alerta', 'Debe seleccionar al menos un día para firmar la conformidad.', 'warning');
                return;
            }
            const dias = Array.from(checkedBoxes).map(cb => cb.dataset.fecha);
            cerrarFirma({ dataURL, dias });
        } else {
            cerrarFirma(dataURL);
        }
    };
    
    // Comprobantes
    document.getElementById('comp-listo').onclick = async () => {
        if (!activeYapeOp) return;
        
        activeYapeOp.comprobantes = activeYapeComps.slice();
        activeYapeOp.comprobantesCount = activeYapeComps.filter(c => !!c.img).length;
        
        const db = await openDB();
        const key = `${wizData.id || 'temp'}_${activeYapeOp.codigo}`;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(activeYapeOp.comprobantes, key);
        
        document.getElementById('modal-comp').classList.remove('activa');
        activeYapeOp = null;
        renderPaso3();
    };
    
    // Modal Documento
    document.getElementById('doc-cerrar').onclick = () => document.getElementById('modal-doc').classList.remove('activa');
    document.getElementById('doc-print').onclick = () => { if (docActualId) imprimirDoc(docActualId); };
    document.getElementById('doc-share').onclick = () => { if (docActualId) compartirPDF(docActualId); };
    
    // Ajustes generales
    document.getElementById('cfg-origen').onchange = e => {
        state.config.origen = e.target.value.trim() || 'Planta';
        guardar();
        render();
    };
    document.getElementById('cfg-motivo').onchange = e => {
        state.config.motivoDefault = e.target.value.trim() || 'Traslado del personal';
        guardar();
        render();
    };
    
    document.getElementById('cfg-add-ruta').onclick = agregarRuta;
    document.getElementById('cfg-add-op').onclick = agregarOperario;
    document.getElementById('cfg-add-area').onclick = agregarArea;
    document.getElementById('cfg-add-personal').onclick = agregarPersonal;
    
    // Ordenamiento por costo
    document.getElementById('btn-ordenar-costo').onclick = () => {
        sortCostoDir = sortCostoDir === 'desc' ? 'asc' : 'desc';
        document.getElementById('btn-ordenar-costo').innerHTML = `<i class="bx bx-sort-alt-2"></i> Costo: ${sortCostoDir === 'asc' ? 'Menor a Mayor' : 'Mayor a Menor'}`;
        renderRegistrar();
    };

    configurarWizardBotones();
}

// Convertidor de números a letras
function enLetras(num) {
    const enteros = Math.floor(num);
    const centavos = Math.round((num - enteros) * 100);
    return numeroALetras(enteros) + ' CON ' + String(centavos).padStart(2, '0') + '/100 SOLES';
}

function numeroALetras(n) {
    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const decenasDiez = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
    
    if (n === 0) return 'CERO';
    if (n === 100) return 'CIEN';
    
    let letras = '';
    if (n >= 1000) {
        const miles = Math.floor(n / 1000);
        n = n % 1000;
        letras += (miles === 1 ? 'MIL' : numeroALetras(miles) + ' MIL') + ' ';
    }
    if (n >= 100) {
        const c = Math.floor(n / 100);
        n = n % 100;
        letras += centenas[c] + ' ';
    }
    if (n >= 20) {
        const d = Math.floor(n / 10);
        n = n % 10;
        if (n === 0) {
            letras += decenasDiez[d];
        } else if (d === 2) {
            letras += 'VEINTI' + unidades[n];
        } else {
            letras += decenasDiez[d] + ' Y ' + unidades[n];
        }
    } else if (n >= 10) {
        letras += decenas[n - 10];
    } else if (n > 0) {
        letras += unidades[n];
    }
    return letras.trim();
}

// Arranque
document.addEventListener("DOMContentLoaded", () => {
    cargar();
    syncWithTopbarSession();
    
    if (!state.rendiciones || state.rendiciones.length === 0) {
        cargarDatosEjemplo(true);
    }
    
    enlazarEventos();
    render();
});
