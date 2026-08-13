# SPEC Angular 21: Informe de Embarque General — SAFCO

**Framework:** Angular 21 (Standalone + Signals + Zoneless)
**Versión del Prototipo de Referencia:** 3.5
**Módulo fuente:** `general/informe-embarque-general.html`
**Design System:** SAFCO Corporativo (Kendo SVG Icons, Paleta Teal/Rojo)
**Fecha de spec:** 2026-08-13

---

> [!IMPORTANT]
> Este spec aplica estrictamente las reglas del **Angular 21 Modernizer** y el **SAFCO Design System**.
> - ❌ **PROHIBIDO** usar `Boxicons (bx bx-*)` — no funcionan en el proyecto Angular.
> - ✅ **OBLIGATORIO** usar `<kendo-svg-icon>` de `@progress/kendo-svg-icons`.
> - ✅ **OBLIGATORIO** usar Signals nativas (`signal()`, `computed()`, `input()`, `output()`, `model()`).
> - ❌ **PROHIBIDO** NgModules, `*ngIf`, `*ngFor`, `@Input()/@Output()` old-style.

---

## 1. Descripción del Módulo

Centro de control consolidado del proceso de embarque de fruta de exportación. Gestiona múltiples roles (Seguridad Patrimonial, Calidad, Frío y Despacho) para registrar, confirmar y firmar digitalmente un **Informe de Embarque**, identificado por la **Instrucción de Embarque** (ej. `ASP001`).

### Capacidades

| Capacidad | Descripción |
|---|---|
| Listar informes | Tabla Kendo Grid en desktop + cards en móvil, con filtros multi-campo |
| Ver / Editar | Modal multi-sección con tabs por área |
| Registro por área | Cada área (Seguridad, Calidad, Frío) confirma su registro independientemente |
| Dictamen en cascada | RECHAZADO general → propaga a las 3 áreas |
| Participantes | Directorio corporativo + alta rápida + firma DNI-e |
| Evidencias fotográficas | Agrupadas por tipo/categoría con carga de archivos |
| Esquema visual reefer | Mapa 2 columnas de posición de pallets |
| Exportación PDF | Via endpoint del backend |

---

## 2. Modelos TypeScript (Interfaces)

> Ubicación sugerida: `src/app/features/informes-embarque/models/informe-embarque.model.ts`

```typescript
export type DictamenArea = 'Conforme' | 'Rechazado';
export type AreaStatus = 'ready' | 'pending' | 'incomplete';
export type TabArea = 'all' | 'seguridad' | 'calidad' | 'frio';

export interface AreaItemStatus {
  status: AreaStatus;
  dictamen: DictamenArea | 'Pendiente';
  fecha: string;       // "2025-01-05 08:30"
  inspector: string;   // nombre del inspector confirmante
}

export interface AreasStatus {
  seguridad: AreaItemStatus;
  calidad: AreaItemStatus;
  frio: AreaItemStatus;
}

export interface PaletaCalidad {
  nro: number;
  nroPallet: string;   // "BBP01260725001C"
  productor: string;
  variedad: string;
  temp: number;        // temperatura pulpa °C
  hora: string;        // "10:25"
  cumple: 'Conforme' | 'No Conforme';
}

export interface Dispositivo {
  tipo: string;        // "1° Termógrafo", "Sensor SENASA 1"
  codigo: string;      // "TERM-881"
  ubicacion: string;   // "Pallet 01"
}

export interface EsquemaPallet {
  pos: number;                        // 1 a 23
  codigo: string;                     // código o "VACÍO"
  estado: 'ok' | 'alert' | 'empty';
  sensor?: string;                    // "SENSOR6565" si aplica
}

export interface FotoEvidencia {
  id: string;
  url: string;     // URL pública del servidor
  caption: string;
}

export interface GrupoEvidencia {
  tipo: string;         // "Inspección Estructura e Higiene del Contenedor"
  fotos: FotoEvidencia[];
}

export interface EvidenciasPorArea {
  seguridad: GrupoEvidencia[];
  calidad: GrupoEvidencia[];
  frio: GrupoEvidencia[];
}

export interface Participante {
  id: number;
  rol: string;
  nombre: string;
  empresa: string;
  doc: string;
  firma?: string;    // URL imagen sello DNI-e o null
}

export interface ParticipanteDirectorio {
  id: number;
  nombre: string;
  rol: string;
  empresa: string;
  doc: string;
  brevete: string;
  correo: string;
}

export interface DatosSeguridad {
  dictamen: DictamenArea;
  observaciones: string[];
}

export interface DatosCalidad {
  dictamen: DictamenArea;
  paletasEvaluadas: PaletaCalidad[];
  observaciones: string;
}

export interface DatosFrio {
  dictamen: DictamenArea;
  precintoSafco: string;
  precintoSenasa: string;
  precintoLinea: string;
  dispositivos: Dispositivo[];
  esquemaPaletas: EsquemaPallet[];
  observaciones: string;
}

export interface InformeEmbarque {
  id: string;
  instruccionEmbarque: string;      // "ASP001" — CLAVE PRINCIPAL
  nroInforme: string;
  nroEmbarque: string;
  contenedor: string;
  booking: string;
  cliente: string;
  productor: string;
  variedad: string;
  programa: string;
  campana: string;                  // "UVA-2025"
  fechaEmbarque: string;            // ISO "2025-01-05"
  guias: string;
  packingList: string;
  estadoGeneral: 'Completo' | 'En Proceso';
  dictamenGeneral: DictamenArea;
  areas: AreasStatus;
  datosSeguridad: DatosSeguridad;
  datosCalidad: DatosCalidad;
  datosFrio: DatosFrio;
  participantes: Participante[];
  evidencias: EvidenciasPorArea;
  conclusionesSeleccionadas: string[];
  conclusionCustom: string;
}

export interface FiltrosInforme {
  campana: string;
  instruccion: string;
  fechaDesde: string;
  fechaHasta: string;
  cliente: string;
  estado: string;
  search: string;
}

export interface ConfirmarAreaPayload {
  dictamen: DictamenArea;
  observaciones?: string | string[];
  // Se extiende con datos específicos por área en el servicio
}

export interface ConclusionCatalogo {
  texto: string;
  orden: number;
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
│   ├── informes-embarque.service.ts
│   ├── participantes.service.ts
│   └── pdf-export.service.ts
│
├── pages/
│   └── informe-embarque-general/
│       ├── informe-embarque-general.component.ts
│       └── informe-embarque-general.component.html
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
    │       ├── datos-principales/
    │       ├── seguridad-section/
    │       ├── calidad-section/
    │       ├── frio-section/
    │       ├── participantes-section/
    │       └── conclusiones-section/
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
        ├── area-badge/
        ├── dictamen-badge/
        └── reefer-esquema/
```

---

## 4. Página Principal — `InformeEmbarqueGeneralComponent`

### TypeScript

```typescript
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { InformesEmbarqueService } from '../../services/informes-embarque.service';
import {
  InformeEmbarque, FiltrosInforme, TabArea
} from '../../models/informe-embarque.model';

// Kendo SVG Icons
import {
  fileIcon,
  filterIcon,
  searchIcon,
  pencilIcon,
  filePdfIcon,
  checkCircleIcon,
  clockIcon,
  xCircleIcon,
  checkIcon
} from '@progress/kendo-svg-icons';

@Component({
  selector: 'app-informe-embarque-general',
  standalone: true,
  imports: [
    CommonModule,      // O imports específicos
    SvgIconModule,     // KendoSVGIconModule
    InformesTableComponent,
    InformesMobileCardsComponent,
    FiltersBarComponent,
    InformeDetailModalComponent,
  ],
  templateUrl: './informe-embarque-general.component.html',
})
export class InformeEmbarqueGeneralComponent implements OnInit {

  private readonly informesService = inject(InformesEmbarqueService);

  // ─── Iconos Kendo SVG ───────────────────────────────────────────
  readonly iconFile       = fileIcon;
  readonly iconFilter     = filterIcon;
  readonly iconSearch     = searchIcon;
  readonly iconEdit       = pencilIcon;
  readonly iconPdf        = filePdfIcon;
  readonly iconCheck      = checkCircleIcon;
  readonly iconClock      = clockIcon;
  readonly iconXCircle    = xCircleIcon;

  // ─── Estado Signals ─────────────────────────────────────────────
  readonly informes        = signal<InformeEmbarque[]>([]);
  readonly filtros         = signal<FiltrosInforme>({
    campana: '', instruccion: '', fechaDesde: '',
    fechaHasta: '', cliente: '', estado: '', search: ''
  });
  readonly modalAbierto    = signal<boolean>(false);
  readonly informeActivo   = signal<InformeEmbarque | null>(null);
  readonly tabActiva       = signal<TabArea>('all');
  readonly cargandoLista   = signal<boolean>(false);

  // ─── Estado Derivado (computed) ─────────────────────────────────
  readonly informesFiltrados = computed(() => {
    const f = this.filtros();
    return this.informes().filter(item => {
      if (f.campana     && item.campana !== f.campana) return false;
      if (f.instruccion && item.instruccionEmbarque !== f.instruccion) return false;
      if (f.fechaDesde  && item.fechaEmbarque < f.fechaDesde) return false;
      if (f.fechaHasta  && item.fechaEmbarque > f.fechaHasta) return false;
      if (f.cliente     && item.cliente !== f.cliente) return false;
      if (f.estado      && item.estadoGeneral !== f.estado) return false;
      if (f.search) {
        const s = f.search.toLowerCase();
        return item.instruccionEmbarque.toLowerCase().includes(s)
          || item.nroInforme.toLowerCase().includes(s)
          || item.contenedor.toLowerCase().includes(s)
          || item.booking.toLowerCase().includes(s);
      }
      return true;
    });
  });

  ngOnInit(): void {
    this.cargarInformes();
  }

  cargarInformes(): void {
    this.cargandoLista.set(true);
    this.informesService.listar(this.filtros()).subscribe({
      next: data => {
        this.informes.set(data);
        this.cargandoLista.set(false);
      },
      error: () => this.cargandoLista.set(false)
    });
  }

  onFiltrosChange(filtros: FiltrosInforme): void {
    this.filtros.set(filtros);
    // computed() se recalcula automáticamente
  }

  abrirModal(id: string, tab: TabArea = 'all'): void {
    const informe = this.informes().find(i => i.id === id);
    if (!informe) return;
    this.informeActivo.set(informe);
    this.tabActiva.set(tab);
    this.modalAbierto.set(true);
  }

  onModalClosed(): void {
    this.modalAbierto.set(false);
    this.cargarInformes(); // recargar lista tras edición
  }

  exportarPDF(id: string): void {
    this.informesService.exportarPDF(id);
  }
}
```

### Template HTML (esquema)

```html
<!-- Banner Ejecutivo SAFCO -->
<div class="executive-banner">
  <div class="banner-left">
    <div class="banner-icon-box">
      <kendo-svg-icon [icon]="iconFile" size="xlarge"></kendo-svg-icon>
    </div>
    <div class="banner-title-text">
      <h1>Informe de Embarque General</h1>
      <p>Agrupado por Instrucción de Embarque (Consolidado: Seguridad, Calidad & Frío y Despacho)</p>
    </div>
  </div>
</div>

<!-- Filtros -->
<app-filters-bar [filtros]="filtros()" (filtrosChange)="onFiltrosChange($event)" />

<!-- Tabla Desktop (oculta en móvil) -->
<div class="hidden-mobile">
  <app-informes-table
    [informes]="informesFiltrados()"
    [cargando]="cargandoLista()"
    (editar)="abrirModal($event, 'all')"
    (exportarPdf)="exportarPDF($event)" />
</div>

<!-- Cards Móvil (ocultas en desktop) -->
<div class="hidden-desktop">
  <app-informes-mobile-cards
    [informes]="informesFiltrados()"
    (editar)="abrirModal($event, 'all')"
    (exportarPdf)="exportarPDF($event)" />
</div>

<!-- Modal Principal -->
@if (modalAbierto()) {
  <app-informe-detail-modal
    [(visible)]="modalAbierto"
    [informeId]="informeActivo()?.id ?? ''"
    [tabInicial]="tabActiva()"
    (cerrar)="onModalClosed()" />
}
```

---

## 5. Componentes — Contratos de Inputs/Outputs/Signals

### 5.1 FiltersBarComponent

```typescript
// Inputs
filtros = input.required<FiltrosInforme>();

// Outputs
filtrosChange = output<FiltrosInforme>();

// State
form: FormGroup; // NonNullableFormBuilder con todos los campos de FiltrosInforme
```

**Campos del formulario:**
- `campana`: select (TODAS LAS CAMPAÑAS | UVA-2025 | UVA-2026 | ARÁNDANO-2026)
- `instruccion`: select (TODAS | ASP001 | ASP011 | ASP012)
- `fechaDesde`: date input
- `fechaHasta`: date input
- `cliente`: select (TODOS | TALSA S.A | VANGUARD LOGISTICS | DOLE FOOD COMPANY)
- `estado`: select (TODOS | Completo | En Proceso)
- `search`: text input con icono de búsqueda (debounce 300ms recomendado)

> El search tiene `grid-column: span 2` para ocupar el ancho de 2 columnas en desktop.

---

### 5.2 InformesTableComponent

```typescript
// Inputs
informes  = input.required<InformeEmbarque[]>();
cargando  = input<boolean>(false);

// Outputs
editar      = output<string>();   // emite informe.id
exportarPdf = output<string>();   // emite informe.id
```

**Columnas de la tabla (estilo Kendo Grid con header teal `#004a4c`):**

| Columna | Campo | Notas |
|---|---|---|
| INSTRUCCIÓN EMBARQUE | `instruccionEmbarque` | Bold rojo `#d30c0c`, icono Kendo `tagIcon` |
| FECHA | `fechaEmbarque` | |
| EMBARQUE | `nroEmbarque` | |
| CONTENEDOR | `contenedor` | Bold `#0f172a` |
| CLIENTE | `cliente` | |
| VARIEDAD | `variedad` | badge `#f1f5f9` |
| PARTICIPANTES | `participantes.length` | "N pers." |
| AVANCE (SEG\|CAL\|FRÍO) | `areas.*` | 3 badges de área |
| ESTADO GENERAL | `estadoGeneral` | badge `ready`/`pending` |
| RESULTADO FINAL | `dictamenGeneral` | badge verde/rojo |
| ACCIONES | — | botones editar + PDF |

**Botones de acción por fila:**
```html
<button (click)="editar.emit(item.id)" title="Ver / Editar">
  <kendo-svg-icon [icon]="iconEdit" size="small"></kendo-svg-icon>
</button>
<button (click)="exportarPdf.emit(item.id)" title="Exportar PDF">
  <kendo-svg-icon [icon]="iconPdf" size="small"></kendo-svg-icon>
</button>
```

---

### 5.3 InformesMobileCardsComponent

```typescript
// Inputs
informes    = input.required<InformeEmbarque[]>();

// Outputs
editar      = output<string>();
exportarPdf = output<string>();
```

**Estructura de cada card:**
- Borde izquierdo de 4px según `estadoGeneral`:
  - Completo → `#4c8c2b` (verde SAFCO)
  - En Proceso → `#d97706` (amber)
- Header: Instrucción (rojo negrita) + badges de estado/dictamen
- Body: grid 2-col con Contenedor, Embarque, Cliente, Fecha
- Footer: 3 badges de área (SEG|CAL|FRÍO) + botón PDF

**Toda la tarjeta es clickeable** (`cursor-pointer`, dispara `editar.emit(item.id)`).
El botón PDF usa `(click)="$event.stopPropagation(); exportarPdf.emit(item.id)"`.

---

### 5.4 InformeDetailModalComponent — Modal Principal

```typescript
// Uso de model() para visibilidad (permite que el hijo se cierre a sí mismo)
visible    = model<boolean>(false);

// Inputs
informeId  = input.required<string>();
tabInicial = input<TabArea>('all');

// Outputs
cerrar     = output<void>();

// State interno
readonly informe      = signal<InformeEmbarque | null>(null);
readonly tabActiva    = signal<TabArea>('all');
readonly cargando     = signal<boolean>(false);

// Iconos
readonly iconFile     = fileIcon;
readonly iconX        = xIcon;
readonly iconEye      = eyeIcon;
readonly iconShield   = shieldIcon;
readonly iconCheck    = checkboxCheckedIcon;
readonly iconSnow     = cloudSnowIcon;
readonly iconGroup    = groupIcon;
readonly iconComment  = commentIcon;
readonly iconPdf      = filePdfIcon;

cerrarModal(): void {
  this.visible.set(false);   // model() → sincroniza el padre automáticamente
  this.cerrar.emit();
}

switchTab(tab: TabArea): void {
  this.tabActiva.set(tab);
}
```

**Estructura del modal (HTML):**
```html
<div class="modal-overlay open">
  <div class="modal-container-xl">

    <!-- Header -->
    <div class="modal-top-header">
      <h2>
        <kendo-svg-icon [icon]="iconFile"></kendo-svg-icon>
        {{ informe()?.nroInforme }}
      </h2>
      <div>
        <span>{{ informe()?.instruccionEmbarque }} | {{ informe()?.contenedor }}</span>
        <button (click)="cerrarModal()">
          <kendo-svg-icon [icon]="iconX"></kendo-svg-icon>
        </button>
      </div>
    </div>

    <!-- Toolbar de Tabs -->
    <div class="area-tabs-bar">
      <button class="area-tab-btn" [class.active]="tabActiva() === 'all'"
              (click)="switchTab('all')">
        <kendo-svg-icon [icon]="iconEye"></kendo-svg-icon> Vista Unificada
      </button>
      <button class="area-tab-btn" [class.active]="tabActiva() === 'seguridad'"
              (click)="switchTab('seguridad')">
        <kendo-svg-icon [icon]="iconShield"></kendo-svg-icon> 1. Seguridad
      </button>
      <button class="area-tab-btn" [class.active]="tabActiva() === 'calidad'"
              (click)="switchTab('calidad')">
        <kendo-svg-icon [icon]="iconCheck"></kendo-svg-icon> 2. Calidad
      </button>
      <button class="area-tab-btn" [class.active]="tabActiva() === 'frio'"
              (click)="switchTab('frio')">
        <kendo-svg-icon [icon]="iconSnow"></kendo-svg-icon> 3. Frío y Despacho
      </button>
    </div>

    <!-- Cuerpo con scroll -->
    <div class="modal-scroll-body">

      <!-- Sección 1: Datos Principales (siempre visible) -->
      <app-datos-principales-section [informe]="informe()" (informeChange)="onInformeUpdate($event)" />

      <!-- Sección 2: Seguridad (visible si tab = all | seguridad) -->
      @if (tabActiva() === 'all' || tabActiva() === 'seguridad') {
        <app-seguridad-section [informe]="informe()" (guardado)="onAreaGuardada('seguridad')" />
      }

      <!-- Sección 3: Calidad -->
      @if (tabActiva() === 'all' || tabActiva() === 'calidad') {
        <app-calidad-section [informe]="informe()" (guardado)="onAreaGuardada('calidad')" />
      }

      <!-- Sección 4: Frío -->
      @if (tabActiva() === 'all' || tabActiva() === 'frio') {
        <app-frio-section [informe]="informe()" (guardado)="onAreaGuardada('frio')" />
      }

      <!-- Sección 5: Participantes (siempre visible) -->
      <app-participantes-section [informe]="informe()" (participantesChange)="onParticipantesUpdate($event)" />

      <!-- Sección 6: Conclusiones y Dictamen Final -->
      <app-conclusiones-section [informe]="informe()" (guardado)="onDictamenGuardado()" />

    </div>

    <!-- Footer Modal -->
    <div class="modal-bottom-footer">
      <button class="btn-secondary-safco" (click)="cerrarModal()">Cerrar</button>
      <button class="btn-primary-safco" (click)="exportarPDF()">
        <kendo-svg-icon [icon]="iconPdf"></kendo-svg-icon> Exportar PDF Consolidado con Firmas
      </button>
    </div>

  </div>
</div>
```

---

### 5.5 SeguridadSectionComponent

```typescript
// Inputs
informe = input.required<InformeEmbarque | null>();

// Outputs
guardado = output<void>();

// State
readonly dictamen        = signal<DictamenArea>('Conforme');
readonly observaciones   = signal<string[]>([]);
readonly guardandoArea   = signal<boolean>(false);

// Computed: estilo dinámico del select dictamen
readonly dictamenStyle = computed(() =>
  this.dictamen() === 'Conforme'
    ? { color: '#059669', borderColor: '#86efac', background: '#f0fdf4' }
    : { color: '#d30c0c', borderColor: '#fca5a5', background: '#fef2f2' }
);

// Computed: si el área ya está confirmada
readonly areaConfirmada = computed(() =>
  this.informe()?.areas.seguridad.status === 'ready'
);
```

**Comportamientos:**
- Observaciones: lista dinámica (agregar via diálogo Kendo, editar en línea, eliminar).
- Evidencias: galería de fotos agrupadas por tipo, con upload y borrado.
- Caja de validación: muestra botón "Confirmar" si `pending`, "Reabrir" si `ready`.

---

### 5.6 CalidadSectionComponent

```typescript
// Inputs
informe = input.required<InformeEmbarque | null>();

// Outputs
guardado = output<void>();

// State
readonly dictamen     = signal<DictamenArea>('Conforme');
readonly observaciones = signal<string>('');
readonly guardandoArea = signal<boolean>(false);

// Computed: temperatura promedio de pulpa
readonly tempPromedio = computed(() => {
  const paletas = this.informe()?.datosCalidad.paletasEvaluadas ?? [];
  if (paletas.length === 0) return '0.00';
  const suma = paletas.reduce((acc, p) => acc + p.temp, 0);
  return (suma / paletas.length).toFixed(2);
});

readonly countPaletas = computed(() =>
  this.informe()?.datosCalidad.paletasEvaluadas.length ?? 0
);
```

**Tabla de paletas evaluadas** — Columnas: N°, N° PALLET, PRODUCTOR, VARIEDAD, T° (°C), HORA, CUMPLE (badge ready/incomplete).

---

### 5.7 FrioSectionComponent

```typescript
// Inputs
informe = input.required<InformeEmbarque | null>();

// Outputs
guardado = output<void>();

// State
readonly dictamen        = signal<DictamenArea>('Conforme');
readonly precintoSafco   = signal<string>('');
readonly precintoSenasa  = signal<string>('');
readonly precintoLinea   = signal<string>('');
readonly observaciones   = signal<string>('');
readonly guardandoArea   = signal<boolean>(false);
```

**Sub-componentes:**
- Tabla de dispositivos (Termógrafos + Sensores SENASA): Dispositivo/Tipo | Código | Ubicación.
- `<app-reefer-esquema>` — esquema visual del contenedor.

---

### 5.8 ReeferEsquemaComponent (Shared)

```typescript
// Input
paletas = input.required<EsquemaPallet[]>();
```

```html
<div class="reefer-container-wrapper">
  <div class="reefer-container-title">FONDO DEL CONTENEDOR</div>
  <div class="reefer-grid-pairs">
    @for (pallet of paletas(); track pallet.pos) {
      <div class="reefer-pallet-card"
           [class.status-ok]="pallet.estado === 'ok'"
           [class.status-alert]="pallet.estado === 'alert'"
           [class.status-empty]="pallet.estado === 'empty'"
           [class.reefer-pallet-23]="pallet.pos === 23">
        <span class="reefer-pallet-number">{{ pallet.pos }}</span>
        <span class="reefer-pallet-code">{{ pallet.codigo }}</span>
        @if (pallet.sensor) {
          <div class="reefer-sensor-pill">
            <kendo-svg-icon [icon]="iconSignal" size="xxsmall"></kendo-svg-icon>
            {{ pallet.sensor }}
          </div>
        }
      </div>
    }
  </div>
</div>
```

---

### 5.9 ParticipantesSectionComponent

```typescript
// Inputs
informe = input.required<InformeEmbarque | null>();

// Outputs
participantesChange = output<Participante[]>();

// State
readonly selectorModalVisible = signal<boolean>(false);
readonly dnieModalVisible     = signal<boolean>(false);
readonly dniePart             = signal<Participante | null>(null);

// Iconos
readonly iconUserPlus  = userPlusIcon;
readonly iconTrash     = trashIcon;
readonly iconChip      = gridIcon;      // Kendo equivalente a chip/smart card
readonly iconCheckDbl  = checkIcon;
```

```html
<!-- Tabla de participantes -->
<table class="participants-table">
  <thead>
    <tr>
      <th>ROL / CARGO</th>
      <th>NOMBRE Y APELLIDOS</th>
      <th>EMPRESA / INSTITUCIÓN</th>
      <th>DOCUMENTO</th>
      <th>FIRMA DNI-e (SMART CARD)</th>
      <th style="text-align:right">ELIMINAR</th>
    </tr>
  </thead>
  <tbody>
    @for (p of informe()?.participantes ?? []; track p.id) {
      <tr>
        <td><strong>{{ p.rol }}</strong></td>
        <td>{{ p.nombre }}</td>
        <td>{{ p.empresa }}</td>
        <td>{{ p.doc }}</td>
        <td>
          @if (p.firma) {
            <div class="signature-badge signed" (click)="abrirDnie(p)">
              <img [src]="p.firma" class="signature-img-sm" [alt]="p.nombre">
              <kendo-svg-icon [icon]="iconCheckDbl" size="small"></kendo-svg-icon>
              Firmado DNI-e
            </div>
          } @else {
            <button class="signature-badge unsigned" (click)="abrirDnie(p)">
              <kendo-svg-icon [icon]="iconChip" size="small"></kendo-svg-icon>
              Firmar con DNI-e
            </button>
          }
        </td>
        <td style="text-align:right">
          <button class="btn-action-trigger" (click)="eliminarParticipante(p.id)">
            <kendo-svg-icon [icon]="iconTrash" size="small"></kendo-svg-icon>
          </button>
        </td>
      </tr>
    }
  </tbody>
</table>
```

---

### 5.10 ParticipanteSelectorModalComponent

```typescript
// model() para visibilidad bidireccional
visible = model<boolean>(false);

// Outputs
seleccionado = output<ParticipanteDirectorio>();

// State
readonly vista               = signal<'lista' | 'nuevo'>('lista');
readonly searchQuery         = signal<string>('');
readonly directorio          = signal<ParticipanteDirectorio[]>([]);

// Computed: filtrado en tiempo real
readonly directorioFiltrado = computed(() => {
  const q = this.searchQuery().toLowerCase();
  if (!q) return this.directorio();
  return this.directorio().filter(p =>
    p.nombre.toLowerCase().includes(q) ||
    p.doc.toLowerCase().includes(q) ||
    p.rol.toLowerCase().includes(q) ||
    p.empresa.toLowerCase().includes(q)
  );
});

// Formulario nuevo participante
readonly form = this.fb.nonNullable.group({
  nombre:  ['', Validators.required],
  doc:     ['', Validators.required],
  rol:     ['', Validators.required],
  empresa: ['SAFCO S.A.C.'],
  brevete: [''],
  correo:  ['', Validators.email],
});
```

**Roles disponibles en el select:**
- Inspector SENASA
- Seguridad Patrimonial
- Inspector Calidad
- Supervisor Frío
- Chofer Transportista
- Agente de Aduanas
- Recibidor / Cliente
- Jefe de Operaciones

---

### 5.11 DnieLectorModalComponent

```typescript
// model() para visibilidad
visible = model<boolean>(false);

// Inputs
participante = input<Participante | null>(null);

// Outputs
firmado = output<{ participanteId: number; firmaUrl: string }>();

// State: 3 pasos del flujo
readonly paso = signal<'inicial' | 'leyendo' | 'exito'>('inicial');

// Iconos
readonly iconChip  = gridIcon;
readonly iconCheck = checkCircleIcon;
readonly iconSpin  = loadingIcon;  // o usar CSS animation

leerChip(): void {
  this.paso.set('leyendo');
  // Simular lectura 1800ms — en producción: llamar al backend
  setTimeout(() => {
    this.paso.set('exito');
    // Emitir la firma generada por el backend
    this.firmado.emit({ ... });
  }, 1800);
}

cerrar(): void {
  this.visible.set(false);
  this.paso.set('inicial');
}
```

```html
<!-- Template con @switch para los pasos -->
@switch (paso()) {
  @case ('inicial') {
    <p>Inserte la tarjeta <strong>DNI-e</strong> en el lector externo...</p>
    <button class="btn-primary-safco" (click)="leerChip()">
      <kendo-svg-icon [icon]="iconChip"></kendo-svg-icon>
      Leer Chip DNI-e & Validar
    </button>
  }
  @case ('leyendo') {
    <div class="dnie-loading">
      <kendo-svg-icon [icon]="iconSpin" size="xlarge"></kendo-svg-icon>
      <div>Leyendo Certificado Digital desde DNI-e...</div>
    </div>
  }
  @case ('exito') {
    <div>
      <kendo-svg-icon [icon]="iconCheck" themeColor="success" size="xlarge"></kendo-svg-icon>
      <div>¡Firma Digital Verificada con Éxito!</div>
      <button class="btn-primary-safco" (click)="cerrar()">Aceptar y Cerrar</button>
    </div>
  }
}
```

---

### 5.12 ConclusionessSection Component

```typescript
// Inputs
informe = input.required<InformeEmbarque | null>();

// Outputs
guardado = output<void>();

// State
readonly conclusiones        = signal<ConclusionCatalogo[]>([]);  // catálogo del backend
readonly seleccionadas       = signal<string[]>([]);
readonly conclusionCustom    = signal<string>('');
readonly dictamenGeneral     = signal<DictamenArea>('Conforme');
readonly guardando           = signal<boolean>(false);

// Computed: estilo dictamen final
readonly dictamenStyle = computed(() =>
  this.dictamenGeneral() === 'Rechazado'
    ? { color: '#d30c0c', borderColor: '#fca5a5', background: '#fef2f2',
        containerBg: '#fef2f2', containerBorder: '#fca5a5' }
    : { color: '#059669', borderColor: '#86efac', background: '#f0fdf4',
        containerBg: '#f0fdf4', containerBorder: '#86efac' }
);

// Computed: si se seleccionó Rechazado, avisa la cascada
readonly mostrarAlertaCascada = computed(() =>
  this.dictamenGeneral() === 'Rechazado'
);

toggleConclusion(texto: string, checked: boolean): void {
  this.seleccionadas.update(sel =>
    checked ? [...sel, texto] : sel.filter(c => c !== texto)
  );
}
```

---

## 6. Servicios — Contratos HTTP

### 6.1 `InformesEmbarqueService`

```typescript
@Injectable({ providedIn: 'root' })
export class InformesEmbarqueService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/informes-embarque';

  listar(filtros?: Partial<FiltrosInforme>): Observable<InformeEmbarque[]>
  obtener(id: string): Observable<InformeEmbarque>
  actualizarDatosPrincipales(id: string, datos: Partial<InformeEmbarque>): Observable<InformeEmbarque>
  confirmarArea(id: string, area: 'seguridad'|'calidad'|'frio', payload: ConfirmarAreaPayload): Observable<{ area: AreaItemStatus, estadoGeneral: string }>
  reabrirArea(id: string, area: 'seguridad'|'calidad'|'frio'): Observable<{ area: AreaItemStatus }>
  guardarDictamenFinal(id: string, payload: { dictamenGeneral: DictamenArea, conclusionesSeleccionadas: string[], conclusionCustom: string }): Observable<InformeEmbarque>
  subirFoto(id: string, area: string, tipoIndex: number, file: File): Observable<FotoEvidencia>
  eliminarFoto(id: string, area: string, tipoIndex: number, fotoId: string): Observable<void>
  agregarParticipante(id: string, participanteId: number): Observable<Participante[]>
  eliminarParticipante(id: string, participanteId: number): Observable<Participante[]>
  registrarFirmaDnie(id: string, participanteId: number): Observable<Participante>
  exportarPDF(id: string): void   // dispara descarga via window.open o link
}
```

### 6.2 `ParticipantesService`

```typescript
@Injectable({ providedIn: 'root' })
export class ParticipantesService {
  listarDirectorio(search?: string): Observable<ParticipanteDirectorio[]>
  crearParticipante(data: Omit<ParticipanteDirectorio, 'id'>): Observable<ParticipanteDirectorio>
}
```

### 6.3 `PdfExportService`

```typescript
@Injectable({ providedIn: 'root' })
export class PdfExportService {
  // Llama al endpoint del backend y descarga el PDF
  descargar(informeId: string): void {
    const url = `/api/informes-embarque/${informeId}/exportar-pdf`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `Informe_Embarque_${informeId}.pdf`;
    link.click();
  }
}
```

---

## 7. Endpoints API REST

| # | Método | URL | Descripción |
|---|---|---|---|
| 1 | GET | `/api/informes-embarque` | Listar con query params de filtros |
| 2 | GET | `/api/informes-embarque/:id` | Detalle completo |
| 3 | PUT | `/api/informes-embarque/:id/datos-principales` | Actualizar campos principales |
| 4 | POST | `/api/informes-embarque/:id/areas/:area/confirmar` | Confirmar área |
| 5 | POST | `/api/informes-embarque/:id/areas/:area/reabrir` | Reabrir área para edición |
| 6 | POST | `/api/informes-embarque/:id/dictamen-final` | Guardar dictamen + conclusiones |
| 7 | POST | `/api/informes-embarque/:id/evidencias/:area/:tipoIndex/fotos` | Subir foto (multipart) |
| 8 | DELETE | `/api/informes-embarque/:id/evidencias/:area/:tipoIndex/fotos/:fotoId` | Eliminar foto |
| 9 | POST | `/api/informes-embarque/:id/participantes` | Agregar participante |
| 10 | DELETE | `/api/informes-embarque/:id/participantes/:participanteId` | Eliminar participante |
| 11 | POST | `/api/informes-embarque/:id/participantes/:participanteId/firma` | Registrar firma DNI-e |
| 12 | GET | `/api/participantes` | Directorio corporativo (con ?search=) |
| 13 | POST | `/api/participantes` | Crear nuevo en directorio |
| 14 | GET | `/api/catalogo/conclusiones-embarque` | Catálogo de conclusiones |
| 15 | GET | `/api/informes-embarque/:id/exportar-pdf` | Descargar PDF |

---

## 8. Design System SAFCO — Aplicación Angular

### 8.1 CSS Custom Properties (añadir a `styles.scss` global)

```scss
:root {
  --safco-teal:       #004a4c;
  --safco-teal-dark:  #003638;
  --safco-teal-light: #05696d;
  --safco-red:        #d80000;   // Corporativo SAFCO (no #d30c0c del prototipo)
  --safco-red-hover:  #b50000;
  --safco-green:      #4c8c2b;
  --safco-amber:      #d97706;
  --safco-blue:       #0284c7;
  --border-color:     #e2e8f0;
  --bg-subtle:        #f8fafc;
}
```

### 8.2 Banner Ejecutivo

```scss
.executive-banner {
  background: linear-gradient(to right, #05696d, #528385);
  border-radius: 1rem;           // rounded-2xl
  padding: 1.5rem 2rem;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 10px 25px -5px rgba(0, 74, 76, 0.3);
  margin-bottom: 1.5rem;
}

.banner-icon-box {
  background: rgba(255, 255, 255, 0.20);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.875rem;
  width: 56px; height: 56px;
  display: flex; align-items: center; justify-content: center;
}
```

### 8.3 Tabla (estilo Kendo Grid SAFCO)

```scss
.table-safco thead th {
  background-color: var(--safco-teal) !important;
  color: white !important;
  font-weight: 700 !important;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  padding: 0.85rem 1rem;
  text-align: center;
}
```

### 8.4 Badges de Estado de Área

```scss
.area-badge.ready      { background: #e6f0f0; color: #004a4c; border: 1px solid #b3d1d2; }
.area-badge.pending    { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
.area-badge.incomplete { background: #fee2e2; color: #990000; border: 1px solid #fecaca; }
```

### 8.5 Cards Móvil con Borde de Estado

```scss
.mobile-card {
  border-left: 4px solid var(--safco-teal);  // default
  &.estado-completo  { border-left-color: #4c8c2b; }
  &.estado-en-proceso { border-left-color: #d97706; }

  // Feedback táctil obligatorio
  cursor: pointer;
  transition: all 0.2s;
  &:hover  { box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
  &:active { transform: scale(0.99); }
}
```

### 8.6 Responsive (ocultar tabla/cards)

```scss
// Desktop: tabla visible, cards ocultas
.hidden-mobile  { display: block; }
.hidden-desktop { display: none; }

@media (max-width: 768px) {
  .hidden-mobile  { display: none; }
  .hidden-desktop { display: block; }
}
```

### 8.7 Modal

```scss
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(5px);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-container-xl {
  background: white;
  width: 100%;
  max-width: 1100px;
  height: 92vh;
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: modalSlideUp 0.3s ease-out;
}

@keyframes modalSlideUp {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

.area-tabs-bar {
  background: var(--safco-teal);
  padding: 0.5rem 1.5rem;
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;

  .area-tab-btn {
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.8);
    border: 1px solid rgba(255,255,255,0.2);
    padding: 0.5rem 1.1rem;
    border-radius: 0.5rem;
    font-size: 0.8rem;
    font-weight: 700;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
    transition: all 0.2s;

    &.active, &:hover {
      background: white;
      color: var(--safco-teal);
      border-color: white;
    }
  }
}
```

### 8.8 Esquema Contenedor Reefer

```scss
.reefer-container-wrapper {
  background: #2b364a;
  border-radius: 1rem;
  padding: 1.2rem;
  max-width: 420px;
  margin: 1rem auto;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  color: white;
}

.reefer-grid-pairs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.reefer-pallet-card {
  position: relative;
  border-radius: 0.625rem;
  padding: 0.65rem 0.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  transition: transform 0.2s;

  &:hover       { transform: scale(1.02); }
  &.status-ok   { background: #22c55e; color: white; }
  &.status-alert { background: #ef4444; color: white; }
  &.status-empty {
    background: #1e293b;
    border: 2px dashed #475569;
    color: #94a3b8;
  }
  &.reefer-pallet-23 { grid-column: span 1; }
}
```

---

## 9. Mapa de Iconos Kendo SVG por Funcionalidad

| Funcionalidad | Import de `@progress/kendo-svg-icons` |
|---|---|
| Módulo / Página (buscador) | `searchIcon` |
| Editar informe | `pencilIcon` |
| Exportar PDF | `filePdfIcon` o `fileAscxIcon` |
| Área Seguridad | `shieldIcon` |
| Área Calidad | `checkboxCheckedIcon` |
| Área Frío | `cloudIcon` o `snowflakeIcon` |
| Confirmar / Guardado | `checkCircleIcon` |
| Doble check (firmado) | `checkIcon` |
| Participantes | `groupIcon` |
| Añadir participante | `userPlusIcon` o `plusCircleIcon` |
| Eliminar | `trashIcon` |
| Cerrar modal | `xIcon` |
| Firma DNI-e / chip | `gridIcon` o `layoutsIcon` |
| Cámara / foto | `cameraIcon` |
| Carpeta / tipo evidencia | `folderOpenIcon` |
| Tiempo / pendiente | `clockIcon` |
| Tag / instrucción | `tagIcon` |
| Comentario / conclusiones | `commentIcon` |
| Vista unificada | `eyeIcon` |
| Búsqueda directorio | `searchIcon` |
| Loading/spinner | usar CSS `@keyframes spin` |
| Sensor reefer | `wifiIcon` o `signalIcon` |

---

## 10. Reglas de Negocio — Implementación Angular

### 10.1 Dictamen en Cascada (ConclusionesSection)
```typescript
onDictamenChange(val: DictamenArea): void {
  this.dictamenGeneral.set(val);
  // Si es RECHAZADO: emitir evento para que el modal actualice las 3 áreas
  if (val === 'Rechazado') {
    // SweetAlert2 o Kendo Dialog de confirmación
    Swal.fire({
      icon: 'warning',
      title: 'Informe Final RECHAZADO',
      text: 'Se actualizarán en cascada los dictámenes de Seguridad, Calidad y Frío.',
      confirmButtonColor: '#d80000'
    });
  }
}
```

### 10.2 Confirmación por Área (efecto loading)
```typescript
confirmarArea(): void {
  this.guardandoArea.set(true);
  this.informesService.confirmarArea(id, area, payload).subscribe({
    next: (res) => {
      // Actualizar signal del informe activo en el store/padre
      this.guardandoArea.set(false);
      this.guardado.emit();
      Swal.fire({ icon: 'success', title: '¡Registro Confirmado!', ... });
    },
    error: () => {
      this.guardandoArea.set(false);
      Swal.fire({ icon: 'error', title: 'Error al guardar', ... });
    }
  });
}
```

### 10.3 Subida de Fotos
```typescript
onFileChange(event: Event, areaKey: string, tipoIndex: number): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  this.informesService.subirFoto(informeId, areaKey, tipoIndex, file)
    .subscribe(foto => {
      // Actualizar el array de fotos via signal.update()
      this.evidencias.update(ev => {
        const copia = structuredClone(ev);
        copia[areaKey as keyof EvidenciasPorArea][tipoIndex].fotos.push(foto);
        return copia;
      });
    });
}
```

### 10.4 Deduplicación de Participantes
```typescript
seleccionarParticipante(p: ParticipanteDirectorio): void {
  const yaExiste = this.informe()?.participantes
    .some(x => x.doc === p.doc && x.rol === p.rol);
  if (yaExiste) {
    Swal.fire({
      icon: 'warning',
      title: 'Participante Ya Registrado',
      text: `${p.nombre} (${p.rol}) ya forma parte de este embarque.`,
    });
    return;
  }
  // Llamar al servicio y actualizar
}
```

---

## 11. Configuración del Módulo / App

### `app.config.ts` — Zoneless

```typescript
import { provideExperimentalZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideExperimentalZonelessChangeDetection(), // Zoneless
    // ... otros providers
  ]
};
```

### Ruta del módulo

```typescript
// En el router de la app
{
  path: 'informes-embarque',
  loadComponent: () =>
    import('./features/informes-embarque/pages/informe-embarque-general/informe-embarque-general.component')
      .then(m => m.InformeEmbarqueGeneralComponent)
}
```

### `angular.json` — verificar que `zone.js` esté removido de polyfills

```json
"polyfills": []  // O vacío si ya se usa Zoneless global
```

---

## 12. Checklist de Implementación Angular 21

### Modelos y Servicios
- [ ] Crear `informe-embarque.model.ts` con todas las interfaces (Sección 2)
- [ ] Crear `informes-embarque.service.ts` (15 endpoints, Sección 6)
- [ ] Crear `participantes.service.ts`
- [ ] Crear `pdf-export.service.ts`

### Página Principal
- [ ] `InformeEmbarqueGeneralComponent` con Signals: `informes`, `filtros`, `informesFiltrados` (computed), `modalAbierto`, `informeActivo`
- [ ] Routing lazy-load

### Filtros
- [ ] `FiltersBarComponent` — `input()` + `output()` + `NonNullableFormBuilder`
- [ ] Debounce 300ms en campo `search`

### Tabla Desktop
- [ ] `InformesTableComponent` — columnas según Sección 5.2
- [ ] Header teal `#004a4c` con texto blanco
- [ ] Badges de área (`ready`/`pending`/`incomplete`)
- [ ] Botones editar + PDF con **Kendo SVG Icons**

### Cards Móvil
- [ ] `InformesMobileCardsComponent` — oculta en desktop
- [ ] Borde izquierdo de color por estado
- [ ] Tarjeta clickeable completa + `stopPropagation()` en botón PDF

### Modal Principal
- [ ] `InformeDetailModalComponent` — `model<boolean>()` para visibilidad
- [ ] Tabs con `@switch`/`@if` para mostrar/ocultar secciones
- [ ] Carga del informe con `toSignal()` o `subscribe` en `ngOnInit`

### Secciones del Modal
- [ ] `DatosPrincipalesSection` — formulario 11 campos con `FormBuilder`
- [ ] `SeguridadSection` — dictamen + observaciones dinámicas + evidencias + caja validación
- [ ] `CalidadSection` — dictamen + tabla paletas + `computed()` tempPromedio + evidencias
- [ ] `FrioSection` — precintos + dispositivos + `<app-reefer-esquema>` + evidencias
- [ ] `ParticipantesSection` — tabla + botón "Añadir Participante"
- [ ] `ConclusionesSection` — checklist + observación custom + select dictamen final

### Componentes Shared
- [ ] `ReeferEsquemaComponent` — `@for` sobre paletas + clases de estado
- [ ] `AreaBadgeComponent` — reutilizable para badges SEG/CAL/FRÍO
- [ ] `DictamenBadgeComponent` — reutilizable para CONFORME/RECHAZADO

### Modales Auxiliares
- [ ] `ParticipanteSelectorModalComponent` — `model<boolean>()` + dos vistas (`@if`)
- [ ] `DnieLectorModalComponent` — `model<boolean>()` + `@switch` para 3 pasos

### Design System
- [ ] Variables CSS corporativas en `styles.scss`
- [ ] **Todos los iconos usando Kendo SVG Icons** (sin Boxicons)
- [ ] Responsive: tabla desktop / cards móvil
- [ ] Animación modal `modalSlideUp`
- [ ] Dinámica de colores en selects de dictamen

### Zoneless & Performance
- [ ] `provideExperimentalZonelessChangeDetection()` en `app.config.ts`
- [ ] Usar `computed()` para todo valor derivado (tempPromedio, filtros, estilos dinámicos)
- [ ] Usar `toSignal()` al convertir observables HTTP en signals
- [ ] **Prohibido** `ChangeDetectorRef.markForCheck()` / `detectChanges()`
- [ ] **Prohibido** asignaciones directas; siempre `.set()` / `.update()`
