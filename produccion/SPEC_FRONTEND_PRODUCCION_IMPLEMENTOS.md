# SPEC Angular 21: Módulo de Producción — Asignación y Catálogo de Implementos — SAFCO

**Framework:** Angular 21 (Standalone + Signals + Zoneless)  
**Backend API de Referencia:** Spring Boot REST (`SPEC_API_FRONTEND_PRODUCCION_IMPLEMENTOS.md` V1.0.0)  
**Módulos fuente:** `produccion/asignacion-implementos.html` & `produccion/tablas-implementos.html`  
**Design System:** SAFCO Corporativo (Kendo SVG Icons, Paleta Teal/Rojo/Verde, Mobile-First)  
**Fecha de spec:** 2026-09-09  
**Ubicación del Documento:** `produccion/SPEC_FRONTEND_PRODUCCION_IMPLEMENTOS.md`

---

> [!IMPORTANT]
> **REGLAS ESTRICTAS DE ARQUITECTURA ANGULAR 21 & SAFCO DESIGN SYSTEM:**
> - ❌ **PROHIBIDO** el uso de Boxicons (`bx bx-*`, `<i class="bx...">`) — Usar exclusivamente `<kendo-svg-icon [icon]="iconName">` importados de `@progress/kendo-svg-icons`.
> - ❌ **PROHIBIDO** `@Input()/@Output()` clásicos, `EventEmitter`, `ChangeDetectorRef.markForCheck()` o `detectChanges()`.
> - ✅ **OBLIGATORIO** Signals nativas: `signal()`, `computed()`, `input()`, `output()`, `model<boolean>()` para Two-Way Binding de visibilidad en modales.
> - ✅ **OBLIGATORIO** Zoneless: Configuración de app con `provideExperimentalZonelessChangeDetection()`.
> - ❌ **PROHIBIDO** Nombrar interfaces de dominio con sufijo `DTO` en el frontend — usar nombres limpios (`TipoImplemento`, `Implemento`, `AsignacionCabecera`, `AsignacionDetalle`, `ResumenImplementosIndicadores`).
> - 📌 **REGLA DE NEGOCIO 1 (KPIS VISUALES):** Las tarjetas de KPIs de cantidad (`totalPersonalEquipado`, `totalDisponibleAlmacen`, `totalDeterioradasPerdidas`) son **exclusivamente informativas/visuales**, no actúan como botones de filtrado interactivo.
> - 📌 **REGLA DE NEGOCIO 2 (BÚSQUEDA CATÁLOGO):** En el inventario/catálogo de implementos, la búsqueda por texto se realiza **únicamente por nombre del implemento**, omitiendo búsqueda por código de sistema.
> - 📌 **REGLA DE NEGOCIO 3 (EXCLUSIÓN DIAGRAMA BD):** Se excluye completamente el botón y enlaces hacia `"Ver Diagrama BD"`, ya que fue un recurso exclusivo del prototipado.

---

## 1. Descripción del Módulo

El Módulo de **Implementos de Producción** de **SAFCO** gestiona el ciclo de vida completo, inventario, asignación masiva y control de trazabilidad de las herramientas e implementos operativos de empaque y campo (tijeras de cosecha, pesas patrón, calibradores, indumentaria de protección, etc.).

El módulo comprende dos vistas funcionales altamente sincronizadas:
1. **Asignación y Devolución de Implementos (`asignacion-implementos.html`):** Control operativo táctil para supervisores y almaceneros de planta. Permite entrega múltiple con filtrado por tipo, selección reactiva en tiempo real con chips de resumen, y devolución múltiple registrando la condición física de recepción (`EXCELENTE`, `DETERIORADA`, `PERDIDA`) y observaciones de incidencias. Incluye soporte de terminal táctil (Modo Tablet Kiosco) y tarjetas de operarios equipados.
2. **Catálogo e Inventario de Implementos (`tablas-implementos.html`):** Control maestro de catálogo de tipos de implementos con prefijos de código, autonumeración correlativa masiva en backend, edición rápida de estados, y modal de auditoría/trazabilidad que identifica al último poseedor registrado en casos de deterioro o pérdida.

### Matriz de Capacidades

| Capacidad | Submódulo | Descripción Técnica |
|---|---|---|
| **Resumen Ejecutivo Visual (KPIs)** | Asignación | Tarjetas informativas superiores (`totalPersonalEquipado`, `totalDisponibleAlmacen`, `totalDeterioradasPerdidas`). No aplican filtros, solo reflejan el estado del almacén. |
| **Entrega Múltiple con Chips Reactivos** | Asignación | Modal con selección de operario, filtro instantáneo por tipo de herramienta, selección múltiple mediante checkboxes y panel de chips removibles `(x)` en tiempo real. |
| **Devolución Múltiple con Observación** | Asignación | Modal batch donde se listan las herramientas del operario, permitiendo clasificar el estado de retorno (`EXCELENTE`, `DETERIORADA`, `PERDIDA`) y desplegando dinámicamente campo de observación obligatoria ante daños o extravíos. |
| **Cards de Operarios con Estado Dual** | Asignación | Visualización en tarjetas con avatares de iniciales, datos de DNI, chips por implemento y diferenciación visual si el operario no tiene implementos o si porta implementos observados. |
| **Modo Tablet Kiosco (Edge-to-Edge)** | Asignación / Catálogo | Toggle de pantalla completa libre de menús superiores/laterales para terminales fijas o tablets industriales en línea de producción. |
| **Autonumeración Correlativa Masiva** | Catálogo | Creación de lotes de implementos físicos con prefijo correlativo automático generado por backend (ej. `TIJERA 10` a `TIJERA 19`). |
| **Mantenimiento de Tipos de Implemento** | Catálogo | Creación dinámica de nuevas familias de herramientas con código corto (ej. `BOT`, `GUA`) y asignación de lote inicial opcional. |
| **Búsqueda Paginada por Nombre** | Catálogo | Búsqueda reactiva en inventario filtrando **exclusivamente por nombre del implemento** y tipo/estado de almacén vía Kendo Grid. |
| **Trazabilidad & Último Poseedor** | Catálogo | Modal de auditoría que reconstruye la cronología de movimientos e identifica con alerta visual destacada al último operario a cargo de un implemento perdido o dañado. |

---

## 2. Modelos TypeScript (Interfaces y Tipos de Dominio)

> Ubicación sugerida: `src/app/features/produccion-implementos/models/implementos.model.ts`

```typescript
// ==========================================
// 1. ENVOLTORIOS ESTÁNDAR DE API REST
// ==========================================

export interface ApiResponseProvider<T> {
  codigo: string;          // "200" para éxito, "400", "500", etc.
  mensaje: string;         // Mensaje descriptivo de la operación
  data: T;                 // Carga útil de la respuesta
  cantidad: number | null;
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
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;          // Página actual (0-indexed)
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ==========================================
// 2. TIPOS Y ENUMS DE DOMINIO
// ==========================================

export type EstadoRegistro = '1' | '0';

export type EstadoImplementoAlmacen = 
  | 'DISPONIBLE' 
  | 'ASIGNADO' 
  | 'DETERIORADA' 
  | 'PERDIDA';

export type EstadoDevolucionImplemento = 
  | 'EXCELENTE' 
  | 'DETERIORADA' 
  | 'PERDIDA';

export type EstadoAsignacionCabecera = 
  | 'ACTIVA' 
  | 'FINALIZADA';

// ==========================================
// 3. MODELOS DE TIPO DE IMPLEMENTO (CATÁLOGO)
// ==========================================

export interface TipoImplemento {
  idTipoImplemento: number;
  nombreTipoImplemento: string;    // Ej: "TIJERA", "CALIBRADOR", "PESA PATRON"
  codigoTipoImplemento: string;    // Ej: "TIJ", "CAL", "PES"
  estado: EstadoRegistro;
  fechaCreacion?: string;
  fechaModificacion?: string | null;
  icono?: string;                  // Emoji o identificador visual auxiliar
}

export interface GuardarTipoImplementoPayload {
  nombreTipoImplemento: string;
  codigoTipoImplemento: string;
}

// ==========================================
// 4. MODELOS DE IMPLEMENTO FÍSICO (INVENTARIO)
// ==========================================

export interface Implemento {
  idImplemento: number;
  nombreImplemento: string;        // Ej: "TIJERA 14", "CALIBRADOR 3"
  estadoActual: EstadoImplementoAlmacen;
  observacion: string | null;
  tipoImplemento: TipoImplemento;
  estado: EstadoRegistro;
  fechaCreacion?: string;
  fechaModificacion?: string | null;
}

export interface GuardarImplementosBulkPayload {
  tipoImplemento: {
    idTipoImplemento: number;
  };
  estadoActual?: EstadoImplementoAlmacen;
  observacion?: string;
}

export interface ActualizarImplementoPayload {
  nombreImplemento: string;
  estadoActual: EstadoImplementoAlmacen;
  observacion?: string;
  tipoImplemento: {
    idTipoImplemento: number;
  };
}

export interface InventarioImplementoItem {
  idImplemento: number;
  nombreImplemento: string;
  estadoActual: EstadoImplementoAlmacen;
  observacion: string;
  idTipoImplemento: number;
  nombreTipoImplemento: string;
  codigoTipoImplemento: string;
  estado: EstadoRegistro;
  fechaCreacion: string;
  fechaModificacion: string | null;
}

// ==========================================
// 5. ASIGNACIONES (ENTREGA Y DEVOLUCIÓN)
// ==========================================

export interface AsignacionDetalle {
  idAsignacionDetalle: number;
  implemento: Implemento;
  fechaHoraDevolucion: string | null;
  observacionDevolucion: string | null;
  estadoDevolucion: EstadoDevolucionImplemento | null;
  estado: EstadoRegistro;
  fechaCreacion?: string;
  fechaModificacion?: string | null;
}

export interface AsignacionCabecera {
  idAsignacionCabecera: number;
  dniOperario: string;
  nombreOperario: string;
  fechaHoraEntrega: string;
  observacionEntrega: string | null;
  estadoAsignacion: EstadoAsignacionCabecera;
  asignacionDetalle: AsignacionDetalle[];
  estado: EstadoRegistro;
  fechaCreacion?: string;
  fechaModificacion?: string | null;
}

export interface GuardarAsignacionDetalleItem {
  implemento: {
    idImplemento: number;
  };
}

export interface GuardarAsignacionPayload {
  dniOperario: string;
  nombreOperario: string;
  fechaHoraEntrega?: string;       // ISO YYYY-MM-DDTHH:mm:ss
  observacionEntrega?: string;
  estadoAsignacion?: EstadoAsignacionCabecera;
  asignacionDetalle: GuardarAsignacionDetalleItem[];
}

export interface ItemDevolucionBatchPayload {
  idAsignacionDetalle: number;
  fechaHoraDevolucion?: string;
  observacionDevolucion?: string;
  estadoDevolucion: EstadoDevolucionImplemento;
}

export interface GuardarDevolucionBatchPayload {
  asignacionDetalle: ItemDevolucionBatchPayload[];
}

// ==========================================
// 6. HISTORIAL DE TRAZABILIDAD
// ==========================================

export interface TrazabilidadImplementoItem {
  idAsignacionDetalle: number;
  asignacionCabecera: {
    idAsignacionCabecera: number;
    dniOperario: string;
    nombreOperario: string;
    fechaHoraEntrega: string;
    observacionEntrega: string | null;
    estadoAsignacion: EstadoAsignacionCabecera;
  };
  implemento: Implemento;
  fechaHoraDevolucion: string | null;
  observacionDevolucion: string | null;
  estadoDevolucion: EstadoDevolucionImplemento | null;
  estado: EstadoRegistro;
  fechaCreacion: string;
}

// ==========================================
// 7. KPIS Y FILTROS DE BÚSQUEDA
// ==========================================

export interface ResumenImplementosIndicadores {
  totalPersonalEquipado: number;
  totalDisponibleAlmacen: number;
  totalDeterioradasPerdidas: number;
}

export interface FiltrosAsignacion {
  idTipoImplemento?: number;
  operarioImplemento?: string;     // Búsqueda por DNI o Nombre de operario
  pagina: number;
  size: number;
}

export interface FiltrosInventarioImplementos {
  idTipoImplemento?: number;
  estado?: EstadoRegistro;
  nombreImplemento?: string;       // REGLA: Búsqueda únicamente por nombre
  pagina: number;
  size: number;
}

// Modelo de operario en catálogo local / RRHH
export interface OperarioProduccion {
  id: string;
  dni: string;
  nombre: string;
}
```

---

## 3. Estructura de Carpetas (Feature-Based)

```
src/app/features/produccion-implementos/
│
├── models/
│   └── implementos.model.ts
│
├── services/
│   ├── tipo-implemento.service.ts
│   ├── implemento.service.ts
│   ├── asignacion-implementos.service.ts
│   └── operarios-produccion.service.ts
│
├── pages/
│   ├── asignacion-implementos/
│   │   ├── asignacion-implementos.component.ts
│   │   ├── asignacion-implementos.component.html
│   │   └── asignacion-implementos.component.scss
│   │
│   └── catalogo-implementos/
│       ├── catalogo-implementos.component.ts
│       ├── catalogo-implementos.component.html
│       └── catalogo-implementos.component.scss
│
└── components/
    ├── asignacion/
    │   ├── asignacion-filters-bar/
    │   │   ├── asignacion-filters-bar.component.ts
    │   │   └── asignacion-filters-bar.component.html
    │   │
    │   ├── visual-kpi-cards/
    │   │   ├── visual-kpi-cards.component.ts
    │   │   └── visual-kpi-cards.component.html
    │   │
    │   ├── operarios-implementos-cards/
    │   │   ├── operarios-implementos-cards.component.ts
    │   │   └── operarios-implementos-cards.component.html
    │   │
    │   ├── entrega-multiple-modal/
    │   │   ├── entrega-multiple-modal.component.ts
    │   │   └── entrega-multiple-modal.component.html
    │   │
    │   └── devolucion-multiple-modal/
    │       ├── devolucion-multiple-modal.component.ts
    │       └── devolucion-multiple-modal.component.html
    │
    └── catalogo/
        ├── catalogo-filters-bar/
        │   ├── catalogo-filters-bar.component.ts
        │   └── catalogo-filters-bar.component.html
        │
        ├── implementos-table/
        │   ├── implementos-table.component.ts
        │   └── implementos-table.component.html
        │
        ├── implementos-mobile-cards/
        │   ├── implementos-mobile-cards.component.ts
        │   └── implementos-mobile-cards.component.html
        │
        ├── nuevo-tipo-modal/
        │   ├── nuevo-tipo-modal.component.ts
        │   └── nuevo-tipo-modal.component.html
        │
        ├── generar-implementos-modal/
        │   ├── generar-implementos-modal.component.ts
        │   └── generar-implementos-modal.component.html
        │
        ├── editar-implemento-modal/
        │   ├── editar-implemento-modal.component.ts
        │   └── editar-implemento-modal.component.html
        │
        └── trazabilidad-modal/
            ├── trazabilidad-modal.component.ts
            └── trazabilidad-modal.component.html
```

---

## 4. Página Principal: `AsignacionImplementosComponent`

Esta vista coordina el panel de filtros colapsable, la visualización no interactiva de KPIs, la lista de operarios equipados con soporte táctil y los dos modales maestros de entrega y devolución.

### 4.1 TypeScript del Componente
```typescript
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KENDO_ICONS } from '@progress/kendo-angular-icons';
import { 
  wrenchIcon, 
  plusCircleIcon, 
  filterIcon, 
  chevronUpIcon, 
  chevronDownIcon, 
  fullscreenIcon, 
  arrowsNoRepeatIcon 
} from '@progress/kendo-svg-icons';

import { AsignacionImplementosService } from '../../services/asignacion-implementos.service';
import { TipoImplementoService } from '../../services/tipo-implemento.service';
import { 
  AsignacionCabecera, 
  TipoImplemento, 
  ResumenImplementosIndicadores, 
  FiltrosAsignacion 
} from '../../models/implementos.model';

import { AsignacionFiltersBarComponent } from '../../components/asignacion/asignacion-filters-bar/asignacion-filters-bar.component';
import { VisualKpiCardsComponent } from '../../components/asignacion/visual-kpi-cards/visual-kpi-cards.component';
import { OperariosImplementosCardsComponent } from '../../components/asignacion/operarios-implementos-cards/operarios-implementos-cards.component';
import { EntregaMultipleModalComponent } from '../../components/asignacion/entrega-multiple-modal/entrega-multiple-modal.component';
import { DevolucionMultipleModalComponent } from '../../components/asignacion/devolucion-multiple-modal/devolucion-multiple-modal.component';

@Component({
  selector: 'app-asignacion-implementos',
  standalone: true,
  imports: [
    CommonModule,
    KENDO_ICONS,
    AsignacionFiltersBarComponent,
    VisualKpiCardsComponent,
    OperariosImplementosCardsComponent,
    EntregaMultipleModalComponent,
    DevolucionMultipleModalComponent
  ],
  templateUrl: './asignacion-implementos.component.html',
  styleUrls: ['./asignacion-implementos.component.scss']
})
export class AsignacionImplementosComponent implements OnInit {
  private readonly asignacionService = inject(AsignacionImplementosService);
  private readonly tipoService = inject(TipoImplementoService);

  // Iconos Kendo SVG
  protected readonly wrenchIco = wrenchIcon;
  protected readonly plusIco = plusCircleIcon;
  protected readonly filterIco = filterIcon;
  protected readonly chevronUpIco = chevronUpIcon;
  protected readonly chevronDownIco = chevronDownIcon;
  protected readonly fullscreenIco = fullscreenIcon;
  protected readonly refreshIco = arrowsNoRepeatIcon;

  // Signals de Estado
  readonly cargando = signal<boolean>(false);
  readonly modoKiosco = signal<boolean>(false);
  readonly panelFiltrosExpandido = signal<boolean>(true);

  // Modales
  readonly modalEntregaAbierto = signal<boolean>(false);
  readonly modalDevolucionAbierto = signal<boolean>(false);
  readonly idAsignacionSeleccionada = signal<number | null>(null);
  readonly operarioPreseleccionado = signal<{ dni: string; nombre: string } | null>(null);

  // Datos
  readonly tiposImplementos = signal<TipoImplemento[]>([]);
  readonly asignaciones = signal<AsignacionCabecera[]>([]);
  readonly indicadoresKpi = signal<ResumenImplementosIndicadores>({
    totalPersonalEquipado: 0,
    totalDisponibleAlmacen: 0,
    totalDeterioradasPerdidas: 0
  });

  // Filtros aplicados
  readonly filtroTipo = signal<number | undefined>(undefined);
  readonly filtroTexto = signal<string>('');

  // Computeds
  readonly asignacionesFiltradas = computed(() => {
    let list = this.asignaciones();
    const tipo = this.filtroTipo();
    const txt = this.filtroTexto().toLowerCase().trim();

    if (tipo !== undefined) {
      list = list.filter(asig => 
        asig.asignacionDetalle.some(det => 
          det.implemento.tipoImplemento.idTipoImplemento === tipo && 
          det.fechaHoraDevolucion === null
        )
      );
    }

    if (txt) {
      list = list.filter(asig => 
        asig.nombreOperario.toLowerCase().includes(txt) ||
        asig.dniOperario.includes(txt) ||
        asig.asignacionDetalle.some(det => 
          det.implemento.nombreImplemento.toLowerCase().includes(txt)
        )
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.cargando.set(true);

    this.tipoService.listarActivos().subscribe({
      next: (tipos) => this.tiposImplementos.set(tipos),
      error: (err) => console.error('Error al cargar tipos:', err)
    });

    this.recargarListadoYIndicadores();
  }

  recargarListadoYIndicadores(): void {
    this.asignacionService.obtenerResumenIndicadores().subscribe({
      next: (indicadores) => this.indicadoresKpi.set(indicadores),
      error: (err) => console.error('Error al cargar KPIs:', err)
    });

    this.asignacionService.listarAsignacionesActivas().subscribe({
      next: (asigs) => {
        this.asignaciones.set(asigs);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al listar asignaciones:', err);
        this.cargando.set(false);
      }
    });
  }

  toggleKiosco(): void {
    const nuevo = !this.modoKiosco();
    this.modoKiosco.set(nuevo);
    if (nuevo) {
      document.body.classList.add('standalone-kiosk-mode');
    } else {
      document.body.classList.remove('standalone-kiosk-mode');
    }
  }

  toggleFiltros(): void {
    this.panelFiltrosExpandido.update(v => !v);
  }

  onFiltroTipoChange(idTipo: number | undefined): void {
    this.filtroTipo.set(idTipo);
  }

  onFiltroTextoChange(texto: string): void {
    this.filtroTexto.set(texto);
  }

  abrirEntregaGeneral(): void {
    this.operarioPreseleccionado.set(null);
    this.modalEntregaAbierto.set(true);
  }

  abrirEntregaParaOperario(op: { dni: string; nombre: string }): void {
    this.operarioPreseleccionado.set(op);
    this.modalEntregaAbierto.set(true);
  }

  abrirDevolucionParaAsignacion(idAsignacion: number): void {
    this.idAsignacionSeleccionada.set(idAsignacion);
    this.modalDevolucionAbierto.set(true);
  }
}
```

### 4.2 Template HTML del Componente
```html
<main class="content-area" [class.kiosk-active]="modoKiosco()">
  <!-- Banner Ejecutivo SAFCO -->
  <div class="produccion-banner">
    <div class="produccion-banner-title">
      <div class="produccion-banner-icon">
        <kendo-svg-icon [icon]="wrenchIco" size="large"></kendo-svg-icon>
      </div>
      <div>
        <h1>Asignación de Implementos Producción</h1>
        <p>Entrega Múltiple con Selección Reactiva · Devolución Múltiple con Observación de Estado</p>
      </div>
    </div>
    
    <div class="banner-actions">
      <!-- Botón Modo Tablet Kiosco -->
      <button 
        type="button" 
        class="btn-kiosk-toggle" 
        [class.active-kiosk]="modoKiosco()"
        (click)="toggleKiosco()"
        title="Modo pantalla completa para tablets industriales">
        <kendo-svg-icon [icon]="fullscreenIco" size="small"></kendo-svg-icon>
        <span>{{ modoKiosco() ? 'Restaurar Pantalla' : 'Modo Tablet' }}</span>
      </button>

      <!-- Acción Principal: Entregar Implementos -->
      <button 
        type="button" 
        class="btn-safco btn-safco-primary" 
        (click)="abrirEntregaGeneral()">
        <kendo-svg-icon [icon]="plusIco" size="small"></kendo-svg-icon>
        <span>Entregar Implementos Múltiples</span>
      </button>
    </div>
  </div>

  <!-- Panel Colapsable de Filtros y KPIs -->
  <div class="collapsible-filter-card" [class.expanded]="panelFiltrosExpandido()">
    <div class="collapsible-filter-header" (click)="toggleFiltros()">
      <div class="filter-header-title">
        <kendo-svg-icon [icon]="filterIco" size="small"></kendo-svg-icon>
        <span>Filtros de Implementos y Resumen de Estado</span>
      </div>
      <button class="btn-toggle-panel" type="button">
        <span>{{ panelFiltrosExpandido() ? 'Ocultar Filtros' : 'Mostrar Filtros' }}</span>
        <kendo-svg-icon [icon]="panelFiltrosExpandido() ? chevronUpIco : chevronDownIco" size="small"></kendo-svg-icon>
      </button>
    </div>

    @if (panelFiltrosExpandido()) {
      <div class="collapsible-filter-body">
        <!-- Barra de Filtros -->
        <app-asignacion-filters-bar
          [tipos]="tiposImplementos()"
          (tipoSeleccionado)="onFiltroTipoChange($event)"
          (textoBusqueda)="onFiltroTextoChange($event)">
        </app-asignacion-filters-bar>

        <!-- Tarjetas Visuales de KPI (Exclusivamente informativas, no filtran) -->
        <app-visual-kpi-cards
          [indicadores]="indicadoresKpi()">
        </app-visual-kpi-cards>
      </div>
    }
  </div>

  <!-- Vista Principal: Operarios con Implementos a su Cargo -->
  <app-operarios-implementos-cards
    [asignaciones]="asignacionesFiltradas()"
    [cargando]="cargando()"
    (entregarImplemento)="abrirEntregaParaOperario($event)"
    (devolverImplementos)="abrirDevolucionParaAsignacion($event)">
  </app-operarios-implementos-cards>

  <!-- Modales Operativos -->
  @if (modalEntregaAbierto()) {
    <app-entrega-multiple-modal
      [(visible)]="modalEntregaAbierto"
      [operarioPreseleccionado]="operarioPreseleccionado()"
      [tipos]="tiposImplementos()"
      (entregaExitosa)="recargarListadoYIndicadores()">
    </app-entrega-multiple-modal>
  }

  @if (modalDevolucionAbierto()) {
    <app-devolucion-multiple-modal
      [(visible)]="modalDevolucionAbierto"
      [idAsignacion]="idAsignacionSeleccionada()"
      (devolucionExitosa)="recargarListadoYIndicadores()">
    </app-devolucion-multiple-modal>
  }
</main>
```

---

## 5. Componentes — Contratos de Inputs, Outputs y Signals

### 5.1 `VisualKpiCardsComponent` (KPIS Solo Visuales)
> 📌 **Cumplimiento Regla 1:** Se elimina cualquier listener de clic o mutación de estado de filtros. Las tarjetas son indicadores puramente numéricos de estado de almacén.

```typescript
@Component({
  selector: 'app-visual-kpi-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kpi-grid">
      <div class="kpi-card visual-only">
        <div class="kpi-val">{{ indicadores().totalPersonalEquipado }}</div>
        <div class="kpi-lbl">Operarios Equipados</div>
      </div>

      <div class="kpi-card visual-only">
        <div class="kpi-val ok">{{ indicadores().totalDisponibleAlmacen }}</div>
        <div class="kpi-lbl">Disponibles Almacén</div>
      </div>

      <div class="kpi-card visual-only">
        <div class="kpi-val bad">{{ indicadores().totalDeterioradasPerdidas }}</div>
        <div class="kpi-lbl">Deterioradas / Perdidas</div>
      </div>
    </div>
  `,
  styleUrls: ['./visual-kpi-cards.component.scss']
})
export class VisualKpiCardsComponent {
  readonly indicadores = input.required<ResumenImplementosIndicadores>();
}
```

### 5.2 `OperariosImplementosCardsComponent` (Tarjetas con Borde Izquierdo y Chips)
- **Inputs:**
  - `asignaciones = input.required<AsignacionCabecera[]>()`
  - `cargando = input<boolean>(false)`
- **Outputs:**
  - `entregarImplemento = output<{ dni: string; nombre: string }>()`
  - `devolverImplementos = output<number>()` // idAsignacionCabecera

```html
<div class="operarios-grid-container">
  @if (cargando()) {
    <div class="loading-state">Cargando operarios equipados...</div>
  } @else if (asignaciones().length === 0) {
    <div class="empty-state">
      No se encontraron operarios con implementos asignados bajo los filtros actuales.
    </div>
  } @else {
    @for (asig of asignaciones(); track asig.idAsignacionCabecera) {
      <div 
        class="operario-herr-card" 
        [class.warn-card]="tieneImplementosDanados(asig)">
        
        <div class="operario-card-header">
          <div class="op-main-det">
            <div class="op-big-avatar">{{ obtenerIniciales(asig.nombreOperario) }}</div>
            <div>
              <div class="op-title-name">{{ asig.nombreOperario }}</div>
              <div class="op-dni-text">
                <kendo-svg-icon [icon]="userIco" size="small"></kendo-svg-icon>
                <span>DNI: {{ asig.dniOperario }}</span>
              </div>
            </div>
          </div>

          <div class="op-card-actions">
            <button 
              type="button" 
              class="btn-safco btn-safco-teal btn-touch-compact"
              (click)="entregarImplemento.emit({ dni: asig.dniOperario, nombre: asig.nombreOperario })">
              <kendo-svg-icon [icon]="plusIco" size="small"></kendo-svg-icon>
              <span>Entregar</span>
            </button>
            <button 
              type="button" 
              class="btn-safco btn-safco-secondary btn-touch-compact"
              (click)="devolverImplementos.emit(asig.idAsignacionCabecera)">
              <kendo-svg-icon [icon]="refreshIco" size="small"></kendo-svg-icon>
              <span>Devolver</span>
            </button>
          </div>
        </div>

        <div class="operario-card-body">
          <div class="chips-section-title">
            Implementos a su cargo ({{ contarImplementosActivos(asig) }}):
          </div>
          
          <div class="herr-chips-grid">
            @for (det of implementosActivos(asig); track det.idAsignacionDetalle) {
              <div 
                class="herr-chip" 
                [class.warn]="det.implemento.estadoActual === 'DETERIORADA' || det.implemento.estadoActual === 'PERDIDA'">
                <span class="herr-chip-icon">{{ obtenerIconoTipo(det.implemento.tipoImplemento.nombreTipoImplemento) }}</span>
                <div>
                  <div class="herr-chip-name">{{ det.implemento.nombreImplemento }}</div>
                  <div class="herr-chip-calib">Asignado · {{ asig.fechaHoraEntrega | date:'HH:mm' }}</div>
                </div>
              </div>
            } @empty {
              <span class="sin-implementos-aviso">Sin implementos activos a su cargo</span>
            }
          </div>
        </div>

      </div>
    }
  }
</div>
```

### 5.3 `EntregaMultipleModalComponent` (Chips Reactivos en Tiempo Real)
Modal interactivo para registrar entregas masivas. Permite filtrar implementos en almacén, marcarlos con checkbox y verlos agregados instantáneamente en una bandeja de chips con botón de remoción `×`.

- **Control de visibilidad:** `visible = model<boolean>(false)`
- **Inputs:**
  - `operarioPreseleccionado = input<{ dni: string; nombre: string } | null>(null)`
  - `tipos = input.required<TipoImplemento[]>()`
- **Outputs:**
  - `entregaExitosa = output<void>()`

```typescript
@Component({
  selector: 'app-entrega-multiple-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, KENDO_ICONS],
  templateUrl: './entrega-multiple-modal.component.html'
})
export class EntregaMultipleModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly implementoService = inject(ImplementoService);
  private readonly asignacionService = inject(AsignacionImplementosService);

  visible = model<boolean>(false);
  operarioPreseleccionado = input<{ dni: string; nombre: string } | null>(null);
  tipos = input.required<TipoImplemento[]>();
  entregaExitosa = output<void>();

  // Signals
  readonly implementosDisponibles = signal<Implemento[]>([]);
  readonly seleccionadosSet = signal<Set<number>>(new Set());
  readonly filtroTipoModal = signal<number | null>(null);

  // Formulario
  form = this.fb.group({
    dniOperario: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
    nombreOperario: ['', [Validators.required]],
    observacionEntrega: ['']
  });

  // Computeds
  readonly implementosVisibles = computed(() => {
    const tipo = this.filtroTipoModal();
    const todos = this.implementosDisponibles();
    if (!tipo) return todos;
    return todos.filter(h => h.tipoImplemento.idTipoImplemento === tipo);
  });

  readonly listaSeleccionados = computed(() => {
    const ids = this.seleccionadosSet();
    return this.implementosDisponibles().filter(h => ids.has(h.idImplemento));
  });

  ngOnInit(): void {
    const pre = this.operarioPreseleccionado();
    if (pre) {
      this.form.patchValue({
        dniOperario: pre.dni,
        nombreOperario: pre.nombre
      });
    }

    this.cargarDisponibles();
  }

  cargarDisponibles(): void {
    this.implementoService.listarActivos().subscribe({
      next: (data) => {
        // Solo implementos que se encuentren físicamente DISPONIBLES
        this.implementosDisponibles.set(data.filter(i => i.estadoActual === 'DISPONIBLE'));
      }
    });
  }

  toggleCheck(idImplemento: number, checked: boolean): void {
    this.seleccionadosSet.update(set => {
      const nuevo = new Set(set);
      if (checked) nuevo.add(idImplemento);
      else nuevo.delete(idImplemento);
      return nuevo;
    });
  }

  removerChip(idImplemento: number): void {
    this.seleccionadosSet.update(set => {
      const nuevo = new Set(set);
      nuevo.delete(idImplemento);
      return nuevo;
    });
  }

  confirmarEntrega(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const ids = Array.from(this.seleccionadosSet());
    if (ids.length === 0) {
      Swal.fire('Atención', 'Selecciona al menos un implemento para entregar.', 'warning');
      return;
    }

    const val = this.form.value;
    const payload: GuardarAsignacionPayload = {
      dniOperario: val.dniOperario!,
      nombreOperario: val.nombreOperario!,
      observacionEntrega: val.observacionEntrega || '',
      estadoAsignacion: 'ACTIVA',
      asignacionDetalle: ids.map(id => ({ implemento: { idImplemento: id } }))
    };

    this.asignacionService.guardarAsignacion(payload).subscribe({
      next: () => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `${ids.length} implementos entregados correctamente`,
          showConfirmButton: false,
          timer: 2000
        });
        this.entregaExitosa.emit();
        this.visible.set(false);
      },
      error: (err) => {
        Swal.fire('Error', err?.error?.mensaje || 'No se pudo registrar la entrega', 'error');
      }
    });
  }
}
```

### 5.4 `DevolucionMultipleModalComponent` (Observaciones Condicionales)
Permite devolver en lote las herramientas de una asignación. Si el estado de devolución es `DETERIORADA` o `PERDIDA`, se habilita de forma obligatoria el campo de texto para la observación.

- **Control de visibilidad:** `visible = model<boolean>(false)`
- **Inputs:** `idAsignacion = input.required<number | null>()`
- **Outputs:** `devolucionExitosa = output<void>()`

```typescript
export interface ItemDevolucionFormState {
  idAsignacionDetalle: number;
  nombreImplemento: string;
  tipo: string;
  seleccionado: boolean;
  estadoDevolucion: EstadoDevolucionImplemento;
  observacion: string;
}

@Component({
  selector: 'app-devolucion-multiple-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, KENDO_ICONS],
  templateUrl: './devolucion-multiple-modal.component.html'
})
export class DevolucionMultipleModalComponent implements OnInit {
  private readonly asignacionService = inject(AsignacionImplementosService);

  visible = model<boolean>(false);
  idAsignacion = input.required<number | null>();
  devolucionExitosa = output<void>();

  readonly items = signal<ItemDevolucionFormState[]>([]);
  readonly nombreOperario = signal<string>('');
  readonly marcarTodos = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.idAsignacion();
    if (id) {
      this.cargarDetalles(id);
    }
  }

  cargarDetalles(idAsignacion: number): void {
    this.asignacionService.listarDetallesPorCabecera(idAsignacion).subscribe({
      next: (detalles) => {
        if (detalles.length > 0) {
          this.nombreOperario.set(detalles[0].implemento.nombreImplemento); // O de cabecera
        }
        // Filtrar los que aún no han sido devueltos
        const pendientes = detalles
          .filter(d => d.fechaHoraDevolucion === null)
          .map(d => ({
            idAsignacionDetalle: d.idAsignacionDetalle,
            nombreImplemento: d.implemento.nombreImplemento,
            tipo: d.implemento.tipoImplemento.nombreTipoImplemento,
            seleccionado: false,
            estadoDevolucion: 'EXCELENTE' as EstadoDevolucionImplemento,
            observacion: ''
          }));
        this.items.set(pendientes);
      }
    });
  }

  toggleMarcarTodos(checked: boolean): void {
    this.marcarTodos.set(checked);
    this.items.update(list => list.map(item => ({ ...item, seleccionado: checked })));
  }

  confirmarDevolucion(): void {
    const seleccionados = this.items().filter(i => i.seleccionado);
    if (seleccionados.length === 0) {
      Swal.fire('Atención', 'Selecciona al menos un implemento a devolver.', 'warning');
      return;
    }

    // Validar observaciones si hay deteriorada o perdida
    for (const item of seleccionados) {
      if ((item.estadoDevolucion === 'DETERIORADA' || item.estadoDevolucion === 'PERDIDA') && !item.observacion.trim()) {
        Swal.fire('Atención', `Ingresa una observación para ${item.nombreImplemento} (${item.estadoDevolucion}).`, 'warning');
        return;
      }
    }

    const payload: GuardarDevolucionBatchPayload = {
      asignacionDetalle: seleccionados.map(i => ({
        idAsignacionDetalle: i.idAsignacionDetalle,
        estadoDevolucion: i.estadoDevolucion,
        observacionDevolucion: i.observacion.trim()
      }))
    };

    const idCabecera = this.idAsignacion()!;
    this.asignacionService.registrarDevolucionBatch(idCabecera, payload).subscribe({
      next: () => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `${seleccionados.length} implementos devueltos exitosamente`,
          showConfirmButton: false,
          timer: 2000
        });
        this.devolucionExitosa.emit();
        this.visible.set(false);
      }
    });
  }
}
```

### 5.5 `CatalogoFiltersBarComponent` (Búsqueda Solo por Nombre)
> 📌 **Cumplimiento Regla 2:** El input de texto está etiquetado y enlaza al parámetro `nombreImplemento` exclusivamente.

```typescript
@Component({
  selector: 'app-catalogo-filters-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filter-bar-produccion">
      <div class="filter-item" style="max-width: 220px;">
        <label>Tipo Implemento:</label>
        <select class="select-touch" [ngModel]="tipo()" (ngModelChange)="tipoChange.emit($event)">
          <option [ngValue]="undefined">Todos los Tipos</option>
          @for (t of tipos(); track t.idTipoImplemento) {
            <option [ngValue]="t.idTipoImplemento">{{ t.nombreTipoImplemento }}</option>
          }
        </select>
      </div>

      <div class="filter-item" style="max-width: 220px;">
        <label>Estado Almacén:</label>
        <select class="select-touch" [ngModel]="estado()" (ngModelChange)="estadoChange.emit($event)">
          <option value="">Todos los Estados</option>
          <option value="DISPONIBLE">🟠 Disponible</option>
          <option value="ASIGNADO">🟢 Asignado</option>
          <option value="DETERIORADA">⚪ Deteriorada</option>
          <option value="PERDIDA">🔴 Perdida</option>
        </select>
      </div>

      <!-- REGLA 2: Solo por Nombre del Implemento -->
      <div class="filter-item" style="flex: 2; min-width: 240px;">
        <label>Buscar por Nombre de Implemento:</label>
        <input 
          type="text" 
          class="input-touch" 
          placeholder="Ej: Tijera 14, Calibrador 2, Pesa Patrón..." 
          [ngModel]="nombre()" 
          (ngModelChange)="nombreChange.emit($event)" />
      </div>
    </div>
  `
})
export class CatalogoFiltersBarComponent {
  readonly tipos = input.required<TipoImplemento[]>();
  readonly tipo = input<number | undefined>(undefined);
  readonly estado = input<string>('');
  readonly nombre = input<string>('');

  readonly tipoChange = output<number | undefined>();
  readonly estadoChange = output<string>();
  readonly nombreChange = output<string>();
}
```

### 5.6 `ImplementosTableComponent` (Kendo Grid con Kebab Menu)
- **Inputs:** `implementos = input.required<InventarioImplementoItem[]>()`
- **Outputs:**
  - `verHistorial = output<number>()` // idImplemento
  - `editarEstado = output<InventarioImplementoItem>()`
  - `activarAnular = output<InventarioImplementoItem>()`

```html
<div class="table-safco-container hidden-mobile">
  <table class="table-safco">
    <thead>
      <tr>
        <th>ID SISTEMA</th>
        <th>NOMBRE / NUMERACIÓN</th>
        <th>TIPO</th>
        <th>ESTADO ALMACÉN</th>
        <th>OBSERVACIÓN / DESCRIPCIÓN</th>
        <th style="text-align: right;">ACCIONES</th>
      </tr>
    </thead>
    <tbody>
      @for (item of implementos(); track item.idImplemento) {
        <tr>
          <td class="mono-text">{{ item.idImplemento }}</td>
          <td class="implemento-nombre-col">
            <span class="icon-prefix">{{ obtenerIcono(item.nombreTipoImplemento) }}</span>
            <strong>{{ item.nombreImplemento }}</strong>
          </td>
          <td>
            <span class="badge-rol b-sel">{{ item.nombreTipoImplemento }}</span>
          </td>
          <td>
            <span class="mesa-status-pill" [ngClass]="obtenerPillClase(item.estadoActual)">
              {{ item.estadoActual }}
            </span>
          </td>
          <td class="desc-col">{{ item.observacion || '—' }}</td>
          <td style="text-align: right;">
            <div class="action-menu-container">
              <button 
                type="button" 
                class="btn-kebab-menu" 
                (click)="toggleMenu(item.idImplemento, $event)">
                <kendo-svg-icon [icon]="dotsIco" size="small"></kendo-svg-icon>
              </button>
              
              @if (menuAbiertoId() === item.idImplemento) {
                <div class="dropdown-action-menu show" (click)="$event.stopPropagation()">
                  <button class="action-menu-item" (click)="onVerHistorial(item.idImplemento)">
                    <kendo-svg-icon [icon]="clockIco" size="small"></kendo-svg-icon>
                    <span>Ver Historial / Trazabilidad</span>
                  </button>
                  <button class="action-menu-item" (click)="onEditar(item)">
                    <kendo-svg-icon [icon]="pencilIco" size="small"></kendo-svg-icon>
                    <span>Editar Estado</span>
                  </button>
                  @if (item.estadoActual === 'DETERIORADA' || item.estadoActual === 'PERDIDA') {
                    <button class="action-menu-item ok-action" (click)="onActivar(item)">
                      <kendo-svg-icon [icon]="checkCircleIco" size="small"></kendo-svg-icon>
                      <span>Activar / Habilitar</span>
                    </button>
                  } @else {
                    <button class="action-menu-item danger" (click)="onAnular(item)">
                      <kendo-svg-icon [icon]="xCircleIco" size="small"></kendo-svg-icon>
                      <span>Anular Implemento</span>
                    </button>
                  }
                </div>
              }
            </div>
          </td>
        </tr>
      } @empty {
        <tr>
          <td colspan="6" class="empty-table-msg">No se encontraron implementos en el inventario.</td>
        </tr>
      }
    </tbody>
  </table>
</div>
```

### 5.7 `ImplementosMobileCardsComponent` (Mobile-First con `border-l-4`)
Vista optimizada para pantallas estrechas y móviles:

```html
<div class="implementos-cards-mobile block md:hidden">
  @for (item of implementos(); track item.idImplemento) {
    <div 
      class="mobile-card-safco"
      [ngClass]="'border-l-' + item.estadoActual.toLowerCase()">
      
      <div class="card-mobile-header">
        <div class="card-mobile-title">
          <span class="icon-prefix">{{ obtenerIcono(item.nombreTipoImplemento) }}</span>
          <strong>{{ item.nombreImplemento }}</strong>
        </div>
        <span class="mesa-status-pill" [ngClass]="obtenerPillClase(item.estadoActual)">
          {{ item.estadoActual }}
        </span>
      </div>

      <div class="card-mobile-row">
        <span class="lbl">Tipo:</span>
        <span class="val">{{ item.nombreTipoImplemento }} ({{ item.codigoTipoImplemento }})</span>
      </div>

      <div class="card-mobile-row">
        <span class="lbl">Obs:</span>
        <span class="val">{{ item.observacion || 'Sin observaciones' }}</span>
      </div>

      <div class="card-mobile-footer" (click)="$event.stopPropagation()">
        <button class="btn-touch-action" (click)="verHistorial.emit(item.idImplemento)">
          <kendo-svg-icon [icon]="clockIco" size="small"></kendo-svg-icon>
          <span>Trazabilidad</span>
        </button>
        <button class="btn-touch-action" (click)="editarEstado.emit(item)">
          <kendo-svg-icon [icon]="pencilIco" size="small"></kendo-svg-icon>
          <span>Editar</span>
        </button>
      </div>

    </div>
  }
</div>
```

### 5.8 `TrazabilidadModalComponent` (Banner de Último Poseedor y Timeline)
Si el implemento está en estado `PERDIDA` o `DETERIORADA`, este modal destaca al operario responsable registrado en el último movimiento.

```html
@if (visible()) {
  <div class="modal-backdrop-safco active" (click)="cerrar()">
    <div class="modal-card-safco max-w-650" (click)="$event.stopPropagation()">
      <div class="modal-card-header">
        <h3>
          <kendo-svg-icon [icon]="clockIco" size="medium"></kendo-svg-icon>
          <span>Trazabilidad de Implemento</span>
        </h3>
        <button class="btn-close-safco" (click)="cerrar()">&times;</button>
      </div>

      <div class="modal-card-body">
        <!-- Banner Último Poseedor si está dañado o perdido -->
        @if (esCritica(implementoActual()) && ultimoMovimiento(); as ult) {
          <div class="banner-ultimo-poseedor" [class.perdida]="implementoActual()?.estadoActual === 'PERDIDA'">
            <div class="poseedor-title">
              <kendo-svg-icon [icon]="alertIco" size="small"></kendo-svg-icon>
              <span>ÚLTIMO POSEEDOR REGISTRADO</span>
            </div>
            <p class="poseedor-desc">
              Implemento a cargo de: <strong>{{ ult.asignacionCabecera.nombreOperario }}</strong> 
              (DNI: {{ ult.asignacionCabecera.dniOperario }}) · {{ ult.fechaHoraDevolucion || ult.asignacionCabecera.fechaHoraEntrega | date:'medium' }}
            </p>
          </div>
        }

        <!-- Timeline de Movimientos -->
        <div class="timeline-container">
          @for (mov of movimientos(); track mov.idAsignacionDetalle) {
            <div 
              class="timeline-card" 
              [class.actual]="mov.fechaHoraDevolucion === null">
              <div class="timeline-header">
                <span class="op-nombre">{{ mov.asignacionCabecera.nombreOperario }}</span>
                <span class="badge-status">
                  {{ mov.fechaHoraDevolucion ? ('DEVUELTO (' + mov.estadoDevolucion + ')') : 'EN USO (ACTUAL)' }}
                </span>
              </div>
              <div class="timeline-dates">
                <span>Entrega: {{ mov.asignacionCabecera.fechaHoraEntrega | date:'dd/MM/yyyy HH:mm' }}</span>
                @if (mov.fechaHoraDevolucion) {
                  <span> · Retorno: {{ mov.fechaHoraDevolucion | date:'dd/MM/yyyy HH:mm' }}</span>
                }
              </div>
              @if (mov.observacionDevolucion) {
                <div class="timeline-obs">
                  <strong>Obs:</strong> {{ mov.observacionDevolucion }}
                </div>
              }
            </div>
          } @empty {
            <div class="empty-timeline">Sin movimientos registrados para este implemento.</div>
          }
        </div>
      </div>

      <div class="modal-card-actions">
        <button class="btn-safco btn-safco-secondary w-full" (click)="cerrar()">Cerrar</button>
      </div>
    </div>
  </div>
}
```

---

## 6. Servicios — Contratos HTTP

### 6.1 `TipoImplementoService`
> Ubicación: `src/app/features/produccion-implementos/services/tipo-implemento.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
  TipoImplemento, 
  GuardarTipoImplementoPayload, 
  ApiResponseProvider 
} from '../models/implementos.model';

@Injectable({ providedIn: 'root' })
export class TipoImplementoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/Produccion/TipoImplemento';

  listarTodos(): Observable<TipoImplemento[]> {
    return this.http.get<ApiResponseProvider<TipoImplemento[]>>(this.baseUrl)
      .pipe(map(res => res.data));
  }

  listarActivos(): Observable<TipoImplemento[]> {
    return this.http.get<ApiResponseProvider<TipoImplemento[]>>(`${this.baseUrl}/activos`)
      .pipe(map(res => res.data));
  }

  obtenerPorId(id: number): Observable<TipoImplemento> {
    return this.http.get<ApiResponseProvider<TipoImplemento>>(`${this.baseUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  guardar(payload: GuardarTipoImplementoPayload): Observable<TipoImplemento> {
    return this.http.post<ApiResponseProvider<TipoImplemento>>(this.baseUrl, payload)
      .pipe(map(res => res.data));
  }

  actualizar(id: number, payload: GuardarTipoImplementoPayload): Observable<TipoImplemento> {
    return this.http.put<ApiResponseProvider<TipoImplemento>>(`${this.baseUrl}/${id}`, payload)
      .pipe(map(res => res.data));
  }

  anular(id: number): Observable<void> {
    return this.http.delete<ApiResponseProvider<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => void 0));
  }
}
```

### 6.2 `ImplementoService`
> Ubicación: `src/app/features/produccion-implementos/services/implemento.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
  Implemento, 
  InventarioImplementoItem, 
  GuardarImplementosBulkPayload, 
  ActualizarImplementoPayload, 
  FiltrosInventarioImplementos, 
  PageSpring, 
  ApiResponseProvider 
} from '../models/implementos.model';

@Injectable({ providedIn: 'root' })
export class ImplementoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/Produccion/Implemento';

  listarActivos(): Observable<Implemento[]> {
    return this.http.get<ApiResponseProvider<Implemento[]>>(`${this.baseUrl}/activos`)
      .pipe(map(res => res.data));
  }

  obtenerPorId(id: number): Observable<Implemento> {
    return this.http.get<ApiResponseProvider<Implemento>>(`${this.baseUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  guardarBulkConCorrelativo(payload: GuardarImplementosBulkPayload, cantidad: number = 1): Observable<Implemento[]> {
    const params = new HttpParams().set('cantidad', cantidad.toString());
    return this.http.post<ApiResponseProvider<Implemento[]>>(this.baseUrl, payload, { params })
      .pipe(map(res => res.data));
  }

  actualizar(id: number, payload: ActualizarImplementoPayload): Observable<Implemento> {
    return this.http.put<ApiResponseProvider<Implemento>>(`${this.baseUrl}/${id}`, payload)
      .pipe(map(res => res.data));
  }

  anular(id: number): Observable<void> {
    return this.http.delete<ApiResponseProvider<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => void 0));
  }

  // REGLA 2: Búsqueda paginada únicamente por nombre de implemento
  listarPaginado(filtros: FiltrosInventarioImplementos): Observable<PageSpring<InventarioImplementoItem>> {
    let params = new HttpParams()
      .set('pagina', filtros.pagina.toString())
      .set('size', filtros.size.toString());

    if (filtros.idTipoImplemento !== undefined) {
      params = params.set('idTipoImplemento', filtros.idTipoImplemento.toString());
    }
    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros.nombreImplemento && filtros.nombreImplemento.trim() !== '') {
      params = params.set('nombreCodigo', filtros.nombreImplemento.trim());
    }

    return this.http.get<PageSpring<InventarioImplementoItem>>(`${this.baseUrl}/listado-paginado`, { params });
  }
}
```

### 6.3 `AsignacionImplementosService`
> Ubicación: `src/app/features/produccion-implementos/services/asignacion-implementos.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
  AsignacionCabecera, 
  AsignacionDetalle, 
  GuardarAsignacionPayload, 
  GuardarDevolucionBatchPayload, 
  TrazabilidadImplementoItem, 
  ResumenImplementosIndicadores, 
  FiltrosAsignacion, 
  PageSpring, 
  ApiResponseProvider 
} from '../models/implementos.model';

@Injectable({ providedIn: 'root' })
export class AsignacionImplementosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/Produccion/Asignacion';

  guardarAsignacion(payload: GuardarAsignacionPayload): Observable<AsignacionCabecera> {
    return this.http.post<ApiResponseProvider<AsignacionCabecera>>(this.baseUrl, payload)
      .pipe(map(res => res.data));
  }

  obtenerPorId(id: number): Observable<AsignacionCabecera> {
    return this.http.get<ApiResponseProvider<AsignacionCabecera>>(`${this.baseUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  listarAsignacionesActivas(): Observable<AsignacionCabecera[]> {
    return this.http.get<ApiResponseProvider<AsignacionCabecera[]>>(`${this.baseUrl}/activos`)
      .pipe(map(res => res.data));
  }

  listarDetallesPorCabecera(idAsignacionCabecera: number): Observable<AsignacionDetalle[]> {
    return this.http.get<ApiResponseProvider<AsignacionDetalle[]>>(`${this.baseUrl}/detalles/${idAsignacionCabecera}`)
      .pipe(map(res => res.data));
  }

  registrarDevolucionBatch(idAsignacionCabecera: number, payload: GuardarDevolucionBatchPayload): Observable<AsignacionDetalle[]> {
    return this.http.put<ApiResponseProvider<AsignacionDetalle[]>>(`${this.baseUrl}/detalles/${idAsignacionCabecera}`, payload)
      .pipe(map(res => res.data));
  }

  obtenerTrazabilidad(idImplemento: number): Observable<TrazabilidadImplementoItem[]> {
    return this.http.get<ApiResponseProvider<TrazabilidadImplementoItem[]>>(`${this.baseUrl}/trazabilidad/${idImplemento}`)
      .pipe(map(res => res.data));
  }

  // REGLA 1: KPIs puramente visuales
  obtenerResumenIndicadores(): Observable<ResumenImplementosIndicadores> {
    return this.http.get<ApiResponseProvider<ResumenImplementosIndicadores>>(`${this.baseUrl}/resumen-implementos`)
      .pipe(map(res => res.data));
  }

  buscarPaginado(filtros: FiltrosAsignacion): Observable<PageSpring<AsignacionCabecera>> {
    let params = new HttpParams()
      .set('pagina', filtros.pagina.toString())
      .set('size', filtros.size.toString());

    if (filtros.idTipoImplemento !== undefined) {
      params = params.set('idTipoImplemento', filtros.idTipoImplemento.toString());
    }
    if (filtros.operarioImplemento && filtros.operarioImplemento.trim() !== '') {
      params = params.set('operarioImplemento', filtros.operarioImplemento.trim());
    }

    return this.http.get<PageSpring<AsignacionCabecera>>(`${this.baseUrl}/listado-paginado`, { params });
  }

  anular(id: number): Observable<void> {
    return this.http.delete<ApiResponseProvider<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => void 0));
  }
}
```

---

## 7. Endpoints API REST (Matriz Consolidada)

| # | Módulo | Método | URL | Descripción | Request Body / Params | Response Data |
|---|---|---|---|---|---|---|
| 1 | Tipo | `POST` | `/Produccion/TipoImplemento` | Crea un catálogo/tipo de herramienta | JSON `GuardarTipoImplementoPayload` | `TipoImplemento` |
| 2 | Tipo | `GET` | `/Produccion/TipoImplemento/activos` | Obtiene tipos activos para dropdowns | - | `TipoImplemento[]` |
| 3 | Tipo | `PUT` | `/Produccion/TipoImplemento/{id}` | Actualiza nombre o código del tipo | Path `id` + JSON Payload | `TipoImplemento` |
| 4 | Tipo | `DELETE` | `/Produccion/TipoImplemento/{id}` | Borrado lógico (`estado = '0'`) | Path `id` | `null` |
| 5 | Implemento | `POST` | `/Produccion/Implemento?cantidad={N}` | Genera N implementos correlativos | Query `cantidad` + JSON `GuardarImplementosBulkPayload` | `Implemento[]` |
| 6 | Implemento | `GET` | `/Produccion/Implemento/activos` | Listado de implementos activos | - | `Implemento[]` |
| 7 | Implemento | `PUT` | `/Produccion/Implemento/{id}` | Modifica estado u observación | Path `id` + JSON `ActualizarImplementoPayload` | `Implemento` |
| 8 | Implemento | `DELETE` | `/Produccion/Implemento/{id}` | Borrado lógico (`estado = '0'`) | Path `id` | `null` |
| 9 | Implemento | `GET` | `/Produccion/Implemento/listado-paginado` | Búsqueda en inventario por nombre | Query `idTipoImplemento`, `nombreCodigo`, `pagina`, `size` | `PageSpring<InventarioImplementoItem>` |
| 10 | Asignación | `POST` | `/Produccion/Asignacion` | Registra entrega múltiple | JSON `GuardarAsignacionPayload` | `AsignacionCabecera` |
| 11 | Asignación | `GET` | `/Produccion/Asignacion/activos` | Asignaciones activas con implementos | - | `AsignacionCabecera[]` |
| 12 | Asignación | `GET` | `/Produccion/Asignacion/detalles/{id}` | Carga implementos de la asignación | Path `idAsignacionCabecera` | `AsignacionDetalle[]` |
| 13 | Asignación | `PUT` | `/Produccion/Asignacion/detalles/{id}` | Registra devolución en lote | Path `id` + JSON `GuardarDevolucionBatchPayload` | `AsignacionDetalle[]` |
| 14 | Asignación | `GET` | `/Produccion/Asignacion/trazabilidad/{id}` | Cronología e historial de auditoría | Path `idImplemento` | `TrazabilidadImplementoItem[]` |
| 15 | Asignación | `GET` | `/Produccion/Asignacion/resumen-implementos` | Indicadores numéricos superiores | - | `ResumenImplementosIndicadores` |
| 16 | Asignación | `GET` | `/Produccion/Asignacion/listado-paginado` | Búsqueda paginada de asignaciones | Query `idTipoImplemento`, `operarioImplemento`, `pagina`, `size` | `PageSpring<AsignacionCabecera>` |

---

## 8. Design System SAFCO — Aplicación Angular

### 8.1 Tokens Corporativos SCSS
```scss
:root {
  --safco-teal: #004a4c;
  --safco-teal-dark: #003638;
  --safco-teal-medium: #005f62;
  --safco-teal-light: #cce5e5;
  --safco-teal-bg: #e6f4f4;

  --safco-red: #d80000;
  --safco-red-hover: #b50000;
  --safco-red-bg: #ffeaea;
  --safco-red-border: #ffcccc;

  --safco-amber: #f5a800;
  --safco-amber-bg: #fffbea;
  --safco-amber-border: #fde68a;

  --safco-green: #4c8c2b;
  --safco-green-bg: #f0fdf4;
  --safco-green-light: #dcfce7;

  --safco-border: #e2e8f0;
  --safco-text-dark: #0f172a;
  --safco-text-muted: #64748b;
  --safco-bg: #f4f7f7;
}
```

### 8.2 Banner Ejecutivo con Modo Sticky y Kiosco
```scss
.produccion-banner {
  background: linear-gradient(135deg, var(--safco-teal) 0%, var(--safco-teal-medium) 100%);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
  color: #ffffff;
  box-shadow: 0 4px 15px rgba(0, 74, 76, 0.18);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.produccion-banner-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #ffffff;
}
```

### 8.3 Tablas SAFCO (Desktop)
```scss
.table-safco {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Inter', sans-serif;

  thead th {
    background-color: var(--safco-teal);
    color: #ffffff;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 0.75rem 1rem;
    text-align: left;
    border: none;
  }

  tbody tr {
    border-bottom: 1px solid var(--safco-border);
    transition: background 0.15s ease;

    &:hover {
      background-color: #f8fafc;
    }
  }

  tbody td {
    padding: 0.75rem 1rem;
    font-size: 0.88rem;
    color: var(--safco-text-dark);
  }
}
```

### 8.4 Badges y Pills de Estado
```scss
.mesa-status-pill {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.25rem 0.65rem;
  border-radius: 20px;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;

  &.pill-disponible {
    background: var(--safco-teal-bg);
    color: var(--safco-teal);
    border: 1px solid var(--safco-teal-light);
  }

  &.pill-asignado {
    background: var(--safco-green-bg);
    color: var(--safco-green);
    border: 1px solid var(--safco-green-light);
  }

  &.pill-deteriorada {
    background: #f1f5f9;
    color: var(--safco-text-muted);
    border: 1px solid var(--safco-border);
  }

  &.pill-perdida {
    background: var(--safco-red-bg);
    color: var(--safco-red);
    border: 1px solid var(--safco-red-border);
  }
}
```

### 8.5 Mobile-First Cards con Borde Lateral 4px
```scss
.mobile-card-safco {
  background: #ffffff;
  border: 1px solid var(--safco-border);
  border-radius: 12px;
  padding: 0.85rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: transform 0.15s ease;

  &:active {
    transform: scale(0.99);
  }

  &.border-l-disponible { border-left: 4px solid var(--safco-teal); }
  &.border-l-asignado   { border-left: 4px solid var(--safco-green); }
  &.border-l-deteriorada { border-left: 4px solid var(--safco-amber); }
  &.border-l-perdida    { border-left: 4px solid var(--safco-red); }
}
```

### 8.6 Modo Tablet Kiosco (Terminal Industrial en Planta)
```scss
body.standalone-kiosk-mode {
  margin: 0 !important;
  padding: 0 !important;
  overflow-x: hidden !important;

  main.content-area {
    padding: 0.5rem !important;
    max-width: 100% !important;
  }

  .produccion-banner {
    border-radius: 0 !important;
    margin: -0.5rem -0.5rem 0.75rem -0.5rem !important;
    width: calc(100% + 1rem) !important;
  }
}
```

---

## 9. Mapa Exhaustivo de Iconos Kendo SVG

> Se elimina el 100% de clases `bx bx-*` del prototipo y se mapean estrictamente a `@progress/kendo-svg-icons`:

| Elemento UI / Funcionalidad | Icono Mockup Original (Boxicons) | Icono Obligatorio `@progress/kendo-svg-icons` |
|---|---|---|
| Banner Principal Asignación | `bx bx-wrench` | `wrenchIcon` |
| Banner Principal Catálogo | `bx bx-cog` | `gearIcon` |
| Botón Modo Tablet Kiosco | `bx bx-fullscreen` / `bx bx-exit-fullscreen` | `fullscreenIcon` / `arrowsNoRepeatIcon` |
| Botón Entregar Implementos | `bx bx-plus-circle` | `plusCircleIcon` |
| Botón Agregar Tipo Implemento | `bx bx-category-plus` | `plusOutlineIcon` |
| Panel Colapsable de Filtros | `bx bx-filter-alt` | `filterIcon` |
| Chevron Ocultar / Mostrar | `bx bx-chevron-up` / `bx bx-chevron-down` | `chevronUpIcon` / `chevronDownIcon` |
| Búsqueda de Texto | `bx bx-search` | `searchIcon` |
| Acción Entregar en Card | `bx bx-plus` | `plusIcon` |
| Acción Devolver en Card | `bx bx-refresh` | `arrowRotateCwIcon` |
| Menú Contextual (Kebab) | `bx bx-dots-vertical-rounded` | `moreVerticalIcon` |
| Ver Historial / Trazabilidad | `bx bx-show` / `bx bx-history` | `clockIcon` / `eyeIcon` |
| Editar Estado | `bx bx-edit` | `pencilIcon` |
| Anular Implemento | `bx bx-x-circle` | `xCircleIcon` |
| Activar / Habilitar | `bx bx-check-circle` | `checkCircleIcon` |
| Alerta de Último Poseedor | `bx bx-error-alt` | `exclamationCircleIcon` |
| Usuario / DNI | `bx bx-id-card` / `bx bx-user` | `userIcon` |
| Calendario / Fecha | `bx bx-calendar` | `calendarIcon` |
| Hora / Tiempo | `bx bx-time-five` | `clockIcon` |
| Guardar Cambios | `bx bx-save` | `saveIcon` |

---

## 10. Reglas de Negocio — Implementación Angular 21

### 10.1 Gestión de KPIs Exclusivamente Visuales (Regla 1)
En el prototipo mockup, las tarjetas KPI tenían clases `clickable` y eventos `onclick="filtrarPorKPI(...)"`. En la arquitectura Angular 21:
- El componente `VisualKpiCardsComponent` **no expone outputs de evento ni modifica signals de filtrado**.
- Las tarjetas únicamente proyectan los valores del signal `indicadores()`, manteniendo estilos accesibles sin pseudoclases `:hover` de botón ni cursores puntero.

### 10.2 Búsqueda de Catálogo Exclusivamente por Nombre (Regla 2)
El formulario de búsqueda del catálogo mapea directamente a:
```typescript
onBuscarPorNombre(nombre: string): void {
  this.filtros.update(f => ({
    ...f,
    nombreImplemento: nombre.trim(),
    pagina: 0 // Reinicio de página al escribir
  }));
  this.cargarInventario();
}
```
No se envía código de sistema ni se concatena en la consulta, respetando la simplificación operacional solicitada.

### 10.3 Exclusión Absoluta del Botón "Ver Diagrama BD" (Regla 3)
El botón `<a href="diagrama-modelo-implementos.html" id="btn-ver-diagrama-bd">` del mockup fue únicamente una herramienta de referencia durante la fase de análisis. En el template Angular 21 no se genera ninguna ruta, botón ni link a dicho diagrama.

### 10.4 Manejo de Observación Condicional en Devolución
Al clasificar un implemento como `DETERIORADA` o `PERDIDA`, la observación es obligatoria antes de autorizar el request:
```typescript
validarObservaciones(items: ItemDevolucionFormState[]): boolean {
  return items.every(item => {
    if (item.estadoDevolucion === 'EXCELENTE') return true;
    return item.observacion && item.observacion.trim().length >= 5;
  });
}
```

---

## 11. Configuración del Módulo / App

### 11.1 Configuración Zoneless (`app.config.ts`)
```typescript
import { ApplicationConfig, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideAnimationsAsync()
  ]
};
```

### 11.2 Definición de Rutas con Lazy Loading (`app.routes.ts`)
```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'produccion/implementos',
    children: [
      {
        path: 'asignacion',
        loadComponent: () => import('./features/produccion-implementos/pages/asignacion-implementos/asignacion-implementos.component')
          .then(m => m.AsignacionImplementosComponent),
        title: 'SAFCO · Asignación de Implementos'
      },
      {
        path: 'catalogo',
        loadComponent: () => import('./features/produccion-implementos/pages/catalogo-implementos/catalogo-implementos.component')
          .then(m => m.CatalogoImplementosComponent),
        title: 'SAFCO · Catálogo e Inventario de Implementos'
      },
      {
        path: '',
        redirectTo: 'asignacion',
        pathMatch: 'full'
      }
    ]
  }
];
```

---

## 12. Checklist de Implementación Angular 21

### Modelos y Servicios
- [ ] Crear `implementos.model.ts` con todos los tipos limpios sin sufijo `DTO`.
- [ ] Implementar `TipoImplementoService` con endpoints `/activos` y CRUD completo.
- [ ] Implementar `ImplementoService` con soporte de creación bulk correlativa y listado paginado.
- [ ] Implementar `AsignacionImplementosService` con entrega múltiple, devolución batch y trazabilidad.

### Submódulo de Asignación de Implementos
- [ ] `AsignacionImplementosComponent` (Página principal con signals de estado y modo kiosco).
- [ ] `AsignacionFiltersBarComponent` (Filtro por tipo y buscador de operario).
- [ ] `VisualKpiCardsComponent` (Tarjetas de KPI no interactivas, solo visuales - Regla 1).
- [ ] `OperariosImplementosCardsComponent` (Tarjetas con iniciales de avatar, chips de herramientas y botones táctiles).
- [ ] `EntregaMultipleModalComponent` (Modal con Two-way binding `model<boolean>()`, checkboxes y resumen de chips interactivos).
- [ ] `DevolucionMultipleModalComponent` (Modal con marcado masivo, selects de condición y textarea condicional para incidencias).

### Submódulo de Catálogo e Inventario
- [ ] `CatalogoImplementosComponent` (Página de inventario con integración Kendo Grid).
- [ ] `CatalogoFiltersBarComponent` (Búsqueda exclusivamente por nombre de implemento - Regla 2).
- [ ] `ImplementosTableComponent` (Kendo Grid desktop con Kebab menu).
- [ ] `ImplementosMobileCardsComponent` (Mobile-First con `border-l-4` por estado de almacén).
- [ ] `NuevoTipoModalComponent` (Modal para registrar familias de herramientas con código corto).
- [ ] `GenerarImplementosModalComponent` (Modal para generación secuencial correlativa).
- [ ] `EditarImplementoModalComponent` (Modal para ajustar estado de almacén y motivo).
- [ ] `TrazabilidadModalComponent` (Modal con banner de último poseedor para perdidas/deterioradas y timeline de asignaciones).

### Design System & Validaciones
- [ ] Migración total a Kendo SVG Icons (0% Boxicons).
- [ ] Verificación de omisión total del botón "Ver Diagrama BD" (Regla 3).
- [ ] Verificación de soporte de pantalla táctil y modo kiosco edge-to-edge.
- [ ] Confirmar ejecución bajo `provideExperimentalZonelessChangeDetection()`.
