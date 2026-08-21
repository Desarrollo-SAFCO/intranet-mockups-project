# SPEC Angular 21: Informe General de Embarque, Documentos Finales & Catálogo de Conclusiones V2 — SAFCO

**Framework:** Angular 21 (Standalone + Signals + Zoneless)  
**Backend API de Referencia:** Spring Boot REST + Stored Procedures (`SPEC_API_DOC_FINAL_EMBARQUE.md` V2)  
**Módulos fuente:** `general/informe-embarque-general.html` & `general/tablas-conclusiones-embarque.html`  
**Design System:** SAFCO Corporativo (Kendo SVG Icons, Paleta Teal/Rojo/Verde, Mobile-First)  
**Fecha de spec:** 2026-08-17  

---

> [!IMPORTANT]
> **REGLAS ESTRICTAS DE ARQUITECTURA ANGULAR 21 & SAFCO DESIGN SYSTEM:**
> - ❌ **PROHIBIDO** el uso de `Boxicons (bx bx-*)` — usar exclusivamente `<kendo-svg-icon>` de `@progress/kendo-svg-icons`.
> - ✅ **OBLIGATORIO** Signals nativas: `signal()`, `computed()`, `input()`, `output()`, `model()`.
> - ❌ **PROHIBIDO** `@Input()/@Output()` clásicos, `EventEmitter`, `ChangeDetectorRef.markForCheck()`, `detectChanges()`.
> - ❌ **PROHIBIDO** Nombrar interfaces con sufijo `DTO` — usar nombres limpios de dominio TypeScript (`CampanaActiva`, `InstruccionDetalle`, `ReporteDatosInstruccion`, `ConclusionInformeFinal`, etc.).
> - ✅ **OBLIGATORIO** Envoltorios de API: Todo servicio debe procesar `ApiResponseProvider<T>` (con campo `respuesta`) y `ResponseStandardProvider<T>`.
> - ✅ **OBLIGATORIO** Manejo de `instruccionEmbarque`: En el listado general `instruccionEmbarque` llega como objeto estructurado (`InstruccionDetalle`), no como string simple.
> - ✅ **OBLIGATORIO** Mobile-First: Tabla Kendo Grid en desktop (`hidden md:block`) y cards con borde lateral de 4px (`border-l-4`) en mobile (`block md:hidden`).

---

## 1. Descripción de los Módulos

### 1.1 Módulo Principal: Informe General de Embarque
Centro de control consolidado del proceso de embarque de fruta de exportación de **SAFCO**. Conecta la gestión operativa de **Producción** con los tres documentos finales de inspección:
1. **Seguridad Patrimonial:** Inspección de Ingreso de Contenedor (`InspeccionIngresoContenedor`).
2. **Calidad:** Inspección Pre-Embarque (`InspeccionPreEmbarque`).
3. **Frío y Despacho:** Inspección de Embarque en Frío (`InspeccionEmbarqueFrio`), incluyendo cabecera detallada y validación de pallets de Nisira.
4. **Documento General Consolidado:** Persistencia del dictamen final, búsqueda por terna de inspecciones (`/buscar-por-inspecciones`) y asignación dinámica de conclusiones de informe (`DocumentoGeneralEmbarque`).

### 1.2 Módulo Maestro: Catálogo de Conclusiones de Embarque
Mantenimiento administrativo de las conclusiones técnicas y comerciales predefinidas que los inspectores y supervisores pueden seleccionar al emitir los dictámenes finales de embarque, clasificadas por Formato de Inspección.

### Matriz de Capacidades

| Capacidad | Módulo | Descripción Técnica |
|---|---|---|
| **Listado Consolidado Paginado** | Embarque | Paginación Spring Boot (`Page<T>`) con filtros por Campaña, Instrucción, Fechas, Cliente, Estado y Buscador. La instrucción llega como objeto `InstruccionDetalle`. |
| **Búsqueda por Terna de Inspecciones** | Embarque | Endpoint `GET /buscar-por-inspecciones?idIngreso=X&idPre=Y&idFrio=Z` para sincronizar y abrir el modal con el documento general existente. |
| **Cabecera & Datos de Embarque** | Embarque | Consulta de datos maestros de la Instrucción (Booking, Contenedor, Variedades, Productor, Guías, Packing List). |
| **Inspección de Calidad (Doc Final)** | Calidad | Paletas evaluadas, temperatura de pulpa (°C), dictamen `estado_calidad` ("1"/"0"), autorización `conEmbarque` y evidencias fotográficas. |
| **Inspección de Frío (Doc Final & Nisira)** | Frío | Precintos, sensores, esquema visual de posiciones, cabecera extendida y registro de detalles de pallet con validación Nisira. |
| **Inspección de Seguridad (Doc Final)** | Seguridad | Estado del contenedor, lista de comentarios técnicos, dictamen y evidencias visuales. |
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
  codigo: string;          // "200" en éxito, "0" en error
  respuesta: string;       // Mensaje descriptivo o código de resultado
  data: T;                 // Payload
  cantidad: number | null; // Cantidad de elementos
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

export interface InstruccionDetalle {
  idInstruccionEmbarque: number;
  fechaEmicion: string;
  fechaCarga: string | null;
  nroOrden: string;        // Ej. "ORD-2025-0815" o "ASP010"
  observaciones: string | null;
  poNr: string | null;
  embarqueDirecto: string | null;
  comision: string | null;
  anexado: string | null;
  idFecha: string;         // Ej. "UV26"
  estadoPedido: boolean;
  estado: string;
}

export interface ClienteFinalCampana {
  idEntidad: number;
  razonSocial: string;
  direccion: string;
  contacto: string;
  email: string;
  telefono: string;
  fax: string | null;
  descAlternativa: string;
  estado: string;
}

export interface FiltrosInformeEmbarque {
  campana: string;                // Requerido (ej. "UV26")
  idInstruccionEmbarque?: number;
  fechaDesde?: string;            // "YYYY-MM-DD"
  fechaHasta?: string;            // "YYYY-MM-DD"
  idClienteFinal?: number;
  estadoGeneral?: string;         // "1" | "2" | "EMBARCADO"
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
  conEmbarque: string;            // "1" | "0" | "SI" | "NO"
  estadoProceso: string;          // "APROBADO" | "TERMINADO" | "EN PROCESO"
  estado: string;
}

export interface InspeccionPreEmbarqueRef {
  idInspeccionPreEmbarque: number;
  packingList?: string;
  nroContenedor?: string;
  fecha?: string;
  observacion?: string;
  estado?: string;
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
  descCorta: string;              // "APTO", "APROBADO", "CONFORME", "RECHAZADO"
  descEstadoCalidad: string;
  estado: string;
  fechaCreacion?: string;
  fechaModificacion?: string | null;
}

export interface InformeEmbarqueItem {
  variedades: string;
  instruccionEmbarque: InstruccionDetalle; // Objeto estructurado completo
  fecha: string;                          // "YYYY-MM-DD"
  contenedor: string;
  cliente: string;
  InspeccionIngresoContenedor?: InspeccionIngresoContenedorRef | null;
  InspeccionPreEmbarque?: InspeccionPreEmbarqueRef | null;
  InspeccionEmbarqueFrio?: InspeccionEmbarqueFrioRef | null;
  resultadoCalidad?: ResultadoCalidadRef | null;
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
// 5. MÓDULO FRÍO (DOC FINAL & DETALLE NISIRA)
// ==========================================

export interface SensorTermoregistro {
  tipo: string;                   // "DIGITAL", "ANALOGICO"
  codigo: string;
  ubicacionContenedor: string;
}

export interface PosicionEnContenedor {
  idPosicionEnContenedor: number;
  lado?: string;                  // "IZQUIERDA", "DERECHA"
  posicion?: number;              // 1 a 12
  descripcion?: string;           // "P1-IZQ", "P1-DER"
}

export interface InspeccionEmbarqueFrioDetalle {
  idInspeccionEmbarqueFrioDetalle: number;
  idReferenciaPaleta?: string;
  nroPalletReferencia: string;
  sensor: string;                 // "SI" | "NO" | "SENSOR_A"
  termoRegistro: string;
  posicionEnContenedor: PosicionEnContenedor;
  estado: string;
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

export interface InspeccionFrioHeader {
  idInspeccionEmbarqueFrio: number;
  campana: string;
  fecha: string;
  refContenedor: string;
  packinglistRef: string;
  observacion: string;
  instruccionEmbarque: InstruccionDetalle;
  resultadoCalidad: ResultadoCalidadRef;
  destino?: { idDestino: number; descDestino: string; descCorta: string; estado: string; };
  persona?: { idPersona: number; dniPersona: string; nombreCompleto: string; nombreSimplificado: string; urlFirma?: string; };
  entidad?: { idEntidad: number; razonSocial: string; direccion: string; contacto: string; email: string; telefono: string; };
  estado: string;
  numPallets: number;
}

export interface GuardarDetalleFrioPayload {
  idInspeccionEmbarqueFrioDetalle?: number | null;
  nroPalletReferencia: string;
  sensor?: string;
  termoRegistro?: string;
  posicionEnContenedor: {
    idPosicionEnContenedor: number;
  };
  estado: string;                 // "1" = Activo, "0" = Anulado
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
  instruccionEmbarque: InstruccionDetalle;
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

## 4. Página Principal: `InformeEmbarqueGeneralComponent`

Gestiona el listado consolidado, donde cada fila contiene `instruccionEmbarque` como objeto `InstruccionDetalle`. Al hacer clic en un registro, utiliza la terna de IDs de inspecciones para consultar si ya existe un `DocumentoGeneralEmbarque` creado mediante `/buscar-por-inspecciones`.

### Fragmento TypeScript
```typescript
abrirDetalle(item: InformeEmbarqueItem, tab: 'all' | 'seguridad' | 'calidad' | 'frio' = 'all'): void {
  this.embarqueSeleccionado.set(item);
  this.tabInicialModal.set(tab);

  // Buscar si ya existe documento general para esta terna de inspecciones
  const idIngreso = item.InspeccionIngresoContenedor?.idInspeccionIngresoContenedor;
  const idPre = item.InspeccionPreEmbarque?.idInspeccionPreEmbarque;
  const idFrio = item.InspeccionEmbarqueFrio?.idInspeccionEmbarqueFrio;

  if (idIngreso || idPre || idFrio) {
    this.embarqueService.buscarPorInspecciones(idIngreso, idPre, idFrio).subscribe({
      next: (docGeneral) => {
        this.documentoGeneralActivo.set(docGeneral);
        this.modalDetalleAbierto.set(true);
      },
      error: () => {
        this.documentoGeneralActivo.set(null);
        this.modalDetalleAbierto.set(true);
      }
    });
  } else {
    this.documentoGeneralActivo.set(null);
    this.modalDetalleAbierto.set(true);
  }
}
```

---

## 5. Módulo Frío: Detalle y Validación con Pallets de Nisira

El servicio de Frío incorpora la obtención de cabecera limpia (`GET /{id}`) y el guardado de detalles vinculados (`POST /{idInspeccion}/detalle`) validando que el número de pallet pertenezca a la orden de Nisira.

### Flujo de Guardado de Pallet en Frío
```typescript
guardarPalletEnFrio(idInspeccionFrio: number, payload: GuardarDetalleFrioPayload): void {
  this.frioService.guardarDetalle(idInspeccionFrio, payload).subscribe({
    next: (detalle) => {
      Swal.fire('¡Pallet Registrado!', 'Pallet y sensor asociados al contenedor.', 'success');
      this.cargarDocFinalFrio();
    },
    error: (err) => {
      // El backend devuelve error 400 con mensaje si el pallet no existe en Nisira
      Swal.fire('Error de Validación', err.error?.respuesta || 'El pallet no existe en Nisira para esta orden.', 'error');
    }
  });
}
```

---

## 6. Servicios — Contratos HTTP Angular 21

### 6.1 `DocumentoGeneralEmbarqueService`
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

  buscarPorInspecciones(idIngreso?: number, idPre?: number, idFrio?: number): Observable<DocumentoGeneralEmbarque> {
    let params = new HttpParams();
    if (idIngreso) params = params.set('idIngreso', idIngreso);
    if (idPre) params = params.set('idPre', idPre);
    if (idFrio) params = params.set('idFrio', idFrio);

    return this.http.get<ApiResponseProvider<DocumentoGeneralEmbarque>>(`${this.baseUrl}/buscar-por-inspecciones`, { params })
      .pipe(map(res => res.data));
  }

  descargarPdfConsolidado(instruccion: string): void {
    window.open(`${this.baseUrl}/exportar-pdf?instruccion=${encodeURIComponent(instruccion)}`, '_blank');
  }
}
```

### 6.2 `CatalogosProduccionService`
```typescript
@Injectable({ providedIn: 'root' })
export class CatalogosProduccionService {
  private readonly http = inject(HttpClient);

  listarCampanasActivas(): Observable<CampanaActiva[]> {
    return this.http.get<ResponseStandardProvider<CampanaActiva[]>>('/Produccion/General/GET/ListCampanasActiva')
      .pipe(map(res => res.data));
  }

  listarInstruccionesPorCampana(campana: string): Observable<InstruccionDetalle[]> {
    const params = new HttpParams().set('campana', campana);
    return this.http.get<ApiResponseProvider<InstruccionDetalle[]>>('/produccion/documento-general-embarque/instrucciones-por-campana', { params })
      .pipe(map(res => res.data));
  }

  listarClientesPorCampana(campana: string): Observable<ClienteFinalCampana[]> {
    const params = new HttpParams().set('campana', campana);
    return this.http.get<ApiResponseProvider<ClienteFinalCampana[]>>('/produccion/documento-general-embarque/clientes-finales-por-campana', { params })
      .pipe(map(res => res.data));
  }
}
```

### 6.3 `InspeccionFrioService`
```typescript
@Injectable({ providedIn: 'root' })
export class InspeccionFrioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/frio/inspeccion-embarque';

  obtenerDocFinal(idInspeccion: number): Observable<InspeccionEmbarqueFrioDocFinal> {
    return this.http.get<ApiResponseProvider<InspeccionEmbarqueFrioDocFinal>>(`${this.baseUrl}/${idInspeccion}/doc-final`)
      .pipe(map(res => res.data));
  }

  obtenerHeaderPorId(idInspeccion: number): Observable<InspeccionFrioHeader> {
    return this.http.get<ApiResponseProvider<InspeccionFrioHeader>>(`${this.baseUrl}/${idInspeccion}`)
      .pipe(map(res => res.data));
  }

  guardarDetalle(idInspeccion: number, payload: GuardarDetalleFrioPayload): Observable<InspeccionEmbarqueFrioDetalle> {
    return this.http.post<ApiResponseProvider<InspeccionEmbarqueFrioDetalle>>(`${this.baseUrl}/${idInspeccion}/detalle`, payload)
      .pipe(map(res => res.data));
  }

  actualizarDocFinal(payload: ActualizarFrioDocFinalPayload): Observable<InspeccionEmbarqueFrioDocFinal> {
    return this.http.put<ApiResponseProvider<InspeccionEmbarqueFrioDocFinal>>(`${this.baseUrl}/doc-final`, payload)
      .pipe(map(res => res.data));
  }

  subirEvidenciasMultipart(idInspeccion: number, formData: FormData): Observable<void> {
    return this.http.post<ApiResponseProvider<void>>(`${this.baseUrl}/${idInspeccion}/evidencias-visuales`, formData)
      .pipe(map(() => void 0));
  }
}
```

---

## 7. Matriz Consolidada de Endpoints API REST (V2)

| # | Módulo | Método | URL | Descripción | Request / Params | Response Data |
|---|---|---|---|---|---|---|
| 1 | Producción | `GET` | `/produccion/documento-general-embarque/listado` | Listado general paginado | Query `FiltrosInformeEmbarque` | `PageSpring<InformeEmbarqueItem>` |
| 2 | Producción | `GET` | `/produccion/documento-general-embarque/reporte-instruccion/{id}` | Datos maestros de embarque | Path `idInstruccionEmbarque` | `ReporteDatosInstruccion[]` |
| 3 | Producción | `GET` | `/produccion/documento-general-embarque/instrucciones-por-campana` | Autocomplete instrucciones | Query `campana` | `InstruccionDetalle[]` |
| 4 | Producción | `GET` | `/produccion/documento-general-embarque/clientes-finales-por-campana` | Autocomplete clientes | Query `campana` | `ClienteFinalCampana[]` |
| 5 | Producción | `POST` | `/produccion/documento-general-embarque/guardar` | Guardar doc general + conclusiones | JSON `GuardarDocumentoGeneralEmbarquePayload` | `DocumentoGeneralEmbarque` |
| 6 | Producción | `GET` | `/produccion/documento-general-embarque/{id}` | Obtener doc general por ID | Path `id` | `DocumentoGeneralEmbarque` |
| 7 | Producción | `GET` | `/produccion/documento-general-embarque/buscar-por-inspecciones` | Buscar doc general por 3 inspecciones | Query `idIngreso`, `idPre`, `idFrio` | `DocumentoGeneralEmbarque` |
| 8 | Conclusiones | `GET` | `/produccion/conclusion-informe-final` | Listar todas las conclusiones | - | `ConclusionInformeFinal[]` |
| 9 | Conclusiones | `GET` | `/produccion/conclusion-informe-final/activos` | Listar conclusiones activas | Query `idFormatoInspeccion` | `ConclusionInformeFinal[]` |
| 10 | Conclusiones | `GET` | `/produccion/conclusion-informe-final/{id}` | Obtener conclusión por ID | Path `id` | `ConclusionInformeFinal` |
| 11 | Conclusiones | `POST` | `/produccion/conclusion-informe-final` | Crear nueva conclusión | JSON `GuardarConclusionPayload` | `ConclusionInformeFinal` |
| 12 | Conclusiones | `PUT` | `/produccion/conclusion-informe-final/{id}` | Actualizar conclusión | Path `id` + JSON `GuardarConclusionPayload` | `ConclusionInformeFinal` |
| 13 | Conclusiones | `PATCH` | `/produccion/conclusion-informe-final/{id}/anular` | Anulación lógica de conclusión | Path `id` | `null` |
| 14 | Calidad | `GET` | `/calidad/InspeccionPreEmbarque/{id}/doc-final` | Documento final Calidad | Path `idInspeccion` | `InspeccionPreEmbarqueDocFinal` |
| 15 | Calidad | `PUT` | `/calidad/InspeccionPreEmbarque/doc-final` | Actualizar doc final Calidad | JSON `ActualizarCalidadDocFinalPayload` | `InspeccionPreEmbarqueDocFinal` |
| 16 | Calidad | `POST` | `/calidad/InspeccionPreEmbarque/{id}/evidencias-visuales-por-tipo` | Subir evidencias Calidad | Multipart FormData | `null` |
| 17 | Frío | `GET` | `/frio/inspeccion-embarque/{id}/doc-final` | Documento final Frío | Path `idInspeccion` | `InspeccionEmbarqueFrioDocFinal` |
| 18 | Frío | `GET` | `/frio/inspeccion-embarque/{id}` | Cabecera y datos de inspección Frío | Path `id` | `InspeccionFrioHeader` |
| 19 | Frío | `POST` | `/frio/inspeccion-embarque/{idInspeccion}/detalle` | Registrar pallet con validación Nisira | Path `idInspeccion` + JSON `GuardarDetalleFrioPayload` | `InspeccionEmbarqueFrioDetalle` |
| 20 | Frío | `PUT` | `/frio/inspeccion-embarque/doc-final` | Actualizar doc final Frío | JSON `ActualizarFrioDocFinalPayload` | `InspeccionEmbarqueFrioDocFinal` |
| 21 | Frío | `POST` | `/frio/inspeccion-embarque/{id}/evidencias-visuales` | Subir evidencias Frío | Multipart FormData | `null` |
| 22 | Seguridad | `GET` | `/SeguridadPatrimonial/InspeccionIngresoContenedor/{id}/doc-final` | Documento final Seguridad | Path `idInspeccion` | `InspeccionIngresoContenedorDocFinal` |
| 23 | Seguridad | `PUT` | `/SeguridadPatrimonial/InspeccionIngresoContenedor/doc-final` | Actualizar doc final Seguridad | JSON `ActualizarSeguridadDocFinalPayload` | `InspeccionIngresoContenedorDocFinal` |
| 24 | Seguridad | `POST` | `/SeguridadPatrimonial/InspeccionIngresoContenedor/{id}/evidencias-visuales-por-tipo` | Subir evidencias Seguridad | Multipart FormData | `null` |
| 25 | Catálogos | `GET` | `/Produccion/General/GET/ListCampanasActiva` | Catálogo campañas activas | - | `CampanaActiva[]` |

---

## 8. Checklist de Implementación Angular 21 (V2)

### Modelos y Servicios
- [ ] Crear `informe-embarque.model.ts` con todos los modelos V2 (incluyendo `InstruccionDetalle`, `InspeccionFrioHeader`, `GuardarDetalleFrioPayload`, `FormatoInspeccion`, `ConclusionInformeFinal`)
- [ ] Implementar `DocumentoGeneralEmbarqueService` con `buscarPorInspecciones` y `guardarDocumentoGeneral`
- [ ] Implementar `ConclusionesInformeService` con CRUD completo y anulación lógica
- [ ] Implementar `InspeccionFrioService` con `obtenerHeaderPorId` y `guardarDetalle` (validación Nisira)
- [ ] Implementar `InspeccionCalidadService` y `InspeccionSeguridadService` con subidas multipart
- [ ] Implementar `CatalogosProduccionService`

### Vistas y Componentes
- [ ] `InformeEmbarqueGeneralComponent` (Listado y apertura de modal con búsqueda por inspecciones)
- [ ] `CatalogoConclusionesComponent` (Página de mantenimiento de conclusiones)
- [ ] `ConclusionFormModalComponent` con Two-way binding `model<boolean>()`
- [ ] `ConclusionesSectionComponent` (Checklist activo en modal de embarque)
- [ ] `FrioDocFinalSectionComponent` con validación de pallets de Nisira
- [ ] `InformesTableComponent` adaptado para leer `instruccionEmbarque.nroOrden`
- [ ] `InformesMobileCardsComponent` (Mobile-First con `border-l-4`)

### Design System & Zoneless
- [ ] 100% Kendo SVG Icons (Cero Boxicons)
- [ ] `provideExperimentalZonelessChangeDetection()` activo
- [ ] Uso estricto de `computed()` para filtrados y promedios
- [ ] Validar formato de respuestas con envoltorio `ApiResponseProvider` (campo `respuesta`)
