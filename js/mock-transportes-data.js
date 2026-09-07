/**
 * SAFCO - Mock Data Store para Módulos de Transporte y Garita
 * Sincronización en tiempo real mediante localStorage
 */

const STORAGE_KEY_CABECERAS = 'SAFCO_TRANSPORTES_CABECERAS_V1';
const STORAGE_KEY_PROGRAMACIONES = 'SAFCO_TRANSPORTES_PROGRAMACIONES_V3';
const STORAGE_KEY_COLABORADORES = 'SAFCO_TRANSPORTES_COLABORADORES_V1';
const STORAGE_KEY_VEHICULOS = 'SAFCO_TRANSPORTES_VEHICULOS_V1';
const STORAGE_KEY_RUTAS = 'SAFCO_TRANSPORTES_RUTAS_V2';
const STORAGE_KEY_CAMPANAS = 'SAFCO_TRANSPORTES_CAMPANAS_V1';
const STORAGE_KEY_TRANSPORTISTAS = 'SAFCO_TRANSPORTES_TRANSPORTISTAS_V1';

// Base de datos de Campañas
const DEFAULT_CAMPANAS = [
    { id: "AR26", nombre: "AR26 - Campaña Arándano 2026", activo: true },
    { id: "PA26", nombre: "PA26 - Campaña Palto 2026", activo: true },
    { id: "VI26", nombre: "VI26 - Campaña Vid 2026", activo: true },
    { id: "ES26", nombre: "ES26 - Campaña Espárrago 2026", activo: true }
];

// Base de datos de Empresas y Sucursales vinculadas
const DEFAULT_EMPRESAS_SUCURSALES = [
    {
        empresaId: "ASP",
        empresaNombre: "ASP (Agrícola SAFCO Perú)",
        sucursales: ["Packing Safco", "Packing La Granja", "Fundo Santa Rosa", "Fundo Huando"]
    },
    {
        empresaId: "GAP",
        empresaNombre: "GAP (Global Agro Perú)",
        sucursales: ["Packing Central GAP", "Planta Agro Ica", "Fundo Villacurí"]
    },
    {
        empresaId: "AGS",
        empresaNombre: "AGS (Agrícola Guilli)",
        sucursales: ["Packing Guilli", "Fundo Don Alberto", "Planta Norte AGS"]
    }
];

// Base de datos de Transportistas con Flota de Vehículos y Choferes Registrados
const DEFAULT_TRANSPORTISTAS = [
    {
        id: "TRP-01",
        nombre: "Multiservicios Raúl E.I.R.L.",
        ruc: "20601234561",
        telefono: "987-654-321",
        vehiculos: [
            { id: "VEH-01", placa: "AYB-745", tipo: "Bus Interprovincial", capacidad: 45 },
            { id: "VEH-02", placa: "B8W-912", tipo: "Bus Urbano Grande", capacidad: 40 },
            { id: "VEH-05", placa: "F2L-880", tipo: "Minibus Ejecutivo", capacidad: 28 }
        ],
        choferes: [
            { id: "CHF-01", nombre: "Carlos Mendoza Vega", dni: "42895612", telefono: "987-654-321" },
            { id: "CHF-02", nombre: "Jorge Ramírez Díaz", dni: "45129874", telefono: "991-234-567" },
            { id: "CHF-05", nombre: "Raúl Rojas Peña", dni: "43781290", telefono: "944-123-908" }
        ]
    },
    {
        id: "TRP-02",
        nombre: "Trans-Pacífico S.A.",
        ruc: "20509876542",
        telefono: "956-112-443",
        vehiculos: [
            { id: "VEH-04", placa: "D9P-608", tipo: "Minibus Ejecutivo", capacidad: 30 },
            { id: "VEH-06", placa: "T5K-310", tipo: "Bus Panorámico", capacidad: 48 }
        ],
        choferes: [
            { id: "CHF-04", nombre: "Luis Huamán Quispe", dni: "47812039", telefono: "956-112-443" },
            { id: "CHF-06", nombre: "Manuel Flores Castro", dni: "41098234", telefono: "981-445-120" }
        ]
    },
    {
        id: "TRP-03",
        nombre: "Flota Interna SAFCO",
        ruc: "20102345678",
        telefono: "945-871-203",
        vehiculos: [
            { id: "VEH-03", placa: "C3M-450", tipo: "Bus SAFCO Interno", capacidad: 35 },
            { id: "VEH-07", placa: "K4N-112", tipo: "Sprinter SAFCO", capacidad: 20 }
        ],
        choferes: [
            { id: "CHF-03", nombre: "Mario Salas Torres", dni: "40982314", telefono: "945-871-203" },
            { id: "CHF-07", nombre: "Esteban Cruz Morales", dni: "46112098", telefono: "976-554-332" }
        ]
    },
    {
        id: "TRP-04",
        nombre: "Transportes Rápidos del Sur S.A.C.",
        ruc: "20456789012",
        telefono: "963-889-112",
        vehiculos: [
            { id: "VEH-08", placa: "Z9X-774", tipo: "Bus Urbano", capacidad: 42 }
        ],
        choferes: [
            { id: "CHF-08", nombre: "Gustavo Rivas Luna", dni: "44901238", telefono: "963-889-112" }
        ]
    }
];

// Base de datos inicial de Rutas con Personas Asignadas (Demanda de Pasajeros)
const DEFAULT_RUTAS = [
    {
        id: "R-01",
        nombre: "Ruta 1 - Cono Norte",
        paraderos: "Los Olivos (Pro) ➔ Comas (Túpac) ➔ Puente Piedra (Zapallal) ➔ Planta SAFCO",
        horarioEstimado: "05:30 AM",
        color: "#0284c7",
        personasAsignadas: 38
    },
    {
        id: "R-02",
        nombre: "Ruta 2 - Panamericana Sur",
        paraderos: "Villa El Salvador ➔ San Juan de Miraflores ➔ Chorrillos ➔ Planta SAFCO",
        horarioEstimado: "05:40 AM",
        color: "#10b981",
        personasAsignadas: 32
    },
    {
        id: "R-03",
        nombre: "Ruta 3 - Callao / Faucett",
        paraderos: "Ventanilla ➔ Av. Faucett ➔ Av. Colonial ➔ Planta SAFCO",
        horarioEstimado: "05:50 AM",
        color: "#f59e0b",
        personasAsignadas: 28
    },
    {
        id: "R-04",
        nombre: "Ruta 4 - Lima Este",
        paraderos: "Ate (Ceres) ➔ Santa Anita (Óvalo) ➔ El Agustino ➔ Planta SAFCO",
        horarioEstimado: "05:35 AM",
        color: "#8b5cf6",
        personasAsignadas: 25
    },
    {
        id: "R-05",
        nombre: "Ruta 5 - Ica / Pisco Rural",
        paraderos: "Plaza de Armas Pisco ➔ San Clemente ➔ Paracas ➔ Planta Agro SAFCO",
        horarioEstimado: "05:15 AM",
        color: "#ec4899",
        personasAsignadas: 40
    }
];

// Base de datos de Cabeceras Semanales Iniciales
const DEFAULT_CABECERAS = [
    {
        id: "CAB-2026W35-ASP-01",
        campanaId: "AR26",
        campanaNombre: "AR26 - Campaña Arándano 2026",
        empresaId: "ASP",
        empresaNombre: "ASP (Agrícola SAFCO Perú)",
        sucursal: "Packing Safco",
        semanaIso: "2026-W35",
        semanaRango: "24/Ago al 30/Ago/2026",
        transportistaId: "TRP-01",
        transportistaNombre: "Multiservicios Raúl E.I.R.L.",
        fechaCreacion: "2026-08-20",
        usuarioCreacion: "ADMIN",
        estado: "ACTIVO"
    },
    {
        id: "CAB-2026W35-GAP-02",
        campanaId: "PA26",
        campanaNombre: "PA26 - Campaña Palto 2026",
        empresaId: "GAP",
        empresaNombre: "GAP (Global Agro Perú)",
        sucursal: "Packing Central GAP",
        semanaIso: "2026-W35",
        semanaRango: "24/Ago al 30/Ago/2026",
        transportistaId: "TRP-02",
        transportistaNombre: "Trans-Pacífico S.A.",
        fechaCreacion: "2026-08-21",
        usuarioCreacion: "ADMIN",
        estado: "ACTIVO"
    },
    {
        id: "CAB-2026W35-AGS-03",
        campanaId: "VI26",
        campanaNombre: "VI26 - Campaña Vid 2026",
        empresaId: "AGS",
        empresaNombre: "AGS (Agrícola Guilli)",
        sucursal: "Packing Guilli",
        semanaIso: "2026-W35",
        semanaRango: "24/Ago al 30/Ago/2026",
        transportistaId: "TRP-03",
        transportistaNombre: "Flota Interna SAFCO",
        fechaCreacion: "2026-08-22",
        usuarioCreacion: "ADMIN",
        estado: "ACTIVO"
    }
];

// Base de datos de Vehículos
const DEFAULT_VEHICULOS = [
    {
        id: "VEH-01",
        placa: "AYB-745",
        tipo: "Bus Interprovincial",
        empresa: "Multiservicios Raúl E.I.R.L.",
        capacidad: 45,
        choferId: "CHF-01",
        choferNombre: "Carlos Mendoza Vega",
        choferDni: "42895612",
        choferTelefono: "987-654-321"
    },
    {
        id: "VEH-02",
        placa: "B8W-912",
        tipo: "Bus Urbano Grande",
        empresa: "Multiservicios Raúl E.I.R.L.",
        capacidad: 40,
        choferId: "CHF-02",
        choferNombre: "Jorge Ramírez Díaz",
        choferDni: "45129874",
        choferTelefono: "991-234-567"
    },
    {
        id: "VEH-03",
        placa: "C3M-450",
        tipo: "Bus SAFCO Interno",
        empresa: "Flota Interna SAFCO",
        capacidad: 35,
        choferId: "CHF-03",
        choferNombre: "Mario Salas Torres",
        choferDni: "40982314",
        choferTelefono: "945-871-203"
    },
    {
        id: "VEH-04",
        placa: "D9P-608",
        tipo: "Minibus Ejecutivo",
        empresa: "Trans-Pacífico S.A.",
        capacidad: 30,
        choferId: "CHF-04",
        choferNombre: "Luis Huamán Quispe",
        choferDni: "47812039",
        choferTelefono: "956-112-443"
    }
];

// Base de Colaboradores
const DEFAULT_COLABORADORES = [
    { dni: "72341101", nombres: "Juan Alberto", apellidos: "Pérez Gómez", area: "Empaque y Selección", rutaAsignada: "R-01", fotocheck: "SAF-1101", foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72341102", nombres: "María Elena", apellidos: "Ramos Castillo", area: "Empaque y Selección", rutaAsignada: "R-01", fotocheck: "SAF-1102", foto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72341103", nombres: "Pedro Luis", apellidos: "Castillo Rojas", area: "Calidad y Frio", rutaAsignada: "R-01", fotocheck: "SAF-1103", foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72341104", nombres: "Rosa Angélica", apellidos: "Flores Medina", area: "Sanidad Vegetal", rutaAsignada: "R-01", fotocheck: "SAF-1104", foto: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72341105", nombres: "Carlos David", apellidos: "Gutiérrez Vega", area: "Mantenimiento", rutaAsignada: "R-01", fotocheck: "SAF-1105", foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72341106", nombres: "Lucía Isabel", apellidos: "Torres Morales", area: "Empaque y Selección", rutaAsignada: "R-01", fotocheck: "SAF-1106", foto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72342201", nombres: "Fernando José", apellidos: "Paredes Rivas", area: "Empaque y Selección", rutaAsignada: "R-02", fotocheck: "SAF-2201", foto: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72342202", nombres: "Gabriela Milagros", apellidos: "Ríos Mendoza", area: "Calidad", rutaAsignada: "R-02", fotocheck: "SAF-2202", foto: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=100&h=100&fit=crop&crop=faces" }
];

// Generar Programaciones Iniciales vinculadas a sus Cabeceras
function getInitialProgramaciones() {
    const hoy = new Date().toISOString().split('T')[0];
    return [
        {
            id: "PRG-2026-001",
            cabeceraId: "CAB-2026W35-ASP-01",
            campanaId: "AR26",
            campanaNombre: "AR26 - Campaña Arándano 2026",
            empresaId: "ASP",
            empresaNombre: "ASP (Agrícola SAFCO Perú)",
            sucursal: "Packing Safco",
            transportistaId: "TRP-01",
            transportistaNombre: "Multiservicios Raúl E.I.R.L.",
            semanaIso: "2026-W35",
            fecha: hoy,
            turno: "Mañana (06:00 - 15:00)",
            rutaId: "R-01",
            rutaNombre: "Ruta 1 - Cono Norte",
            personasRutaAsignadas: 38,
            vehiculoId: "VEH-01",
            placa: "AYB-745",
            empresa: "Multiservicios Raúl E.I.R.L.",
            capacidad: 45,
            choferId: "CHF-01",
            choferNombre: "Carlos Mendoza Vega",
            choferDni: "42895612",
            estadoGeneral: "INGRESADO_GARITA",
            ingreso: {
                iniciado: true,
                horaInicio: "05:25 AM",
                finalizado: true,
                horaLlegada: "06:10 AM",
                pasajeros: [
                    { dni: "72341101", nombres: "Juan Alberto Pérez Gómez", area: "Empaque y Selección", rutaAsignada: "R-01", esRutaCorrecta: true, horaAbordaje: "05:32 AM", fotocheck: "SAF-1101" },
                    { dni: "72341102", nombres: "María Elena Ramos Castillo", area: "Empaque y Selección", rutaAsignada: "R-01", esRutaCorrecta: true, horaAbordaje: "05:34 AM", fotocheck: "SAF-1102" },
                    { dni: "72341103", nombres: "Pedro Luis Castillo Rojas", area: "Calidad y Frio", rutaAsignada: "R-01", esRutaCorrecta: true, horaAbordaje: "05:40 AM", fotocheck: "SAF-1103" }
                ],
                totalChofer: 3,
                inspeccionGarita: {
                    revisado: true,
                    horaInspeccion: "06:14 AM",
                    guardia: "Of. Roberto Sánchez",
                    conteoRealGarita: 3,
                    conforme: true,
                    observaciones: "Conforme"
                }
            },
            retorno: { iniciado: false, pasajeros: [], totalChofer: 0, inspeccionGarita: { revisado: false } }
        },
        {
            id: "PRG-2026-002",
            cabeceraId: "CAB-2026W35-ASP-01",
            campanaId: "AR26",
            campanaNombre: "AR26 - Campaña Arándano 2026",
            empresaId: "ASP",
            empresaNombre: "ASP (Agrícola SAFCO Perú)",
            sucursal: "Packing Safco",
            transportistaId: "TRP-01",
            transportistaNombre: "Multiservicios Raúl E.I.R.L.",
            semanaIso: "2026-W35",
            fecha: hoy,
            turno: "Tarde (14:00 - 23:00)",
            rutaId: "R-02",
            rutaNombre: "Ruta 2 - Panamericana Sur",
            personasRutaAsignadas: 32,
            vehiculoId: "VEH-02",
            placa: "B8W-912",
            empresa: "Multiservicios Raúl E.I.R.L.",
            capacidad: 40,
            choferId: "CHF-02",
            choferNombre: "Jorge Ramírez Díaz",
            choferDni: "45129874",
            estadoGeneral: "PROGRAMADO",
            ingreso: { iniciado: false, pasajeros: [], totalChofer: 0, inspeccionGarita: { revisado: false } },
            retorno: { iniciado: false, pasajeros: [], totalChofer: 0, inspeccionGarita: { revisado: false } }
        },
        {
            id: "PRG-2026-003",
            cabeceraId: "CAB-2026W35-GAP-02",
            campanaId: "PA26",
            campanaNombre: "PA26 - Campaña Palto 2026",
            empresaId: "GAP",
            empresaNombre: "GAP (Global Agro Perú)",
            sucursal: "Packing Central GAP",
            transportistaId: "TRP-02",
            transportistaNombre: "Trans-Pacífico S.A.",
            semanaIso: "2026-W35",
            fecha: hoy,
            turno: "Mañana (06:00 - 15:00)",
            rutaId: "R-04",
            rutaNombre: "Ruta 4 - Lima Este",
            personasRutaAsignadas: 25,
            vehiculoId: "VEH-04",
            placa: "D9P-608",
            empresa: "Trans-Pacífico S.A.",
            capacidad: 30,
            choferId: "CHF-04",
            choferNombre: "Luis Huamán Quispe",
            choferDni: "47812039",
            estadoGeneral: "PROGRAMADO",
            ingreso: { iniciado: false, pasajeros: [], totalChofer: 0, inspeccionGarita: { revisado: false } },
            retorno: { iniciado: false, pasajeros: [], totalChofer: 0, inspeccionGarita: { revisado: false } }
        }
    ];
}

// API y Manejador Local
window.SafcoTransportesDB = {
    init: function() {
        if (!localStorage.getItem(STORAGE_KEY_CABECERAS)) {
            localStorage.setItem(STORAGE_KEY_CABECERAS, JSON.stringify(DEFAULT_CABECERAS));
        }
        if (!localStorage.getItem(STORAGE_KEY_CAMPANAS)) {
            localStorage.setItem(STORAGE_KEY_CAMPANAS, JSON.stringify(DEFAULT_CAMPANAS));
        }
        if (!localStorage.getItem(STORAGE_KEY_TRANSPORTISTAS)) {
            localStorage.setItem(STORAGE_KEY_TRANSPORTISTAS, JSON.stringify(DEFAULT_TRANSPORTISTAS));
        }
        if (!localStorage.getItem(STORAGE_KEY_RUTAS)) {
            localStorage.setItem(STORAGE_KEY_RUTAS, JSON.stringify(DEFAULT_RUTAS));
        }
        if (!localStorage.getItem(STORAGE_KEY_VEHICULOS)) {
            localStorage.setItem(STORAGE_KEY_VEHICULOS, JSON.stringify(DEFAULT_VEHICULOS));
        }
        if (!localStorage.getItem(STORAGE_KEY_COLABORADORES)) {
            localStorage.setItem(STORAGE_KEY_COLABORADORES, JSON.stringify(DEFAULT_COLABORADORES));
        }
        if (!localStorage.getItem(STORAGE_KEY_PROGRAMACIONES)) {
            localStorage.setItem(STORAGE_KEY_PROGRAMACIONES, JSON.stringify(getInitialProgramaciones()));
        }
    },

    // Cabeceras Semanales (Master)
    getCabeceras: function() {
        this.init();
        return JSON.parse(localStorage.getItem(STORAGE_KEY_CABECERAS)) || [];
    },

    getCabeceraById: function(id) {
        const list = this.getCabeceras();
        return list.find(c => c.id === id);
    },

    saveCabeceras: function(list) {
        localStorage.setItem(STORAGE_KEY_CABECERAS, JSON.stringify(list));
        window.dispatchEvent(new Event('safco_transportes_updated'));
    },

    saveCabecera: function(cabeceraObj) {
        const list = this.getCabeceras();
        const idx = list.findIndex(c => c.id === cabeceraObj.id);
        if (idx >= 0) {
            list[idx] = cabeceraObj;
        } else {
            list.unshift(cabeceraObj);
        }
        this.saveCabeceras(list);
        return cabeceraObj;
    },

    deleteCabecera: function(id) {
        let list = this.getCabeceras();
        list = list.filter(c => c.id !== id);
        this.saveCabeceras(list);

        // Eliminar programaciones diarias vinculadas a esa cabecera
        let prgs = this.getProgramaciones();
        prgs = prgs.filter(p => p.cabeceraId !== id);
        this.saveProgramaciones(prgs);
    },

    getCampanas: function() {
        this.init();
        return JSON.parse(localStorage.getItem(STORAGE_KEY_CAMPANAS)) || DEFAULT_CAMPANAS;
    },

    getEmpresasSucursales: function() {
        return DEFAULT_EMPRESAS_SUCURSALES;
    },

    getSucursalesByEmpresa: function(empresaId) {
        const item = DEFAULT_EMPRESAS_SUCURSALES.find(e => e.empresaId === empresaId);
        return item ? item.sucursales : [];
    },

    getTransportistas: function() {
        this.init();
        return JSON.parse(localStorage.getItem(STORAGE_KEY_TRANSPORTISTAS)) || DEFAULT_TRANSPORTISTAS;
    },

    getTransportistaById: function(trpId) {
        const list = this.getTransportistas();
        return list.find(t => t.id === trpId);
    },

    getRutas: function() {
        this.init();
        return JSON.parse(localStorage.getItem(STORAGE_KEY_RUTAS)) || DEFAULT_RUTAS;
    },

    getRutaById: function(rutaId) {
        const list = this.getRutas();
        return list.find(r => r.id === rutaId);
    },

    getVehiculos: function() {
        this.init();
        return JSON.parse(localStorage.getItem(STORAGE_KEY_VEHICULOS)) || DEFAULT_VEHICULOS;
    },

    getColaboradores: function() {
        this.init();
        return JSON.parse(localStorage.getItem(STORAGE_KEY_COLABORADORES)) || DEFAULT_COLABORADORES;
    },

    findColaboradorByDniOrFotocheck: function(query) {
        const list = this.getColaboradores();
        const q = String(query).trim().toLowerCase();
        return list.find(c => 
            c.dni.toLowerCase() === q || 
            c.fotocheck.toLowerCase() === q || 
            (c.nombres + ' ' + c.apellidos).toLowerCase().includes(q)
        );
    },

    getProgramaciones: function() {
        this.init();
        return JSON.parse(localStorage.getItem(STORAGE_KEY_PROGRAMACIONES)) || [];
    },

    getProgramacionById: function(id) {
        const list = this.getProgramaciones();
        return list.find(p => p.id === id);
    },

    getProgramacionesByCabeceraId: function(cabeceraId) {
        const list = this.getProgramaciones();
        return list.filter(p => p.cabeceraId === cabeceraId);
    },

    saveProgramaciones: function(list) {
        localStorage.setItem(STORAGE_KEY_PROGRAMACIONES, JSON.stringify(list));
        window.dispatchEvent(new Event('safco_transportes_updated'));
    },

    saveProgramacion: function(prg) {
        const list = this.getProgramaciones();
        const idx = list.findIndex(p => p.id === prg.id);
        if (idx >= 0) {
            list[idx] = prg;
        } else {
            list.unshift(prg);
        }
        this.saveProgramaciones(list);
        return prg;
    },

    addProgramacionesBatch: function(newItems) {
        if (!newItems || newItems.length === 0) return;
        const list = this.getProgramaciones();
        newItems.forEach(item => {
            const idx = list.findIndex(p => p.id === item.id);
            if (idx >= 0) {
                list[idx] = item;
            } else {
                list.unshift(item);
            }
        });
        this.saveProgramaciones(list);
    },

    deleteProgramacion: function(id) {
        let list = this.getProgramaciones();
        list = list.filter(p => p.id !== id);
        this.saveProgramaciones(list);
    },

    deleteProgramaciones: function(ids) {
        let list = this.getProgramaciones();
        const idSet = new Set(ids);
        list = list.filter(p => !idSet.has(p.id));
        this.saveProgramaciones(list);
    },

    getProgramacionesByDate: function(dateStr) {
        return this.getProgramaciones().filter(p => p.fecha === dateStr);
    },

    getProgramacionesByDateRange: function(startDate, endDate) {
        return this.getProgramaciones().filter(p => p.fecha >= startDate && p.fecha <= endDate);
    },

    resetToDefault: function() {
        localStorage.removeItem(STORAGE_KEY_CABECERAS);
        localStorage.removeItem(STORAGE_KEY_PROGRAMACIONES);
        localStorage.removeItem(STORAGE_KEY_COLABORADORES);
        localStorage.removeItem(STORAGE_KEY_VEHICULOS);
        localStorage.removeItem(STORAGE_KEY_RUTAS);
        localStorage.removeItem(STORAGE_KEY_CAMPANAS);
        localStorage.removeItem(STORAGE_KEY_TRANSPORTISTAS);
        this.init();
        window.dispatchEvent(new Event('safco_transportes_updated'));
    },

    checkAdminAccess: function() {
        const sessionData = localStorage.getItem("userSession");
        let user = "admin";
        if (sessionData) {
            try {
                const data = JSON.parse(sessionData);
                user = (data.user || "admin").toLowerCase();
            } catch(e) {}
        }

        if (user !== "admin") {
            document.body.innerHTML = `
                <div style="font-family: 'Open Sans', sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:80vh; text-align:center; padding:2rem; color:#1e293b;">
                    <div style="width:76px; height:76px; border-radius:50%; background:#fee2e2; display:flex; align-items:center; justify-content:center; margin-bottom:1.25rem; color:#d80000; font-size:2.2rem;">
                        🔒
                    </div>
                    <h2 style="font-size:1.5rem; font-weight:800; margin-bottom:0.5rem; color:#004a4c;">Módulo en Fase de Integración</h2>
                    <p style="max-width:500px; color:#64748b; font-size:0.9rem; margin-bottom:1.5rem; line-height:1.6;">
                        Este módulo de <b>Control de Transporte de Buses</b> está habilitado temporalmente de forma exclusiva para el usuario <b>ADMIN</b>.
                    </p>
                    <div style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:10px; padding:0.6rem 1.2rem; font-size:0.85rem; color:#334155;">
                        Usuario activo: <b style="text-transform:uppercase; color:#d80000;">${user}</b>
                    </div>
                    <p style="font-size:0.78rem; color:#94a3b8; margin-top:1rem;">
                        (Para visualizar esta pantalla, cambie el usuario a <b>ADMIN</b> en la barra superior o en el login).
                    </p>
                </div>
            `;
            return false;
        }
        return true;
    }
};

// Inicializar al cargar
window.SafcoTransportesDB.init();
