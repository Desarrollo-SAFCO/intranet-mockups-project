/**
 * SAFCO - Mock Data Store para Módulos de Transporte y Garita
 * Sincronización en tiempo real mediante localStorage
 */

const STORAGE_KEY_PROGRAMACIONES = 'SAFCO_TRANSPORTES_PROGRAMACIONES_V1';
const STORAGE_KEY_COLABORADORES = 'SAFCO_TRANSPORTES_COLABORADORES_V1';
const STORAGE_KEY_VEHICULOS = 'SAFCO_TRANSPORTES_VEHICULOS_V1';
const STORAGE_KEY_RUTAS = 'SAFCO_TRANSPORTES_RUTAS_V1';

// Base de datos inicial de Rutas
const DEFAULT_RUTAS = [
    {
        id: "R-01",
        nombre: "Ruta 1 - Cono Norte",
        paraderos: "Los Olivos (Pro) ➔ Comas (Túpac) ➔ Puente Piedra (Zapallal) ➔ Planta SAFCO",
        horarioEstimado: "05:30 AM",
        color: "#0284c7"
    },
    {
        id: "R-02",
        nombre: "Ruta 2 - Panamericana Sur",
        paraderos: "Villa El Salvador ➔ San Juan de Miraflores ➔ Chorrillos ➔ Planta SAFCO",
        horarioEstimado: "05:40 AM",
        color: "#10b981"
    },
    {
        id: "R-03",
        nombre: "Ruta 3 - Callao / Faucett",
        paraderos: "Ventanilla ➔ Av. Faucett ➔ Av. Colonial ➔ Planta SAFCO",
        horarioEstimado: "05:50 AM",
        color: "#f59e0b"
    },
    {
        id: "R-04",
        nombre: "Ruta 4 - Lima Este",
        paraderos: "Ate (Ceres) ➔ Santa Anita (Óvalo) ➔ El Agustino ➔ Planta SAFCO",
        horarioEstimado: "05:35 AM",
        color: "#8b5cf6"
    },
    {
        id: "R-05",
        nombre: "Ruta 5 - Ica / Pisco Rural",
        paraderos: "Plaza de Armas Pisco ➔ San Clemente ➔ Paracas ➔ Planta Agro SAFCO",
        horarioEstimado: "05:15 AM",
        color: "#ec4899"
    }
];

// Base de datos de Vehículos y Choferes
const DEFAULT_VEHICULOS = [
    {
        id: "VEH-01",
        placa: "AYB-745",
        tipo: "Bus Interprovincial",
        empresa: "Trans-Pacífico S.A.",
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
        empresa: "Transportes Rápidos S.A.",
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

// Base de Colaboradores (Trabajadores de planta con su ruta oficial asignada)
const DEFAULT_COLABORADORES = [
    // Ruta 1 - Cono Norte
    { dni: "72341101", nombres: "Juan Alberto", apellidos: "Pérez Gómez", area: "Empaque y Selección", 
        rutaAsignada: "R-01", fotocheck: "SAF-1101", 
        foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72341102", nombres: "María Elena", apellidos: "Ramos Castillo", area: "Empaque y Selección", rutaAsignada: "R-01", fotocheck: "SAF-1102", foto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72341103", nombres: "Pedro Luis", apellidos: "Castillo Rojas", area: "Calidad y Frio", rutaAsignada: "R-01", fotocheck: "SAF-1103", foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72341104", nombres: "Rosa Angélica", apellidos: "Flores Medina", area: "Sanidad Vegetal", rutaAsignada: "R-01", fotocheck: "SAF-1104", foto: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72341105", nombres: "Carlos David", apellidos: "Gutiérrez Vega", area: "Mantenimiento", rutaAsignada: "R-01", fotocheck: "SAF-1105", foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72341106", nombres: "Lucía Isabel", apellidos: "Torres Morales", area: "Empaque y Selección", rutaAsignada: "R-01", fotocheck: "SAF-1106", foto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72341107", nombres: "Manuel Antonio", apellidos: "Chávez Salazar", area: "Producción Agrícola", rutaAsignada: "R-01", fotocheck: "SAF-1107", foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72341108", nombres: "Sonia Beatriz", apellidos: "Vásquez Díaz", area: "Calidad", rutaAsignada: "R-01", fotocheck: "SAF-1108", foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72341109", nombres: "Héctor Hugo", apellidos: "Navarro Peña", area: "Despacho y Frio", rutaAsignada: "R-01", fotocheck: "SAF-1109", foto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72341110", nombres: "Ana Patricia", apellidos: "Ortega Silva", area: "Empaque y Selección", rutaAsignada: "R-01", fotocheck: "SAF-1110", foto: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=faces" },

    // Ruta 2 - Panamericana Sur
    { dni: "72342201", nombres: "Fernando José", apellidos: "Paredes Rivas", area: "Empaque y Selección", rutaAsignada: "R-02", fotocheck: "SAF-2201", foto: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72342202", nombres: "Gabriela Milagros", apellidos: "Ríos Mendoza", area: "Calidad", rutaAsignada: "R-02", fotocheck: "SAF-2202", foto: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72342203", nombres: "Raúl Esteban", apellidos: "Espinoza Vargas", area: "Producción Agrícola", rutaAsignada: "R-02", fotocheck: "SAF-2203", foto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72342204", nombres: "Carmen Julia", apellidos: "Vargas Luna", area: "Empaque y Selección", rutaAsignada: "R-02", fotocheck: "SAF-2204", foto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72342205", nombres: "Diego Alonso", apellidos: "Herrera Campos", area: "Mantenimiento", rutaAsignada: "R-02", fotocheck: "SAF-2205", foto: "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72342206", nombres: "Diana Carolina", apellidos: "Sánchez Bravo", area: "Sanidad Vegetal", rutaAsignada: "R-02", fotocheck: "SAF-2206", foto: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=faces" },

    // Ruta 3 - Callao / Faucett
    { dni: "72343301", nombres: "Oscar Martín", apellidos: "Aguilar Prieto", area: "Producción Agrícola", rutaAsignada: "R-03", fotocheck: "SAF-3301", foto: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72343302", nombres: "Patricia Inés", apellidos: "Maldonado Cruz", area: "Empaque y Selección", rutaAsignada: "R-03", fotocheck: "SAF-3302", foto: "https://images.unsplash.com/photo-1548142813-c348350df52b?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72343303", nombres: "Víctor Raúl", apellidos: "León Guerrero", area: "Despacho y Frio", rutaAsignada: "R-03", fotocheck: "SAF-3303", foto: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72343304", nombres: "Elena Rosario", apellidos: "Cabrera Ponce", area: "Calidad", rutaAsignada: "R-03", fotocheck: "SAF-3304", foto: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=faces" },

    // Ruta 4 - Lima Este
    { dni: "72344401", nombres: "Julio César", apellidos: "Montesinos Barco", area: "Empaque y Selección", rutaAsignada: "R-04", fotocheck: "SAF-4401", foto: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=faces" },
    { dni: "72344402", nombres: "Valeria Andrea", apellidos: "Quispe Córdova", area: "Sanidad Vegetal", rutaAsignada: "R-04", fotocheck: "SAF-4402", foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces" }
];

// Generar Programaciones Iniciales (Simulación del día)
function getInitialProgramaciones() {
    const hoy = new Date().toISOString().split('T')[0];
    return [
        {
            id: "PRG-2026-001",
            fecha: hoy,
            turno: "Mañana (06:00 - 15:00)",
            rutaId: "R-01",
            rutaNombre: "Ruta 1 - Cono Norte",
            vehiculoId: "VEH-01",
            placa: "AYB-745",
            empresa: "Trans-Pacífico S.A.",
            capacidad: 45,
            choferId: "CHF-01",
            choferNombre: "Carlos Mendoza Vega",
            choferDni: "42895612",
            // Estados: PROGRAMADO, EN_RUTA_IDA, LLEGADA_PLANTA, INGRESADO_GARITA, EN_RUTA_RETORNO, FINALIZADO
            estadoGeneral: "INGRESADO_GARITA", 
            
            // Flujo de Ingreso (Ida)
            ingreso: {
                iniciado: true,
                horaInicio: "05:25 AM",
                finalizado: true,
                horaLlegada: "06:10 AM",
                pasajeros: [
                    { dni: "72341101", nombres: "Juan Alberto Pérez Gómez", area: "Empaque y Selección", rutaAsignada: "R-01", esRutaCorrecta: true, horaAbordaje: "05:32 AM", fotocheck: "SAF-1101" },
                    { dni: "72341102", nombres: "María Elena Ramos Castillo", area: "Empaque y Selección", rutaAsignada: "R-01", esRutaCorrecta: true, horaAbordaje: "05:34 AM", fotocheck: "SAF-1102" },
                    { dni: "72341103", nombres: "Pedro Luis Castillo Rojas", area: "Calidad y Frio", rutaAsignada: "R-01", esRutaCorrecta: true, horaAbordaje: "05:40 AM", fotocheck: "SAF-1103" },
                    { dni: "72341104", nombres: "Rosa Angélica Flores Medina", area: "Sanidad Vegetal", rutaAsignada: "R-01", esRutaCorrecta: true, horaAbordaje: "05:45 AM", fotocheck: "SAF-1104" },
                    { dni: "72341105", nombres: "Carlos David Gutiérrez Vega", area: "Mantenimiento", rutaAsignada: "R-01", esRutaCorrecta: true, horaAbordaje: "05:48 AM", fotocheck: "SAF-1105" },
                    // Caso Pasajero de otra ruta (R-02) que subió a este bus
                    { dni: "72342201", nombres: "Fernando José Paredes Rivas", area: "Empaque y Selección", rutaAsignada: "R-02", esRutaCorrecta: false, horaAbordaje: "05:52 AM", fotocheck: "SAF-2201", observacion: "Ruta habitual R-02 (Permitido por chofer)" }
                ],
                totalChofer: 6,
                inspeccionGarita: {
                    revisado: true,
                    horaInspeccion: "06:14 AM",
                    guardia: "Of. Roberto Sánchez",
                    conteoRealGarita: 6,
                    conforme: true,
                    observaciones: "Conteo conforme en garita principal."
                }
            },

            // Flujo de Retorno (Salida de Planta)
            retorno: {
                iniciado: false,
                horaInicio: null,
                finalizado: false,
                horaFinalizado: null,
                pasajeros: [],
                totalChofer: 0,
                inspeccionGarita: {
                    revisado: false,
                    horaInspeccion: null,
                    guardia: null,
                    conteoRealGarita: null,
                    conforme: false,
                    observaciones: ""
                }
            }
        },
        {
            id: "PRG-2026-002",
            fecha: hoy,
            turno: "Mañana (06:00 - 15:00)",
            rutaId: "R-02",
            rutaNombre: "Ruta 2 - Panamericana Sur",
            vehiculoId: "VEH-02",
            placa: "B8W-912",
            empresa: "Transportes Rápidos S.A.",
            capacidad: 40,
            choferId: "CHF-02",
            choferNombre: "Jorge Ramírez Díaz",
            choferDni: "45129874",
            estadoGeneral: "LLEGADA_PLANTA", // Llegó a planta, listo para revisión de garita
            
            ingreso: {
                iniciado: true,
                horaInicio: "05:35 AM",
                finalizado: true,
                horaLlegada: "06:20 AM",
                pasajeros: [
                    { dni: "72342202", nombres: "Gabriela Milagros Ríos Mendoza", area: "Calidad", rutaAsignada: "R-02", esRutaCorrecta: true, horaAbordaje: "05:42 AM", fotocheck: "SAF-2202" },
                    { dni: "72342203", nombres: "Raúl Esteban Espinoza Vargas", area: "Producción Agrícola", rutaAsignada: "R-02", esRutaCorrecta: true, horaAbordaje: "05:48 AM", fotocheck: "SAF-2203" },
                    { dni: "72342204", nombres: "Carmen Julia Vargas Luna", area: "Empaque y Selección", rutaAsignada: "R-02", esRutaCorrecta: true, horaAbordaje: "05:54 AM", fotocheck: "SAF-2204" }
                ],
                totalChofer: 3,
                inspeccionGarita: {
                    revisado: false,
                    conteoRealGarita: null,
                    conforme: false,
                    observaciones: ""
                }
            },
            retorno: {
                iniciado: false,
                pasajeros: [],
                totalChofer: 0,
                inspeccionGarita: { revisado: false, conteoRealGarita: null }
            }
        },
        {
            id: "PRG-2026-003",
            fecha: hoy,
            turno: "Mañana (06:00 - 15:00)",
            rutaId: "R-03",
            rutaNombre: "Ruta 3 - Callao / Faucett",
            vehiculoId: "VEH-03",
            placa: "C3M-450",
            empresa: "Flota Interna SAFCO",
            capacidad: 35,
            choferId: "CHF-03",
            choferNombre: "Mario Salas Torres",
            choferDni: "40982314",
            estadoGeneral: "PROGRAMADO",
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
        }
    ];
}

// API y Manejador Local
window.SafcoTransportesDB = {
    init: function() {
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

    getRutas: function() {
        this.init();
        return JSON.parse(localStorage.getItem(STORAGE_KEY_RUTAS)) || DEFAULT_RUTAS;
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

    resetToDefault: function() {
        localStorage.removeItem(STORAGE_KEY_PROGRAMACIONES);
        localStorage.removeItem(STORAGE_KEY_COLABORADORES);
        localStorage.removeItem(STORAGE_KEY_VEHICULOS);
        localStorage.removeItem(STORAGE_KEY_RUTAS);
        this.init();
        window.dispatchEvent(new Event('safco_transportes_updated'));
    },

    /**
     * Valida si el usuario actual es 'admin'.
     * Si no es admin, renderiza un banner informativo de acceso restringido.
     */
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
