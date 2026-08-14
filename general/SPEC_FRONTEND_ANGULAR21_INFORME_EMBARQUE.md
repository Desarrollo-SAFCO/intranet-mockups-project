# SPEC Angular 21: Informe General de Embarque, Documentos Finales & Catálogo de Conclusiones — SAFCO

**Framework:** Angular 21 (Standalone + Signals + Zoneless)  
**Backend API de Referencia:** Spring Boot REST + Stored Procedures (`SPEC_API_DOC_FINAL_EMBARQUE.md`)  
**Módulos fuente:** `general/informe-embarque-general.html` & `general/tablas-conclusiones-embarque.html`  
**Design System:** SAFCO Corporativo (Kendo SVG Icons, Paleta Teal/Rojo/Verde, Mobile-First)  
**Fecha de spec:** 2026-08-14  

---

> [!IMPORTANT]
> **REGLAS ESTRICTAS DE ARQUITECTURA ANGULAR 21 & SAFCO DESIGN SYSTEM:**
> - ❌ **PROHIBIDO** el uso de `Boxicons (bx bx-*)` — usar exclusivamente `<kendo-svg-icon>` de `@progress/kendo-svg-icons`.
> - ✅ **OBLIGATORIO** Signals nativas: `signal()`, `computed()`, `input()`, `output()`, `model()`.
> - ❌ **PROHIBIDO** `@Input()/@Output()` clásicos, `EventEmitter`, `ChangeDetectorRef.markForCheck()`, `detectChanges()`.
> - ❌ **PROHIBIDO** Nombrar interfaces con sufijo `DTO` — usar nombres limpios de dominio TypeScript (`CampanaActiva`, `InstruccionCampana`, `ReporteDatosInstruccion`, `ConclusionInformeFinal`, etc.).
> - ✅ **OBLIGATORIO** Envoltorios de API: Todo servicio debe procesar `ApiResponseProvider<T>` y `ResponseStandardProvider<T>`.
> - ✅ **OBLIGATORIO** Mobile-First: Tabla Kendo Grid en desktop (`hidden md:block`) y cards con borde lateral de 4px (`border-l-4`) en mobile (`block md:hidden`).

---

## 1. Descripción de los Módulos

### 1.1 Módulo Principal: Informe General de Embarque
Centro de control consolidado del proceso de embarque de fruta de exportación de **SAFCO**. Conecta la gestión operativa de **Producción** con los tres documentos finales de inspección:
1. **Seguridad Patrimonial:** Inspección de Ingreso de Contenedor (`InspeccionIngresoContenedor`).
2. **Calidad:** Inspección Pre-Embarque (`InspeccionPreEmbarque`).
3. **Frío y Despacho:** Inspección de Embarque en Frío (`InspeccionEmbarqueFrio`).
4. **Documento General Consolidado:** Persistencia del dictamen final y asignación dinámica de conclusiones de informe (`DocumentoGeneralEmbarque`).

### 1.2 Módulo Maestro: Catálogo de Conclusiones de Embarque
Mantenimiento administrativo de las conclusiones técnicas y comerciales predefinidas que los inspectores y supervisores pueden seleccionar al emitir los dictámenes finales de embarque, clasificadas por Formato de Inspección.

### Matriz de Capacidades

| Capacidad | Módulo | Descripción Técnica |
|---|---|---|
| **Listado Consolidado Paginado** | Embarque | Paginación Spring Boot (`Page<T>`) con filtros por Campaña, Instrucción, Fechas, Cliente, Estado y Buscador rápido. |
| **Cabecera & Datos de Embarque** | Embarque | Consulta de datos maestros de la Instrucción (Booking, Contenedor, Variedades, Productor, Guías, Packing List). |
| **Inspección de Calidad (Doc Final)** | Calidad | Visualización de paletas inspeccionadas, temperatura de pulpa (°C), dictamen `estado_calidad` ("1"/"0"), autorización `conEmbarque` y evidencias fotográficas. |
| **Inspección de Frío (Doc Final)** | Frío | Gestión de precintos (Packing, SENASA, Línea), sensores termorregistros, esquema visual de contenedor reefer y dictamen `idResultadoCalidad`. |
| **Inspección de Seguridad (Doc Final)** | Seguridad | Estado del contenedor, lista dinámica de comentarios/observaciones técnicas, dictamen de pase y evidencias visuales. |
| **Guardado de Doc General & Conclusiones** | Producción | Guardado atómico del documento general (`POST /guardar`) vinculando el array de conclusiones asociadas y anulación automática de desmarcadas. |
| **Mantenimiento de Conclusiones** | Conclusiones | CRUD completo de conclusiones (Crear, Editar, Anulación Lógica, Filtros por Formato y Estado). |
| **Sincronización Multipart de Fotos** | Evidencias | Subida y eliminación de fotos por tipo mediante `multipart/form-data`. |
| **Descarga de PDF Consolidado** | Reportes | Exportación del informe técnico final con sellos y dictámenes. |

---

## 2. Modelos TypeScript (Interfaces y Tipos de Dominio)

> Ubicación sugerida: `src/app/features/informes-embarque/models/informe-embarque.model.ts`

```typescript
// ==========================================
// 1. ENVOLTORIOS ESTÁNDAR DE API (BACKEND)
// ==========================================

export interface ApiResponseProvider<T> {
  codigo: string;          // "200"
  mensaje: string;         // Mensaje descriptivo
  data: T;                 // Payload
  cantidad: number;        // Cantidad de elementos
  error: string | null;    // Detalle de excepción o null
}

export interface ResponseStandardProvider<T> {
  codigo: string;          // "0"
  respuesta: string;       // "Busqueda exitosa"
  data: T;
  cantidad: string;
  error: string | null;
}

export interface PageSpring<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;          // Página actual (0-indexed)
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

// ==========================================
// 2. CATÁLOGOS Y FILTROS DE EMBARQUE
// ==========================================

export interface CampanaActiva {
  idEmpresaCorporacion: string;
  idFecha: string;         // Ej. "UV26" (Código de campaña)
  descCampana: string;     // Ej. "CAMPAÑA UVA 2025-2026"
  idCultivoRef: string;
}

export interface InstruccionCampana {
  instruccionEmbarque: {
    idInstruccionEmbarque: number;
    fechaEmicion: string;
    fechaCarga: string;
    nroOrden: string;
    observaciones: string;
    poNr: string;
    embarqueDirecto: string;
    comision: string;
    anexado: string;
    idFecha: string;
    estadoPedido: boolean;
    estado: string;
  };
}

export interface ClienteFinalCampana {
  entidad: {
    idEntidad: number;
    razonSocial: string;
    direccion: string;
    contacto: string;
    email: string;
    telefono: string;
    fax: string | null;
    descAlternativa: string;
    estado: string;
  };
}

export interface FiltrosInformeEmbarque {
  campana: string;                // Requerido (ej. "UV26")
  idInstruccionEmbarque?: number;
  fechaDesde?: string;            // "YYYY-MM-DD"
  fechaHasta?: string;            // "YYYY-MM-DD"
  idClienteFinal?: number;
  estadoGeneral?: string;         // "EMBARCADO" | "EN PROCESO"
  buscador?: string;              // Búsqueda rápida
  pagina: number;                 // 0-indexed
  size: number;                   // 10
}

// ==========================================
// 3. LISTADO GENERAL (PRODUCCIÓN)
// ==========================================

export interface InspeccionIngresoContenedorRef {
  idInspeccionIngresoContenedor: number;
  campana: string;
  conEmbarque: string;            // "1" | "0"
  estadoProceso: string;          // "TERMINADO" | "EN PROCESO"
  estado: string;
}

export interface InspeccionPreEmbarqueRef {
  idInspeccionPreEmbarque: number;
  packingList: string;
  nroContenedor: string;
  fecha: string;
  observacion: string;
  estado: string;
}

export interface InspeccionEmbarqueFrioRef {
  idInspeccionEmbarqueFrio: number;
  campana: string;
  fecha: string;
  refContenedor: string;
  packinglistRef: string;
  observacion: string;
  estado: string;
}

export interface ResultadoCalidadRef {
  idResultadoCalidad: number;
  descCorta: string;              // "APTO", "CONFORME", "RECHAZADO"
  descEstadoCalidad: string;
  estado: string;
}

export interface InformeEmbarqueItem {
  variedades: string;
  instruccionEmbarque: string;    // "IE-2026-0045"
  fecha: string;                  // "YYYY-MM-DD"
  contenedor: string;
  cliente: string;
  InspeccionIngresoContenedor?: InspeccionIngresoContenedorRef;
  InspeccionPreEmbarque?: InspeccionPreEmbarqueRef;
  InspeccionEmbarqueFrio?: InspeccionEmbarqueFrioRef;
  resultadoCalidad?: ResultadoCalidadRef;
  estado: string;
}

export interface ReporteDatosInstruccion {
  variedades: string;
  instruccionEmbarque: string;
  contenedor: string;
  booking: string;
  clienteFinal: string;
  productor: string;
  programas: string;
  fechaEmbarque: string;
  guiaRemision: string;
  packingListDoc: string;
}

// ==========================================
// 4. MÓDULO CALIDAD (DOC FINAL)
// ==========================================

export interface PreEmbarqueDetallePaleta {
  idInspeccionPreEmbarqueDetalle: number;
  nroPallet: string;
  idRegistroPaleta: string;
  cantidadRequisitos: number;
  cantidadIncidencias: number;
  cliente: string;
  productor: string;
  variedad: string;
  tempMuestra: string;            // Temperatura pulpa ej. "0.8"
  hora: string;                   // "10:30"
  estadoFinal: string;            // "APROBADO" | "RECHAZADO"
  estado: string;
}

export interface DetalleFotoEvidencia {
  idDetalleEvidenciaVisual: number;
  url: string;
  nombreArchivo: string;
  posicion?: number;
}

export interface EvidenciaVisualGrupoCalidad {
  idTipoEvidenciaVisualGeneral: number;
  nombreTipoEvidencia: string;
  cantidad: string;
  detallePreEmbarqueEvidenciaVisual: DetalleFotoEvidencia[];
}

export interface InspeccionPreEmbarqueDocFinal {
  idInspeccionPreEmbarque: number;
  estado_calidad: string;         // "1" (Aprobado) | "0" (Rechazado)
  conEmbarque: string;            // "1" | "0"
  observacion: string;
  inspeccionPreEmbarqueDetalles: PreEmbarqueDetallePaleta[];
  evidenciasVisuales: EvidenciaVisualGrupoCalidad[];
}

export interface ActualizarCalidadDocFinalPayload {
  idInspeccionPreEmbarque: number;
  conEmbarque?: string;           // "1" | "0"
  observacion?: string;
  estado_calidad?: string;        // "1" | "0"
}

// ==========================================
// 5. MÓDULO FRÍO (DOC FINAL)
// ==========================================

export interface SensorTermoregistro {
  tipo: string;                   // "DIGITAL", "ANALOGICO"
  codigo: string;
  ubicacionContenedor: string;
}

export interface PosicionContenedor {
  idPosicionContenedor: number;
  descripcion: string;            // "P1-IZQ", "P1-DER"
}

export interface InspeccionEmbarqueFrioDetalle {
  idInspeccionEmbarqueFrioDetalle: number;
  idReferenciaPaleta: string;
  nroPalletReferencia: string;
  sensor: string;                 // "SI" | "NO"
  termoRegistro: string;
  contenedorPosicion: PosicionContenedor;
}

export interface EvidenciaVisualGrupoFrio {
  idTipoEvidenciaVisualGeneral: number;
  nombreTipoEvidencia: string;
  cantidad: string;
  evidenciaVisualEmbarqueFrio: DetalleFotoEvidencia[];
}

export interface InspeccionEmbarqueFrioDocFinal {
  idInspeccionEmbarqueFrio: number;
  conEmbarque: string;            // "1" | "0"
  precintoPacking: string;
  precintoSenasa: string;
  precintoLinea: string;
  sensoresTermoregistros: SensorTermoregistro[];
  resultadoCalidad: ResultadoCalidadRef;
  inspeccionEmbarqueFrioDetalles: InspeccionEmbarqueFrioDetalle[];
  evidenciasVisuales: EvidenciaVisualGrupoFrio[];
}

export interface ActualizarFrioDocFinalPayload {
  idInspeccionEmbarqueFrio: number;
  conEmbarque?: string;           // "1" | "0"
  resultadoCalidad?: {
    idResultadoCalidad: number;
  };
}

// ==========================================
// 6. MÓDULO SEGURIDAD PATRIMONIAL (DOC FINAL)
// ==========================================

export interface ComentarioSeguridad {
  idComentarioIngresoContenedor: number | null; // null si es nuevo
  comentario: string;
  estado: string;                 // "1" (Activo) | "0" (Eliminado)
}

export interface EvidenciaVisualGrupoSeguridad {
  tipoEvidenciaVisualSeguridad: {
    idTipoEvidenciaVisualSeguridad: number;
    descripcion: string;
  };
  evidenciasVisualesSeguridad: DetalleFotoEvidencia[];
}

export interface InspeccionIngresoContenedorDocFinal {
  idInspeccionIngresoContenedor: number;
  idCampanaReferencia: string;
  estadoProceso: string;          // "TERMINADO" | "EN PROCESO"
  conEmbarque: string;            // "1" | "0"
  resultadoCalidad: ResultadoCalidadRef;
  comentarios: ComentarioSeguridad[];
  evidenciasVisuales: EvidenciaVisualGrupoSeguridad[];
}

export interface ActualizarSeguridadDocFinalPayload {
  idInspeccionIngresoContenedor: number;
  conEmbarque?: string;
  resultadoCalidad?: {
    idResultadoCalidad: number;
  };
  comentarios?: ComentarioSeguridad[];
}

// ==========================================
// 7. CATÁLOGO DE CONCLUSIONES DE EMBARQUE
// ==========================================

export interface FormatoInspeccion {
  idFormatoInspeccion: number;
  descFormatoInspeccion: string;  // Ej. "FORMATO DE INSPECCIÓN DE EMBARQUE EN FRÍO"
  estado: string;
}

export interface ConclusionInformeFinal {
  id: number;
  descripcion: string;
  formatoInspeccion: FormatoInspeccion;
  estado: string;                 // "1" = Activo, "0" = Anulado
  fechaCreacion: string;
  fechaModificacion: string | null;
}

export interface GuardarConclusionPayload {
  descripcion: string;
  idFormatoInspeccion: number;
}

export interface FiltrosConclusion {
  idFormatoInspeccion?: number;
  estado?: string;                // "1" | "0" | ""
  search?: string;
}

// ==========================================
// 8. DOCUMENTO GENERAL CONSOLIDADO
// ==========================================

export interface DocumentoGeneralEmbarqueDetalle {
  id: number;
  conclusionDeInformeFinal: ConclusionInformeFinal;
  estado: string;
  fechaCreacion: string;
  fechaModificacion: string | null;
}

export interface DocumentoGeneralEmbarque {
  id: number;
  observacion: string;
  instruccionEmbarque: InstruccionCampana['instruccionEmbarque'];
  resultadoCalidad: ResultadoCalidadRef;
  inspeccionIngresoContenedor?: InspeccionIngresoContenedorRef;
  inspeccionPreEmbarque?: InspeccionPreEmbarqueRef;
  inspeccionEmbarqueFrio?: InspeccionEmbarqueFrioRef;
  detalles: DocumentoGeneralEmbarqueDetalle[];
  estado: string;
  fechaCreacion: string;
  fechaModificacion: string | null;
}

export interface GuardarDocumentoGeneralEmbarquePayload {
  idDocumentoGeneralEmbarque: number | null; // null si es nuevo
  observacion?: string;
  instruccionEmbarque: {
    idInstruccionEmbarque: number;
  };
  inspeccionIngresoContenedor?: {
    idInspeccionIngresoContenedor: number;
  };
  inspeccionPreEmbarque?: {
    idInspeccionPreEmbarque: number;
  };
  inspeccionEmbarqueFrio?: {
    idInspeccionEmbarqueFrio: number;
  };
  resultadoCalidad?: {
    idResultadoCalidad: number;
  };
  conclusiones?: Array<{
    idConclusionDeInformeFinal: number;
  }>;
}

// ==========================================
// 9. PARTICIPANTES & FIRMA DNI-E
// ==========================================

export interface ParticipanteEmbarque {
  id: number;
  rol: string;
  nombre: string;
  empresa: string;
  doc: string;
  firmaUrl?: string | null;
}

export interface ParticipanteDirectorio {
  id: number;
  nombre: string;
  rol: string;
  empresa: string;
  doc: string;
  brevete?: string;
  correo?: string;
}
```

---

## 3. Estructura de Carpetas (Feature-Based)

```
src/app/features/informes-embarque/
│
├── models/
│   └── informe-embarque.model.ts
│
├── services/
│   ├── documento-general-embarque.service.ts
│   ├── conclusiones-informe.service.ts
│   ├── inspeccion-calidad.service.ts
│   ├── inspeccion-frio.service.ts
│   ├── inspeccion-seguridad.service.ts
│   └── catalogos-produccion.service.ts
│
├── pages/
│   ├── informe-embarque-general/
│   │   ├── informe-embarque-general.component.ts
│   │   ├── informe-embarque-general.component.html
│   │   └── informe-embarque-general.component.scss
│   │
│   └── catalogo-conclusiones/
│       ├── catalogo-conclusiones.component.ts
│       ├── catalogo-conclusiones.component.html
│       └── catalogo-conclusiones.component.scss
│
└── components/
    ├── filters-bar/
    │   ├── filters-bar.component.ts
    │   └── filters-bar.component.html
    │
    ├── informes-table/
    │   ├── informes-table.component.ts
    │   └── informes-table.component.html
    │
    ├── informes-mobile-cards/
    │   ├── informes-mobile-cards.component.ts
    │   └── informes-mobile-cards.component.html
    │
    ├── informe-detail-modal/
    │   ├── informe-detail-modal.component.ts
    │   ├── informe-detail-modal.component.html
    │   └── sections/
    │       ├── datos-principales-section/
    │       ├── seguridad-doc-final-section/
    │       ├── calidad-doc-final-section/
    │       ├── frio-doc-final-section/
    │       ├── participantes-section/
    │       └── conclusiones-section/
    │
    ├── conclusion-form-modal/
    │   ├── conclusion-form-modal.component.ts
    │   └── conclusion-form-modal.component.html
    │
    ├── participante-selector-modal/
    │   ├── participante-selector-modal.component.ts
    │   └── participante-selector-modal.component.html
    │
    ├── dnie-lector-modal/
    │   ├── dnie-lector-modal.component.ts
    │   └── dnie-lector-modal.component.html
    │
    └── shared/
        ├── area-status-badge/
        ├── resultado-calidad-badge/
        └── reefer-esquema-viewer/
```

---

## 4. Página Principal 1: `InformeEmbarqueGeneralComponent`

Gestiona el listado consolidado y la apertura del modal multi-sección que consume las 3 inspecciones y permite el guardado del documento general con conclusiones asociadas.

### Template HTML Resumido
```html
<!-- Banner Ejecutivo SAFCO -->
<div class="executive-banner">
  <div class="banner-left">
    <div class="banner-icon-box">
      <kendo-svg-icon [icon]="iconFile" size="xlarge"></kendo-svg-icon>
    </div>
    <div class="banner-title-text">
      <h1>Informe General de Embarque</h1>
      <p>Consolidado Ejecutivo: Producción, Seguridad Patrimonial, Calidad & Frío</p>
    </div>
  </div>

  <div class="banner-actions">
    <button class="btn-banner-action" (click)="cargarListado()" [disabled]="cargandoLista()">
      <kendo-svg-icon [icon]="iconReload"></kendo-svg-icon>
      <span>Actualizar</span>
    </button>
  </div>
</div>

<!-- Filtros -->
<app-filters-bar
  [campanas]="campanas()"
  [filtrosIniciales]="filtros()"
  (filtrosChange)="onFiltrosAplicados($event)"
/>

<!-- Desktop Grid -->
<div class="hidden-mobile">
  <app-informes-table
    [items]="itemsEmbarque()"
    [cargando]="cargandoLista()"
    [totalElements]="totalRegistros()"
    [pageNumber]="paginaActual()"
    [pageSize]="filtros().size"
    (abrirModal)="abrirDetalle($event, 'all')"
    (exportarPdf)="exportarPdfConsolidado($event)"
    (cambiarPagina)="onCambioPagina($event)"
  />
</div>

<!-- Mobile Cards -->
<div class="hidden-desktop">
  <app-informes-mobile-cards
    [items]="itemsEmbarque()"
    [cargando]="cargandoLista()"
    (abrirModal)="abrirDetalle($event, 'all')"
    (exportarPdf)="exportarPdfConsolidado($event)"
  />
</div>

<!-- Modal Principal Multi-Sección -->
@if (modalDetalleAbierto() && embarqueSeleccionado()) {
  <app-informe-detail-modal
    [(visible)]="modalDetalleAbierto"
    [embarque]="embarqueSeleccionado()!"
    [tabInicial]="tabInicialModal()"
    (cerrar)="onModalCerrado()"
  />
}
```

---

## 5. Página Principal 2: `CatalogoConclusionesComponent` (Mantenimiento)

Basada en `tablas-conclusiones-embarque.html`, implementa el catálogo reactivo con Angular 21, Signals y Kendo SVG Icons.

### TypeScript
```typescript
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SvgIconModule } from '@progress/kendo-angular-icons';
import {
  listCheckIcon,
  plusCircleIcon,
  searchIcon,
  pencilIcon,
  trashIcon,
  checkCircleIcon,
  xCircleIcon,
  arrowRotateCwIcon
} from '@progress/kendo-svg-icons';
import Swal from 'sweetalert2';

import { ConclusionesInformeService } from '../../services/conclusiones-informe.service';
import {
  ConclusionInformeFinal,
  FiltrosConclusion
} from '../../models/informe-embarque.model';
import { ConclusionFormModalComponent } from '../../components/conclusion-form-modal/conclusion-form-modal.component';

@Component({
  selector: 'app-catalogo-conclusiones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SvgIconModule,
    ConclusionFormModalComponent
  ],
  templateUrl: './catalogo-conclusiones.component.html',
  styleUrls: ['./catalogo-conclusiones.component.scss'],
})
export class CatalogoConclusionesComponent implements OnInit {
  private readonly conclusionesService = inject(ConclusionesInformeService);

  // ─── Kendo SVG Icons ─────────────────────────────────────────────
  readonly iconBanner   = listCheckIcon;
  readonly iconPlus     = plusCircleIcon;
  readonly iconSearch   = searchIcon;
  readonly iconEdit     = pencilIcon;
  readonly iconTrash    = trashIcon;
  readonly iconCheck    = checkCircleIcon;
  readonly iconCancel   = xCircleIcon;
  readonly iconRefresh = arrowRotateCwIcon;

  // ─── Signals de Estado ───────────────────────────────────────────
  readonly conclusiones   = signal<ConclusionInformeFinal[]>([]);
  readonly cargando        = signal<boolean>(false);
  readonly modalAbierto   = signal<boolean>(false);
  readonly conclusionEdit = signal<ConclusionInformeFinal | null>(null);

  // ─── Filtros Locales ─────────────────────────────────────────────
  readonly filtroFormato = signal<string>('');
  readonly filtroEstado  = signal<string>('');
  readonly filtroSearch  = signal<string>('');

  // ─── Filtrado Derivado en Tiempo Real (computed) ──────────────────
  readonly conclusionesFiltradas = computed(() => {
    const lista = this.conclusiones();
    const fFormato = this.filtroFormato();
    const fEstado = this.filtroEstado();
    const fSearch = this.filtroSearch().toLowerCase().trim();

    return lista.filter(item => {
      // Filtro formato
      if (fFormato && item.formatoInspeccion?.descFormatoInspeccion !== fFormato) {
        return false;
      }
      // Filtro estado ("1" = Activo, "0" = Anulado)
      if (fEstado && item.estado !== fEstado) {
        return false;
      }
      // Búsqueda textual
      if (fSearch && !item.descripcion.toLowerCase().includes(fSearch)) {
        return false;
      }
      return true;
    });
  });

  ngOnInit(): void {
    this.cargarConclusiones();
  }

  cargarConclusiones(): void {
    this.cargando.set(true);
    this.conclusionesService.listarTodas().subscribe({
      next: (data) => {
        this.conclusiones.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  abrirModalCrear(): void {
    this.conclusionEdit.set(null);
    this.modalAbierto.set(true);
  }

  abrirModalEditar(item: ConclusionInformeFinal): void {
    this.conclusionEdit.set(item);
    this.modalAbierto.set(true);
  }

  anularConclusion(item: ConclusionInformeFinal): void {
    Swal.fire({
      title: '¿Anular Conclusión?',
      text: `Se dará de baja la conclusión: "${item.descripcion.substring(0, 60)}..."`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d80000',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, Anular',
      cancelButtonText: 'Cancelar'
    }).then(res => {
      if (res.isConfirmed) {
        this.conclusionesService.anularConclusion(item.id).subscribe({
          next: () => {
            Swal.fire('¡Anulada!', 'La conclusión ha sido dada de baja.', 'success');
            this.cargarConclusiones();
          }
        });
      }
    });
  }

  onGuardadoExitoso(): void {
    this.modalAbierto.set(false);
    this.cargarConclusiones();
  }
}
```

### Template HTML (`catalogo-conclusiones.component.html`)
```html
<main class="content-area">
  <!-- Banner Ejecutivo Corporativo SAFCO -->
  <div class="executive-banner">
    <div class="banner-left">
      <div class="banner-icon-box">
        <kendo-svg-icon [icon]="iconBanner" size="xlarge"></kendo-svg-icon>
      </div>
      <div class="banner-title-text">
        <h1>Catálogo de Conclusiones de Embarque</h1>
        <p>Mantenimiento de Conclusiones Frecuentes por Formato de Informe</p>
      </div>
    </div>
    <button class="btn-primary-safco" (click)="abrirModalCrear()">
      <kendo-svg-icon [icon]="iconPlus"></kendo-svg-icon>
      <span>Nueva Conclusión</span>
    </button>
  </div>

  <!-- Barra de Filtros Avanzada -->
  <div class="filters-card">
    <div class="filters-grid">
      <div class="filter-item">
        <label for="filterFormato">Formato de Informe</label>
        <select id="filterFormato" class="form-select" [ngModel]="filtroFormato()" (ngModelChange)="filtroFormato.set($event)">
          <option value="">TODOS LOS FORMATOS</option>
          <option value="FORMATO DE INSPECCIÓN DE EMBARQUE EN FRÍO">Inspección Frío y Despacho</option>
          <option value="FORMATO DE INSPECCIÓN DE INGRESO DE CONTENEDOR">Inspección de Contenedores (Seguridad)</option>
          <option value="FORMATO DE INSPECCIÓN PRE-EMBARQUE">Control de Calidad Pre-Embarque</option>
        </select>
      </div>

      <div class="filter-item">
        <label for="filterEstado">Estado</label>
        <select id="filterEstado" class="form-select" [ngModel]="filtroEstado()" (ngModelChange)="filtroEstado.set($event)">
          <option value="">TODOS LOS ESTADOS</option>
          <option value="1">ACTIVO</option>
          <option value="0">ANULADO</option>
        </select>
      </div>

      <div class="filter-item filter-search-span">
        <label for="filterSearch">Buscar Conclusión...</label>
        <div class="search-input-wrapper">
          <kendo-svg-icon [icon]="iconSearch" class="search-icon-inside"></kendo-svg-icon>
          <input
            type="text"
            id="filterSearch"
            class="form-input search-input"
            placeholder="Buscar por texto de conclusión..."
            [ngModel]="filtroSearch()"
            (ngModelChange)="filtroSearch.set($event)"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- Tabla Estilo Kendo SAFCO -->
  <div class="table-container">
    <table class="table-safco">
      <thead>
        <tr>
          <th style="width: 280px; text-align: left;">FORMATO DE INSPECCIÓN</th>
          <th style="text-align: left;">TEXTO DE LA CONCLUSIÓN</th>
          <th style="width: 130px; text-align: center;">ESTADO</th>
          <th style="width: 140px; text-align: center;">ACCIONES</th>
        </tr>
      </thead>
      <tbody>
        @for (item of conclusionesFiltradas(); track item.id) {
          <tr>
            <td style="font-weight: 700; color: #004a4c; text-align: left;">
              {{ item.formatoInspeccion?.descFormatoInspeccion || 'GENERAL' }}
            </td>
            <td style="text-align: left; color: #1e293b; line-height: 1.4;">
              {{ item.descripcion }}
            </td>
            <td style="text-align: center;">
              @if (item.estado === '1') {
                <span class="badge-status-activo">
                  <kendo-svg-icon [icon]="iconCheck" size="small"></kendo-svg-icon>
                  ACTIVO
                </span>
              } @else {
                <span class="badge-status-anulado">
                  <kendo-svg-icon [icon]="iconCancel" size="small"></kendo-svg-icon>
                  ANULADO
                </span>
              }
            </td>
            <td style="text-align: center;">
              <div class="action-buttons-row">
                <button class="btn-action-icon edit" (click)="abrirModalEditar(item)" title="Editar Conclusión">
                  <kendo-svg-icon [icon]="iconEdit"></kendo-svg-icon>
                </button>
                @if (item.estado === '1') {
                  <button class="btn-action-icon delete" (click)="anularConclusion(item)" title="Anular Conclusión">
                    <kendo-svg-icon [icon]="iconTrash"></kendo-svg-icon>
                  </button>
                }
              </div>
            </td>
          </tr>
        } @empty {
          <tr>
            <td colspan="4" class="empty-table-cell">
              No se encontraron conclusiones con los filtros seleccionados.
            </td>
          </tr>
        }
      </tbody>
    </table>
  </div>
</main>

<!-- Modal Crear / Editar Conclusión -->
@if (modalAbierto()) {
  <app-conclusion-form-modal
    [(visible)]="modalAbierto"
    [conclusion]="conclusionEdit()"
    (guardado)="onGuardadoExitoso()"
  />
}
```

---

## 6. Sección de Conclusiones en Modal de Embarque (`ConclusionesSectionComponent`)

Se ubica dentro del modal de detalle (`InformeDetailModalComponent`). Muestra el checklist de conclusiones activas obtenidas de `GET /produccion/conclusion-informe-final/activos`, permite redactar observaciones y al confirmar, dispara el guardado del `DocumentoGeneralEmbarque`.

### TypeScript
```typescript
import { Component, inject, signal, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SvgIconModule } from '@progress/kendo-angular-icons';
import { checkCircleIcon, commentIcon, alertCircleIcon } from '@progress/kendo-svg-icons';
import Swal from 'sweetalert2';

import { ConclusionesInformeService } from '../../services/conclusiones-informe.service';
import { DocumentoGeneralEmbarqueService } from '../../services/documento-general-embarque.service';
import {
  ConclusionInformeFinal,
  InformeEmbarqueItem,
  GuardarDocumentoGeneralEmbarquePayload
} from '../../models/informe-embarque.model';

@Component({
  selector: 'app-conclusiones-section',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgIconModule],
  templateUrl: './conclusiones-section.component.html',
})
export class ConclusionesSectionComponent implements OnInit {
  private readonly conclusionesService = inject(ConclusionesInformeService);
  private readonly embarqueService = inject(DocumentoGeneralEmbarqueService);

  // Inputs & Outputs
  embarque = input.required<InformeEmbarqueItem>();
  idDocumentoGeneral = input<number | null>(null);
  idInstruccion = input.required<number>();
  guardado = output<void>();

  // Signals
  readonly catalogoConclusiones = signal<ConclusionInformeFinal[]>([]);
  readonly idsSeleccionados      = signal<number[]>([]);
  readonly observacionGeneral   = signal<string>('');
  readonly guardando            = signal<boolean>(false);

  // Icons
  readonly iconCheck = checkCircleIcon;
  readonly iconComment = commentIcon;
  readonly iconAlert = alertCircleIcon;

  ngOnInit(): void {
    this.cargarCatalogoActivo();
  }

  cargarCatalogoActivo(): void {
    this.conclusionesService.listarActivas().subscribe({
      next: (data) => this.catalogoConclusiones.set(data),
    });
  }

  toggleConclusion(id: number, checked: boolean): void {
    this.idsSeleccionados.update(ids =>
      checked ? [...ids, id] : ids.filter(x => x !== id)
    );
  }

  guardarDocumentoFinal(): void {
    const payload: GuardarDocumentoGeneralEmbarquePayload = {
      idDocumentoGeneralEmbarque: this.idDocumentoGeneral(),
      observacion: this.observacionGeneral(),
      instruccionEmbarque: {
        idInstruccionEmbarque: this.idInstruccion(),
      },
      inspeccionIngresoContenedor: this.embarque().InspeccionIngresoContenedor ? {
        idInspeccionIngresoContenedor: this.embarque().InspeccionIngresoContenedor!.idInspeccionIngresoContenedor
      } : undefined,
      inspeccionPreEmbarque: this.embarque().InspeccionPreEmbarque ? {
        idInspeccionPreEmbarque: this.embarque().InspeccionPreEmbarque!.idInspeccionPreEmbarque
      } : undefined,
      inspeccionEmbarqueFrio: this.embarque().InspeccionEmbarqueFrio ? {
        idInspeccionEmbarqueFrio: this.embarque().InspeccionEmbarqueFrio!.idInspeccionEmbarqueFrio
      } : undefined,
      resultadoCalidad: this.embarque().resultadoCalidad ? {
        idResultadoCalidad: this.embarque().resultadoCalidad!.idResultadoCalidad
      } : { idResultadoCalidad: 1 },
      conclusiones: this.idsSeleccionados().map(id => ({ idConclusionDeInformeFinal: id })),
    };

    this.guardando.set(true);
    this.embarqueService.guardarDocumentoGeneral(payload).subscribe({
      next: () => {
        this.guardando.set(false);
        Swal.fire('¡Éxito!', 'Documento General y Conclusiones guardadas correctamente.', 'success');
        this.guardado.emit();
      },
      error: () => this.guardando.set(false)
    });
  }
}
```

---

## 7. Servicios — Contratos HTTP Angular 21

### 7.1 `DocumentoGeneralEmbarqueService`
```typescript
@Injectable({ providedIn: 'root' })
export class DocumentoGeneralEmbarqueService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/produccion/documento-general-embarque';

  listarInformeGeneral(filtros: FiltrosInformeEmbarque): Observable<PageSpring<InformeEmbarqueItem>> {
    let params = new HttpParams()
      .set('campana', filtros.campana)
      .set('pagina', filtros.pagina.toString())
      .set('size', filtros.size.toString());

    if (filtros.idInstruccionEmbarque) params = params.set('idInstruccionEmbarque', filtros.idInstruccionEmbarque);
    if (filtros.fechaDesde) params = params.set('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) params = params.set('fechaHasta', filtros.fechaHasta);
    if (filtros.idClienteFinal) params = params.set('idClienteFinal', filtros.idClienteFinal);
    if (filtros.estadoGeneral) params = params.set('estadoGeneral', filtros.estadoGeneral);
    if (filtros.buscador) params = params.set('buscador', filtros.buscador);

    return this.http.get<ApiResponseProvider<PageSpring<InformeEmbarqueItem>>>(`${this.baseUrl}/listado`, { params })
      .pipe(map(res => res.data));
  }

  obtenerReporteInstruccion(idInstruccion: number): Observable<ReporteDatosInstruccion[]> {
    return this.http.get<ApiResponseProvider<ReporteDatosInstruccion[]>>(`${this.baseUrl}/reporte-instruccion/${idInstruccion}`)
      .pipe(map(res => res.data));
  }

  guardarDocumentoGeneral(payload: GuardarDocumentoGeneralEmbarquePayload): Observable<DocumentoGeneralEmbarque> {
    return this.http.post<ApiResponseProvider<DocumentoGeneralEmbarque>>(`${this.baseUrl}/guardar`, payload)
      .pipe(map(res => res.data));
  }

  obtenerDocumentoGeneralPorId(id: number): Observable<DocumentoGeneralEmbarque> {
    return this.http.get<ApiResponseProvider<DocumentoGeneralEmbarque>>(`${this.baseUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  descargarPdfConsolidado(instruccion: string): void {
    window.open(`${this.baseUrl}/exportar-pdf?instruccion=${encodeURIComponent(instruccion)}`, '_blank');
  }
}
```

### 7.2 `ConclusionesInformeService`
```typescript
@Injectable({ providedIn: 'root' })
export class ConclusionesInformeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/produccion/conclusion-informe-final';

  listarTodas(): Observable<ConclusionInformeFinal[]> {
    return this.http.get<ApiResponseProvider<ConclusionInformeFinal[]>>(this.baseUrl)
      .pipe(map(res => res.data));
  }

  listarActivas(idFormatoInspeccion?: number): Observable<ConclusionInformeFinal[]> {
    let params = new HttpParams();
    if (idFormatoInspeccion) params = params.set('idFormatoInspeccion', idFormatoInspeccion);

    return this.http.get<ApiResponseProvider<ConclusionInformeFinal[]>>(`${this.baseUrl}/activos`, { params })
      .pipe(map(res => res.data));
  }

  obtenerPorId(id: number): Observable<ConclusionInformeFinal> {
    return this.http.get<ApiResponseProvider<ConclusionInformeFinal>>(`${this.baseUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  crearConclusion(payload: GuardarConclusionPayload): Observable<ConclusionInformeFinal> {
    return this.http.post<ApiResponseProvider<ConclusionInformeFinal>>(this.baseUrl, payload)
      .pipe(map(res => res.data));
  }

  actualizarConclusion(id: number, payload: GuardarConclusionPayload): Observable<ConclusionInformeFinal> {
    return this.http.put<ApiResponseProvider<ConclusionInformeFinal>>(`${this.baseUrl}/${id}`, payload)
      .pipe(map(res => res.data));
  }

  anularConclusion(id: number): Observable<void> {
    return this.http.patch<ApiResponseProvider<null>>(`${this.baseUrl}/${id}/anular`, {})
      .pipe(map(() => void 0));
  }
}
```

---

## 8. Matriz Consolidada de Endpoints API REST

| # | Módulo | Método | URL | Descripción | Request / Params | Response Data |
|---|---|---|---|---|---|---|
| 1 | Producción | `GET` | `/produccion/documento-general-embarque/listado` | Listado general paginado | Query `FiltrosInformeEmbarque` | `PageSpring<InformeEmbarqueItem>` |
| 2 | Producción | `GET` | `/produccion/documento-general-embarque/reporte-instruccion/{id}` | Datos maestros de embarque | Path `idInstruccionEmbarque` | `ReporteDatosInstruccion[]` |
| 3 | Producción | `GET` | `/produccion/documento-general-embarque/instrucciones-por-campana` | Autocomplete instrucciones | Query `campana` | `InstruccionCampana[]` |
| 4 | Producción | `GET` | `/produccion/documento-general-embarque/clientes-finales-por-campana` | Autocomplete clientes | Query `campana` | `ClienteFinalCampana[]` |
| 5 | Producción | `POST` | `/produccion/documento-general-embarque/guardar` | Guardar doc general + conclusiones | JSON `GuardarDocumentoGeneralEmbarquePayload` | `DocumentoGeneralEmbarque` |
| 6 | Producción | `GET` | `/produccion/documento-general-embarque/{id}` | Obtener doc general por ID | Path `id` | `DocumentoGeneralEmbarque` |
| 7 | Conclusiones | `GET` | `/produccion/conclusion-informe-final` | Listar todas las conclusiones | - | `ConclusionInformeFinal[]` |
| 8 | Conclusiones | `GET` | `/produccion/conclusion-informe-final/activos` | Listar conclusiones activas | Query `idFormatoInspeccion` | `ConclusionInformeFinal[]` |
| 9 | Conclusiones | `GET` | `/produccion/conclusion-informe-final/{id}` | Obtener conclusión por ID | Path `id` | `ConclusionInformeFinal` |
| 10 | Conclusiones | `POST` | `/produccion/conclusion-informe-final` | Crear nueva conclusión | JSON `GuardarConclusionPayload` | `ConclusionInformeFinal` |
| 11 | Conclusiones | `PUT` | `/produccion/conclusion-informe-final/{id}` | Actualizar conclusión | Path `id` + JSON `GuardarConclusionPayload` | `ConclusionInformeFinal` |
| 12 | Conclusiones | `PATCH` | `/produccion/conclusion-informe-final/{id}/anular` | Anulación lógica de conclusión | Path `id` | `null` |
| 13 | Calidad | `GET` | `/calidad/InspeccionPreEmbarque/{id}/doc-final` | Documento final Calidad | Path `idInspeccion` | `InspeccionPreEmbarqueDocFinal` |
| 14 | Calidad | `PUT` | `/calidad/InspeccionPreEmbarque/doc-final` | Actualizar doc final Calidad | JSON `ActualizarCalidadDocFinalPayload` | `InspeccionPreEmbarqueDocFinal` |
| 15 | Calidad | `POST` | `/calidad/InspeccionPreEmbarque/{id}/evidencias-visuales-por-tipo` | Subir evidencias Calidad | Multipart FormData | `null` |
| 16 | Frío | `GET` | `/frio/inspeccion-embarque/{id}/doc-final` | Documento final Frío | Path `idInspeccion` | `InspeccionEmbarqueFrioDocFinal` |
| 17 | Frío | `PUT` | `/frio/inspeccion-embarque/doc-final` | Actualizar doc final Frío | JSON `ActualizarFrioDocFinalPayload` | `InspeccionEmbarqueFrioDocFinal` |
| 18 | Frío | `POST` | `/frio/inspeccion-embarque/{id}/evidencias-visuales` | Subir evidencias Frío | Multipart FormData | `null` |
| 19 | Seguridad | `GET` | `/SeguridadPatrimonial/InspeccionIngresoContenedor/{id}/doc-final` | Documento final Seguridad | Path `idInspeccion` | `InspeccionIngresoContenedorDocFinal` |
| 20 | Seguridad | `PUT` | `/SeguridadPatrimonial/InspeccionIngresoContenedor/doc-final` | Actualizar doc final Seguridad | JSON `ActualizarSeguridadDocFinalPayload` | `InspeccionIngresoContenedorDocFinal` |
| 21 | Seguridad | `POST` | `/SeguridadPatrimonial/InspeccionIngresoContenedor/{id}/evidencias-visuales-por-tipo` | Subir evidencias Seguridad | Multipart FormData | `null` |
| 22 | Catálogos | `GET` | `/Produccion/General/GET/ListCampanasActiva` | Catálogo campañas activas | - | `CampanaActiva[]` |

---

## 9. Design System SAFCO — Tokens y Estilos de Conclusiones

```scss
// Badges de Estado para Conclusiones
.badge-status-activo {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  background-color: #e6f0f0;
  color: #004a4c;
  border: 1px solid #b3d1d2;
}

.badge-status-anulado {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  background-color: #fee2e2;
  color: #990000;
  border: 1px solid #fecaca;
}

// Botones de acción en tabla
.action-buttons-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  .btn-action-icon {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
    background: white;
    cursor: pointer;
    transition: all 0.15s ease;

    &.edit {
      color: #004a4c;
      &:hover { background: #e6f0f0; border-color: #004a4c; }
    }

    &.delete {
      color: #d80000;
      &:hover { background: #fee2e2; border-color: #d80000; }
    }
  }
}
```

---

## 10. Checklist de Implementación Angular 21

### Modelos y Servicios
- [ ] Crear `informe-embarque.model.ts` con todos los modelos e interfaces
- [ ] Implementar `DocumentoGeneralEmbarqueService` (con `guardarDocumentoGeneral` y `obtenerPorId`)
- [ ] Implementar `ConclusionesInformeService` (CRUD completo y anulación lógica)
- [ ] Implementar `InspeccionCalidadService` con subida multipart
- [ ] Implementar `InspeccionFrioService` con subida multipart
- [ ] Implementar `InspeccionSeguridadService` con gestión de comentarios
- [ ] Implementar `CatalogosProduccionService`

### Vistas y Componentes
- [ ] `InformeEmbarqueGeneralComponent` (Listado y modal de embarque)
- [ ] `CatalogoConclusionesComponent` (Página de mantenimiento de conclusiones)
- [ ] `ConclusionFormModalComponent` con Two-way binding `model<boolean>()`
- [ ] `ConclusionesSectionComponent` (Checklist activo en modal de embarque)
- [ ] `FiltersBarComponent` con carga en cascada de instrucciones y clientes
- [ ] `InformesTableComponent` y `InformesMobileCardsComponent` (Mobile-First)
- [ ] `DnieLectorModalComponent` para captura de firma electrónica

### Design System & Zoneless
- [ ] 100% Kendo SVG Icons (Cero Boxicons)
- [ ] `provideExperimentalZonelessChangeDetection()` activo
- [ ] Uso estricto de `computed()` para filtrados y promedios
- [ ] Validar estados visuales de badges de `ApiResponseProvider`
