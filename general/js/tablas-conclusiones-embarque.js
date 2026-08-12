// Lógica de Mantenimiento de Conclusiones de Embarque - SAFCO

const defaultConclusiones = [
  {
    id: 1,
    texto: "La altura de los pallets que conforman la carga siempre está por debajo de la línea límite del contenedor.",
    formato: "Informe General de Embarque",
    estado: "Activo"
  },
  {
    id: 2,
    texto: "Toda colocación de sensores de frío es realizada exclusivamente por el inspector de SENASA asignado.",
    formato: "Informe General de Embarque",
    estado: "Activo"
  },
  {
    id: 3,
    texto: "La colocación de precintos de seguridad (SAFCO, SENASA, Línea) se realizó en presencia del chofer y seguridad patrimonial.",
    formato: "Informe General de Embarque",
    estado: "Activo"
  },
  {
    id: 4,
    texto: "Contenedor reefer inspeccionado en estructura, higiene y sellado hermético en cámara.",
    formato: "Inspección de Contenedores",
    estado: "Activo"
  },
  {
    id: 5,
    texto: "Temperatura de fruta y pulpa verificada en rango conforme para exportación.",
    formato: "Control de Calidad Pre-Embarque",
    estado: "Activo"
  }
];

let conclusionesList = [];

document.addEventListener("DOMContentLoaded", () => {
  cargarConclusiones();
  setupEventListeners();
});

function cargarConclusiones() {
  if (localStorage.getItem("safco_conclusiones_embarque_v1")) {
    try {
      conclusionesList = JSON.parse(localStorage.getItem("safco_conclusiones_embarque_v1"));
    } catch(e) {
      conclusionesList = defaultConclusiones;
    }
  } else {
    conclusionesList = defaultConclusiones;
    guardarEnStorage();
  }
  renderTabla();
}

function guardarEnStorage() {
  localStorage.setItem("safco_conclusiones_embarque_v1", JSON.stringify(conclusionesList));
}

function setupEventListeners() {
  document.getElementById("filterFormato").addEventListener("change", applyFilters);
  document.getElementById("filterEstado").addEventListener("change", applyFilters);
  document.getElementById("filterSearch").addEventListener("input", applyFilters);
}

function applyFilters() {
  const formato = document.getElementById("filterFormato").value;
  const est = document.getElementById("filterEstado").value;
  const search = document.getElementById("filterSearch").value.toLowerCase().trim();

  const filtered = conclusionesList.filter(item => {
    if (formato && item.formato !== formato) return false;
    if (est && item.estado !== est) return false;
    if (search && !item.texto.toLowerCase().includes(search)) return false;
    return true;
  });

  renderTabla(filtered);
}

function renderTabla(data = conclusionesList) {
  const tbody = document.getElementById("conclusionesTbody");
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="padding:2rem; color:#94a3b8;">No se encontraron conclusiones registradas.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(item => {
    const isActivo = (item.estado || "Activo") === "Activo";
    return `
      <tr>
        <td style="text-align:left; white-space:nowrap;">
          <span style="font-size:0.75rem; background:#e6f0f0; color:#004a4c; font-weight:700; padding:0.3rem 0.65rem; border-radius:6px; border:1px solid #b3d1d2; display:inline-block;">
            ${item.formato || 'Informe General de Embarque'}
          </span>
        </td>
        <td style="text-align:left; font-weight:600; color:#1e293b;">${item.texto}</td>
        <td>
          <span class="status-pill ${isActivo ? 'activo' : 'anulado'}">
            <i class='bx ${isActivo ? 'bx-check-circle' : 'bx-x-circle'}'></i> ${isActivo ? 'ACTIVO' : 'ANULADO'}
          </span>
        </td>
        <td>
          <div style="display:flex; justify-content:center; gap:0.35rem;">
            <button class="btn-action-trigger" title="Editar Conclusión" onclick="abrirModalEditarConclusion(${item.id})">
              <i class='bx bx-edit-alt'></i>
            </button>
            <button class="btn-action-trigger" title="${isActivo ? 'Anular Conclusión' : 'Reactivar Conclusión'}" onclick="toggleEstadoConclusion(${item.id})" style="${isActivo ? 'color:#d30c0c; border-color:#fecaca;' : 'color:#059669; border-color:#a7f3d0;'}">
              <i class='bx ${isActivo ? 'bx-block' : 'bx-check-circle'}'></i>
            </button>
            <button class="btn-action-trigger" title="Eliminar" onclick="eliminarConclusion(${item.id})" style="color:#e11d48; border-color:#fecaca;">
              <i class='bx bx-trash'></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function abrirModalNuevaConclusion() {
  document.getElementById("editConclusionId").value = "";
  document.getElementById("editConclusionTexto").value = "";
  document.getElementById("editConclusionFormato").value = "Informe General de Embarque";

  document.getElementById("modalConclusionTitle").innerText = "Nueva Conclusión de Embarque";
  document.getElementById("modalConclusionOverlay").classList.add("open");
}

function abrirModalEditarConclusion(id) {
  const item = conclusionesList.find(c => c.id === id);
  if (!item) return;

  document.getElementById("editConclusionId").value = item.id;
  document.getElementById("editConclusionTexto").value = item.texto;
  document.getElementById("editConclusionFormato").value = item.formato || "Informe General de Embarque";

  document.getElementById("modalConclusionTitle").innerText = "Editar Conclusión de Embarque";
  document.getElementById("modalConclusionOverlay").classList.add("open");
}

function cerrarModalConclusion() {
  document.getElementById("modalConclusionOverlay").classList.remove("open");
}

function guardarConclusion() {
  const idVal = document.getElementById("editConclusionId").value;
  const texto = document.getElementById("editConclusionTexto").value.trim();
  const formato = document.getElementById("editConclusionFormato").value;

  if (!texto) {
    Swal.fire({
      icon: 'warning',
      title: 'Texto Requerido',
      text: 'Ingrese el texto descriptivo de la conclusión.',
      confirmButtonColor: '#004a4c'
    });
    return;
  }

  if (idVal) {
    const item = conclusionesList.find(c => c.id === parseInt(idVal));
    if (item) {
      item.texto = texto;
      item.formato = formato;
    }
  } else {
    const nueva = {
      id: Date.now(),
      texto: texto,
      formato: formato,
      estado: "Activo"
    };
    conclusionesList.push(nueva);
  }

  guardarEnStorage();
  renderTabla();
  cerrarModalConclusion();

  Swal.fire({
    icon: 'success',
    title: 'Conclusión Guardada',
    text: 'La conclusión se ha registrado con estado ACTIVO de manera predeterminada.',
    confirmButtonColor: '#004a4c'
  });
}

function toggleEstadoConclusion(id) {
  const item = conclusionesList.find(c => c.id === id);
  if (!item) return;

  const esAct = (item.estado || "Activo") === "Activo";
  item.estado = esAct ? "Anulado" : "Activo";
  guardarEnStorage();
  renderTabla();

  Swal.fire({
    icon: esAct ? 'warning' : 'success',
    title: esAct ? 'Conclusión Anulada' : 'Conclusión Reactivada',
    text: `El registro ha pasado a estado ${item.estado.toUpperCase()}.`,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000
  });
}

function eliminarConclusion(id) {
  Swal.fire({
    title: '¿Eliminar Registro?',
    text: 'Esta acción removerá permanentemente la conclusión del catálogo.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d30c0c',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, Eliminar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      conclusionesList = conclusionesList.filter(c => c.id !== id);
      guardarEnStorage();
      renderTabla();

      Swal.fire({
        icon: 'success',
        title: 'Conclusión Eliminada',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      });
    }
  });
}
