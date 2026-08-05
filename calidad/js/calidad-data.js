/**
 * calidad-data.js
 * Módulo de Gestión de Datos para el Área de Calidad de SAFCO
 * Persistencia en localStorage con soporte para:
 * - Personal Inspector/Auditor de Calidad
 * - Catálogo de Implementos de Calidad (Casacas de frío, Chalecos, Mandil, Tocas de tela)
 * - Entrega y Devolución Múltiple con Observaciones
 * - Historial con Trazabilidad Completa
 */

const CALIDAD_STORAGE_KEYS = {
    OPERARIOS: 'safco_calidad_personal_v1',
    HERRAMIENTAS: 'safco_calidad_implementos_v1',
    ASIGNACIONES_HERR: 'safco_calidad_asig_impl_v1',
    HISTORIAL_HERR: 'safco_calidad_hist_impl_v1',
    TIPOS_HERRAMIENTAS: 'safco_calidad_tipos_v1'
};

const DEFAULT_TIPOS_CALIDAD = [
    { id: 'TIPO-01', nombre: 'Casaca de Frío', prefijo: 'CAS', icono: '🧥' },
    { id: 'TIPO-02', nombre: 'Chaleco', prefijo: 'CHL', icono: '🦺' },
    { id: 'TIPO-03', nombre: 'Mandil', prefijo: 'MND', icono: '🥼' },
    { id: 'TIPO-04', nombre: 'Toca de Tela', prefijo: 'TOC', icono: '🧢' }
];

// --- MAESTRO DE PERSONAL DE CALIDAD SAFCO ---
const DEFAULT_PERSONAL_CALIDAD = [
    { id: 'CAL-01', dni: '45892011', nombre: 'María Fernández Quispe', cargo: 'Inspector de Calidad', area: 'Línea 1 - Selección' },
    { id: 'CAL-02', dni: '72349012', nombre: 'Roberto Gómez Vega', cargo: 'Auditor de BPM', area: 'Línea 1 - Empaque' },
    { id: 'CAL-03', dni: '41029384', nombre: 'Andrea Benítez Soto', cargo: 'Analista de Fito-Sanidad', area: 'Laboratorio' },
    { id: 'CAL-04', dni: '43920192', nombre: 'Javier Morales Ramos', cargo: 'Controlador de Calidad', area: 'Línea 2 - Selección' },
    { id: 'CAL-05', dni: '75839201', nombre: 'Carmen Mendoza Ruiz', cargo: 'Inspectora de Higiene', area: 'Planta General' },
    { id: 'CAL-06', dni: '46920182', nombre: 'Daniel Torres Flores', cargo: 'Auditor de Proceso', area: 'Línea 2 - Empaque' },
    { id: 'CAL-07', dni: '71920394', nombre: 'Sofía Paredes Castro', cargo: 'Analista de Frío y Maduración', area: 'Cámaras Frías' },
    { id: 'CAL-08', dni: '48291029', nombre: 'Martín Silva Azaña', cargo: 'Auditor de Embarque', area: 'Zona Despacho' }
];

function generateDefaultImplementosCalidad() {
    const impls = [];

    // Casacas de Frío (10)
    for (let i = 1; i <= 10; i++) {
        let est = 'Disponible';
        let desc = '';
        if (i <= 4) est = 'Asignado';
        else if (i === 9) { est = 'Deteriorada'; desc = 'Cierre frontal roto y rasgado en manga.'; }
        else if (i === 10) { est = 'Perdida'; desc = 'Reportada extraviada en turno noche.'; }

        impls.push({
            id: `CAS-${String(i).padStart(2, '0')}`,
            codigo: `Casaca de Frío ${i}`,
            tipo: 'Casaca de Frío',
            estado: est,
            descripcion: desc,
            diasCalibracion: Math.floor(Math.random() * 30) + 15,
            fechaRegistro: '2026-01-15'
        });
    }

    // Chalecos (10)
    for (let i = 1; i <= 10; i++) {
        let est = 'Disponible';
        let desc = '';
        if (i <= 5) est = 'Asignado';
        else if (i === 8) { est = 'Deteriorada'; desc = 'Cintas reflectivas desgastadas.'; }

        impls.push({
            id: `CHL-${String(i).padStart(2, '0')}`,
            codigo: `Chaleco ${i}`,
            tipo: 'Chaleco',
            estado: est,
            descripcion: desc,
            diasCalibracion: Math.floor(Math.random() * 30) + 20,
            fechaRegistro: '2026-01-15'
        });
    }

    // Mandil (10)
    for (let i = 1; i <= 10; i++) {
        let est = 'Disponible';
        let desc = '';
        if (i <= 4) est = 'Asignado';
        else if (i === 9) { est = 'Deteriorada'; desc = 'Manchas permanentes y jalón en amarra.'; }

        impls.push({
            id: `MND-${String(i).padStart(2, '0')}`,
            codigo: `Mandil ${i}`,
            tipo: 'Mandil',
            estado: est,
            descripcion: desc,
            diasCalibracion: Math.floor(Math.random() * 30) + 10,
            fechaRegistro: '2026-01-15'
        });
    }

    // Tocas de Tela (15)
    for (let i = 1; i <= 15; i++) {
        let est = 'Disponible';
        let desc = '';
        if (i <= 6) est = 'Asignado';
        else if (i === 14) { est = 'Deteriorada'; desc = 'Elástico vencido.'; }

        impls.push({
            id: `TOC-${String(i).padStart(2, '0')}`,
            codigo: `Toca de Tela ${i}`,
            tipo: 'Toca de Tela',
            estado: est,
            descripcion: desc,
            diasCalibracion: Math.floor(Math.random() * 40) + 10,
            fechaRegistro: '2026-01-15'
        });
    }

    return impls;
}

function generateDefaultAsignacionesCalidad() {
    return [
        { operarioId: 'CAL-01', herramientaCodigo: 'Casaca de Frío 1', tipo: 'Casaca de Frío', fechaEntrega: '07:00' },
        { operarioId: 'CAL-01', herramientaCodigo: 'Chaleco 1', tipo: 'Chaleco', fechaEntrega: '07:00' },
        { operarioId: 'CAL-01', herramientaCodigo: 'Toca de Tela 1', tipo: 'Toca de Tela', fechaEntrega: '07:05' },

        { operarioId: 'CAL-02', herramientaCodigo: 'Mandil 1', tipo: 'Mandil', fechaEntrega: '07:10' },
        { operarioId: 'CAL-02', herramientaCodigo: 'Chaleco 2', tipo: 'Chaleco', fechaEntrega: '07:10' },

        { operarioId: 'CAL-03', herramientaCodigo: 'Casaca de Frío 2', tipo: 'Casaca de Frío', fechaEntrega: '07:15' },
        { operarioId: 'CAL-03', herramientaCodigo: 'Mandil 2', tipo: 'Mandil', fechaEntrega: '07:15' },
        { operarioId: 'CAL-03', herramientaCodigo: 'Toca de Tela 2', tipo: 'Toca de Tela', fechaEntrega: '07:15' }
    ];
}

function generateDefaultHistorialCalidad() {
    return {
        'Casaca de Frío 1': [
            { operarioNombre: 'María Fernández Quispe', fecha: '2026-08-04', hora: '07:00', estado: 'En uso (Actual)', observacion: 'Entrega de equipo para turno mañana.' }
        ],
        'Chaleco 1': [
            { operarioNombre: 'María Fernández Quispe', fecha: '2026-08-04', hora: '07:00', estado: 'En uso (Actual)', observacion: 'Entrega regular.' }
        ],
        'Casaca de Frío 9': [
            { operarioNombre: 'Roberto Gómez Vega (Último Poseedor)', fecha: '2026-08-03', hora: '18:00', estado: '⚪ Entregada con deterioro', observacion: 'Cierre roto reportado.' }
        ],
        'Casaca de Frío 10': [
            { operarioNombre: 'Andrea Benítez Soto (Último Poseedor)', fecha: '2026-08-02', hora: '22:00', estado: '🔴 Reportada Perdida', observacion: 'Extravío en vestuario.' }
        ]
    };
}

// --- BASE DE DATOS LOCALSTORAGE CALIDAD ---
const CalidadDB = {
    getOperarios: function() {
        const data = localStorage.getItem(CALIDAD_STORAGE_KEYS.OPERARIOS);
        if (!data) {
            localStorage.setItem(CALIDAD_STORAGE_KEYS.OPERARIOS, JSON.stringify(DEFAULT_PERSONAL_CALIDAD));
            return DEFAULT_PERSONAL_CALIDAD;
        }
        return JSON.parse(data);
    },

    getHerramientas: function() {
        const data = localStorage.getItem(CALIDAD_STORAGE_KEYS.HERRAMIENTAS);
        if (!data) {
            const initial = generateDefaultImplementosCalidad();
            localStorage.setItem(CALIDAD_STORAGE_KEYS.HERRAMIENTAS, JSON.stringify(initial));
            return initial;
        }
        return JSON.parse(data);
    },

    getTiposHerramientas: function() {
        const data = localStorage.getItem(CALIDAD_STORAGE_KEYS.TIPOS_HERRAMIENTAS);
        if (!data) {
            localStorage.setItem(CALIDAD_STORAGE_KEYS.TIPOS_HERRAMIENTAS, JSON.stringify(DEFAULT_TIPOS_CALIDAD));
            return DEFAULT_TIPOS_CALIDAD;
        }
        return JSON.parse(data);
    },

    saveTiposHerramientas: function(tipos) {
        localStorage.setItem(CALIDAD_STORAGE_KEYS.TIPOS_HERRAMIENTAS, JSON.stringify(tipos));
    },

    addTipoHerramienta: function(nombre, prefijo, icono = '🔧') {
        const tipos = this.getTiposHerramientas();
        const existe = tipos.find(t => t.nombre.toLowerCase() === nombre.toLowerCase().trim());
        if (existe) return existe;

        const pref = (prefijo || nombre.substring(0, 3)).toUpperCase().trim();
        const nuevo = {
            id: `TIPO-${Date.now()}`,
            nombre: nombre.trim(),
            prefijo: pref,
            icono: icono || '🔧'
        };
        tipos.push(nuevo);
        this.saveTiposHerramientas(tipos);
        return nuevo;
    },

    saveHerramientas: function(herramientas) {
        localStorage.setItem(CALIDAD_STORAGE_KEYS.HERRAMIENTAS, JSON.stringify(herramientas));
    },

    addHerramientasBulk: function(tipo, cantidad, diasCalib = 30) {
        const herrs = this.getHerramientas();
        const mismoTipo = herrs.filter(h => h.tipo === tipo);
        let maxNum = 0;
        mismoTipo.forEach(h => {
            const match = h.codigo.match(/\d+/);
            if (match) {
                const val = parseInt(match[0]);
                if (val > maxNum) maxNum = val;
            }
        });

        const tipos = this.getTiposHerramientas();
        const tipoObj = tipos.find(t => t.nombre === tipo);
        const config = tipoObj ? { pref: tipoObj.prefijo, name: tipoObj.nombre } : { pref: (tipo.substring(0, 3)).toUpperCase(), name: tipo };
        const fechaActual = new Date().toISOString().split('T')[0];
        const nuevas = [];

        for (let i = 1; i <= cantidad; i++) {
            const num = maxNum + i;
            const nueva = {
                id: `${config.pref}-${String(num).padStart(2, '0')}`,
                codigo: `${config.name} ${num}`,
                tipo: tipo,
                estado: 'Disponible',
                descripcion: '',
                diasCalibracion: parseInt(diasCalib) || 30,
                fechaRegistro: fechaActual
            };
            nuevas.push(nueva);
            herrs.push(nueva);
        }

        this.saveHerramientas(herrs);
        return nuevas;
    },

    editarHerramienta: function(herrId, nuevoEstado, nuevaDescripcion) {
        const herrs = this.getHerramientas();
        const h = herrs.find(x => x.id === herrId);
        if (h) {
            h.estado = nuevoEstado;
            h.descripcion = nuevaDescripcion;
            this.saveHerramientas(herrs);
            return true;
        }
        return false;
    },

    activarHerramienta: function(herrId) {
        const herrs = this.getHerramientas();
        const h = herrs.find(x => x.id === herrId);
        if (h) {
            h.estado = 'Disponible';
            h.descripcion = 'Reactivado y disponible en almacén de Calidad.';
            this.saveHerramientas(herrs);
            return true;
        }
        return false;
    },

    getAsignacionesHerramientas: function() {
        const data = localStorage.getItem(CALIDAD_STORAGE_KEYS.ASIGNACIONES_HERR);
        if (!data) {
            const initial = generateDefaultAsignacionesCalidad();
            localStorage.setItem(CALIDAD_STORAGE_KEYS.ASIGNACIONES_HERR, JSON.stringify(initial));
            return initial;
        }
        return JSON.parse(data);
    },

    saveAsignacionesHerramientas: function(asig) {
        localStorage.setItem(CALIDAD_STORAGE_KEYS.ASIGNACIONES_HERR, JSON.stringify(asig));
    },

    entregarHerramientasMultiples: function(operarioId, codigosHerramientasArray) {
        const asigHerr = this.getAsignacionesHerramientas();
        const herrs = this.getHerramientas();
        const historial = this.getHistorialHerramientas();
        const operarios = this.getOperarios();
        const opObj = operarios.find(o => o.id === operarioId);

        const now = new Date();
        const horaStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        const fechaStr = now.toISOString().split('T')[0];

        codigosHerramientasArray.forEach(herrCod => {
            const herrObj = herrs.find(h => h.codigo === herrCod);
            if (herrObj && herrObj.estado === 'Disponible') {
                asigHerr.push({
                    operarioId: operarioId,
                    herramientaCodigo: herrCod,
                    tipo: herrObj.tipo,
                    fechaEntrega: horaStr
                });
                herrObj.estado = 'Asignado';

                if (!historial[herrCod]) historial[herrCod] = [];
                historial[herrCod].unshift({
                    operarioNombre: opObj ? opObj.nombre : 'Personal Calidad',
                    fecha: fechaStr,
                    hora: horaStr,
                    estado: 'En uso (Actual)',
                    observacion: 'Entrega regular a personal de Calidad.'
                });
            }
        });

        this.saveAsignacionesHerramientas(asigHerr);
        this.saveHerramientas(herrs);
        this.saveHistorialHerramientas(historial);
        return true;
    },

    devolverImplementosMultiples: function(operarioId, itemsDevolucionArray) {
        let asigHerr = this.getAsignacionesHerramientas();
        const herrs = this.getHerramientas();
        const historial = this.getHistorialHerramientas();
        const operarios = this.getOperarios();
        const opObj = operarios.find(o => o.id === operarioId);

        const now = new Date();
        const horaStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        const fechaStr = now.toISOString().split('T')[0];

        itemsDevolucionArray.forEach(item => {
            const herrCod = item.herramientaCodigo;
            const estadoDev = item.estadoDevolucion || 'Disponible';
            const obs = item.observacion || '';

            asigHerr = asigHerr.filter(a => !(a.operarioId === operarioId && a.herramientaCodigo === herrCod));

            const herrObj = herrs.find(h => h.codigo === herrCod);
            let estadoHistTxt = 'Devuelto al almacén de Calidad (Bueno)';

            if (herrObj) {
                if (estadoDev.includes('Deteriorada')) {
                    herrObj.estado = 'Deteriorada';
                    herrObj.descripcion = obs || 'Devuelto con deterioro reportado.';
                    estadoHistTxt = '⚪ Entregada con deterioro';
                } else if (estadoDev.includes('Perdida')) {
                    herrObj.estado = 'Perdida';
                    herrObj.descripcion = obs || 'Reportado perdido al devolver.';
                    estadoHistTxt = '🔴 Reportada Perdida';
                } else {
                    herrObj.estado = 'Disponible';
                    if (obs) herrObj.descripcion = obs;
                    estadoHistTxt = 'Devuelto al almacén (Bueno)';
                }
            }

            if (!historial[herrCod]) historial[herrCod] = [];

            const activeIndex = historial[herrCod].findIndex(h => h.estado.includes('En uso') || h.estado.includes('Actual'));

            if (activeIndex !== -1) {
                const regExistente = historial[herrCod][activeIndex];
                regExistente.estado = estadoHistTxt;
                regExistente.fecha = fechaStr;
                regExistente.hora = regExistente.hora.includes('-') ? regExistente.hora : `${regExistente.hora} - ${horaStr}`;
                if (obs) regExistente.observacion = obs;
            } else {
                historial[herrCod].unshift({
                    operarioNombre: opObj ? opObj.nombre : 'Personal Calidad',
                    fecha: fechaStr,
                    hora: horaStr,
                    estado: estadoHistTxt,
                    observacion: obs || 'Devolución procesada.'
                });
            }
        });

        this.saveAsignacionesHerramientas(asigHerr);
        this.saveHerramientas(herrs);
        this.saveHistorialHerramientas(historial);
        return true;
    },

    getHistorialHerramientas: function() {
        const data = localStorage.getItem(CALIDAD_STORAGE_KEYS.HISTORIAL_HERR);
        if (!data) {
            const initial = generateDefaultHistorialCalidad();
            localStorage.setItem(CALIDAD_STORAGE_KEYS.HISTORIAL_HERR, JSON.stringify(initial));
            return initial;
        }
        return JSON.parse(data);
    },

    saveHistorialHerramientas: function(hist) {
        localStorage.setItem(CALIDAD_STORAGE_KEYS.HISTORIAL_HERR, JSON.stringify(hist));
    }
};

window.CalidadDB = CalidadDB;
