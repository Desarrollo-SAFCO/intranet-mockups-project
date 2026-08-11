// Lógica del Informe de Embarque General - SAFCO (Actualizado con Paletas, Firma Electrónica y Diagrama de Carga)

// Generador de imágenes SVG base64 para mockups seguros
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

// Generador de Firma Electrónica Cursiva en SVG Base64
function generateSignatureSvg(name) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80">
    <path d="M 20 50 Q 40 10, 60 50 T 100 40 T 140 55 T 180 30" fill="none" stroke="#001a40" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M 30 60 Q 80 65, 170 58" fill="none" stroke="#001a40" stroke-width="1.5" stroke-dasharray="4,2"/>
    <text x="100" y="75" font-family="sans-serif" font-size="9" font-weight="bold" fill="#64748b" text-anchor="middle">Firma Digital - ${name}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// Data Mockup Inicial
let informesMock = [
  {
    id: "INF-001",
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
    areas: {
      seguridad: { status: "ready", dictamen: "Conforme", fecha: "2025-01-05 08:30", inspector: "CARLOS MENDOZA" },
      frio: { status: "ready", dictamen: "Conforme", fecha: "2025-01-05 10:15", inspector: "ANA RODRIGUEZ" },
      calidad: { status: "ready", dictamen: "Conforme", fecha: "2025-01-05 09:45", inspector: "MARCOS VILCA" }
    },
    datosSeguridad: {
      placaTractor: "F4R-892",
      placaCarreta: "B9C-771",
      chofer: "JUAN PEREZ ROSALES",
      licencia: "Q09876543",
      soat: "SOAT-2025-8819",
      observaciones: "Unidad limpia, precintos de seguridad colocados en presencia del chofer. Sin novedades."
    },
    datosFrio: {
      paletasCount: 20,
      precintoSafco: "SAF-99120",
      precintoSenasa: "SEN-44102",
      precintoLinea: "HLBU-119283",
      horaInicio: "08:15",
      horaFin: "10:00",
      dispositivos: [
        { tipo: "1° Termógrafo", codigo: "TERM-881", ubicacion: "Pallet 01 (Puerta)", estado: "Instalado" },
        { tipo: "2° Termógrafo", codigo: "TERM-882", ubicacion: "Pallet 10 (Centro)", estado: "Instalado" },
        { tipo: "Sensor SENASA 1", codigo: "SENS-01", ubicacion: "Pallet 04", estado: "Instalado por SENASA" },
        { tipo: "Sensor SENASA 2", codigo: "SENS-02", ubicacion: "Pallet 16", estado: "Instalado por SENASA" }
      ],
      observaciones: "Paletas colocadas respetando la línea límite de carga del contenedor reefer. Sensores colocados por SENASA."
    },
    datosCalidad: {
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
      observaciones: "Calidad de empaque conforme. Se evaluaron 8 paletas seleccionadas aleatoriamente, obteniendo un promedio de pulpa de 0.14°C."
    },
    participantes: [
      { id: 1, rol: "Inspector Calidad", nombre: "Marcos Vilca", empresa: "SAFCO S.A.C.", doc: "44892019", firma: generateSignatureSvg("Marcos Vilca") },
      { id: 2, rol: "Supervisor Frío", nombre: "Ana Rodríguez", empresa: "SAFCO S.A.C.", doc: "41903212", firma: generateSignatureSvg("Ana Rodríguez") },
      { id: 3, rol: "Seguridad Patrimonial", nombre: "Carlos Mendoza", empresa: "SAFCO S.A.C.", doc: "10982345", firma: generateSignatureSvg("Carlos Mendoza") },
      { id: 4, rol: "Chofer Transportista", nombre: "Juan Pérez Rosales", empresa: "TRANS-AGRO E.I.R.L.", doc: "09876543", firma: generateSignatureSvg("Juan Pérez") },
      { id: 5, rol: "Inspector SENASA", nombre: "Ing. Roberto Gutiérrez", empresa: "SENASA ICA", doc: "25890123", firma: generateSignatureSvg("Roberto Gutiérrez") }
    ],
    evidencias: {
      seguridad: [
        {
          tipo: "Inspección Estructura e Higiene del Contenedor",
          fotos: [
            { id: "s1", url: createSvgDataUrl("Estructura Contenedor Interior", "#4f46e5"), caption: "Paredes internas limpias" },
            { id: "s2", url: createSvgDataUrl("Piso T-Floor Contenedor", "#4f46e5"), caption: "Inspección de piso y acople" }
          ]
        },
        {
          tipo: "Placa y Documentación del Vehículo",
          fotos: [
            { id: "s3", url: createSvgDataUrl("Placa Tractor F4R-892", "#4f46e5"), caption: "Tractor F4R-892" },
            { id: "s4", url: createSvgDataUrl("Placa Carreta B9C-771", "#4f46e5"), caption: "Carreta B9C-771" }
          ]
        }
      ],
      calidad: [
        {
          tipo: "Desarrollo de la Operación de Empaque",
          fotos: [
            { id: "c1", url: createSvgDataUrl("Empaque Pallet 01", "#05696d"), caption: "Verificación de cajas punnets" },
            { id: "c2", url: createSvgDataUrl("Empaque Pallet 05", "#05696d"), caption: "Control de estibado de pallets" }
          ]
        },
        {
          tipo: "Inspección de Pulpa y Evaluación de Fruta",
          fotos: [
            { id: "c3", url: createSvgDataUrl("Medición Temp Pulpa (0.1°C)", "#05696d"), caption: "Medición con termómetro digital" },
            { id: "c4", url: createSvgDataUrl("Evaluación Apariencia Fruta", "#05696d"), caption: "Baya racimo Autumn Crisp" }
          ]
        }
      ],
      frio: [
        {
          tipo: "Ubicación de 1° y 2° Termógrafo",
          fotos: [
            { id: "f1", url: createSvgDataUrl("Ubicación 1° Termógrafo", "#0284c7"), caption: "1° Termógrafo en Pallet 01" },
            { id: "f2", url: createSvgDataUrl("Ubicación 2° Termógrafo", "#0284c7"), caption: "2° Termógrafo en Pallet 10" }
          ]
        },
        {
          tipo: "Colocación de Sensores de Tratamiento (SENASA)",
          fotos: [
            { id: "f3", url: createSvgDataUrl("Sensor Senasa 1", "#0284c7"), caption: "Sensor 1 instalado por SENASA" },
            { id: "f4", url: createSvgDataUrl("Sensor Senasa 2", "#0284c7"), caption: "Sensor 2 instalado por SENASA" }
          ]
        },
        {
          tipo: "Término de Carguío y Cierre",
          fotos: [
            { id: "f5", url: createSvgDataUrl("Término de Carguío", "#0284c7"), caption: "20 Pallets cargados" }
          ]
        },
        {
          tipo: "Presentación y Colocación de Precintos",
          fotos: [
            { id: "f6", url: createSvgDataUrl("Presentación Precintos", "#0284c7"), caption: "Precintos presentados" },
            { id: "f7", url: createSvgDataUrl("Colocación Precinto SAFCO", "#0284c7"), caption: "Precinto SAFCO-99120 cerrado" }
          ]
        }
      ]
    },
    conclusiones: [
      "La altura de los pallets que conforman la carga tal cual muestran las imágenes siempre está por debajo de la línea límite que tiene cada Contenedor.",
      "Adicional a ello toda colocación de sensores es realizada por el mismo inspector de SENASA Asignado para el Despacho. El personal de cámara no interviene en dicha operación.",
      "Todas las precintas se colocaron en presencia del chofer de la unidad y el supervisor de seguridad patrimonial."
    ]
  }
];

let activeInformes = [];
let currentInformeId = null;
let currentTabArea = "all";

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("safco_informes_embarque_v2")) {
    try {
      activeInformes = JSON.parse(localStorage.getItem("safco_informes_embarque_v2"));
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
  localStorage.setItem("safco_informes_embarque_v2", JSON.stringify(activeInformes));
}

function setupEventListeners() {
  document.getElementById("filterCampana").addEventListener("change", applyFilters);
  document.getElementById("filterFechaDesde").addEventListener("change", applyFilters);
  document.getElementById("filterFechaHasta").addEventListener("change", applyFilters);
  document.getElementById("filterCliente").addEventListener("change", applyFilters);
  document.getElementById("filterEstado").addEventListener("change", applyFilters);
  document.getElementById("filterSearch").addEventListener("input", applyFilters);
  document.getElementById("btnNuevoInforme").addEventListener("click", openNuevoInformeModal);
}

function applyFilters() {
  const campana = document.getElementById("filterCampana").value;
  const fechaDesde = document.getElementById("filterFechaDesde").value;
  const fechaHasta = document.getElementById("filterFechaHasta").value;
  const cliente = document.getElementById("filterCliente").value;
  const estado = document.getElementById("filterEstado").value;
  const search = document.getElementById("filterSearch").value.toLowerCase().trim();

  const filtered = activeInformes.filter(item => {
    if (campana && item.campana !== campana) return false;
    if (fechaDesde && item.fechaEmbarque < fechaDesde) return false;
    if (fechaHasta && item.fechaEmbarque > fechaHasta) return false;
    if (cliente && item.cliente !== cliente) return false;
    if (estado && item.estadoGeneral !== estado) return false;
    if (search) {
      const matchSearch = item.nroInforme.toLowerCase().includes(search) ||
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
    tbody.innerHTML = `<tr><td colspan="10" style="padding: 2rem; color: #94a3b8;">No se encontraron informes con los filtros seleccionados.</td></tr>`;
    return;
  }

  tbody.innerHTML = dataList.map(item => {
    const badgeSeg = getAreaBadgeHtml("Seguridad", item.areas.seguridad.status);
    const badgeFrio = getAreaBadgeHtml("Frío", item.areas.frio.status);
    const badgeCal = getAreaBadgeHtml("Calidad", item.areas.calidad.status);

    const statusGeneralBadge = item.estadoGeneral === "Completo" 
      ? `<span class="area-badge ready"><i class='bx bx-check-circle'></i> COMPLETO</span>`
      : `<span class="area-badge pending"><i class='bx bx-time-five'></i> EN PROCESO</span>`;

    return `
      <tr>
        <td style="font-weight: 700; color: #004a4c;">${item.nroInforme}</td>
        <td>${item.fechaEmbarque}</td>
        <td style="font-weight:600;">${item.nroEmbarque}</td>
        <td style="font-weight:700; color: #0f172a;">${item.contenedor}</td>
        <td>${item.cliente}</td>
        <td><span style="font-size:0.75rem; background:#f1f5f9; padding:0.2rem 0.5rem; border-radius:4px; font-weight:600;">${item.variedad}</span></td>
        <td>${item.participantes.length} pers.</td>
        <td>
          <div class="area-badges-group">
            ${badgeCal} ${badgeFrio} ${badgeSeg}
          </div>
        </td>
        <td>${statusGeneralBadge}</td>
        <td>
          <div style="display:flex; justify-content:center; gap:0.35rem;">
            <button class="btn-action-trigger" title="Ver / Editar Informe" onclick="openEditarInformeModal('${item.id}', 'all')">
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
        <span style="font-weight:800; color:#004a4c; font-size:0.9rem;">${item.nroInforme}</span>
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
          ${getAreaBadgeHtml("CAL", item.areas.calidad.status)}
          ${getAreaBadgeHtml("FRÍO", item.areas.frio.status)}
          ${getAreaBadgeHtml("SEG", item.areas.seguridad.status)}
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
    return `<span class="area-badge ready" title="${label}: Completado"><i class='bx bx-check'></i> ${label}</span>`;
  } else if (status === "pending") {
    return `<span class="area-badge pending" title="${label}: Pendiente"><i class='bx bx-time'></i> ${label}</span>`;
  }
  return `<span class="area-badge incomplete" title="${label}: Incompleto"><i class='bx bx-x'></i> ${label}</span>`;
}

function openNuevoInformeModal() {
  const nuevoId = "INF-" + String(activeInformes.length + 1).padStart(3, '0');
  const nuevoInforme = {
    id: nuevoId,
    nroInforme: `INFORME DE EMBARQUE N° 03${activeInformes.length + 5}.AC-2025`,
    nroEmbarque: `SAF00${activeInformes.length + 1}`,
    contenedor: "SEGU-902182-0",
    booking: "BK-991202",
    cliente: "TALSA S.A",
    productor: "AGRICOLA TAMBO COLORADO S.A.C.",
    variedad: "AUTUMN CRISP",
    programa: "PUNNETS 4KG",
    campana: "UVA-2025",
    fechaEmbarque: new Date().toISOString().split('T')[0],
    guias: "T007 - 0000" + (130 + activeInformes.length),
    packingList: `PL-UV-00${activeInformes.length + 1}-A`,
    estadoGeneral: "En Proceso",
    areas: {
      seguridad: { status: "ready", dictamen: "Conforme", fecha: new Date().toLocaleDateString(), inspector: "SEGURIDAD PATRIMONIAL" },
      frio: { status: "pending", dictamen: "Pendiente", fecha: "-", inspector: "AREA FRIO" },
      calidad: { status: "ready", dictamen: "Conforme", fecha: new Date().toLocaleDateString(), inspector: "AREA CALIDAD" }
    },
    datosSeguridad: { placaTractor: "", placaCarreta: "", chofer: "", licencia: "", soat: "", observaciones: "" },
    datosFrio: {
      paletasCount: 20,
      precintoSafco: "",
      precintoSenasa: "",
      precintoLinea: "",
      horaInicio: "",
      horaFin: "",
      dispositivos: [
        { tipo: "1° Termógrafo", codigo: "TERM-901", ubicacion: "Pallet 01", estado: "Instalado" },
        { tipo: "2° Termógrafo", codigo: "TERM-902", ubicacion: "Pallet 10", estado: "Instalado" }
      ],
      observaciones: ""
    },
    datosCalidad: {
      paletasEvaluadas: [
        { nro: 1, nroPallet: "BBP01260725001C", productor: "AGRICOLA TAMBO COLORADO", variedad: "AUTUMN CRISP", temp: 0.1, hora: "10:25", cumple: "Conforme" },
        { nro: 2, nroPallet: "BBP01260725002C", productor: "AGRICOLA TAMBO COLORADO", variedad: "AUTUMN CRISP", temp: 0.2, hora: "10:29", cumple: "Conforme" }
      ],
      observaciones: ""
    },
    participantes: [
      { id: 1, rol: "Inspector Calidad", nombre: "Inspector Calidad SAFCO", empresa: "SAFCO", doc: "00000000", firma: generateSignatureSvg("Inspector Calidad") }
    ],
    evidencias: {
      seguridad: [
        { tipo: "Inspección Estructura e Higiene del Contenedor", fotos: [] },
        { tipo: "Placa y Documentación del Vehículo", fotos: [] }
      ],
      calidad: [
        { tipo: "Desarrollo de la Operación de Empaque", fotos: [] },
        { tipo: "Inspección de Pulpa y Evaluación de Fruta", fotos: [] }
      ],
      frio: [
        { tipo: "Ubicación de 1° y 2° Termógrafo", fotos: [] },
        { tipo: "Colocación de Sensores de Tratamiento (SENASA)", fotos: [] },
        { tipo: "Término de Carguío y Cierre", fotos: [] },
        { tipo: "Presentación y Colocación de Precintos", fotos: [] }
      ]
    },
    conclusiones: [
      "La altura de los pallets que conforman la carga tal cual muestran las imágenes siempre está por debajo de la línea límite que tiene cada Contenedor.",
      "Adicional a ello toda colocación de sensores es realizada por el mismo inspector de SENASA Asignado para el Despacho."
    ]
  };

  activeInformes.unshift(nuevoInforme);
  saveToStorage();
  openEditarInformeModal(nuevoId, 'all');
}

function openEditarInformeModal(id, initialTab = 'all') {
  currentInformeId = id;
  const item = activeInformes.find(i => i.id === id);
  if (!item) return;

  document.getElementById("modalNroInformeText").innerText = item.nroInforme;
  document.getElementById("modalContenedorText").innerText = `${item.contenedor} | ${item.cliente}`;

  // Cargar valores en formulario principal
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

  // Cargar datos de Seguridad
  document.getElementById("segPlacaTractor").value = item.datosSeguridad.placaTractor || "";
  document.getElementById("segPlacaCarreta").value = item.datosSeguridad.placaCarreta || "";
  document.getElementById("segChofer").value = item.datosSeguridad.chofer || "";
  document.getElementById("segLicencia").value = item.datosSeguridad.licencia || "";
  document.getElementById("segSoat").value = item.datosSeguridad.soat || "";
  document.getElementById("segObs").value = item.datosSeguridad.observaciones || "";

  // Cargar datos de Frío
  document.getElementById("frioPrecintoSafco").value = item.datosFrio.precintoSafco || "";
  document.getElementById("frioPrecintoSenasa").value = item.datosFrio.precintoSenasa || "";
  document.getElementById("frioPrecintoLinea").value = item.datosFrio.precintoLinea || "";
  document.getElementById("frioHoraInicio").value = item.datosFrio.horaInicio || "";
  document.getElementById("frioHoraFin").value = item.datosFrio.horaFin || "";
  document.getElementById("frioObs").value = item.datosFrio.observaciones || "";

  // Cargar Calidad Observaciones
  document.getElementById("calObs").value = item.datosCalidad.observaciones || "";

  // Cargar Conclusiones
  document.getElementById("editConclusiones").value = item.conclusiones.join("\n");

  renderPaletasCalidadModal(item);
  renderDispositivosFrioModal(item);
  renderEsquemaCargaContenedor(item);
  renderEvidenciasPorTiposModal(item);
  renderParticipantesModal(item);

  switchModalTab(initialTab);

  document.getElementById("modalInformeOverlay").classList.add("open");
}

function switchModalTab(tabArea) {
  currentTabArea = tabArea;

  document.querySelectorAll(".area-tab-btn").forEach(btn => btn.classList.remove("active"));
  const activeBtn = document.querySelector(`.area-tab-btn[data-tab="${tabArea}"]`);
  if (activeBtn) activeBtn.classList.add("active");

  const secSeguridad = document.getElementById("secSeguridad");
  const secFrio = document.getElementById("secFrio");
  const secCalidad = document.getElementById("secCalidad");

  if (tabArea === "all") {
    secSeguridad.style.display = "block";
    secFrio.style.display = "block";
    secCalidad.style.display = "block";
  } else if (tabArea === "seguridad") {
    secSeguridad.style.display = "block";
    secFrio.style.display = "none";
    secCalidad.style.display = "none";
  } else if (tabArea === "frio") {
    secSeguridad.style.display = "none";
    secFrio.style.display = "block";
    secCalidad.style.display = "none";
  } else if (tabArea === "calidad") {
    secSeguridad.style.display = "none";
    secFrio.style.display = "none";
    secCalidad.style.display = "block";
  }
}

// 1. RENDER PALETAS CALIDAD PRE-EMBARQUE
function renderPaletasCalidadModal(item) {
  const tbody = document.getElementById("paletasCalidadTbody");
  const spanProm = document.getElementById("calTempPromText");
  if (!tbody) return;

  const paletas = item.datosCalidad.paletasEvaluadas || [];
  
  // Calcular Promedio de Pulpa
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

function agregarPaletaCalidadPrompt() {
  const item = activeInformes.find(i => i.id === currentInformeId);
  if (!item) return;

  const paletas = item.datosCalidad.paletasEvaluadas || [];
  const nroPallet = prompt("N° de Pallet:", `BBP0126072400${paletas.length + 1}C`);
  if (!nroPallet) return;

  const tempStr = prompt("Temperatura de Pulpa (°C):", "0.2");
  if (!tempStr) return;

  const hora = prompt("Hora de Medición:", "11:45");

  paletas.push({
    nro: paletas.length + 1,
    nroPallet: nroPallet,
    productor: item.productor || "BYBLUE PERU",
    variedad: item.variedad || "AUTUMN CRISP",
    temp: parseFloat(tempStr),
    hora: hora || "12:00",
    cumple: "Conforme"
  });

  item.datosCalidad.paletasEvaluadas = paletas;
  saveToStorage();
  renderPaletasCalidadModal(item);
}

// 3. RENDER DISPOSITIVOS Y DIAGRAMA DE CONTENEDOR (FRÍO)
function renderDispositivosFrioModal(item) {
  const tbody = document.getElementById("dispositivosFrioTbody");
  if (!tbody) return;

  const disp = item.datosFrio.dispositivos || [];
  tbody.innerHTML = disp.map((d, index) => `
    <tr>
      <td><strong>${d.tipo}</strong></td>
      <td style="font-weight:700; color:#0284c7;">${d.codigo}</td>
      <td>${d.ubicacion}</td>
      <td><span class="area-badge ready">${d.estado}</span></td>
      <td style="text-align:right;">
        <button type="button" class="btn-action-trigger" style="width:24px; height:24px; color:#e11d48;" onclick="eliminarDispositivoFrio(${index})">
          <i class='bx bx-trash'></i>
        </button>
      </td>
    </tr>
  `).join("");
}

function agregarDispositivoFrioPrompt() {
  const item = activeInformes.find(i => i.id === currentInformeId);
  if (!item) return;

  const tipo = prompt("Tipo de Dispositivo (ej. 1° Termógrafo, Sensor SENASA 1):", "Sensor SENASA");
  if (!tipo) return;

  const codigo = prompt("Código / N° ID del Dispositivo:", "SENS-03");
  if (!codigo) return;

  const ubicacion = prompt("Ubicación en Contenedor (ej. Pallet 08):", "Pallet 08");

  if (!item.datosFrio.dispositivos) item.datosFrio.dispositivos = [];
  item.datosFrio.dispositivos.push({
    tipo: tipo,
    codigo: codigo,
    ubicacion: ubicacion || "Pallet Central",
    estado: "Instalado"
  });

  saveToStorage();
  renderDispositivosFrioModal(item);
  renderEsquemaCargaContenedor(item);
}

function eliminarDispositivoFrio(index) {
  const item = activeInformes.find(i => i.id === currentInformeId);
  if (!item) return;

  item.datosFrio.dispositivos.splice(index, 1);
  saveToStorage();
  renderDispositivosFrioModal(item);
  renderEsquemaCargaContenedor(item);
}

function renderEsquemaCargaContenedor(item) {
  const container = document.getElementById("contenedorEsquemaGrid");
  if (!container) return;

  const disp = item.datosFrio.dispositivos || [];
  let html = "";

  for (let i = 1; i <= 20; i++) {
    const pStr = "Pallet " + String(i).padStart(2, '0');
    let hasTermografo = disp.some(d => d.ubicacion.includes(String(i)) || d.ubicacion.includes(pStr));
    let hasSensor = disp.some(d => d.tipo.toLowerCase().includes("sensor") && (d.ubicacion.includes(String(i)) || d.ubicacion.includes(pStr)));

    let slotClass = "pallet-slot";
    let iconLabel = "";
    if (hasSensor) {
      slotClass += " has-sensor";
      iconLabel = "<br>📡 Sensor";
    } else if (hasTermografo) {
      slotClass += " has-termografo";
      iconLabel = "<br>🌡️ Termógr.";
    }

    html += `<div class="${slotClass}">P-${String(i).padStart(2, '0')}${iconLabel}</div>`;
  }

  container.innerHTML = html;
}

// 2. RENDER EVIDENCIAS POR TIPOS (Multiple photos per type)
function renderEvidenciasPorTiposModal(item) {
  renderSeccionEvidenciaTipos("containerEvidenciasSeguridad", item.evidencias.seguridad, "seguridad");
  renderSeccionEvidenciaTipos("containerEvidenciasFrio", item.evidencias.frio, "frio");
  renderSeccionEvidenciaTipos("containerEvidenciasCalidad", item.evidencias.calidad, "calidad");
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
    item.areas[areaKey].status = "ready";
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

// 4. PARTICIPANTES & FIRMAS ELECTRÓNICAS
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
          `<div class="signature-badge signed" onclick="firmarParticipanteModal(${p.id})"><img src="${p.firma}" class="signature-img-sm"> <i class='bx bx-check-double'></i> Firmado</div>` : 
          `<button type="button" class="signature-badge unsigned" onclick="firmarParticipanteModal(${p.id})"><i class='bx bx-pen'></i> Registrar Firma</button>`
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

function firmarParticipanteModal(pId) {
  const item = activeInformes.find(i => i.id === currentInformeId);
  if (!item) return;

  const part = item.participantes.find(p => p.id === pId);
  if (!part) return;

  // Simular la captura/generación de Firma Electrónica
  part.firma = generateSignatureSvg(part.nombre);
  saveToStorage();
  renderParticipantesModal(item);

  Swal.fire({
    icon: 'success',
    title: 'Firma Registrada',
    text: `Se ha registrado la firma electrónica digital para ${part.nombre} (${part.rol}).`,
    confirmButtonColor: '#004a4c'
  });
}

function agregarParticipantePrompt() {
  const item = activeInformes.find(i => i.id === currentInformeId);
  if (!item) return;

  const rol = prompt("Ingrese el Rol (ej. Inspector SENASA, Chofer, Recibidor):", "Inspector SENASA");
  if (!rol) return;

  const nombre = prompt("Nombre completo del participante:", "Ing. Carlos Varela");
  if (!nombre) return;

  const empresa = prompt("Empresa / Institución:", "SENASA ICA");
  const doc = prompt("Documento DNI / Registro:", "21980341");

  const nuevoPart = {
    id: Date.now(),
    rol: rol,
    nombre: nombre,
    empresa: empresa || "-",
    doc: doc || "-",
    firma: generateSignatureSvg(nombre)
  };

  item.participantes.push(nuevoPart);
  saveToStorage();
  renderParticipantesModal(item);
}

function eliminarParticipante(pId) {
  const item = activeInformes.find(i => i.id === currentInformeId);
  if (!item) return;

  item.participantes = item.participantes.filter(p => p.id !== pId);
  saveToStorage();
  renderParticipantesModal(item);
}

function guardarModalInforme() {
  const item = activeInformes.find(i => i.id === currentInformeId);
  if (!item) return;

  // Guardar Header
  item.nroEmbarque = document.getElementById("editNroEmbarque").value;
  item.contenedor = document.getElementById("editContenedor").value;
  item.booking = document.getElementById("editBooking").value;
  item.cliente = document.getElementById("editCliente").value;
  item.productor = document.getElementById("editProductor").value;
  item.variedad = document.getElementById("editVariedad").value;
  item.programa = document.getElementById("editPrograma").value;
  item.fechaEmbarque = document.getElementById("editFechaEmbarque").value;
  item.guias = document.getElementById("editGuias").value;
  item.packingList = document.getElementById("editPackingList").value;

  // Guardar Seguridad
  item.datosSeguridad.placaTractor = document.getElementById("segPlacaTractor").value;
  item.datosSeguridad.placaCarreta = document.getElementById("segPlacaCarreta").value;
  item.datosSeguridad.chofer = document.getElementById("segChofer").value;
  item.datosSeguridad.licencia = document.getElementById("segLicencia").value;
  item.datosSeguridad.soat = document.getElementById("segSoat").value;
  item.datosSeguridad.observaciones = document.getElementById("segObs").value;

  // Guardar Frío
  item.datosFrio.precintoSafco = document.getElementById("frioPrecintoSafco").value;
  item.datosFrio.precintoSenasa = document.getElementById("frioPrecintoSenasa").value;
  item.datosFrio.precintoLinea = document.getElementById("frioPrecintoLinea").value;
  item.datosFrio.horaInicio = document.getElementById("frioHoraInicio").value;
  item.datosFrio.horaFin = document.getElementById("frioHoraFin").value;
  item.datosFrio.observaciones = document.getElementById("frioObs").value;

  // Guardar Calidad
  item.datosCalidad.observaciones = document.getElementById("calObs").value;

  // Guardar Conclusiones
  const lineas = document.getElementById("editConclusiones").value.split("\n").filter(l => l.trim().length > 0);
  item.conclusiones = lineas;

  item.estadoGeneral = "Completo";

  saveToStorage();
  closeModalInforme();
  renderTabla();
  renderTarjetasMovil();

  Swal.fire({
    icon: 'success',
    title: 'Informe Guardado',
    text: 'Se han consolidado los datos del informe de embarque.',
    confirmButtonColor: '#004a4c'
  });
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

  // Calcular T° Promedio de Paletas de Calidad
  const paletasCal = item.datosCalidad.paletasEvaluadas || [];
  let sumaT = 0;
  paletasCal.forEach(p => sumaT += parseFloat(p.temp || 0));
  const tempPromCal = paletasCal.length > 0 ? (sumaT / paletasCal.length).toFixed(2) : "0.00";

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
            <p>${item.nroInforme}</p>
          </td>
          <td style="width: 25%; font-size: 0.75rem; text-align: right;">
            <strong>Código:</strong> INF-EMB-01<br>
            <strong>Versión:</strong> 02<br>
            <strong>Fecha:</strong> ${item.fechaEmbarque}
          </td>
        </tr>
      </table>

      <!-- Datos Principales -->
      <div class="pdf-section-title">1. INFORMACIÓN GENERAL DEL EMBARQUE</div>
      <table class="pdf-meta-table">
        <tr>
          <td class="pdf-meta-label">N° Embarque:</td>
          <td style="font-weight:700;">${item.nroEmbarque}</td>
          <td class="pdf-meta-label">Contenedor:</td>
          <td style="font-weight:700;">${item.contenedor}</td>
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

      <!-- Inspección Pre-Embarque (Calidad) - Lista de Paletas -->
      <div class="pdf-section-title">2. INSPECCIÓN DE PRE-EMBARQUE (CALIDAD)</div>
      <p style="font-size:0.78rem; font-weight:700; color:#004a4c; margin-bottom:0.4rem;">
        Evaluación de Paletas y Control de Temperatura (T° Promedio Evaluado: <strong>${tempPromCal} °C</strong>):
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

      <!-- Inspección de Frío y Despacho -->
      <div class="pdf-section-title">3. INSPECCIÓN DE FRÍO Y DESPACHO</div>
      <table class="pdf-meta-table">
        <tr>
          <td class="pdf-meta-label">Hora Inicio:</td>
          <td>${item.datosFrio.horaInicio || '08:15'}</td>
          <td class="pdf-meta-label">Hora Fin:</td>
          <td>${item.datosFrio.horaFin || '10:00'}</td>
        </tr>
        <tr>
          <td class="pdf-meta-label">Precinto SAFCO:</td>
          <td>${item.datosFrio.precintoSafco || 'SAF-99120'}</td>
          <td class="pdf-meta-label">Precinto SENASA:</td>
          <td>${item.datosFrio.precintoSenasa || 'SEN-44102'}</td>
        </tr>
      </table>

      <p style="font-size:0.78rem; font-weight:700; color:#004a4c; margin-top:0.4rem; margin-bottom:0.3rem;">Ubicación de Sensores y Termógrafos:</p>
      <table class="pdf-meta-table" style="font-size:0.75rem;">
        <tr style="background:#f1f5f9; font-weight:700;">
          <td>DISPOSITIVO / TIPO</td>
          <td>CÓDIGO / ID</td>
          <td>UBICACIÓN EN CONTENEDOR</td>
          <td>ESTADO</td>
        </tr>
        ${(item.datosFrio.dispositivos || []).map(d => `
          <tr>
            <td><strong>${d.tipo}</strong></td>
            <td>${d.codigo}</td>
            <td>${d.ubicacion}</td>
            <td>${d.estado}</td>
          </tr>
        `).join("")}
      </table>

      <!-- Inspección de Seguridad Patrimonial -->
      <div class="pdf-section-title">4. INSPECCIÓN DE SEGURIDAD PATRIMONIAL</div>
      <table class="pdf-meta-table">
        <tr>
          <td class="pdf-meta-label">Tractor / Carreta:</td>
          <td>${item.datosSeguridad.placaTractor || '-'} / ${item.datosSeguridad.placaCarreta || '-'}</td>
          <td class="pdf-meta-label">Chofer:</td>
          <td>${item.datosSeguridad.chofer || '-'} (Lic: ${item.datosSeguridad.licencia || '-'})</td>
        </tr>
        <tr>
          <td class="pdf-meta-label">SOAT Vehicular:</td>
          <td>${item.datosSeguridad.soat || '-'}</td>
          <td class="pdf-meta-label">Dictamen:</td>
          <td style="font-weight:700; color:#059669;">Conforme</td>
        </tr>
      </table>

      <!-- Galería de Evidencias Fotográficas -->
      <div class="pdf-section-title">5. REGISTRO FOTOGRÁFICO DE EVIDENCIAS POR CATEGORÍA</div>
      ${renderPdfEvidenciasCategorizadasHtml(item)}

      <!-- Conclusiones -->
      <div class="pdf-section-title">6. CONCLUSIONES DEL INFORME</div>
      <ul style="font-size:0.8rem; line-height:1.6; color:#334155; padding-left:1.2rem;">
        ${item.conclusiones.map(c => `<li>${c}</li>`).join("")}
      </ul>

      <!-- Firmas Electrónicas por Participante -->
      <div class="pdf-section-title">7. FIRMAS ELECTRÓNICAS DE PARTICIPANTES</div>
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
      filename:     `Informe_Embarque_${item.nroEmbarque}_${item.contenedor}.pdf`,
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
