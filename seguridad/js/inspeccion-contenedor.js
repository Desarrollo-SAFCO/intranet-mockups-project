// --- MOCK DATA --- 
let mockInstructions = [
    {
        id: "INST-001",
        nroOrden: "24024", // Usamos números como en la muestra
        contenedor: "MNBU433208-0",
        booking: "ADR-014",
        campana: "UV26",
        responsable: "Carlos M.",
        fecha: "26 mar. 2026",
        estado: "pendiente" 
    },
    {
        id: "INST-002",
        nroOrden: "24023",
        contenedor: "CAAU416290-3",
        booking: "GLO-563",
        campana: "UV26",
        responsable: "Ana R.",
        fecha: "26 mar. 2026",
        estado: "inspeccionado"
    },
    {
        id: "INST-003",
        nroOrden: "24022",
        contenedor: "SEGU973763-6",
        booking: "GLO-564",
        campana: "UV26",
        responsable: "Carlos M.",
        fecha: "26 mar. 2026",
        estado: "rechazado"
    },
    {
        id: "INST-004",
        nroOrden: "24020",
        contenedor: "TEMU961139-3",
        booking: "GLO-561",
        campana: "UV26",
        responsable: "Luis Z.",
        fecha: "26 mar. 2026",
        estado: "pendiente"
    }
];

document.addEventListener("DOMContentLoaded", () => {
    // Topbar username load
    const sd = localStorage.getItem("userSession");
    if(sd) {
        try { document.getElementById("userNameHeader").textContent = JSON.parse(sd).user.toUpperCase(); } catch(e){}
    }

    renderTabla();
});

function renderTabla() {
    const tbody = document.getElementById("listaContenedoresTbody");
    tbody.innerHTML = "";

    mockInstructions.forEach(ins => {
        let statusBadge = "";
        let rowClass = "";

        if (ins.estado === "pendiente") {
            rowClass = "row-pending";
            statusBadge = "Pendiente";
        } else if (ins.estado === "inspeccionado") {
            rowClass = "row-done";
            statusBadge = `<span class="pill-status pill-approved"><i class='bx bx-check-circle'></i> Aprobado</span>`;
        } else if (ins.estado === "rechazado") {
            rowClass = "row-rejected";
            statusBadge = "Rechazado";
        }

        const tr = document.createElement("tr");
        tr.className = rowClass;
        
        tr.innerHTML = `
            <td>${ins.nroOrden}</td>
            <td>${ins.fecha}</td>
            <td>${ins.campana}</td>
            <td>${ins.booking}</td>
            <td>${ins.contenedor}</td>
            <td>${ins.responsable}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn-action-table" onclick="abrirModalFormulario('${ins.id}')">
                    <i class='bx bx-menu' style="font-size:1.2rem;"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// Lógica del Modal Flat
const modal = document.getElementById("modalInspeccion");

function abrirModalFormulario(id) {
    const data = mockInstructions.find(i => i.id === id);
    if(!data) return;

    document.getElementById("modalInspeccionId").value = data.id;
    document.getElementById("ro-nroOrden").innerText = data.nroOrden;
    document.getElementById("ro-contenedor").innerText = data.contenedor;
    document.getElementById("ro-booking").innerText = data.booking;
    document.getElementById("ro-responsable").innerText = data.responsable;

    limpiarFormularioModal();

    const actionBtn = document.querySelector(".modal-footer .btn-primary");
    if(data.estado === "rechazado") {
        actionBtn.style.display = 'none';
        Swal.fire({ toast: true, position: 'top', icon: 'info', title: 'Modo lectura (Rechazado)', showConfirmButton: false, timer: 2000 });
        document.querySelectorAll("#modalInspeccion input, #modalInspeccion textarea").forEach(el => el.disabled = true);
    } else {
        actionBtn.style.display = 'block';
        document.querySelectorAll("#modalInspeccion input, #modalInspeccion textarea").forEach(el => el.disabled = false);
    }

    modal.classList.add("active");
}

function closeModal() {
    modal.classList.remove("active");
}

function updateFileName(inp, displayId) {
    const disp = document.getElementById(displayId);
    if(inp.files && inp.files.length > 0) disp.textContent = "📎 " + inp.files[0].name;
    else disp.textContent = "";
}

function addFakePreview(inp) {
    if(inp.files && inp.files.length > 0) {
        const objUrl = URL.createObjectURL(inp.files[0]);
        const parent = inp.parentElement;
        parent.innerHTML = `<img src="${objUrl}" style="width:100%;height:100%;object-fit:cover;">`;
        parent.style.border = "none";
        
        const grid = document.getElementById("evidencesGrid");
        if(grid.children.length < 5) {
            grid.insertAdjacentHTML('beforeend', `<label class="evidence-box"><i class='bx bx-plus' style="font-size:1.5rem;"></i> Añadir Foto<input type="file" accept="image/*" hidden onchange="addFakePreview(this)"></label>`);
        }
    }
}

function addObsField() {
    document.getElementById("obsList").insertAdjacentHTML('beforeend', `<div class="obs-item"><textarea class="form-control" placeholder="Añadir otra observación..."></textarea></div>`);
}

function limpiarFormularioModal() {
    ['soatName', 'guiaName', 'tarjetaName'].forEach(id => document.getElementById(id).textContent = "");
    document.getElementById("evidencesGrid").innerHTML = `<label class="evidence-box"><i class='bx bx-plus' style="font-size:1.5rem;"></i> Añadir Foto<input type="file" accept="image/*" hidden onchange="addFakePreview(this)"></label>`;
    document.getElementById("obsList").innerHTML = `<div class="obs-item"><textarea class="form-control" placeholder="Describa irregularidades..."></textarea></div>`;
    const dict = document.getElementById("resDictamen"); if(dict) dict.value = "conforme";
}

function guardarInspeccion() {
    const idObj = document.getElementById("modalInspeccionId").value;
    const index = mockInstructions.findIndex(i => i.id === idObj);
    
    if(index > -1) {
        Swal.fire({
            title: 'Guardando',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const dictamen = document.getElementById("resDictamen").value;

        setTimeout(() => {
            if(dictamen === "rechazado") {
                mockInstructions[index].estado = "rechazado";
                Swal.fire({
                    icon: 'warning',
                    title: 'Inspección Rechazada',
                    text: 'El contenedor ha sido marcado como No Apto.',
                    timer: 1500,
                    showConfirmButton: false,
                    backdrop: `rgba(0,0,0,0.4)`
                });
            } else {
                mockInstructions[index].estado = "inspeccionado";
                Swal.fire({
                    icon: 'success',
                    title: '¡Aprobado!',
                    text: 'Inspección guardada y conforme.',
                    timer: 1500,
                    showConfirmButton: false,
                    backdrop: `rgba(0,0,0,0.4)`
                });
            }
            closeModal();
            renderTabla();
        }, 800);
    }
}
