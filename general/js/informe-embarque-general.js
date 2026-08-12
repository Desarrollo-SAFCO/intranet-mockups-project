// Lógica del Informe de Embarque General - SAFCO (Versión 3.5 - Consolidación Automática por Instrucción de Embarque)

// Generador de imágenes SVG base64 para mockups de evidencias
function createSvgDataUrl(text, bgColor = "#004a4c", textColor = "#ffffff") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="${bgColor}"/>
    <rect x="15" y="15" width="370" height="270" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="6,6" opacity="0.4"/>
    <text x="200" y="130" font-family="'Open Sans', sans-serif" font-size="18" font-weight="bold" fill="${textColor}" text-anchor="middle">${text}</text>
    <text x="200" y="165" font-family="'Open Sans', sans-serif" font-size="12" fill="${textColor}" opacity="0.8" text-anchor="middle">Agricola SAFCO - Control de Embarque</text>
    <circle cx="200" cy="200" r="20" fill="rgba(255,255,255,0.2)"/>
    <path d="M192 200 L198 206 L210 194" stroke="${textColor}" stroke-width="3" fill="none"/>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// Generador de Sello Digital DNI-e (PKI RENIEC / FIRMA DIGITAL)
function generateDnieSignatureSvg(name, doc) {
  const dateStr = new Date().toLocaleDateString();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="90" viewBox="0 0 220 90">
    <rect width="220" height="90" fill="#f0f9ff" rx="8" stroke="#0284c7" stroke-width="1.5"/>
    <rect x="6" y="6" width="208" height="78" fill="none" stroke="#0284c7" stroke-dasharray="3,3" rx="6"/>
    <text x="15" y="24" font-family="sans-serif" font-size="10" font-weight="bold" fill="#004a4c">🔒 FIRMADO DIGITALMENTE CON DNI-e</text>
    <text x="15" y="40" font-family="sans-serif" font-size="9" font-weight="bold" fill="#0f172a">Titular: ${name}</text>
    <text x="15" y="54" font-family="sans-serif" font-size="8" fill="#475569">DNI: ${doc} | Certificado PKI RENIEC</text>
    <text x="15" y="68" font-family="sans-serif" font-size="8" fill="#0284c7">Validado con Lector Chip | ${dateStr}</text>
    <circle cx="195" cy="45" r="14" fill="#0284c7"/>
    <path d="M189 45 L193 49 L201 41" stroke="#ffffff" stroke-width="2.5" fill="none"/>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// Directorio Corporativo Base de Participantes Frecuentes
let directorioParticipantes = [
  { id: 101, nombre: "Carlos Mendoza", rol: "Seguridad Patrimonial", empresa: "SAFCO S.A.C.", doc: "10982345", brevete: "", correo: "carlos.mendoza@safco.pe" },
  { id: 102, nombre: "Marcos Vilca", rol: "Inspector Calidad", empresa: "SAFCO S.A.C.", doc: "44892019", brevete: "", correo: "marcos.vilca@safco.pe" },
  { id: 103, nombre: "Ana Rodríguez", rol: "Supervisor Frío", empresa: "SAFCO S.A.C.", doc: "41903212", brevete: "", correo: "ana.rodriguez@safco.pe" },
  { id: 104, nombre: "Juan Pérez Rosales", rol: "Chofer Transportista", empresa: "TRANS-AGRO E.I.R.L.", doc: "09876543", brevete: "Q-09876543", correo: "jperez@transagro.com" },
  { id: 105, nombre: "Ing. Roberto Gutiérrez", rol: "Inspector SENASA", empresa: "SENASA ICA", doc: "25890123", brevete: "", correo: "rgutierrez@senasa.gob.pe" },
  { id: 106, nombre: "Miguel Ángel Torres", rol: "Agente de Aduanas", empresa: "RANSA COMERCIAL S.A.", doc: "43210987", brevete: "", correo: "mtorres@ransa.com" },
  { id: 107, nombre: "Patricia Huamán", rol: "Control Operativo", empresa: "TALSA S.A.", doc: "70123456", brevete: "", correo: "phuaman@talsa.com" },
  { id: 108, nombre: "Jorge Luis Ramos", rol: "Inspector de Empaque", empresa: "SAFCO S.A.C.", doc: "45678912", brevete: "", correo: "jorge.ramos@safco.pe" }
];

// Data Mockup Inicial (Consolidado de Instrucciones de Embarque Existentes)
let informesMock = [
  {
    id: "INF-001",
    instruccionEmbarque: "ASP001",
    nroInforme: "INFORME DE EMBARQUE N° 033.AC-2025",
    nroEmbarque: "SAF001",
    contenedor: "HLBU 963821-7",
    booking: "HLBU96382170",
    cliente: "TALSA S.A",
    productor: "AGRICOLA TAMBO COLORADO S.A.C.",
    variedad: "AUTUMN CRISP",
    programa: "PUNNETS 4KG",
    campana: "UVA-2025",
    fechaEmbarque: "2025-01-05",
    guias: "T007 - 0000129",
    packingList: "PL-UV-001-A",
    estadoGeneral: "Completo",
    dictamenGeneral: "Conforme",
    areas: {
      seguridad: { status: "ready", dictamen: "Conforme", fecha: "2025-01-05 08:30", inspector: "Carlos Mendoza" },
      calidad: { status: "ready", dictamen: "Conforme", fecha: "2025-01-05 09:45", inspector: "Marcos Vilca" },
      frio: { status: "ready", dictamen: "Conforme", fecha: "2025-01-05 10:15", inspector: "Ana Rodríguez" }
    },
    datosSeguridad: {
      dictamen: "Conforme",
      observaciones: [
        "Contenedor verificado e higienizado sin olores ni daños en estructura.",
        "Sellos de seguridad verificados al momento del ingreso a planta."
      ]
    },
    datosCalidad: {
      dictamen: "Conforme",
      paletasEvaluadas: [
        { nro: 1, nroPallet: "BBP01260725001C", productor: "BYBLUE PERU", variedad: "AUTUMN CRISP", temp: 0.1, hora: "10:25", cumple: "Conforme" },
        { nro: 2, nroPallet: "BBP01260725002C", productor: "BYBLUE PERU", variedad: "AUTUMN CRISP", temp: 0.2, hora: "10:29", cumple: "Conforme" },
        { nro: 3, nroPallet: "BBP01260724007C", productor: "BYBLUE PERU", variedad: "AUTUMN CRISP", temp: 0.3, hora: "11:18", cumple: "Conforme" },
        { nro: 4, nroPallet: "BBP01260723002R", productor: "BYBLUE PERU", variedad: "AUTUMN CRISP", temp: -0.2, hora: "11:25", cumple: "Conforme" },
        { nro: 5, nroPallet: "BBP01260724006C", productor: "BYBLUE PERU", variedad: "AUTUMN CRISP", temp: 0.2, hora: "10:33", cumple: "Conforme" },
        { nro: 6, nroPallet: "BBP01260724009C", productor: "BYBLUE PERU", variedad: "AUTUMN CRISP", temp: 0.3, hora: "11:27", cumple: "Conforme" },
        { nro: 7, nroPallet: "BBP01260724008C", productor: "BYBLUE PERU", variedad: "AUTUMN CRISP", temp: 0.1, hora: "10:37", cumple: "Conforme" },
        { nro: 8, nroPallet: "BBP01260724003C", productor: "BYBLUE PERU", variedad: "AUTUMN CRISP", temp: 0.1, hora: "11:37", cumple: "Conforme" }
      ],
      observaciones: "Calidad de empaque conforme. Temperatura de pulpa promedio evaluada de 0.14°C."
    },
    datosFrio: {
      dictamen: "Conforme",
      precintoSafco: "SAF-99120",
      precintoSenasa: "SEN-44102",
      precintoLinea: "HLBU-119283",
      dispositivos: [
        { tipo: "1° Termógrafo", codigo: "TERM-881", ubicacion: "Pallet 01" },
        { tipo: "2° Termógrafo", codigo: "TERM-882", ubicacion: "Pallet 10" },
        { tipo: "Sensor SENASA 1", codigo: "SENSOR6565", ubicacion: "Pallet 04" },
        { tipo: "Sensor SENASA 2", codigo: "SENSOR9632", ubicacion: "Pallet 23" }
      ],
      esquemaPaletas: [
        { pos: 2, codigo: "PAL-999", estado: "alert" },
        { pos: 1, codigo: "ASP1", estado: "ok" },
        { pos: 4, codigo: "ASP8", estado: "ok", sensor: "SENSOR6565" },
        { pos: 3, codigo: "ASP3", estado: "ok" },
        { pos: 6, codigo: "ASP6", estado: "ok" },
        { pos: 5, codigo: "ASP5", estado: "ok" },
        { pos: 8, codigo: "ASP8", estado: "ok" },
        { pos: 7, codigo: "PAL-888", estado: "alert" },
        { pos: 10, codigo: "ASP12", estado: "ok" },
        { pos: 9, codigo: "ASP9", estado: "ok" },
        { pos: 12, codigo: "PAL-777", estado: "alert" },
        { pos: 11, codigo: "ASP11", estado: "ok" },
        { pos: 14, codigo: "ASP14", estado: "ok" },
        { pos: 13, codigo: "ASP13", estado: "ok" },
        { pos: 16, codigo: "PAL-666", estado: "alert" },
        { pos: 15, codigo: "ASP15", estado: "ok" },
        { pos: 18, codigo: "ASP18", estado: "ok" },
        { pos: 17, codigo: "ASP17", estado: "ok" },
        { pos: 20, codigo: "ASP20", estado: "ok" },
        { pos: 19, codigo: "ASP19", estado: "ok" },
        { pos: 22, codigo: "VACÍO", estado: "empty" },
        { pos: 21, codigo: "PAL-555", estado: "alert" },
        { pos: 23, codigo: "ASP2", estado: "ok", sensor: "SENSOR9632" }
      ],
      observaciones: "Paletas estibadas en 2 filas respetando límite de altura del contenedor reefer."
    },
    participantes: [
      { id: 1, rol: "Seguridad Patrimonial", nombre: "Carlos Mendoza", empresa: "SAFCO S.A.C.", doc: "10982345", firma: generateDnieSignatureSvg("Carlos Mendoza", "10982345") },
      { id: 2, rol: "Inspector Calidad", nombre: "Marcos Vilca", empresa: "SAFCO S.A.C.", doc: "44892019", firma: generateDnieSignatureSvg("Marcos Vilca", "44892019") },
      { id: 3, rol: "Supervisor Frío", nombre: "Ana Rodríguez", empresa: "SAFCO S.A.C.", doc: "41903212", firma: generateDnieSignatureSvg("Ana Rodríguez", "41903212") },
      { id: 4, rol: "Chofer Transportista", nombre: "Juan Pérez Rosales", empresa: "TRANS-AGRO E.I.R.L.", doc: "09876543", firma: generateDnieSignatureSvg("Juan Pérez", "09876543") },
      { id: 5, rol: "Inspector SENASA", nombre: "Ing. Roberto Gutiérrez", empresa: "SENASA ICA", doc: "25890123", firma: generateDnieSignatureSvg("Roberto Gutiérrez", "25890123") }
    ],
    evidencias: {
      seguridad: [
        {
          tipo: "Inspección Estructura e Higiene del Contenedor",
          fotos: [
            { id: "s1", url: createSvgDataUrl("Estructura Contenedor Interior", "#4f46e5"), caption: "Paredes internas limpias" },
            { id: "s2", url: createSvgDataUrl("Piso T-Floor Contenedor", "#4f46e5"), caption: "Inspección de piso" }
          ]
        }
      ],
      calidad: [
        {
          tipo: "Desarrollo de la Operación de Empaque",
          fotos: [
            { id: "c1", url: createSvgDataUrl("Empaque Pallet 01", "#05696d"), caption: "Cajas punnets inspeccionadas" }
          ]
        },
        {
          tipo: "Inspección de Pulpa y Evaluación de Fruta",
          fotos: [
            { id: "c3", url: createSvgDataUrl("Medición Temp Pulpa (0.1°C)", "#05696d"), caption: "Medición de temperatura pulpa" }
          ]
        }
      ],
      frio: [
        {
          tipo: "Ubicación de Termógrafos y Sensores",
          fotos: [
            { id: "f1", url: createSvgDataUrl("Ubicación 1° Termógrafo", "#0284c7"), caption: "1° Termógrafo en Pallet 01" },
            { id: "f3", url: createSvgDataUrl("Sensor Senasa 1", "#0284c7"), caption: "Sensor 1 instalado por SENASA" }
          ]
        }
      ]
    },
    conclusionesSeleccionadas: [
      "La altura de los pallets que conforman la carga siempre está por debajo de la línea límite del contenedor.",
      "Toda colocación de sensores de frío es realizada exclusivamente por el inspector de SENASA asignado.",
      "La colocación de precintos de seguridad (SAFCO, SENASA, Línea) se realizó en presencia del chofer y seguridad patrimonial."
    ],
    conclusiónCustom: ""
  },
  {
    id: "INF-002",
    instruccionEmbarque: "ASP011",
    nroInforme: "INFORME DE EMBARQUE N° 034.AC-2025",
    nroEmbarque: "SAF002",
    contenedor: "SUDU 778129-0",
    booking: "SUDU77812901",
    cliente: "VANGUARD LOGISTICS",
    productor: "AGRICOLA TAMBO COLORADO S.A.C.",
    variedad: "SWEET GLOBE",
    programa: "CLAMSHELL 3.5KG",
    campana: "UVA-2025",
    fechaEmbarque: "2025-01-06",
    guias: "T007 - 0000130",
    packingList: "PL-UV-002-A",
    estadoGeneral: "En Proceso",
    dictamenGeneral: "Conforme",
    areas: {
      seguridad: { status: "ready", dictamen: "Conforme", fecha: "2025-01-06 09:00", inspector: "Carlos Mendoza" },
      calidad: { status: "ready", dictamen: "Conforme", fecha: "2025-01-06 10:15", inspector: "Marcos Vilca" },
      frio: { status: "pending", dictamen: "Pendiente", fecha: "-", inspector: "Ana Rodríguez" }
    },
    datosSeguridad: {
      dictamen: "Conforme",
      observaciones: ["Precintos de garita verificados sin observaciones."]
    },
    datosCalidad: {
      dictamen: "Conforme",
      paletasEvaluadas: [
        { nro: 1, nroPallet: "BBP01260725003C", productor: "BYBLUE PERU", variedad: "SWEET GLOBE", temp: 0.2, hora: "09:45", cumple: "Conforme" }
      ],
      observaciones: "Calidad conforme para empaque SWEET GLOBE."
    },
    datosFrio: {
      dictamen: "Conforme",
      precintoSafco: "SAF-99121",
      precintoSenasa: "SEN-44103",
      precintoLinea: "SUDU-881293",
      dispositivos: [
        { tipo: "1° Termógrafo", codigo: "TERM-883", ubicacion: "Pallet 01" }
      ],
      esquemaPaletas: [
        { pos: 1, codigo: "ASP1", estado: "ok" },
        { pos: 2, codigo: "ASP2", estado: "ok" }
      ],
      observaciones: "En proceso de estiba."
    },
    participantes: [
      { id: 1, rol: "Seguridad Patrimonial", nombre: "Carlos Mendoza", empresa: "SAFCO S.A.C.", doc: "10982345", firma: generateDnieSignatureSvg("Carlos Mendoza", "10982345") }
    ],
    evidencias: {
      seguridad: [{ tipo: "Inspección Estructura e Higiene del Contenedor", fotos: [] }],
      calidad: [{ tipo: "Desarrollo de la Operación de Empaque", fotos: [] }],
      frio: [{ tipo: "Ubicación de Termógrafos y Sensores", fotos: [] }]
    },
    conclusionesSeleccionadas: [],
    conclusiónCustom: ""
  }
];

let activeInformes = [];
let currentInformeId = null;
let currentTabArea = "all";
let dnieSelectedParticipantId = null;

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("safco_informes_embarque_v3.5")) {
    try {
      activeInformes = JSON.parse(localStorage.getItem("safco_informes_embarque_v3.5"));
    } catch(e) {
      activeInformes = informesMock;
    }
  } else {
    activeInformes = informesMock;
    saveToStorage();
  }

  renderTabla();
  renderTarjetasMovil();
  setupEventListeners();
});

function saveToStorage() {
  localStorage.setItem("safco_informes_embarque_v3.5", JSON.stringify(activeInformes));
}

function setupEventListeners() {
  document.getElementById("filterCampana").addEventListener("change", applyFilters);
  document.getElementById("filterInstruccion").addEventListener("change", applyFilters);
  document.getElementById("filterFechaDesde").addEventListener("change", applyFilters);
  document.getElementById("filterFechaHasta").addEventListener("change", applyFilters);
  document.getElementById("filterCliente").addEventListener("change", applyFilters);
  document.getElementById("filterEstado").addEventListener("change", applyFilters);
  document.getElementById("filterSearch").addEventListener("input", applyFilters);
}

function applyFilters() {
  const campana = document.getElementById("filterCampana").value;
  const instruccion = document.getElementById("filterInstruccion").value;
  const fechaDesde = document.getElementById("filterFechaDesde").value;
  const fechaHasta = document.getElementById("filterFechaHasta").value;
  const cliente = document.getElementById("filterCliente").value;
  const estado = document.getElementById("filterEstado").value;
  const search = document.getElementById("filterSearch").value.toLowerCase().trim();

  const filtered = activeInformes.filter(item => {
    if (campana && item.campana !== campana) return false;
    if (instruccion && item.instruccionEmbarque !== instruccion) return false;
    if (fechaDesde && item.fechaEmbarque < fechaDesde) return false;
    if (fechaHasta && item.fechaEmbarque > fechaHasta) return false;
    if (cliente && item.cliente !== cliente) return false;
    if (estado && item.estadoGeneral !== estado) return false;
    if (search) {
      const matchSearch = item.nroInforme.toLowerCase().includes(search) ||
                          item.instruccionEmbarque.toLowerCase().includes(search) ||
                          item.nroEmbarque.toLowerCase().includes(search) ||
                          item.contenedor.toLowerCase().includes(search) ||
                          item.booking.toLowerCase().includes(search);
      if (!matchSearch) return false;
    }
    return true;
  });

  renderTabla(filtered);
  renderTarjetasMovil(filtered);
}

function renderTabla(dataList = activeInformes) {
  const tbody = document.getElementById("informesTbody");
  if (!tbody) return;

  if (dataList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="padding: 2rem; color: #94a3b8;">No se encontraron informes para la Instrucción de Embarque o filtro seleccionado.</td></tr>`;
    return;
  }

  tbody.innerHTML = dataList.map(item => {
    const badgeSeg = getAreaBadgeHtml("SEG", item.areas.seguridad.status);
    const badgeCal = getAreaBadgeHtml("CAL", item.areas.calidad.status);
    const badgeFrio = getAreaBadgeHtml("FRÍO", item.areas.frio.status);

    const statusGeneralBadge = item.estadoGeneral === "Completo" 
      ? `<span class="area-badge ready"><i class='bx bx-check-circle'></i> COMPLETO</span>`
      : `<span class="area-badge pending"><i class='bx bx-time-five'></i> EN PROCESO</span>`;

    const resultGeneralBadge = (item.dictamenGeneral || "Conforme") === "Conforme"
      ? `<span class="area-badge ready" style="background:#dcfce7; color:#15803d; border-color:#86efac;"><i class='bx bx-check-circle'></i> CONFORME</span>`
      : `<span class="area-badge incomplete" style="background:#fee2e2; color:#b91c1c; border-color:#fca5a5;"><i class='bx bx-x-circle'></i> RECHAZADO</span>`;

    return `
      <tr>
        <td style="font-weight: 800; color: #d30c0c;"><i class='bx bx-purchase-tag-alt'></i> ${item.instruccionEmbarque}</td>
        <td>${item.fechaEmbarque}</td>
        <td style="font-weight:600;">${item.nroEmbarque}</td>
        <td style="font-weight:700; color: #0f172a;">${item.contenedor}</td>
        <td>${item.cliente}</td>
        <td><span style="font-size:0.75rem; background:#f1f5f9; padding:0.2rem 0.5rem; border-radius:4px; font-weight:600;">${item.variedad}</span></td>
        <td>${item.participantes.length} pers.</td>
        <td>
          <div class="area-badges-group">
            ${badgeSeg} ${badgeCal} ${badgeFrio}
          </div>
        </td>
        <td>
          <div style="display:flex; flex-direction:column; gap:0.25rem; align-items:center;">
            ${statusGeneralBadge}
            ${resultGeneralBadge}
          </div>
        </td>
        <td>
          <div style="display:flex; justify-content:center; gap:0.35rem;">
            <button class="btn-action-trigger" title="Ver / Editar Informe por Áreas" onclick="openEditarInformeModal('${item.id}', 'all')">
              <i class='bx bx-edit-alt'></i>
            </button>
            <button class="btn-action-trigger" title="Exportar PDF" onclick="exportarInformePDF('${item.id}')" style="color:#d30c0c; border-color:#fecaca;">
              <i class='bx bxs-file-pdf'></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function renderTarjetasMovil(dataList = activeInformes) {
  const container = document.getElementById("mobileCardsContainer");
  if (!container) return;

  if (dataList.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:2rem; color:#94a3b8;">No hay registros disponibles.</div>`;
    return;
  }

  container.innerHTML = dataList.map(item => `
    <div class="mobile-card" onclick="openEditarInformeModal('${item.id}', 'all')">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
        <span style="font-weight:800; color:#d30c0c; font-size:0.9rem;">IE: ${item.instruccionEmbarque}</span>
        <span class="area-badge ${item.estadoGeneral === 'Completo' ? 'ready' : 'pending'}">${item.estadoGeneral}</span>
      </div>
      <div style="font-size:0.8rem; color:#475569; display:grid; grid-template-columns:1fr 1fr; gap:0.4rem;">
        <div><strong>Contenedor:</strong> ${item.contenedor}</div>
        <div><strong>Embarque:</strong> ${item.nroEmbarque}</div>
        <div><strong>Cliente:</strong> ${item.cliente}</div>
        <div><strong>Fecha:</strong> ${item.fechaEmbarque}</div>
      </div>
      <div style="margin-top:0.75rem; pt:0.5rem; border-top:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
        <div class="area-badges-group">
          ${getAreaBadgeHtml("SEG", item.areas.seguridad.status)}
          ${getAreaBadgeHtml("CAL", item.areas.calidad.status)}
          ${getAreaBadgeHtml("FRÍO", item.areas.frio.status)}
        </div>
        <button class="btn-primary-safco" style="padding:0.3rem 0.75rem; font-size:0.75rem;" onclick="event.stopPropagation(); exportarInformePDF('${item.id}')">
          <i class='bx bxs-file-pdf'></i> PDF
        </button>
      </div>
    </div>
  `).join("");
}

function getAreaBadgeHtml(label, status) {
  if (status === "ready") {
    return `<span class="area-badge ready" title="${label}: Confirmado por Área"><i class='bx bx-check'></i> ${label}</span>`;
  } else if (status === "pending") {
    return `<span class="area-badge pending" title="${label}: Pendiente de Confirmación"><i class='bx bx-time'></i> ${label}</span>`;
  }
  return `<span class="area-badge incomplete" title="${label}: Incompleto"><i class='bx bx-x'></i> ${label}</span>`;
}

function openEditarInformeModal(id, initialTab = 'all') {
  currentInformeId = id;
  const item = activeInformes.find(i => i.id === id);
  if (!item) return;

  document.getElementById("modalNroInformeText").innerText = item.nroInforme;
  document.getElementById("modalContenedorText").innerText = `Instrucción: ${item.instruccionEmbarque} | Contenedor: ${item.contenedor}`;

  // Cargar valores en formulario principal
  document.getElementById("editInstruccionEmbarque").value = item.instruccionEmbarque || "";
  document.getElementById("editNroEmbarque").value = item.nroEmbarque;
  document.getElementById("editContenedor").value = item.contenedor;
  document.getElementById("editBooking").value = item.booking;
  document.getElementById("editCliente").value = item.cliente;
  document.getElementById("editProductor").value = item.productor;
  document.getElementById("editVariedad").value = item.variedad;
  document.getElementById("editPrograma").value = item.programa;
  document.getElementById("editFechaEmbarque").value = item.fechaEmbarque;
  document.getElementById("editGuias").value = item.guias;
  document.getElementById("editPackingList").value = item.packingList;

  const editDictGen = document.getElementById("editDictamenGeneral");
  if (editDictGen) {
    editDictGen.value = item.dictamenGeneral || "Conforme";
    updateDictamenGeneralColor(editDictGen);
  }

  // Cargar Dictámenes por cada área
  const segElem = document.getElementById("segDictamen");
  const calElem = document.getElementById("calDictamen");
  const frioElem = document.getElementById("frioDictamen");

  if (segElem) { segElem.value = item.datosSeguridad.dictamen || "Conforme"; updateDictamenColor(segElem); }
  if (calElem) { calElem.value = item.datosCalidad.dictamen || "Conforme"; updateDictamenColor(calElem); }
  if (frioElem) { frioElem.value = item.datosFrio.dictamen || "Conforme"; updateDictamenColor(frioElem); }

  renderObservacionesSeguridadModal(item);

  // Cargar datos de Frío
  document.getElementById("frioPrecintoSafco").value = item.datosFrio.precintoSafco || "";
  document.getElementById("frioPrecintoSenasa").value = item.datosFrio.precintoSenasa || "";
  document.getElementById("frioPrecintoLinea").value = item.datosFrio.precintoLinea || "";
  document.getElementById("frioObs").value = item.datosFrio.observaciones || "";

  // Cargar Calidad Observaciones
  document.getElementById("calObs").value = item.datosCalidad.observaciones || "";

  // Cargar Cajas de Confirmación por Área
  renderValidacionCheckboxesModal(item);

  // Cargar Conclusiones Checkbox
  renderConclusionesCheckboxes(item);

  renderPaletasCalidadModal(item);
  renderDispositivosFrioModal(item);
  renderEsquemaCargaContenedorExacto(item);
  renderEvidenciasPorTiposModal(item);
  renderParticipantesModal(item);

  switchModalTab(initialTab);

  document.getElementById("modalInformeOverlay").classList.add("open");
}

function updateDictamenColor(elem) {
  if (!elem) return;
  if (elem.value === "Rechazado") {
    elem.style.color = "#d30c0c";
    elem.style.borderColor = "#fca5a5";
    elem.style.backgroundColor = "#fef2f2";
  } else {
    elem.style.color = "#059669";
    elem.style.borderColor = "#86efac";
    elem.style.backgroundColor = "#f0fdf4";
  }
}

function updateDictamenGeneralColor(elem) {
  if (!elem) return;
  const containerBox = document.getElementById("dictamenGeneralContainerBox");
  if (elem.value === "Rechazado") {
    elem.style.color = "#d30c0c";
    elem.style.borderColor = "#fca5a5";
    elem.style.backgroundColor = "#fef2f2";
    if (containerBox) {
      containerBox.style.background = "#fef2f2";
      containerBox.style.borderColor = "#fca5a5";
    }
  } else {
    elem.style.color = "#059669";
    elem.style.borderColor = "#86efac";
    elem.style.backgroundColor = "#f0fdf4";
    if (containerBox) {
      containerBox.style.background = "#f0fdf4";
      containerBox.style.borderColor = "#86efac";
    }
  }
}

function handleDictamenGeneralChange(val) {
  const item = activeInformes.find(i => i.id === currentInformeId);
  if (!item) return;

  item.dictamenGeneral = val;

  const editDictGen = document.getElementById("editDictamenGeneral");
  if (editDictGen) updateDictamenGeneralColor(editDictGen);

  if (val === "Rechazado") {
    item.datosSeguridad.dictamen = "Rechazado";
    item.datosCalidad.dictamen = "Rechazado";
    item.datosFrio.dictamen = "Rechazado";

    const segSelect = document.getElementById("segDictamen");
    const calSelect = document.getElementById("calDictamen");
    const frioSelect = document.getElementById("frioDictamen");

    if (segSelect) { segSelect.value = "Rechazado"; updateDictamenColor(segSelect); }
    if (calSelect) { calSelect.value = "Rechazado"; updateDictamenColor(calSelect); }
    if (frioSelect) { frioSelect.value = "Rechazado"; updateDictamenColor(frioSelect); }

    Swal.fire({
      icon: 'warning',
      title: 'Informe Final RECHAZADO',
      text: 'Al cambiar el Resultado Final del Informe a RECHAZADO, se han actualizado en cascada los dictámenes de Seguridad, Calidad y Frío a RECHAZADO.',
      confirmButtonColor: '#d30c0c'
    });
  } else {
    const segSelect = document.getElementById("segDictamen");
    const calSelect = document.getElementById("calDictamen");
    const frioSelect = document.getElementById("frioDictamen");

    if (segSelect) updateDictamenColor(segSelect);
    if (calSelect) updateDictamenColor(calSelect);
    if (frioSelect) updateDictamenColor(frioSelect);
  }

  saveToStorage();
  renderTabla();
  renderTarjetasMovil();
}

function guardarDictamenFinalConConclusiones() {
  const item = activeInformes.find(i => i.id === currentInformeId);
  if (!item) return;

  const dictamenVal = document.getElementById("editDictamenGeneral").value;
  const conclusionCustomVal = document.getElementById("editConclusionCustom").value.trim();

  Swal.fire({
    title: 'Guardando Dictamen Final y Conclusiones...',
    text: 'Sincronizando el resultado general del informe con el servidor de SAFCO...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  setTimeout(() => {
    item.dictamenGeneral = dictamenVal;
    item.conclusiónCustom = conclusionCustomVal;

    if (dictamenVal === "Rechazado") {
      item.datosSeguridad.dictamen = "Rechazado";
      item.datosCalidad.dictamen = "Rechazado";
      item.datosFrio.dictamen = "Rechazado";
    }

    saveToStorage();
    renderTabla();
    renderTarjetasMovil();

    Swal.fire({
      icon: 'success',
      title: '¡Dictamen y Conclusiones Guardados!',
      text: `El resultado final (${dictamenVal.toUpperCase()}) y las conclusiones del informe han sido confirmados.`,
      confirmButtonColor: '#004a4c'
    });
  }, 1200);
}

// CONFIRMACIÓN INDIVIDUAL DE REGISTRO POR ÁREA (PETICIÓN BACKEND SIMULADA)
function renderValidacionCheckboxesModal(item) {
  setupSingleAreaValidationBox(item, "seguridad", "segValidationBox", "segValidationIcon", "segValidationTitle", "segValidationMeta", "segValidationActionBtn", "Carlos Mendoza", "Seguridad Patrimonial", "#4f46e5");
  setupSingleAreaValidationBox(item, "calidad", "calValidationBox", "calValidationIcon", "calValidationTitle", "calValidationMeta", "calValidationActionBtn", "Marcos Vilca", "Calidad (Pre-Embarque)", "#05696d");
  setupSingleAreaValidationBox(item, "frio", "frioValidationBox", "frioValidationIcon", "frioValidationTitle", "frioValidationMeta", "frioValidationActionBtn", "Ana Rodríguez", "Frío y Despacho", "#0284c7");
}

function setupSingleAreaValidationBox(item, areaKey, boxId, iconId, titleId, metaId, actionBtnId, defaultInspector, areaLabel, areaColor) {
  const box = document.getElementById(boxId);
  const icon = document.getElementById(iconId);
  const title = document.getElementById(titleId);
  const meta = document.getElementById(metaId);
  const actionBtnContainer = document.getElementById(actionBtnId);

  if (!box || !title || !meta || !actionBtnContainer) return;

  const isReady = item.areas[areaKey] && item.areas[areaKey].status === "ready";

  if (isReady) {
    box.classList.remove("pending-box");
    icon.innerHTML = `<i class='bx bx-check-circle' style="color:#059669;"></i>`;
    title.innerText = `Registro de ${areaLabel}: CONFIRMADO Y GUARDADO`;
    title.style.color = "#059669";
    const insp = item.areas[areaKey].inspector || defaultInspector;
    const fecha = item.areas[areaKey].fecha || new Date().toLocaleDateString();
    meta.innerHTML = `✓ Confirmado por <strong>${insp}</strong> (${fecha})`;

    actionBtnContainer.innerHTML = `
      <button type="button" class="btn-secondary-safco" style="font-size:0.78rem; padding:0.4rem 0.85rem;" onclick="reabrirAreaBackend('${areaKey}')">
        <i class='bx bx-lock-open-alt'></i> Reabrir para Modificar
      </button>
    `;
  } else {
    box.classList.add("pending-box");
    icon.innerHTML = `<i class='bx bx-time-five' style="color:#d97706;"></i>`;
    title.innerText = `Registro de ${areaLabel}: PENDIENTE`;
    title.style.color = "#b45309";
    meta.innerHTML = `Aún no se ha enviado la confirmación del área.`;

    actionBtnContainer.innerHTML = `
      <button type="button" class="btn-primary-safco" style="background:${areaColor}; font-size:0.8rem; padding:0.5rem 1rem;" onclick="confirmarAreaBackend('${areaKey}')">
        <i class='bx bx-check-circle'></i> Confirmar y Guardar Registro de ${areaLabel.split(" ")[0]}
      </button>
    `;
  }
}

function confirmarAreaBackend(areaKey) {
  const item = activeInformes.find(i => i.id === currentInformeId);
  if (!item) return;

  let inspectorName = "CARLOS MENDOZA";
  if (areaKey === "calidad") inspectorName = "MARCOS VILCA";
  else if (areaKey === "frio") inspectorName = "ANA RODRÍGUEZ";

  Swal.fire({
    title: `Guardando Registro de ${areaKey.toUpperCase()}...`,
    text: 'Sincronizando datos e imágenes con el servidor de SAFCO...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  setTimeout(() => {
    item.areas[areaKey].status = "ready";
    item.areas[areaKey].fecha = new Date().toLocaleString();
    item.areas[areaKey].inspector = inspectorName;

    // Evaluar si las 3 áreas han confirmado
    if (item.areas.seguridad.status === "ready" && item.areas.calidad.status === "ready" && item.areas.frio.status === "ready") {
      item.estadoGeneral = "Completo";
    } else {
      item.estadoGeneral = "En Proceso";
    }

    saveToStorage();
    renderValidacionCheckboxesModal(item);
    renderTabla();
    renderTarjetasMovil();

    Swal.fire({
      icon: 'success',
      title: '¡Registro Confirmado!',
      text: `Los datos del área de ${areaKey.toUpperCase()} han sido guardados correctamente en el servidor.`,
      confirmButtonColor: '#004a4c'
    });
  }, 1200);
}

function reabrirAreaBackend(areaKey) {
  const item = activeInformes.find(i => i.id === currentInformeId);
  if (!item) return;

  item.areas[areaKey].status = "pending";
  item.estadoGeneral = "En Proceso";

  saveToStorage();
  renderValidacionCheckboxesModal(item);
  renderTabla();
  renderTarjetasMovil();

  Swal.fire({
    icon: 'info',
    title: 'Registro Reabierto',
    text: `El área de ${areaKey.toUpperCase()} se encuentra en modo edición. Recuerde volver a confirmar al finalizar.`,
    confirmButtonColor: '#004a4c'
  });
}

// OCULTAMIENTO REAL DE SECCIONES POR ÁREA
function switchModalTab(tabArea) {
  currentTabArea = tabArea;

  document.querySelectorAll(".area-tab-btn").forEach(btn => btn.classList.remove("active"));
  const activeBtn = document.querySelector(`.area-tab-btn[data-tab="${tabArea}"]`);
  if (activeBtn) activeBtn.classList.add("active");

  const secSeguridad = document.getElementById("secSeguridad");
  const secCalidad = document.getElementById("secCalidad");
  const secFrio = document.getElementById("secFrio");

  if (tabArea === "all") {
    secSeguridad.style.display = "block";
    secCalidad.style.display = "block";
    secFrio.style.display = "block";
  } else if (tabArea === "seguridad") {
    secSeguridad.style.display = "block";
    secCalidad.style.display = "none";
    secFrio.style.display = "none";
  } else if (tabArea === "calidad") {
    secSeguridad.style.display = "none";
    secCalidad.style.display = "block";
    secFrio.style.display = "none";
  } else if (tabArea === "frio") {
    secSeguridad.style.display = "none";
    secCalidad.style.display = "none";
    secFrio.style.display = "block";
  }
}

// 1. SEGURIDAD
function renderObservacionesSeguridadModal(item) {
  const container = document.getElementById("segObsListContainer");
  if (!container) return;

  const obsList = item.datosSeguridad.observaciones || [];
  if (obsList.length === 0) {
    container.innerHTML = `<div style="font-size:0.8rem; color:#94a3b8; font-style:italic;">No hay observaciones registradas.</div>`;
    return;
  }

  container.innerHTML = obsList.map((obs, idx) => `
    <div style="display:flex; gap:0.5rem; margin-bottom:0.4rem;">
      <input type="text" class="form-input" value="${obs}" onchange="actualizarObsSeguridad(${idx}, this.value)">
      <button type="button" class="btn-action-trigger" style="color:#e11d48;" onclick="eliminarObsSeguridad(${idx})">
        <i class='bx bx-trash'></i>
      </button>
    </div>
  `).join("");
}

function agregarObsSeguridadPrompt() {
  const item = activeInformes.find(i => i.id === currentInformeId);
  if (!item) return;

  const obs = prompt("Ingrese observación de Seguridad Patrimonial:", "Inspección de puerta y sello aprobados sin anomalías.");
  if (!obs) return;

  if (!item.datosSeguridad.observaciones) item.datosSeguridad.observaciones = [];
  item.datosSeguridad.observaciones.push(obs);

  saveToStorage();
  renderObservacionesSeguridadModal(item);
}

function actualizarObsSeguridad(idx, val) {
  const item = activeInformes.find(i => i.id === currentInformeId);
  if (!item) return;

  item.datosSeguridad.observaciones[idx] = val;
  saveToStorage();
}

function eliminarObsSeguridad(idx) {
  const item = activeInformes.find(i => i.id === currentInformeId);
  if (!item) return;

  item.datosSeguridad.observaciones.splice(idx, 1);
  saveToStorage();
  renderObservacionesSeguridadModal(item);
}

// 2. PRE-EMBARQUE CALIDAD
function renderPaletasCalidadModal(item) {
  const tbody = document.getElementById("paletasCalidadTbody");
  const spanProm = document.getElementById("calTempPromText");
  if (!tbody) return;

  const paletas = item.datosCalidad.paletasEvaluadas || [];
  
  let suma = 0;
  paletas.forEach(p => suma += parseFloat(p.temp || 0));
  const prom = paletas.length > 0 ? (suma / paletas.length).toFixed(2) : "0.00";
  if (spanProm) spanProm.innerText = `${prom} °C (${paletas.length} paletas evaluadas)`;

  tbody.innerHTML = paletas.map(p => `
    <tr>
      <td><strong>${p.nro}</strong></td>
      <td style="font-weight:700; color:#004a4c;">${p.nroPallet}</td>
      <td>${p.productor}</td>
      <td><span style="font-size:0.75rem; background:#f1f5f9; padding:0.15rem 0.4rem; border-radius:4px;">${p.variedad}</span></td>
      <td style="font-weight:700; color:#05696d;">${p.temp} °C</td>
      <td>${p.hora}</td>
      <td><span class="area-badge ready">${p.cumple}</span></td>
    </tr>
  `).join("");
}

// 3. FRÍO: DISPOSITIVOS
function renderDispositivosFrioModal(item) {
  const tbody = document.getElementById("dispositivosFrioTbody");
  if (!tbody) return;

  const disp = item.datosFrio.dispositivos || [];
  tbody.innerHTML = disp.map(d => `
    <tr>
      <td><strong>${d.tipo}</strong></td>
      <td style="font-weight:700; color:#0284c7;">${d.codigo}</td>
      <td>${d.ubicacion}</td>
    </tr>
  `).join("");
}

function renderEsquemaCargaContenedorExacto(item) {
  const container = document.getElementById("contenedorEsquemaGridExact");
  if (!container) return;

  const paletas = item.datosFrio.esquemaPaletas || [];
  let html = "";

  paletas.forEach(p => {
    let cardClass = "reefer-pallet-card";
    if (p.estado === "ok") cardClass += " status-ok";
    else if (p.estado === "alert") cardClass += " status-alert";
    else if (p.estado === "empty") cardClass += " status-empty";

    if (p.pos === 23) cardClass += " reefer-pallet-23";

    let sensorBadge = p.sensor ? `<div class="reefer-sensor-pill">📡 ${p.sensor}</div>` : "";

    html += `
      <div class="${cardClass}">
        <span class="reefer-pallet-number">${p.pos}</span>
        <span class="reefer-pallet-code">${p.codigo}</span>
        ${sensorBadge}
      </div>
    `;
  });

  container.innerHTML = html;
}

// EVIDENCIAS POR TIPOS
function renderEvidenciasPorTiposModal(item) {
  renderSeccionEvidenciaTipos("containerEvidenciasSeguridad", item.evidencias.seguridad, "seguridad");
  renderSeccionEvidenciaTipos("containerEvidenciasCalidad", item.evidencias.calidad, "calidad");
  renderSeccionEvidenciaTipos("containerEvidenciasFrio", item.evidencias.frio, "frio");
}

function renderSeccionEvidenciaTipos(containerId, listaTipos, areaKey) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!listaTipos || listaTipos.length === 0) {
    container.innerHTML = `<div style="font-size:0.8rem; color:#94a3b8; font-style:italic;">No hay categorías creadas.</div>`;
    return;
  }

  container.innerHTML = listaTipos.map((g, typeIndex) => `
    <div class="type-evidence-group">
      <div class="type-evidence-header">
        <span><i class='bx bx-folder-open' style="color:#004a4c;"></i> ${g.tipo}</span>
        <span class="area-badge ready">${g.fotos ? g.fotos.length : 0} Fotos</span>
      </div>
      <div class="photo-grid-preview">
        ${(g.fotos || []).map((ev, photoIndex) => `
          <div class="photo-box">
            <img src="${ev.url}" alt="${ev.caption}">
            <div class="photo-box-actions">
              <button type="button" class="btn-photo-del" onclick="eliminarFotoDeTipo('${areaKey}', ${typeIndex}, '${ev.id}')" title="Eliminar Foto"><i class='bx bx-x'></i></button>
            </div>
            <div class="photo-box-caption">${ev.caption || g.tipo}</div>
          </div>
        `).join("")}

        <!-- Botón Cargar Foto -->
        <label class="photo-box" style="border-style:dashed;">
          <i class='bx bx-plus-circle' style="font-size:1.6rem; color:#004a4c;"></i>
          <span style="font-size:0.68rem; font-weight:700; color:#004a4c; margin-top:0.2rem;">+ Foto</span>
          <input type="file" accept="image/*" hidden onchange="subirFotoEnTipo(this, '${areaKey}', ${typeIndex})">
        </label>
      </div>
    </div>
  `).join("");
}

function subirFotoEnTipo(input, areaKey, typeIndex) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    const item = activeInformes.find(i => i.id === currentInformeId);
    if (!item) return;

    if (!item.evidencias[areaKey][typeIndex].fotos) item.evidencias[areaKey][typeIndex].fotos = [];

    const nuevaFoto = {
      id: "foto_" + Date.now(),
      url: e.target.result,
      caption: file.name.substring(0, 20)
    };

    item.evidencias[areaKey][typeIndex].fotos.push(nuevaFoto);
    saveToStorage();
    renderEvidenciasPorTiposModal(item);
  };

  reader.readAsDataURL(file);
}

function eliminarFotoDeTipo(areaKey, typeIndex, fotoId) {
  const item = activeInformes.find(i => i.id === currentInformeId);
  if (!item) return;

  item.evidencias[areaKey][typeIndex].fotos = item.evidencias[areaKey][typeIndex].fotos.filter(f => f.id !== fotoId);
  saveToStorage();
  renderEvidenciasPorTiposModal(item);
}

// PARTICIPANTES Y FIRMA ELECTRÓNICA DNI-e
function renderParticipantesModal(item) {
  const tbody = document.getElementById("participantesTbody");
  if (!tbody) return;

  tbody.innerHTML = item.participantes.map(p => `
    <tr>
      <td><strong>${p.rol}</strong></td>
      <td>${p.nombre}</td>
      <td>${p.empresa}</td>
      <td>${p.doc}</td>
      <td>
        ${p.firma ? 
          `<div class="signature-badge signed" onclick="abrirModalDnieReader(${p.id})"><img src="${p.firma}" class="signature-img-sm"> <i class='bx bx-check-double'></i> Firmado DNI-e</div>` : 
          `<button type="button" class="signature-badge unsigned" onclick="abrirModalDnieReader(${p.id})"><i class='bx bx-chip'></i> Firmar con DNI-e</button>`
        }
      </td>
      <td style="text-align:right;">
        <button type="button" class="btn-action-trigger" style="width:24px; height:24px; color:#e11d48;" onclick="eliminarParticipante(${p.id})">
          <i class='bx bx-trash'></i>
        </button>
      </td>
    </tr>
  `).join("");
}

// MODAL SELECCIONADOR DE PARTICIPANTES
function openBuscarParticipanteModal() {
  document.getElementById("searchParticipanteInput").value = "";
  mostrarListaBuscadorParticipantes();
  renderDirectorioParticipantesModal();
  document.getElementById("modalBuscarParticipanteOverlay").classList.add("open");
}

function cerrarModalBuscarParticipante() {
  document.getElementById("modalBuscarParticipanteOverlay").classList.remove("open");
}

function mostrarListaBuscadorParticipantes() {
  document.getElementById("viewListaBuscadorParticipantes").style.display = "block";
  document.getElementById("viewFormularioNuevoParticipante").style.display = "none";
}

function mostrarFormularioNuevoParticipante() {
  document.getElementById("viewListaBuscadorParticipantes").style.display = "none";
  document.getElementById("viewFormularioNuevoParticipante").style.display = "block";
  
  // Limpiar campos del sub-formulario
  document.getElementById("newPartNombre").value = "";
  document.getElementById("newPartDoc").value = "";
  document.getElementById("newPartRol").value = "";
  document.getElementById("newPartEmpresa").value = "SAFCO S.A.C.";
  document.getElementById("newPartBrevete").value = "";
  document.getElementById("newPartCorreo").value = "";
}

function renderDirectorioParticipantesModal(query = "") {
  const container = document.getElementById("directorioParticipantesListContainer");
  if (!container) return;

  const search = query.toLowerCase().trim();

  const filtered = directorioParticipantes.filter(p => {
    if (!search) return true;
    return p.nombre.toLowerCase().includes(search) ||
           p.doc.toLowerCase().includes(search) ||
           p.rol.toLowerCase().includes(search) ||
           p.empresa.toLowerCase().includes(search);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:2rem 1rem; color:#94a3b8;">
        <i class='bx bx-user-x' style="font-size:2.5rem; margin-bottom:0.5rem; color:#cbd5e1;"></i>
        <div style="font-weight:700; font-size:0.9rem;">No se encontraron participantes en el directorio.</div>
        <p style="font-size:0.78rem; margin-top:0.3rem;">Utilice el botón inferior para registrar un nuevo participante.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => `
    <div class="directory-participant-card">
      <div style="display:flex; align-items:center; gap:0.85rem;">
        <div class="participant-avatar-icon">
          ${p.nombre.charAt(0)}
        </div>
        <div>
          <div style="font-weight:800; color:#0f172a; font-size:0.88rem;">${p.nombre}</div>
          <div style="font-size:0.75rem; color:#004a4c; font-weight:700;">${p.rol} <span style="color:#64748b; font-weight:400;">(${p.empresa})</span></div>
          <div style="font-size:0.7rem; color:#64748b;">DNI: <strong>${p.doc}</strong> ${p.brevete ? '| Lic: ' + p.brevete : ''}</div>
        </div>
      </div>
      <button type="button" class="btn-primary-safco" style="padding:0.35rem 0.75rem; font-size:0.75rem; background:#004a4c;" onclick="seleccionarParticipanteDelDirectorio(${p.id})">
        <i class='bx bx-plus'></i> Seleccionar
      </button>
    </div>
  `).join("");
}

function seleccionarParticipanteDelDirectorio(pId) {
  const pData = directorioParticipantes.find(p => p.id === pId);
  if (!pData) return;

  const item = activeInformes.find(i => i.id === currentInformeId);
  if (!item) return;

  const existe = item.participantes.find(p => p.doc === pData.doc && p.rol === pData.rol);
  if (existe) {
    Swal.fire({
      icon: 'warning',
      title: 'Participante Ya Registrado',
      text: `${pData.nombre} (${pData.rol}) ya forma parte de los participantes de este embarque.`,
      confirmButtonColor: '#004a4c'
    });
    return;
  }

  const nuevoPart = {
    id: Date.now(),
    rol: pData.rol,
    nombre: pData.nombre,
    empresa: pData.empresa,
    doc: pData.doc,
    firma: generateDnieSignatureSvg(pData.nombre, pData.doc)
  };

  item.participantes.push(nuevoPart);
  saveToStorage();
  renderParticipantesModal(item);
  cerrarModalBuscarParticipante();

  Swal.fire({
    icon: 'success',
    title: 'Participante Añadido',
    text: `${pData.nombre} ha sido agregado al informe.`,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000
  });
}

function guardarNuevoParticipanteDirectorio() {
  const nombre = document.getElementById("newPartNombre").value.trim();
  const doc = document.getElementById("newPartDoc").value.trim();
  const rol = document.getElementById("newPartRol").value.trim();
  const empresa = document.getElementById("newPartEmpresa").value.trim();
  const brevete = document.getElementById("newPartBrevete").value.trim();
  const correo = document.getElementById("newPartCorreo").value.trim();

  if (!nombre || !doc || !rol) {
    Swal.fire({
      icon: 'warning',
      title: 'Campos Incompletos',
      text: 'Por favor complete Nombres, DNI y Rol del participante.',
      confirmButtonColor: '#004a4c'
    });
    return;
  }

  const nuevoEnDirectorio = {
    id: Date.now(),
    nombre: nombre,
    doc: doc,
    rol: rol,
    empresa: empresa || "SAFCO S.A.C.",
    brevete: brevete || "",
    correo: correo || ""
  };

  directorioParticipantes.unshift(nuevoEnDirectorio);
  seleccionarParticipanteDelDirectorio(nuevoEnDirectorio.id);
}

function abrirModalDnieReader(pId) {
  dnieSelectedParticipantId = pId;
  const item = activeInformes.find(i => i.id === currentInformeId);
  if (!item) return;

  const part = item.participantes.find(p => p.id === pId);
  if (!part) return;

  document.getElementById("dnieNombreText").innerText = part.nombre;
  document.getElementById("dnieDocText").innerText = part.doc;
  document.getElementById("dnieRolText").innerText = part.rol;

  document.getElementById("dnieStepInitial").style.display = "block";
  document.getElementById("dnieStepReading").style.display = "none";
  document.getElementById("dnieStepSuccess").style.display = "none";

  document.getElementById("modalDnieOverlay").classList.add("open");
}

function simularLecturaChipDnie() {
  document.getElementById("dnieStepInitial").style.display = "none";
  document.getElementById("dnieStepReading").style.display = "block";

  setTimeout(() => {
    const item = activeInformes.find(i => i.id === currentInformeId);
    if (!item) return;

    const part = item.participantes.find(p => p.id === dnieSelectedParticipantId);
    if (part) {
      part.firma = generateDnieSignatureSvg(part.nombre, part.doc);
      saveToStorage();
      renderParticipantesModal(item);
    }

    document.getElementById("dnieStepReading").style.display = "none";
    document.getElementById("dnieStepSuccess").style.display = "block";
  }, 1800);
}

function cerrarModalDnie() {
  document.getElementById("modalDnieOverlay").classList.remove("open");
}

function eliminarParticipante(pId) {
  const item = activeInformes.find(i => i.id === currentInformeId);
  if (!item) return;

  item.participantes = item.participantes.filter(p => p.id !== pId);
  saveToStorage();
  renderParticipantesModal(item);
}

// CONCLUSIONES
function getConclusionesCatalogo() {
  if (localStorage.getItem("safco_conclusiones_embarque_v1")) {
    try {
      const stored = JSON.parse(localStorage.getItem("safco_conclusiones_embarque_v1"));
      const activas = stored.filter(c => c.estado === "Activo").sort((a, b) => a.orden - b.orden);
      if (activas.length > 0) return activas.map(c => c.texto);
    } catch(e){}
  }
  return [
    "La altura de los pallets que conforman la carga siempre está por debajo de la línea límite del contenedor.",
    "Toda colocación de sensores de frío es realizada exclusivamente por el inspector de SENASA asignado.",
    "La colocación de precintos de seguridad (SAFCO, SENASA, Línea) se realizó en presencia del chofer y seguridad patrimonial.",
    "Contenedor reefer inspeccionado en estructura, higiene y sellado hermético en cámara.",
    "Temperatura de fruta y pulpa verificada en rango conforme para exportación."
  ];
}

function renderConclusionesCheckboxes(item) {
  const container = document.getElementById("conclusionesChecklistContainer");
  if (!container) return;

  const seleccionadas = item.conclusionesSeleccionadas || [];
  const listaDisponibles = getConclusionesCatalogo();

  container.innerHTML = listaDisponibles.map((cText, idx) => {
    const isChecked = seleccionadas.includes(cText) ? "checked" : "";
    return `
      <label style="display:flex; align-items:flex-start; gap:0.5rem; font-size:0.82rem; color:#334155; margin-bottom:0.4rem; cursor:pointer;">
        <input type="checkbox" value="${cText}" ${isChecked} onchange="toggleConclusionCheck('${cText.replace(/'/g, "\\'")}', this.checked)">
        <span>${cText}</span>
      </label>
    `;
  }).join("");

  document.getElementById("editConclusionCustom").value = item.conclusiónCustom || "";
}

function toggleConclusionCheck(cText, isChecked) {
  const item = activeInformes.find(i => i.id === currentInformeId);
  if (!item) return;

  if (!item.conclusionesSeleccionadas) item.conclusionesSeleccionadas = [];

  if (isChecked) {
    if (!item.conclusionesSeleccionadas.includes(cText)) item.conclusionesSeleccionadas.push(cText);
  } else {
    item.conclusionesSeleccionadas = item.conclusionesSeleccionadas.filter(c => c !== cText);
  }

  saveToStorage();
}

function closeModalInforme() {
  document.getElementById("modalInformeOverlay").classList.remove("open");
}

// GENERACIÓN Y EXPORTACIÓN PDF
function exportarInformePDF(id) {
  const item = activeInformes.find(i => i.id === id);
  if (!item) return;

  const pdfContainer = document.getElementById("pdfPrintContainer");
  if (!pdfContainer) return;

  const paletasCal = item.datosCalidad.paletasEvaluadas || [];
  let sumaT = 0;
  paletasCal.forEach(p => sumaT += parseFloat(p.temp || 0));
  const tempPromCal = paletasCal.length > 0 ? (sumaT / paletasCal.length).toFixed(2) : "0.00";

  const concList = [...(item.conclusionesSeleccionadas || [])];
  if (item.conclusiónCustom) concList.push(item.conclusiónCustom);

  pdfContainer.innerHTML = `
    <div class="pdf-document">
      <!-- Encabezado SAFCO -->
      <table class="pdf-header-table">
        <tr>
          <td style="width: 25%; text-align: center;">
            <img src="../logo_sin_fondo.png" class="pdf-logo" alt="Logo SAFCO">
          </td>
          <td class="pdf-title-box" style="width: 50%;">
            <h1>AGRICOLA SAFCO S.A.C.</h1>
            <p style="font-size: 1.05rem; font-weight: 800; color: #004a4c; margin-top: 4px;">INFORME DE EMBARQUE GENERAL</p>
            <p style="font-weight:700; color:#d30c0c;">Instrucción: ${item.instruccionEmbarque}</p>
          </td>
          <td style="width: 25%; font-size: 0.75rem; text-align: right;">
            <strong>Código:</strong> INF-EMB-01<br>
            <strong>Versión:</strong> 03<br>
            <strong>Fecha:</strong> ${item.fechaEmbarque}
          </td>
        </tr>
      </table>

      <!-- Datos Principales -->
      <div class="pdf-section-title">1. INFORMACIÓN GENERAL DEL EMBARQUE (INSTRUCCIÓN: ${item.instruccionEmbarque})</div>
      <table class="pdf-meta-table">
        <tr>
          <td class="pdf-meta-label">RESULTADO FINAL:</td>
          <td style="font-weight:800; font-size:0.95rem; color:${(item.dictamenGeneral || 'Conforme') === 'Conforme' ? '#059669' : '#d30c0c'};">
            ${(item.dictamenGeneral || 'Conforme').toUpperCase()}
          </td>
          <td class="pdf-meta-label">N° Embarque:</td>
          <td style="font-weight:700;">${item.nroEmbarque}</td>
        </tr>
        <tr>
          <td class="pdf-meta-label">Contenedor:</td>
          <td style="font-weight:700;">${item.contenedor}</td>
          <td class="pdf-meta-label">Booking:</td>
          <td style="font-weight:700;">${item.booking}</td>
        </tr>
        <tr>
          <td class="pdf-meta-label">Cliente:</td>
          <td>${item.cliente}</td>
          <td class="pdf-meta-label">Productor:</td>
          <td>${item.productor}</td>
        </tr>
        <tr>
          <td class="pdf-meta-label">Variedad:</td>
          <td>${item.variedad}</td>
          <td class="pdf-meta-label">Programa:</td>
          <td>${item.programa}</td>
        </tr>
        <tr>
          <td class="pdf-meta-label">Fecha Embarque:</td>
          <td>${item.fechaEmbarque}</td>
          <td class="pdf-meta-label">Guías de Remisión:</td>
          <td>${item.guias}</td>
        </tr>
        <tr>
          <td class="pdf-meta-label">Packing List:</td>
          <td>${item.packingList}</td>
          <td class="pdf-meta-label">Booking:</td>
          <td>${item.booking}</td>
        </tr>
      </table>

      <!-- 1. INSPECCIÓN DE SEGURIDAD PATRIMONIAL -->
      <div class="pdf-section-title">2. INSPECCIÓN DE SEGURIDAD PATRIMONIAL</div>
      <table class="pdf-meta-table">
        <tr>
          <td class="pdf-meta-label">Dictamen Final:</td>
          <td style="font-weight:700; color:#059669;">${item.datosSeguridad.dictamen || 'Conforme'}</td>
          <td class="pdf-meta-label">Estado Validación:</td>
          <td>${item.areas.seguridad.status === 'ready' ? '✓ CONFIRMADO Y GUARDADO' : 'PENDIENTE'}</td>
        </tr>
      </table>
      <p style="font-size:0.75rem; color:#475569; margin-bottom:0.5rem;">
        <strong>Observaciones de Seguridad:</strong>
        <ul style="margin:0.2rem 0 0 1rem; padding:0;">
          ${(item.datosSeguridad.observaciones || []).map(o => `<li>${o}</li>`).join("")}
        </ul>
      </p>

      <!-- 2. INSPECCIÓN DE PRE-EMBARQUE (CALIDAD) -->
      <div class="pdf-section-title">3. INSPECCIÓN DE PRE-EMBARQUE (CALIDAD)</div>
      <table class="pdf-meta-table">
        <tr>
          <td class="pdf-meta-label">Dictamen Final:</td>
          <td style="font-weight:700; color:#059669;">${item.datosCalidad.dictamen || 'Conforme'}</td>
          <td class="pdf-meta-label">T° Pulpa Promedio:</td>
          <td style="font-weight:700; color:#004a4c;">${tempPromCal} °C</td>
        </tr>
      </table>
      <p style="font-size:0.78rem; font-weight:700; color:#004a4c; margin-bottom:0.4rem;">
        Evaluación de Paletas Evaluadas (${paletasCal.length} paletas):
      </p>
      <table class="pdf-meta-table" style="font-size:0.75rem;">
        <tr style="background:#004a4c; color:white; font-weight:700; text-align:center;">
          <td>N°</td>
          <td>N° PALLET</td>
          <td>PRODUCTOR</td>
          <td>VARIEDAD</td>
          <td>T° (°C)</td>
          <td>HORA</td>
          <td>CUMPLE</td>
        </tr>
        ${paletasCal.map(p => `
          <tr style="text-align:center;">
            <td>${p.nro}</td>
            <td style="font-weight:700;">${p.nroPallet}</td>
            <td>${p.productor}</td>
            <td>${p.variedad}</td>
            <td style="font-weight:700; color:#004a4c;">${p.temp} °C</td>
            <td>${p.hora}</td>
            <td>${p.cumple}</td>
          </tr>
        `).join("")}
      </table>
      <p style="font-size:0.75rem; color:#475569; margin-top:0.3rem;"><strong>Observaciones Calidad:</strong> ${item.datosCalidad.observaciones || 'Conforme.'}</p>

      <!-- 3. INSPECCIÓN DE FRÍO Y DESPACHO -->
      <div class="pdf-section-title">4. INSPECCIÓN DE FRÍO Y DESPACHO</div>
      <table class="pdf-meta-table">
        <tr>
          <td class="pdf-meta-label">Dictamen Final:</td>
          <td style="font-weight:700; color:#059669;">${item.datosFrio.dictamen || 'Conforme'}</td>
          <td class="pdf-meta-label">Precinto SAFCO:</td>
          <td>${item.datosFrio.precintoSafco || 'SAF-99120'}</td>
        </tr>
        <tr>
          <td class="pdf-meta-label">Precinto SENASA:</td>
          <td>${item.datosFrio.precintoSenasa || 'SEN-44103'}</td>
          <td class="pdf-meta-label">Precinto Línea:</td>
          <td>${item.datosFrio.precintoLinea || 'HLBU-119283'}</td>
        </tr>
      </table>

      <p style="font-size:0.78rem; font-weight:700; color:#004a4c; margin-top:0.4rem; margin-bottom:0.3rem;">Dispositivos Instalados (Termógrafos y Sensores SENASA):</p>
      <table class="pdf-meta-table" style="font-size:0.75rem;">
        <tr style="background:#f1f5f9; font-weight:700;">
          <td>DISPOSITIVO / TIPO</td>
          <td>CÓDIGO / ID</td>
          <td>UBICACIÓN EN CONTENEDOR</td>
        </tr>
        ${(item.datosFrio.dispositivos || []).map(d => `
          <tr>
            <td><strong>${d.tipo}</strong></td>
            <td>${d.codigo}</td>
            <td>${d.ubicacion}</td>
          </tr>
        `).join("")}
      </table>

      <!-- ESQUEMA VISUAL DEL CONTENEDOR DENTRO DEL PDF -->
      <div style="font-size:0.78rem; font-weight:800; color:#004a4c; margin-top:0.6rem; margin-bottom:0.4rem;">DISPOSICIÓN VISUAL DE PALETAS EN CONTENEDOR:</div>
      <div class="reefer-container-wrapper" style="margin:0 auto 1.25rem auto;">
        <div class="reefer-container-title">FONDO DEL CONTENEDOR</div>
        <div class="reefer-grid-pairs">
          ${(item.datosFrio.esquemaPaletas || []).map(p => `
            <div class="reefer-pallet-card ${p.estado === 'ok' ? 'status-ok' : (p.estado === 'alert' ? 'status-alert' : 'status-empty')} ${p.pos === 23 ? 'reefer-pallet-23' : ''}">
              <span class="reefer-pallet-number">${p.pos}</span>
              <span class="reefer-pallet-code">${p.codigo}</span>
              ${p.sensor ? `<div class="reefer-sensor-pill">📡 ${p.sensor}</div>` : ''}
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Galería de Evidencias Fotográficas -->
      <div class="pdf-section-title">5. REGISTRO FOTOGRÁFICO DE EVIDENCIAS POR CATEGORÍA</div>
      ${renderPdfEvidenciasCategorizadasHtml(item)}

      <!-- Conclusiones -->
      <div class="pdf-section-title">6. CONCLUSIONES DEL INFORME</div>
      <ul style="font-size:0.8rem; line-height:1.6; color:#334155; padding-left:1.2rem;">
        ${concList.map(c => `<li>${c}</li>`).join("")}
      </ul>

      <!-- Firmas Electrónicas con DNI-e por Participante -->
      <div class="pdf-section-title">7. FIRMAS DIGITALES CON DNI ELECTRÓNICO (PKI RENIEC)</div>
      <div style="margin-top: 1.5rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; text-align: center; font-size: 0.75rem;">
        ${item.participantes.map(p => `
          <div>
            ${p.firma ? `<img src="${p.firma}" class="pdf-signature-img">` : `<div style="height:35px;"></div>`}
            <div class="pdf-signature-box">
              <strong>${p.nombre}</strong><br>
              <span style="color:#64748b; font-size:0.7rem;">${p.rol} (${p.empresa})</span><br>
              <span style="font-family:monospace; font-size:0.65rem; color:#94a3b8;">DNI: ${p.doc}</span>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  if (typeof html2pdf !== 'undefined') {
    const opt = {
      margin:       [0.4, 0.4, 0.4, 0.4],
      filename:     `Informe_Embarque_${item.instruccionEmbarque}_${item.contenedor}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(pdfContainer.querySelector('.pdf-document')).save();
  } else {
    window.print();
  }
}

function renderPdfEvidenciasCategorizadasHtml(item) {
  let html = "";
  const areas = [
    { name: "Seguridad Patrimonial", data: item.evidencias.seguridad },
    { name: "Calidad (Pre-Embarque)", data: item.evidencias.calidad },
    { name: "Frío y Despacho", data: item.evidencias.frio }
  ];

  areas.forEach(a => {
    html += `<div style="font-size:0.8rem; font-weight:800; color:#004a4c; margin-top:0.6rem; margin-bottom:0.4rem; text-transform:uppercase;">• ${a.name}</div>`;
    (a.data || []).forEach(group => {
      if (group.fotos && group.fotos.length > 0) {
        html += `<div style="font-size:0.75rem; font-weight:700; color:#475569; margin-left:0.5rem; margin-bottom:0.3rem;">[${group.tipo}]</div>`;
        html += `<div class="pdf-photo-grid">`;
        group.fotos.forEach(f => {
          html += `
            <div class="pdf-photo-card">
              <img src="${f.url}" alt="${f.caption}">
              <p>${f.caption || group.tipo}</p>
            </div>
          `;
        });
        html += `</div>`;
      }
    });
  });

  return html;
}
