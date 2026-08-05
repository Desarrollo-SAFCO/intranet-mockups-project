/**
 * produccion-data.js
 * Módulo de Gestión de Datos para el Área de Producción de SAFCO
 * Persistencia en localStorage con soporte para Asistencia, Asignación de Mesas,
 * Catálogo de Implementos (Estados: Asignado, Disponible, Perdida, Deteriorada),
 * Historial de Implementos con Trazabilidad y Observaciones.
 */

const STORAGE_KEYS = {
    MESAS: 'safco_produccion_mesas_v6',
    HERRAMIENTAS: 'safco_produccion_herramientas_v6',
    OPERARIOS: 'safco_produccion_operarios_v6',
    ASISTENCIA: 'safco_produccion_asistencia_v6',
    ASIGNACIONES_MESAS: 'safco_produccion_asig_mesas_v6',
    ASIGNACIONES_HERR: 'safco_produccion_asig_herr_v6',
    HISTORIAL_HERR: 'safco_produccion_hist_herr_v6',
    TIPOS_HERRAMIENTAS: 'safco_produccion_tipos_v6'
};

const DEFAULT_TIPOS_HERRAMIENTAS = [
    { id: 'TIPO-01', nombre: 'Tijera', prefijo: 'TIJ', icono: '✂️' },
    { id: 'TIPO-02', nombre: 'Pesa Patrón', prefijo: 'PES', icono: '⚖️' },
    { id: 'TIPO-03', nombre: 'Calibrador', prefijo: 'CAL', icono: '📐' }
];

// --- MAESTRO DE OPERARIOS SAFCO ---
const DEFAULT_OPERARIOS = [
    { id: 'OP-01', dni: '45892011', nombre: 'Ana García Mamani', cargo: 'Seleccionador', estadoDefault: 'En hora' },
    { id: 'OP-02', dni: '72349012', nombre: 'Carlos López Ramos', cargo: 'Seleccionador', estadoDefault: 'En hora' },
    { id: 'OP-03', dni: '41029384', nombre: 'Rosa Mamani Flores', cargo: 'Seleccionador', estadoDefault: 'En hora' },
    { id: 'OP-04', dni: '43920192', nombre: 'Juan Pérez Quispe', cargo: 'Seleccionador', estadoDefault: 'En hora' },
    { id: 'OP-05', dni: '75839201', nombre: 'Lucía Quispe Vega', cargo: 'Seleccionador', estadoDefault: 'En hora' },
    { id: 'OP-06', dni: '46920182', nombre: 'Pedro Silva Soto', cargo: 'Seleccionador', estadoDefault: 'En hora' },
    { id: 'OP-07', dni: '71920394', nombre: 'María Torres Calle', cargo: 'Seleccionador', estadoDefault: 'Tarde' },
    { id: 'OP-08', dni: '48291029', nombre: 'Diego Castro Rios', cargo: 'Seleccionador', estadoDefault: 'En hora' },
    { id: 'OP-09', dni: '73910293', nombre: 'Elena Ruiz Vargas', cargo: 'Seleccionador', estadoDefault: 'En hora' },
    { id: 'OP-10', dni: '42910294', nombre: 'Raúl Flores Mendoza', cargo: 'Seleccionador', estadoDefault: 'En hora' },

    { id: 'OP-11', dni: '76920192', nombre: 'Betty Cruz Huanca', cargo: 'Embalador', estadoDefault: 'En hora' },
    { id: 'OP-12', dni: '40920193', nombre: 'Mario Huanca Tito', cargo: 'Embalador', estadoDefault: 'En hora' },
    { id: 'OP-13', dni: '74829102', nombre: 'Silvia Ramos Paz', cargo: 'Embalador', estadoDefault: 'En hora' },
    { id: 'OP-14', dni: '49201920', nombre: 'Tomás Vera Gil', cargo: 'Embalador', estadoDefault: 'En hora' },
    { id: 'OP-15', dni: '78291029', nombre: 'Pilar Lagos Mora', cargo: 'Embalador', estadoDefault: 'En hora' },
    { id: 'OP-16', dni: '41920192', nombre: 'René Soto Rueda', cargo: 'Embalador', estadoDefault: 'En hora' },
    { id: 'OP-17', dni: '73920193', nombre: 'Claudia Paz Salas', cargo: 'Embalador', estadoDefault: 'En hora' },
    { id: 'OP-18', dni: '44820192', nombre: 'Andrés Gil Cano', cargo: 'Embalador', estadoDefault: 'En hora' },
    { id: 'OP-19', dni: '77291029', nombre: 'Fátima Reyes Vega', cargo: 'Embalador', estadoDefault: 'En hora' },
    { id: 'OP-20', dni: '42920193', nombre: 'Iván Mora Ríos', cargo: 'Embalador', estadoDefault: 'En hora' },
    { id: 'OP-21', dni: '71029384', nombre: 'Gloria Tito Pinto', cargo: 'Embalador', estadoDefault: 'En hora' },
    { id: 'OP-22', dni: '48291023', nombre: 'Sergio Rueda Lara', cargo: 'Embalador', estadoDefault: 'En hora' }
];

function generateDefaultAsistencia() {
    const asist = [];
    const ops = DEFAULT_OPERARIOS;
    const horaDefault = '07:00';

    const todayStr = new Date().toISOString().split('T')[0];
    const defAsig = generateDefaultAsignacionesMesas();
    const opToMesa = {};
    Object.keys(defAsig).forEach(mCode => {
        defAsig[mCode].forEach(item => {
            opToMesa[item.opId] = mCode;
        });
    });

    for (let i = 0; i < 16; i++) {
        const mesa = opToMesa[ops[i].id] || null;
        asist.push({
            id: ops[i].id,
            dni: ops[i].dni,
            nombre: ops[i].nombre,
            cargo: ops[i].cargo,
            estadoAsistencia: i === 6 ? 'Tarde' : 'En hora',
            fechaRegistro: todayStr,
            horaRegistro: i === 6 ? '07:22' : horaDefault,
            mesaAsignada: mesa,
            lineaAsignada: mesa ? 'Línea 1' : null
        });
    }
    return asist;
}

function generateDefaultMesas() {
    const mesas = [];
    let count = 1;
    for (let r = 1; r <= 2; r++) {
        for (let m = 1; m <= 10; m++) {
            mesas.push({
                id: `MESA-${Date.now()}-${count}`,
                codigo: `L1-R${r}-M${String(m).padStart(2, '0')}`,
                linea: 'Línea 1',
                riel: `Riel ${r}`,
                numeroMesa: m,
                capacidad: 3,
                estado: 'Activa'
            });
            count++;
        }
    }
    for (let r = 1; r <= 2; r++) {
        for (let m = 1; m <= 5; m++) {
            mesas.push({
                id: `MESA-${Date.now()}-${count}`,
                codigo: `L2-R${r}-M${String(m).padStart(2, '0')}`,
                linea: 'Línea 2',
                riel: `Riel ${r}`,
                numeroMesa: m,
                capacidad: 3,
                estado: 'Activa'
            });
            count++;
        }
    }
    return mesas;
}

function generateDefaultHerramientas() {
    const herrs = [];
    for (let i = 1; i <= 20; i++) {
        let est = 'Disponible';
        let desc = '';
        if (i <= 6) est = 'Asignado';
        else if (i === 18) { est = 'Deteriorada'; desc = 'Hojas melladas sin filo, requiere cambio.'; }
        else if (i === 19) { est = 'Perdida'; desc = 'Reportada extraviada por turno noche.'; }

        herrs.push({
            id: `TIJ-${String(i).padStart(2, '0')}`,
            codigo: `Tijera ${i}`,
            tipo: 'Tijera',
            estado: est,
            descripcion: desc,
            diasCalibracion: Math.floor(Math.random() * 20) + 10,
            fechaRegistro: '2026-01-15'
        });
    }
    for (let i = 1; i <= 10; i++) {
        let est = 'Disponible';
        let desc = '';
        if (i <= 4) est = 'Asignado';
        else if (i === 9) { est = 'Deteriorada'; desc = 'Masa fuera de tolerancia patrón.'; }

        herrs.push({
            id: `PES-${String(i).padStart(2, '0')}`,
            codigo: `Pesa Patrón ${i}`,
            tipo: 'Pesa Patrón',
            estado: est,
            
            descripcion: desc,
            diasCalibracion: Math.floor(Math.random() * 25) + 5,
            fechaRegistro: '2026-01-15'
        });
    }
    for (let i = 1; i <= 10; i++) {
        let est = 'Disponible';
        let desc = '';
        if (i <= 5) est = 'Asignado';
        else if (i === 10) { est = 'Deteriorada'; desc = 'Pantalla digital descalibrada.'; }

        herrs.push({
            id: `CAL-${String(i).padStart(2, '0')}`,
            codigo: `Calibrador ${i}`,
            tipo: 'Calibrador',
            estado: est,
            descripcion: desc,
            diasCalibracion: Math.floor(Math.random() * 30) + 2,
            fechaRegistro: '2026-01-15'
        });
    }
    return herrs;
}

function generateDefaultAsignacionesMesas() {
    return {
        'L1-R1-M01': [
            { opId: 'OP-01', labor: 'Seleccionador' },
            { opId: 'OP-11', labor: 'Embalador 1' },
            { opId: 'OP-12', labor: 'Embalador 2' }
        ],
        'L1-R1-M02': [
            { opId: 'OP-02', labor: 'Seleccionador' },
            { opId: 'OP-13', labor: 'Embalador 1' },
            { opId: 'OP-14', labor: 'Embalador 2' }
        ],
        'L1-R1-M03': [
            { opId: 'OP-03', labor: 'Seleccionador' },
            { opId: 'OP-15', labor: 'Embalador 1' }
        ],
        'L1-R1-M04': [
            { opId: 'OP-04', labor: 'Seleccionador' }
        ]
    };
}

function generateDefaultAsignacionesHerramientas() {
    return [
        { operarioId: 'OP-01', herramientaCodigo: 'Tijera 1', tipo: 'Tijera', fechaEntrega: '07:00' },
        { operarioId: 'OP-01', herramientaCodigo: 'Tijera 2', tipo: 'Tijera', fechaEntrega: '07:00' },
        { operarioId: 'OP-01', herramientaCodigo: 'Calibrador 1', tipo: 'Calibrador', fechaEntrega: '07:05' },
        
        { operarioId: 'OP-02', herramientaCodigo: 'Tijera 3', tipo: 'Tijera', fechaEntrega: '07:00' },
        { operarioId: 'OP-02', herramientaCodigo: 'Calibrador 2', tipo: 'Calibrador', fechaEntrega: '07:10' },

        { operarioId: 'OP-03', herramientaCodigo: 'Tijera 4', tipo: 'Tijera', fechaEntrega: '07:00' },
        { operarioId: 'OP-03', herramientaCodigo: 'Pesa Patrón 1', tipo: 'Pesa Patrón', fechaEntrega: '07:12' }
    ];
}

// Historial inicial con registros para Tijera 19 (Perdida) y Tijera 18 (Deteriorada)
function generateDefaultHistorialHerramientas() {
    return {
        'Tijera 1': [
            { operarioNombre: 'Ana García Mamani', fecha: '2026-08-03', hora: '07:00', estado: 'En uso (Actual)', observacion: 'Entrega inicial en turno mañana.' },
            { operarioNombre: 'María Torres Calle', fecha: '2026-08-02', hora: '07:00 - 15:00', estado: 'Devuelta (Bueno)', observacion: 'Retorno en óptimo estado.' }
        ],
        'Calibrador 1': [
            { operarioNombre: 'Ana García Mamani', fecha: '2026-08-03', hora: '07:05', estado: 'En uso (Actual)', observacion: 'Verificación diaria.' }
        ],
        'Tijera 19': [
            { operarioNombre: 'Carlos López Ramos (Último Poseedor)', fecha: '2026-08-02', hora: '22:30', estado: '🔴 Reportada Perdida al finalizar turno Noche', observacion: 'No fue entregada en caja al cierre de turno.' }
        ],
        'Tijera 18': [
            { operarioNombre: 'Lucía Quispe Vega (Último Poseedor)', fecha: '2026-08-02', hora: '18:15', estado: '⚪ Entregada con melladura / deterioro', observacion: 'Melladura por contacto con estructura de empaque.' },
            { operarioNombre: 'Juan Pérez Quispe', fecha: '2026-08-01', hora: '07:00 - 15:00', estado: 'Devuelta (Bueno)', observacion: 'Sin observaciones.' }
        ]
    };
}

// --- BASE DE DATOS LOCALSTORAGE ---
const ProduccionDB = {
    getOperarios: function() {
        const data = localStorage.getItem(STORAGE_KEYS.OPERARIOS);
        if (!data) {
            localStorage.setItem(STORAGE_KEYS.OPERARIOS, JSON.stringify(DEFAULT_OPERARIOS));
            return DEFAULT_OPERARIOS;
        }
        return JSON.parse(data);
    },

    getAsistencia: function() {
        const data = localStorage.getItem(STORAGE_KEYS.ASISTENCIA);
        if (!data) {
            const initial = generateDefaultAsistencia();
            localStorage.setItem(STORAGE_KEYS.ASISTENCIA, JSON.stringify(initial));
            return initial;
        }
        return JSON.parse(data);
    },

    saveAsistencia: function(asistList) {
        localStorage.setItem(STORAGE_KEYS.ASISTENCIA, JSON.stringify(asistList));
    },

    registrarAsistenciaPersona: function(opId, estadoHora = 'En hora', codigoMesa = null) {
        const asist = this.getAsistencia();
        const ops = this.getOperarios();
        const mesas = this.getMesas();

        let lineaMesa = null;
        if (codigoMesa) {
            const m = mesas.find(x => x.codigo === codigoMesa);
            if (m) lineaMesa = m.linea;
        }

        const existe = asist.find(a => a.id === opId);
        const now = new Date();
        const fechaStr = now.toISOString().split('T')[0];
        const horaStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

        if (existe) {
            existe.estadoAsistencia = estadoHora;
            existe.fechaRegistro = fechaStr;
            existe.horaRegistro = horaStr;
            if (codigoMesa) {
                existe.mesaAsignada = codigoMesa;
                existe.lineaAsignada = lineaMesa;
            }
        } else {
            const opObj = ops.find(o => o.id === opId);
            if (opObj) {
                asist.push({
                    id: opObj.id,
                    dni: opObj.dni,
                    nombre: opObj.nombre,
                    cargo: opObj.cargo,
                    estadoAsistencia: estadoHora,
                    fechaRegistro: fechaStr,
                    horaRegistro: horaStr,
                    mesaAsignada: codigoMesa,
                    lineaAsignada: lineaMesa
                });
            }
        }
        this.saveAsistencia(asist);
        return asist;
    },

    getMesas: function() {
        const data = localStorage.getItem(STORAGE_KEYS.MESAS);
        if (!data) {
            const initial = generateDefaultMesas();
            localStorage.setItem(STORAGE_KEYS.MESAS, JSON.stringify(initial));
            return initial;
        }
        return JSON.parse(data);
    },

    saveMesas: function(mesas) {
        localStorage.setItem(STORAGE_KEYS.MESAS, JSON.stringify(mesas));
    },

    addMesasBulk: function(linea, riel, cantidad, capacidad = 3) {
        const mesas = this.getMesas();
        const existentesRiel = mesas.filter(m => m.linea === linea && m.riel === riel);
        let maxNum = 0;
        existentesRiel.forEach(m => {
            if (m.numeroMesa > maxNum) maxNum = m.numeroMesa;
        });

        const nuevas = [];
        const lineaNum = linea.replace(/\D/g, '') || '1';
        const rielNum = riel.replace(/\D/g, '') || '1';

        for (let i = 1; i <= cantidad; i++) {
            const numMesa = maxNum + i;
            const codigo = `L${lineaNum}-R${rielNum}-M${String(numMesa).padStart(2, '0')}`;
            const nueva = {
                id: `MESA-${Date.now()}-${i}`,
                codigo: codigo,
                linea: linea,
                riel: riel,
                numeroMesa: numMesa,
                capacidad: parseInt(capacidad) || 3,
                estado: 'Activa'
            };
            nuevas.push(nueva);
            mesas.push(nueva);
        }

        this.saveMesas(mesas);
        return nuevas;
    },

    activarMesa: function(mesaId) {
        const mesas = this.getMesas();
        const m = mesas.find(x => x.id === mesaId);
        if (m) {
            m.estado = 'Activa';
            this.saveMesas(mesas);
            return true;
        }
        return false;
    },

    anularMesa: function(mesaId) {
        const mesas = this.getMesas();
        const m = mesas.find(x => x.id === mesaId);
        if (m) {
            m.estado = 'Inactiva';
            this.saveMesas(mesas);
            return true;
        }
        return false;
    },

    getAsignacionesMesas: function() {
        const data = localStorage.getItem(STORAGE_KEYS.ASIGNACIONES_MESAS);
        if (!data) {
            const initial = generateDefaultAsignacionesMesas();
            localStorage.setItem(STORAGE_KEYS.ASIGNACIONES_MESAS, JSON.stringify(initial));
            return initial;
        }
        return JSON.parse(data);
    },

    saveAsignacionesMesas: function(asig) {
        localStorage.setItem(STORAGE_KEYS.ASIGNACIONES_MESAS, JSON.stringify(asig));
    },

    guardarMesaIntegrantes: function(codigoMesa, arrayIntegrantes, estadoLlegada = 'En hora') {
        const asig = this.getAsignacionesMesas();
        const nuevosIds = arrayIntegrantes.map(x => x.opId);

        // Remover de cualquier otra mesa
        Object.keys(asig).forEach(mCode => {
            asig[mCode] = asig[mCode].filter(item => !nuevosIds.includes(item.opId));
        });

        asig[codigoMesa] = arrayIntegrantes;

        // REGISTRO AUTOMÁTICO DE ASISTENCIA al colocar operario en mesa (En hora / Tarde)
        arrayIntegrantes.forEach(item => {
            if (item.opId) {
                this.registrarAsistenciaPersona(item.opId, estadoLlegada, codigoMesa);
            }
        });

        this.saveAsignacionesMesas(asig);
        return asig;
    },

    // TRASLADO DE EQUIPO DE MESA COMPLETO
    trasladarEquipoMesa: function(origenCodigo, destinoCodigo) {
        const asig = this.getAsignacionesMesas();
        const integrantesOrigen = asig[origenCodigo] || [];

        if (integrantesOrigen.length === 0) return false;

        // Limpiar la mesa de destino y origen, luego asignar el equipo en destino
        asig[destinoCodigo] = [...integrantesOrigen];
        asig[origenCodigo] = [];

        // Actualizar el reporte de asistencia con la nueva mesa
        const asist = this.getAsistencia();
        const mesas = this.getMesas();
        const mDest = mesas.find(x => x.codigo === destinoCodigo);
        
        integrantesOrigen.forEach(item => {
            const a = asist.find(x => x.id === item.opId);
            if (a) {
                a.mesaAsignada = destinoCodigo;
                if (mDest) a.lineaAsignada = mDest.linea;
            }
        });
        this.saveAsistencia(asist);

        this.saveAsignacionesMesas(asig);
        return true;
    },

    limpiarMesa: function(codigoMesa) {
        const asig = this.getAsignacionesMesas();
        asig[codigoMesa] = [];
        this.saveAsignacionesMesas(asig);
        return asig;
    },

    finalizarProcesoLineaRiel: function(linea, riel) {
        const mesas = this.getMesas();
        const asig = this.getAsignacionesMesas();

        const mesasSub = mesas.filter(m => m.linea === linea && (riel === 'TODOS' || m.riel === riel));
        mesasSub.forEach(m => {
            asig[m.codigo] = [];
        });

        this.saveAsignacionesMesas(asig);
        return true;
    },

    getHerramientas: function() {
        const data = localStorage.getItem(STORAGE_KEYS.HERRAMIENTAS);
        if (!data) {
            const initial = generateDefaultHerramientas();
            localStorage.setItem(STORAGE_KEYS.HERRAMIENTAS, JSON.stringify(initial));
            return initial;
        }
        return JSON.parse(data);
    },

    getTiposHerramientas: function() {
        const data = localStorage.getItem(STORAGE_KEYS.TIPOS_HERRAMIENTAS);
        if (!data) {
            localStorage.setItem(STORAGE_KEYS.TIPOS_HERRAMIENTAS, JSON.stringify(DEFAULT_TIPOS_HERRAMIENTAS));
            return DEFAULT_TIPOS_HERRAMIENTAS;
        }
        return JSON.parse(data);
    },

    saveTiposHerramientas: function(tipos) {
        localStorage.setItem(STORAGE_KEYS.TIPOS_HERRAMIENTAS, JSON.stringify(tipos));
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
        localStorage.setItem(STORAGE_KEYS.HERRAMIENTAS, JSON.stringify(herramientas));
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
            h.descripcion = 'Reactivado y habilitado para uso.';
            this.saveHerramientas(herrs);
            return true;
        }
        return false;
    },

    getAsignacionesHerramientas: function() {
        const data = localStorage.getItem(STORAGE_KEYS.ASIGNACIONES_HERR);
        if (!data) {
            const initial = generateDefaultAsignacionesHerramientas();
            localStorage.setItem(STORAGE_KEYS.ASIGNACIONES_HERR, JSON.stringify(initial));
            return initial;
        }
        return JSON.parse(data);
    },

    saveAsignacionesHerramientas: function(asig) {
        localStorage.setItem(STORAGE_KEYS.ASIGNACIONES_HERR, JSON.stringify(asig));
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
                    operarioNombre: opObj ? opObj.nombre : 'Operario',
                    fecha: fechaStr,
                    hora: horaStr,
                    estado: 'En uso (Actual)',
                    observacion: 'Entrega regular a operario.'
                });
            }
        });

        this.saveAsignacionesHerramientas(asigHerr);
        this.saveHerramientas(herrs);
        this.saveHistorialHerramientas(historial);
        return true;
    },

    // DEVOLUCIÓN MÚLTIPLE DE IMPLEMENTOS CON OBSERVACIÓN POR CADA UNO
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

            // Remover de asignaciones activas
            asigHerr = asigHerr.filter(a => !(a.operarioId === operarioId && a.herramientaCodigo === herrCod));

            const herrObj = herrs.find(h => h.codigo === herrCod);
            let estadoHistTxt = 'Devuelto al almacén (Bueno)';

            if (herrObj) {
                if (estadoDev.includes('Deteriorada')) {
                    herrObj.estado = 'Deteriorada';
                    herrObj.descripcion = obs || 'Devuelto con daño / falla reportada.';
                    estadoHistTxt = '⚪ Entregada con deterioro / daño';
                } else if (estadoDev.includes('Perdida')) {
                    herrObj.estado = 'Perdida';
                    herrObj.descripcion = obs || 'Reportado perdido al devolver.';
                    estadoHistTxt = '🔴 Reportada Perdida / Extraviada';
                } else {
                    herrObj.estado = 'Disponible';
                    if (obs) herrObj.descripcion = obs;
                    estadoHistTxt = 'Devuelta al almacén (Bueno)';
                }
            }

            if (!historial[herrCod]) historial[herrCod] = [];

            // Buscar si ya existe una entrada activa de préstamo para este operario u operario genérico
            const activeIndex = historial[herrCod].findIndex(h => h.estado.includes('En uso') || h.estado.includes('Actual'));

            if (activeIndex !== -1) {
                // Actualizar la entrada existente sin duplicar la tarjeta del operario
                const regExistente = historial[herrCod][activeIndex];
                regExistente.estado = estadoHistTxt;
                regExistente.fecha = fechaStr;
                regExistente.hora = regExistente.hora.includes('-') ? regExistente.hora : `${regExistente.hora} - ${horaStr}`;
                if (obs) regExistente.observacion = obs;
            } else {
                // Si no existía entrada previa en uso, se agrega el registro consolidado de devolución
                historial[herrCod].unshift({
                    operarioNombre: opObj ? opObj.nombre : 'Operario',
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
        const data = localStorage.getItem(STORAGE_KEYS.HISTORIAL_HERR);
        if (!data) {
            const initial = generateDefaultHistorialHerramientas();
            localStorage.setItem(STORAGE_KEYS.HISTORIAL_HERR, JSON.stringify(initial));
            return initial;
        }
        return JSON.parse(data);
    },

    saveHistorialHerramientas: function(hist) {
        localStorage.setItem(STORAGE_KEYS.HISTORIAL_HERR, JSON.stringify(hist));
    }
};

window.ProduccionDB = ProduccionDB;
