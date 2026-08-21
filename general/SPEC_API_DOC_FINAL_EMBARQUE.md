# Especificación Técnica de APIs para Frontend: Documento General de Embarque y Documentos Finales V2

Especificación técnica de integración HTTP y contratos de datos actualizada para los módulos de **Documento General de Embarque**, **Conclusiones de Informe Final**, **Inspección Pre-Embarque (Calidad)**, **Inspección de Embarque en Frío (Frío)**, **Inspección de Ingreso de Contenedor (Seguridad Patrimonial)** y **Catálogo de Campañas**.

---

## 1. Convenciones Globales y Envoltorios de Respuesta

### 1.1 Envoltorio Estándar Moderno (`ApiResponseProvider<T>`)
Aplica a los módulos de Producción, Calidad, Frío y Seguridad Patrimonial:

```typescript
{
  "codigo": string,       // Código de estado ("200" en éxito, "0" en error)
  "respuesta": string,    // Mensaje descriptivo de la operación o código de error
  "data": T,              // Payload con la entidad, listado o página (null en caso de error)
  "cantidad": number,     // Cantidad de elementos devueltos
  "error": string | null  // Detalle técnico del error en caso de fallo (null en éxito)
}
```

### 1.2 Envoltorio Estándar Legacy (`ResponseStandardProvider<T>`)
Aplica a los endpoints de catálogos generales (`/Produccion/General/GET/*`):

```typescript
{
  "codigo": string,       // "0" para éxito
  "respuesta": string,    // Mensaje de resultado ("Busqueda exitosa")
  "data": T,              // Payload de datos
  "cantidad": string,     // Cantidad de registros en formato string
  "error": string | null  // Detalle de excepción
}
```

### 1.3 Autenticación y Paginación
- **Autenticación**: Cabecera `Authorization: Bearer <token>` obligatoria en todas las peticiones.
- **Paginación en Spring (`Page<T>`)**:
  - `pagina`: 0-indexed (la primera página es `0`).
  - `size`: cantidad de registros por página (default `10`).
  - **Paginación Invertida**: El listado general devuelve los registros más recientes primero.

---

## 2. Módulo 1: Producción - Documento General de Embarque

**Ruta Base**: `/produccion/documento-general-embarque`

### 2.1 Listado de Informe General de Embarque
- **Método**: `GET`
- **Ruta**: `/produccion/documento-general-embarque/listado`
- **Descripción**: Ejecuta el SP `PRODUCCION.listado_informe_embarque_general` y devuelve el listado consolidado y paginado de embarques, incluyendo la instrucción de embarque como objeto completo y las 3 inspecciones asociadas.
- **Cabeceras**: `Authorization: Bearer <token>`, `Accept: application/json`

#### Parámetros Query
| Parámetro | Tipo | Requerido | Default | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `campana` | `string` | **Sí** | - | Código de campaña activa | `"UV26"` |
| `idInstruccionEmbarque` | `integer` | No | - | ID de la instrucción de embarque | `815` |
| `fechaDesde` | `string` | No | - | Fecha inicio (`YYYY-MM-DD`) | `"2025-11-01"` |
| `fechaHasta` | `string` | No | - | Fecha fin (`YYYY-MM-DD`) | `"2025-11-30"` |
| `idClienteFinal` | `integer` | No | - | ID de la entidad cliente final | `42` |
| `estadoGeneral` | `string` | No | - | Estado del embarque | `"2"` |
| `buscador` | `string` | No | - | Filtro rápido (Instrucción / Contenedor / Booking) | `"MEDU9638447"` |
| `pagina` | `integer` | No | `0` | Número de página (0-indexed) | `0` |
| `size` | `integer` | No | `10` | Tamaño de página | `10` |

#### Respuesta Exitosa (HTTP 200)
```json
{
  "codigo": "200",
  "mensaje": "Listado general de embarque obtenido correctamente.",
  "data": {
    "content": [
      {
        "variedades": "AUTUMN CRISP",
        "instruccionEmbarque": {
          "idInstruccionEmbarque": 815,
          "fechaEmicion": "2025-11-20 00:00:00",
          "fechaCarga": "2025-11-21 00:00:00",
          "nroOrden": "ORD-2025-0815",
          "observaciones": "Sin observaciones",
          "poNr": "PO-9921",
          "embarqueDirecto": "SI",
          "comision": "0",
          "anexado": "NO",
          "idFecha": "2025",
          "estadoPedido": true,
          "estado": "1"
        },
        "fecha": "2025-11-21",
        "contenedor": "MEDU9638447",
        "cliente": "Sociedad Comercial El Espino Ltda",
        "InspeccionIngresoContenedor": {
          "idInspeccionIngresoContenedor": 1,
          "campana": "UV26",
          "conEmbarque": "SI",
          "estadoProceso": "APROBADO",
          "estado": "1"
        },
        "InspeccionPreEmbarque": null,
        "InspeccionEmbarqueFrio": {
          "idInspeccionEmbarqueFrio": 6,
          "campana": "UV26",
          "fecha": "2025-11-21",
          "refContenedor": "MEDU9638447",
          "packinglistRef": "PL-815",
          "observacion": "Conforme",
          "estado": "1"
        },
        "resultadoCalidad": {
          "idResultadoCalidad": 30094,
          "descCorta": "APROBADO",
          "descEstadoCalidad": "Aprobado para Exportación",
          "estado": "1"
        },
        "estado": "2"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "sort": { "empty": true, "sorted": false, "unsorted": true },
      "offset": 0,
      "paged": true,
      "unpaged": false
    },
    "totalPages": 1,
    "totalElements": 1,
    "last": true,
    "size": 10,
    "number": 0,
    "sort": { "empty": true, "sorted": false, "unsorted": true },
    "numberOfElements": 1,
    "first": true,
    "empty": false
  },
  "cantidad": 1,
  "error": null
}
```

---

### 2.2 Reporte General de Datos de Embarque por ID de Instrucción
- **Método**: `GET`
- **Ruta**: `/produccion/documento-general-embarque/reporte-instruccion/{idInstruccionEmbarque}`
- **Descripción**: Ejecuta el SP `PRODUCCION.reporte_informe_general_embarque_data_por_idInstruccion` y devuelve la relación de datos de packing, booking, contenedor y productor.

#### Parámetros Path
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `idInstruccionEmbarque` | `integer` | **Sí** | ID de la instrucción de embarque | `815` |

#### Respuesta Exitosa (HTTP 200)
```json
{
  "codigo": "200",
  "mensaje": "Reporte de embarque obtenido correctamente.",
  "data": [
    {
      "variedades": "AUTUMN CRISP",
      "instruccionEmbarque": "ORD-2025-0815",
      "contenedor": "MEDU9638447",
      "booking": "BKG-992102",
      "clienteFinal": "Sociedad Comercial El Espino Ltda",
      "productor": "AGROINDUSTRIA SAFCO PERU S.A.",
      "programas": "USA PREMIUM PROGRAM",
      "fechaEmbarque": "2025-11-21",
      "guiaRemision": "T001-0004921",
      "packingListDoc": "PL-815"
    }
  ],
  "cantidad": 1,
  "error": null
}
```

---

### 2.3 Listado de Instrucciones de Embarque por Campaña
- **Método**: `GET`
- **Ruta**: `/produccion/documento-general-embarque/instrucciones-por-campana`
- **Descripción**: Ejecuta el SP `PRODUCCION.listado_instruccionesEmbarques_por_campana` para alimentar los filtros y autocompletados.

#### Parámetros Query
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `campana` | `string` | **Sí** | Código de la campaña | `"UV26"` |

#### Respuesta Exitosa (HTTP 200)
```json
{
  "codigo": "200",
  "mensaje": "Listado de instrucciones de embarque por campaña obtenido correctamente.",
  "data": [
    {
      "idInstruccionEmbarque": 815,
      "fechaEmicion": "2025-11-20 00:00:00",
      "fechaCarga": "2025-11-21 00:00:00",
      "nroOrden": "ORD-2025-0815",
      "observaciones": "Sin observaciones",
      "poNr": "PO-9921",
      "embarqueDirecto": "SI",
      "comision": "0",
      "anexado": "NO",
      "idFecha": "2025",
      "estadoPedido": true,
      "estado": "1"
    }
  ],
  "cantidad": 1,
  "error": null
}
```

---

### 2.4 Listado de Clientes Finales por Campaña
- **Método**: `GET`
- **Ruta**: `/produccion/documento-general-embarque/clientes-finales-por-campana`
- **Descripción**: Ejecuta el SP `PRODUCCION.listado_idClienteFinal_de_instruccionesEmbarques_por_campana` para alimentar el filtro de clientes.

#### Parámetros Query
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `campana` | `string` | **Sí** | Código de campaña | `"UV26"` |

#### Respuesta Exitosa (HTTP 200)
```json
{
  "codigo": "200",
  "mensaje": "Listado de clientes finales por campaña obtenido correctamente.",
  "data": [
    {
      "idEntidad": 42,
      "razonSocial": "Sociedad Comercial El Espino Ltda",
      "direccion": "Santiago, Chile",
      "contacto": "John Doe",
      "email": "import@elespino.cl",
      "telefono": "+56 2 2555 0199",
      "fax": null,
      "descAlternativa": "EL ESPINO",
      "estado": "1"
    }
  ],
  "cantidad": 1,
  "error": null
}
```

---

### 2.5 Guardar o Actualizar Documento General de Embarque
- **Método**: `POST`
- **Ruta**: `/produccion/documento-general-embarque/guardar`
- **Descripción**: Crea o actualiza un documento general de embarque, asociando de forma dinámica las conclusiones de informe final y realizando una anulación lógica (estado = "0") de las conclusiones no incluidas en la lista provista.
- **Cabeceras**: `Content-Type: application/json`, `Authorization: Bearer <token>`

#### Cuerpo de la Petición (Request Body)
| Atributo | Tipo | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `idDocumentoGeneralEmbarque` | `number` | No | ID del documento general (enviar `null` para registrar uno nuevo, o el ID para actualizar) | `null` |
| `observacion` | `string` | No | Notas u observaciones generales | `"Contenedor verificado sin novedades térmicas"` |
| `instruccionEmbarque` | `object` | **Sí** | Instrucción de embarque asociada | `{ "idInstruccionEmbarque": 815 }` |
| `inspeccionIngresoContenedor` | `object` | No | Inspección de ingreso de contenedor | `{ "idInspeccionIngresoContenedor": 150 }` |
| `inspeccionPreEmbarque` | `object` | No | Inspección de calidad pre-embarque | `{ "idInspeccionPreEmbarque": 320 }` |
| `inspeccionEmbarqueFrio` | `object` | No | Inspección de frío | `{ "idInspeccionEmbarqueFrio": 410 }` |
| `resultadoCalidad` | `object` | No | Resultado final de calidad | `{ "idResultadoCalidad": 1 }` |
| `conclusiones` | `array<object>` | No | Lista de conclusiones asociadas | `[ { "idConclusionDeInformeFinal": 1 } ]` |

##### Ejemplo de Request Body:
```json
{
  "idDocumentoGeneralEmbarque": null,
  "observacion": "Contenedor verificado sin novedades térmicas",
  "instruccionEmbarque": {
    "idInstruccionEmbarque": 815
  },
  "inspeccionIngresoContenedor": {
    "idInspeccionIngresoContenedor": 1
  },
  "inspeccionPreEmbarque": {
    "idInspeccionPreEmbarque": 1
  },
  "inspeccionEmbarqueFrio": {
    "idInspeccionEmbarqueFrio": 1
  },
  "resultadoCalidad": {
    "idResultadoCalidad": 1
  },
  "conclusiones": [
    {
      "idConclusionDeInformeFinal": 1
    },
    {
      "idConclusionDeInformeFinal": 2
    }
  ]
}
```

#### Respuesta Exitosa (HTTP 200)
```json
{
  "codigo": "200",
  "mensaje": "Documento general de embarque guardado correctamente.",
  "data": {
    "id": 5,
    "observacion": "Contenedor verificado sin novedades térmicas",
    "instruccionEmbarque": {
      "idInstruccionEmbarque": 815,
      "fechaEmicion": "2025-11-20 00:00:00",
      "fechaCarga": "2025-11-21 00:00:00",
      "nroOrden": "ORD-2025-0815",
      "observaciones": "Sin observaciones",
      "poNr": "PO-9921",
      "embarqueDirecto": "SI",
      "comision": "0",
      "anexado": "NO",
      "idFecha": "2025",
      "estadoPedido": true,
      "estado": "1"
    },
    "resultadoCalidad": {
      "idResultadoCalidad": 1,
      "descCorta": "APTO",
      "descEstadoCalidad": "Aprobado para Embarque",
      "estado": "1"
    },
    "inspeccionIngresoContenedor": {
      "idInspeccionIngresoContenedor": 1,
      "campana": "UV26",
      "conEmbarque": "SI",
      "estadoProceso": "APROBADO",
      "estado": "1"
    },
    "inspeccionPreEmbarque": {
      "idInspeccionPreEmbarque": 1,
      "packingList": "PL-8890",
      "nroContenedor": "MSKU9876543",
      "fecha": "2026-02-14",
      "observacion": "Sin observaciones de empaque",
      "estado": "1"
    },
    "inspeccionEmbarqueFrio": {
      "idInspeccionEmbarqueFrio": 1,
      "campana": "UV26",
      "fecha": "2026-02-14",
      "refContenedor": "MSKU9876543",
      "packinglistRef": "PL-8890",
      "observacion": "Temperatura óptima de despacho",
      "estado": "1"
    },
    "detalles": [
      {
        "id": 12,
        "conclusionDeInformeFinal": {
          "id": 1,
          "descripcion": "La fruta cumple con los estándares comerciales de exportación.",
          "estado": "1",
          "fechaCreacion": "2026-08-14 15:10:00",
          "fechaModificacion": null
        },
        "estado": "1",
        "fechaCreacion": "2026-08-14 16:03:00",
        "fechaModificacion": null
      }
    ],
    "estado": "1",
    "fechaCreacion": "2026-08-14 16:03:00",
    "fechaModificacion": null
  },
  "cantidad": 1,
  "error": null
}
```

---

### 2.6 Obtener Documento General de Embarque por ID
- **Método**: `GET`
- **Ruta**: `/produccion/documento-general-embarque/{id}`
- **Descripción**: Obtiene los datos detallados de un Documento General de Embarque por su identificador.
- **Cabeceras**: `Authorization: Bearer <token>`, `Accept: application/json`

#### Parámetros Path
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `number` | **Sí** | ID del documento general de embarque | `5` |

#### Respuesta Exitosa (HTTP 200)
Retorna la estructura detallada del `DocumentoGeneralEmbarqueResponseDTO` (idéntica a la sección 2.5).

---

### 2.7 Buscar Documento General por sus 3 Inspecciones
- **Método**: `GET`
- **Ruta**: `/produccion/documento-general-embarque/buscar-por-inspecciones`
- **Descripción**: Busca y devuelve el documento general de embarque que coincida exactamente con los IDs de las 3 inspecciones asociadas provistas.
- **Cabeceras**: `Authorization: Bearer <token>`, `Accept: application/json`

#### Parámetros Query
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `idIngreso` | `number` | No | ID de la inspección de ingreso | `1` |
| `idPre` | `number` | No | ID de la inspección pre-embarque | `1` |
| `idFrio` | `number` | No | ID de la inspección de frío | `1` |

##### Ejemplo de Petición (Request URL):
`GET /produccion/documento-general-embarque/buscar-por-inspecciones?idIngreso=1&idPre=1&idFrio=1`

#### Respuesta Exitosa (HTTP 200)
Retorna la estructura detallada de tipo `DocumentoGeneralEmbarqueResponseDTO` (idéntica a la sección 2.5).

#### Respuestas de Error
- **404 NOT FOUND**: Si no existe ningún documento general que asocie exactamente a las 3 inspecciones provistas.
  ```json
  {
    "codigo": "0",
    "respuesta": "RECORD_NOT_FOUND",
    "data": null,
    "cantidad": null,
    "error": "No se encontró ningún documento general de embarque con las inspecciones indicadas."
  }
  ```

---

## 3. Módulo 2: Calidad - Inspección Pre-Embarque (Doc Final y Evidencias)

**Ruta Base**: `/calidad/InspeccionPreEmbarque`

### 3.1 Obtener Documento Final de Calidad
- **Método**: `GET`
- **Ruta**: `/calidad/InspeccionPreEmbarque/{id}/doc-final`
- **Descripción**: Retorna la cabecera del documento final de calidad, los detalles de paletas inspeccionadas y el consolidado de evidencias fotográficas agrupadas por tipo.

#### Parámetros Path
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `integer (long)` | **Sí** | ID de la inspección pre-embarque | `320` |

#### Respuesta Exitosa (HTTP 200)
```json
{
  "codigo": "200",
  "mensaje": "Documento final obtenido con éxito",
  "data": {
    "idInspeccionPreEmbarque": 320,
    "estado_calidad": "1",
    "conEmbarque": "1",
    "observacion": "Fruta cumple con los estándares de exportación",
    "inspeccionPreEmbarqueDetalles": [
      {
        "idInspeccionPreEmbarqueDetalle": 701,
        "nroPallet": "PAL-001",
        "idRegistroPaleta": "RP-9011",
        "cantidadRequisitos": 15,
        "cantidadIncidencias": 0,
        "cliente": "Sociedad Comercial El Espino Ltda",
        "productor": "AGROINDUSTRIA SAFCO PERU S.A.",
        "variedad": "AUTUMN CRISP",
        "tempMuestra": "0.8",
        "hora": "10:30",
        "estadoFinal": "APROBADO",
        "estado": "1"
      }
    ],
    "evidenciasVisuales": [
      {
        "idTipoEvidenciaVisualGeneral": 1,
        "nombreTipoEvidencia": "EVIDENCIA DE SELLADO Y PALETAS",
        "cantidad": "1",
        "detallePreEmbarqueEvidenciaVisual": [
          {
            "idDetalleEvidenciaVisual": 801,
            "url": "https://storage.safcoperu.com/calidad/evidencia_801.jpg",
            "nombreArchivo": "evidencia_paleta_1.jpg",
            "posicion": 1
          }
        ]
      }
    ]
  },
  "cantidad": 1,
  "error": null
}
```

---

### 3.2 Actualizar Documento Final de Calidad
- **Método**: `PUT`
- **Ruta**: `/calidad/InspeccionPreEmbarque/doc-final`
- **Descripción**: Actualiza el indicador de embarque (`conEmbarque`), la observación y el estado de calidad (`estado_calidad`).
- **Cabeceras**: `Content-Type: application/json`

#### Estructura del Request Body
| Atributo | Tipo | Requerido | Restricciones | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `idInspeccionPreEmbarque` | `integer (long)` | **Sí** | Obligatorio | ID de la inspección pre-embarque |
| `conEmbarque` | `string` | No | Máx. 1 caracter (`"1"` o `"0"`) | Indica si autoriza embarque |
| `observacion` | `string` | No | - | Observación técnica |
| `estado_calidad` | `string` | No | Máx. 1 caracter (`"1"` = Aprobado, `"0"` = Rechazado) | Estado de calidad |

#### Ejemplo de Request Body
```json
{
  "idInspeccionPreEmbarque": 320,
  "conEmbarque": "1",
  "observacion": "Aprobado para despacho comercial.",
  "estado_calidad": "1"
}
```

#### Respuesta Exitosa (HTTP 200)
Retorna la entidad `InspeccionPreEmbarqueDocFinalResponseDTO` actualizada con estructura idéntica al punto 3.1.

---

### 3.3 Subir Evidencias Visuales de Calidad
- **Método**: `POST`
- **Ruta**: `/calidad/InspeccionPreEmbarque/{idInspeccion}/evidencias-visuales-por-tipo`
- **Descripción**: Sincroniza listas de imágenes por tipo de evidencia visual mediante `multipart/form-data`.
- **Cabeceras**: `Content-Type: multipart/form-data`

#### Parámetros Path y Form-Data
| Parámetro | Ubicación | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `idInspeccion` | Path | `integer (long)` | **Sí** | ID de la inspección pre-embarque |
| `idTiposEvidencia` | Form Field | `array<number>` | **Sí** | Lista de IDs de tipos de evidencia |
| `grupos[i]` | Form File | `binary[]` | No | Archivos de imágenes nuevos para el índice `i` |
| `gruposIdImagenes[i]` | Form Field | `string` | No | IDs existentes a mantener para el índice `i` (ej. `"801,null"`) |

#### Respuesta Exitosa (HTTP 200)
```json
{
  "codigo": "200",
  "mensaje": "Evidencias visuales procesadas correctamente.",
  "data": null,
  "cantidad": 0,
  "error": null
}
```

---

## 4. Módulo 3: Frío - Inspección Embarque Frío (Doc Final y Evidencias)

**Ruta Base**: `/frio/inspeccion-embarque`

### 4.1 Obtener Documento Final de Frío
- **Método**: `GET`
- **Ruta**: `/frio/inspeccion-embarque/{id}/doc-final`
- **Descripción**: Retorna la información de precintos, sensores de termoregistro, posiciones de paletas dentro del contenedor y evidencias visuales.

#### Parámetros Path
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `integer (long)` | **Sí** | ID de la inspección de embarque en frío | `410` |

#### Respuesta Exitosa (HTTP 200)
```json
{
  "codigo": "200",
  "mensaje": "Documento final de frío obtenido con éxito",
  "data": {
    "idInspeccionEmbarqueFrio": 410,
    "conEmbarque": "1",
    "precintoPacking": "PK-55102",
    "precintoSenasa": "SEN-88219",
    "precintoLinea": "LIN-00192",
    "sensoresTermoregistros": [
      {
        "tipo": "DIGITAL",
        "codigo": "TR-90412",
        "ubicacionContenedor": "PALETA 01 - FONDO DERECHA"
      }
    ],
    "resultadoCalidad": {
      "idResultadoCalidad": 1,
      "descCorta": "APTO",
      "descEstadoCalidad": "Aprobado para Despacho Frío",
      "estado": "1"
    },
    "inspeccionEmbarqueFrioDetalles": [
      {
        "idInspeccionEmbarqueFrioDetalle": 601,
        "idReferenciaPaleta": "RP-9011",
        "nroPalletReferencia": "PAL-001",
        "sensor": "SI",
        "termoRegistro": "TR-90412",
        "contenedorPosicion": {
          "idPosicionContenedor": 1,
          "descripcion": "P1-IZQ"
        }
      }
    ],
    "evidenciasVisuales": [
      {
        "idTipoEvidenciaVisualGeneral": 3,
        "nombreTipoEvidencia": "PRESCINTOS Y SENSORES",
        "cantidad": "1",
        "evidenciaVisualEmbarqueFrio": [
          {
            "idDetalleEvidenciaVisual": 910,
            "url": "https://storage.safcoperu.com/frio/precinto_910.jpg",
            "nombreArchivo": "precinto_senasa.jpg"
          }
        ]
      }
    ]
  },
  "cantidad": 1,
  "error": null
}
```

---

### 4.2 Actualizar Documento Final de Frío
- **Método**: `PUT`
- **Ruta**: `/frio/inspeccion-embarque/doc-final`
- **Descripción**: Actualiza el indicador `conEmbarque` y el `idResultadoCalidad` asignado a la inspección de frío.
- **Cabeceras**: `Content-Type: application/json`

#### Estructura del Request Body
| Atributo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `idInspeccionEmbarqueFrio` | `integer (long)` | **Sí** | ID de la inspección de frío |
| `conEmbarque` | `string` | No | `"1"` (Autorizado) / `"0"` (No autorizado) |
| `resultadoCalidad` | `object` | No | Objeto contenedor |
| `resultadoCalidad.idResultadoCalidad` | `integer (long)` | No | ID del catálogo de resultado de calidad |

#### Ejemplo de Request Body
```json
{
  "idInspeccionEmbarqueFrio": 410,
  "conEmbarque": "1",
  "resultadoCalidad": {
    "idResultadoCalidad": 1
  }
}
```

#### Respuesta Exitosa (HTTP 200)
Retorna la entidad `InspeccionEmbarqueFrioDocFinalResponseDTO` actualizada con estructura idéntica al punto 4.1.

---

### 4.3 Subir Evidencias Visuales de Frío
- **Método**: `POST`
- **Ruta**: `/frio/inspeccion-embarque/{idInspeccion}/evidencias-visuales`
- **Descripción**: Sincroniza fotos de precintos, sensores y termoregistro mediante `multipart/form-data`.
- **Cabeceras**: `Content-Type: multipart/form-data`

#### Parámetros Path y Form-Data
| Parámetro | Ubicación | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `idInspeccion` | Path | `integer (long)` | **Sí** | ID de la inspección de frío |
| `idTiposEvidencia` | Form Field | `array<number>` | **Sí** | Lista de IDs de tipos de evidencia |
| `grupos[i]` | Form File | `binary[]` | No | Archivos de imágenes nuevos |
| `gruposIdImagenes[i]` | Form Field | `string` | No | IDs de imágenes existentes a conservar |

#### Respuesta Exitosa (HTTP 200)
```json
{
  "codigo": "200",
  "mensaje": "Evidencias visuales procesadas correctamente.",
  "data": null,
  "cantidad": 0,
  "error": null
}
```

---

### 4.4 Buscar Inspección por ID
- **Método**: `GET`
- **Ruta**: `/frio/inspeccion-embarque/{id}`
- **Descripción**: Obtiene los detalles de una inspección por su ID sin palets ni evidencias.
- **Cabeceras**: `Authorization: Bearer <token>`, `Accept: application/json`

#### Parámetros Path
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `integer (long)` | **Sí** | ID de la inspección de embarque en frío | `24` |

#### Respuesta Exitosa (HTTP 200)
```json
{
  "codigo": "200",
  "mensaje": "Búsqueda exitosa",
  "data": {
    "idInspeccionEmbarqueFrio": 24,
    "campana": "UV26",
    "fecha": "2025-12-15",
    "refContenedor": "MEDU9638447",
    "packinglistRef": "PL-815",
    "observacion": "Observaciones de la inspección",
    "instruccionEmbarque": {
      "idInstruccionEmbarque": 815,
      "fechaEmicion": "2025-12-15 00:00:00",
      "fechaCarga": null,
      "nroOrden": "ASP010",
      "observaciones": null,
      "poNr": null,
      "embarqueDirecto": null,
      "comision": null,
      "anexado": "1",
      "idFecha": "UV26",
      "estadoPedido": true,
      "estado": "1"
    },
    "resultadoCalidad": {
      "idResultadoCalidad": 30094,
      "descEstadoCalidad": "CONFORME",
      "descCorta": "CON",
      "estado": "1",
      "fechaCreacion": "2026-08-13 11:41:30",
      "fechaModificacion": null
    },
    "destino": {
      "idDestino": 1,
      "descDestino": "VALPARAISO",
      "descCorta": "VAL",
      "estado": "1",
      "fechaCreacion": "2026-08-13 11:41:30",
      "fechaModificacion": null
    },
    "persona": {
      "idPersona": 60081,
      "dniPersona": "70080090",
      "nombres": "JUAN",
      "apellidoPat": "PEREZ",
      "apellidoMat": "GOMEZ",
      "email": "jperez@safco.com",
      "telefono": "999888777",
      "tipo": 1,
      "estado": "1",
      "urlFirma": "https://storage.safcoperu.com/firmas/juan_perez.png",
      "nombreCompleto": "JUAN PEREZ GOMEZ",
      "nombreSimplificado": "J. PEREZ"
    },
    "entidad": {
      "idEntidad": 100,
      "razonSocial": "TRANSPORTES RAPIDO S.A.",
      "direccion": "Av. Nicolas de Pierola 123",
      "contacto": "Pedro Martinez",
      "email": "contacto@rapido.com",
      "telefono": "987654321",
      "fax": null,
      "descAlternativa": "RAPIDO",
      "estado": "1"
    },
    "estado": "1",
    "numPallets": 20
  },
  "cantidad": 1,
  "error": null
}
```

---

### 4.5 Guardar Detalle para una Inspección específica
- **Método**: `POST`
- **Ruta**: `/frio/inspeccion-embarque/{idInspeccion}/detalle`
- **Descripción**: Crea o actualiza un detalle asociándolo a la inspección de embarque en frío indicada en la URL. Valida que el pallet exista en Nisira para la instrucción de embarque.
- **Cabeceras**: `Content-Type: application/json`, `Authorization: Bearer <token>`

#### Parámetros Path
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `idInspeccion` | `integer (long)` | **Sí** | ID de la inspección de embarque en frío padre | `24` |

#### Cuerpo de la Petición (Request Body)
| Atributo | Tipo | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `idInspeccionEmbarqueFrioDetalle` | `number` | No | ID del detalle (enviar en nulo para registrar uno nuevo, o el ID para actualizar) | `null` |
| `nroPalletReferencia` | `string` | **Sí** | Número de pallet referenciado (debe existir en el listado de Nisira para la instrucción de embarque del contenedor) | `"ASP01251117081R"` |
| `sensor` | `string` | No | Termoregistro/sensor colocado en el pallet | `"SENSOR_A"` |
| `termoRegistro` | `string` | No | Código del termoregistro de frío | `"TERM_01"` |
| `posicionEnContenedor` | `object` | **Sí** | Ubicación del pallet | `{ "idPosicionEnContenedor": 10 }` |
| `estado` | `string` | **Sí** | Estado del registro (`"1"` = Activo, `"0"` = Anulado) | `"1"` |

##### Ejemplo de Request Body:
```json
{
  "nroPalletReferencia": "ASP01251117081R",
  "sensor": "SENSOR_A",
  "termoRegistro": "TERM_01",
  "posicionEnContenedor": {
    "idPosicionEnContenedor": 10
  },
  "estado": "1"
}
```

#### Respuesta Exitosa (HTTP 200)
```json
{
  "codigo": "200",
  "mensaje": "Detalle guardado correctamente.",
  "data": {
    "idInspeccionEmbarqueFrioDetalle": 105,
    "idReferenciaPaleta": "RP-9011",
    "nroPalletReferencia": "ASP01251117081R",
    "sensor": "SENSOR_A",
    "termoRegistro": "TERM_01",
    "posicionEnContenedor": {
      "idPosicionEnContenedor": 10,
      "lado": "IZQUIERDA",
      "posicion": 5
    },
    "estado": "1"
  },
  "cantidad": 1,
  "error": null
}
```

#### Respuestas de Error
- **400 BAD REQUEST**: Si el número de pallet referenciado no está registrado en el listado de Nisira para la instrucción de embarque asociada al contenedor.
  ```json
  {
    "codigo": "0",
    "respuesta": "El número de pallet 'ASP01251117081R' no se encuentra en el listado de pallets de Nisira para la instrucción de embarque 815.",
    "data": null,
    "cantidad": null,
    "error": "BAD_REQUEST"
  }
  ```

---

## 5. Módulo 4: Seguridad Patrimonial - Inspección Ingreso Contenedor

**Ruta Base**: `/SeguridadPatrimonial/InspeccionIngresoContenedor`

### 5.1 Obtener Documento Final de Ingreso de Contenedor
- **Método**: `GET`
- **Ruta**: `/SeguridadPatrimonial/InspeccionIngresoContenedor/{id}/doc-final`
- **Descripción**: Retorna el resultado de seguridad, estado del proceso, listado de comentarios y evidencias visuales.

#### Parámetros Path
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `integer (long)` | **Sí** | ID de la inspección de ingreso | `150` |

#### Respuesta Exitosa (HTTP 200)
```json
{
  "codigo": "200",
  "mensaje": "Datos obtenidos con éxito",
  "data": {
    "idInspeccionIngresoContenedor": 150,
    "idCampanaReferencia": "UV26",
    "estadoProceso": "TERMINADO",
    "conEmbarque": "1",
    "resultadoCalidad": {
      "idResultadoCalidad": 1,
      "descCorta": "CONFORME",
      "descEstadoCalidad": "Contenedor Limpio y Operativo",
      "estado": "1"
    },
    "comentarios": [
      {
        "idComentarioIngresoContenedor": 55,
        "comentario": "Pintura y pisos en buen estado, sin olores extraños.",
        "estado": "1"
      }
    ],
    "evidenciasVisuales": [
      {
        "tipoEvidenciaVisualSeguridad": {
          "idTipoEvidenciaVisualSeguridad": 4,
          "descripcion": "ESTADO GENERAL DEL CONTENEDOR"
        },
        "evidenciasVisualesSeguridad": [
          {
            "idEvidenciaVisualSeguridad": 1201,
            "url": "https://storage.safcoperu.com/seguridad/contenedor_ext.jpg",
            "nombreArchivo": "contenedor_ext.jpg"
          }
        ]
      }
    ]
  },
  "cantidad": 1,
  "error": null
}
```

---

### 5.2 Actualizar Documento Final de Seguridad Patrimonial
- **Método**: `PUT`
- **Ruta**: `/SeguridadPatrimonial/InspeccionIngresoContenedor/doc-final`
- **Descripción**: Actualiza el indicador `conEmbarque`, `resultadoCalidad` y la lista de comentarios.
- **Cabeceras**: `Content-Type: application/json`

#### Estructura del Request Body
| Atributo | Tipo | Requerido | Restricciones | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `idInspeccionIngresoContenedor` | `integer (long)` | **Sí** | No nulo | ID de la inspección de ingreso |
| `conEmbarque` | `string` | No | Máx. 1 caracter (`"1"` o `"0"`) | Pase a embarque |
| `resultadoCalidad` | `object` | No | - | Objeto contenedor |
| `resultadoCalidad.idResultadoCalidad` | `integer (long)` | No | - | ID del catálogo de resultado |
| `comentarios` | `array<object>` | No | - | Lista de comentarios |
| `comentarios[].idComentarioIngresoContenedor` | `integer (long)` | No | - | ID comentario (null para nuevos) |
| `comentarios[].comentario` | `string` | No | - | Contenido del comentario |
| `comentarios[].estado` | `string` | No | - | `"1"` (Activo) o `"0"` (Inactivo) |

#### Ejemplo de Request Body
```json
{
  "idInspeccionIngresoContenedor": 150,
  "conEmbarque": "1",
  "resultadoCalidad": {
    "idResultadoCalidad": 1
  },
  "comentarios": [
    {
      "idComentarioIngresoContenedor": 55,
      "comentario": "Pintura y pisos en buen estado, sin olores extraños.",
      "estado": "1"
    },
    {
      "idComentarioIngresoContenedor": null,
      "comentario": "Revisión técnica de motor aprobada.",
      "estado": "1"
    }
  ]
}
```

#### Respuesta Exitosa (HTTP 200)
```json
{
  "codigo": "200",
  "mensaje": "Inspección actualizada con éxito",
  "data": {
    "idInspeccionIngresoContenedor": 150,
    "idCampanaReferencia": "UV26",
    "estadoProceso": "TERMINADO",
    "conEmbarque": "1",
    "resultadoCalidad": {
      "idResultadoCalidad": 1,
      "descCorta": "CONFORME",
      "descEstadoCalidad": "Contenedor Limpio y Operativo",
      "estado": "1"
    },
    "comentarios": [
      {
        "idComentarioIngresoContenedor": 55,
        "comentario": "Pintura y pisos en buen estado, sin olores extraños.",
        "estado": "1"
      },
      {
        "idComentarioIngresoContenedor": 56,
        "comentario": "Revisión técnica de motor aprobada.",
        "estado": "1"
      }
    ]
  },
  "cantidad": 1,
  "error": null
}
```

---

### 5.3 Subir Evidencias Visuales de Seguridad Patrimonial
- **Método**: `POST`
- **Ruta**: `/SeguridadPatrimonial/InspeccionIngresoContenedor/{idInspeccion}/evidencias-visuales-por-tipo`
- **Descripción**: Sincroniza fotos de inspección física y seguridad mediante `multipart/form-data`.
- **Cabeceras**: `Content-Type: multipart/form-data`

#### Parámetros Path y Form-Data
| Parámetro | Ubicación | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `idInspeccion` | Path | `integer (long)` | **Sí** | ID de la inspección |
| `idTiposEvidencia` | Form Field | `array<number>` | **Sí** | Lista de IDs de tipos de evidencia |
| `grupos[i]` | Form File | `binary[]` | No | Archivos de imágenes nuevos |
| `gruposIdImagenes[i]` | Form Field | `string` | No | IDs existentes a conservar |

#### Respuesta Exitosa (HTTP 200)
```json
{
  "codigo": "200",
  "mensaje": "Evidencias visuales procesadas correctamente.",
  "data": null,
  "cantidad": 0,
  "error": null
}
```

---

## 6. Módulo 5: Catálogos Generales (Extras)

**Ruta Base**: `/Produccion/General/GET`

### 6.1 Listado de Campañas Activas
- **Método**: `GET`
- **Ruta**: `/Produccion/General/GET/ListCampanasActiva`
- **Descripción**: Obtiene el catálogo de campañas activas desde NISIRA.
- **Cabeceras**: `Authorization: Bearer <token>`, `Accept: application/json`

#### Respuesta Exitosa (HTTP 200)
```json
{
  "codigo": "0",
  "respuesta": "Busqueda exitosa",
  "data": [
    {
      "idEmpresaCorporacion": "001",
      "idFecha": "UV26",
      "descCampana": "CAMPAÑA UVA 2025-2026",
      "idCultivoRef": "001"
    },
    {
      "idEmpresaCorporacion": "001",
      "idFecha": "UV25",
      "descCampana": "CAMPAÑA UVA 2024-2025",
      "idCultivoRef": "001"
    }
  ],
  "cantidad": "2",
  "error": null
}
```

---

## 7. Módulo 6: Producción - Conclusiones de Informe Final

**Ruta Base**: `/produccion/conclusion-informe-final`

### 7.1 Crear Conclusión de Informe Final
- **Método**: `POST`
- **Ruta**: `/produccion/conclusion-informe-final`
- **Descripción**: Registra una nueva conclusión aplicable a informes finales asociada a un formato de inspección.
- **Cabeceras**: `Content-Type: application/json`, `Authorization: Bearer <token>`

#### Cuerpo de la Petición (Request Body)
| Atributo | Tipo | Requerido | Restricciones | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `descripcion` | `string` | **Sí** | No vacío | Texto descriptivo de la conclusión |
| `idFormatoInspeccion` | `number` | **Sí** | No nulo | ID del formato de inspección asociado |

##### Ejemplo de Request Body:
```json
{
  "descripcion": "La fruta cumple con los estándares comerciales de exportación.",
  "idFormatoInspeccion": 1
}
```

#### Respuesta Exitosa (HTTP 201)
```json
{
  "codigo": "200",
  "mensaje": "Conclusión de informe final creada correctamente.",
  "data": {
    "id": 1,
    "descripcion": "La fruta cumple con los estándares comerciales de exportación.",
    "formatoInspeccion": {
      "idFormatoInspeccion": 1,
      "descFormatoInspeccion": "FORMATO DE INSPECCIÓN DE EMBARQUE EN FRÍO",
      "estado": "1"
    },
    "estado": "1",
    "fechaCreacion": "2026-08-14 15:10:00",
    "fechaModificacion": null
  },
  "cantidad": 1,
  "error": null
}
```

---

### 7.2 Actualizar Conclusión de Informe Final
- **Método**: `PUT`
- **Ruta**: `/produccion/conclusion-informe-final/{id}`
- **Descripción**: Modifica la descripción y/o formato asociado de una conclusión existente.
- **Cabeceras**: `Content-Type: application/json`, `Authorization: Bearer <token>`

#### Parámetros Path
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `number` | **Sí** | ID de la conclusión a actualizar | `1` |

#### Cuerpo de la Petición (Request Body)
Igual al cuerpo de petición de creación (sección 7.1).

#### Respuesta Exitosa (HTTP 200)
Retorna la conclusión modificada con la misma estructura detallada en la respuesta de la sección 7.1.

---

### 7.3 Anular Conclusión de Informe Final (Anulación Lógica)
- **Método**: `PATCH`
- **Ruta**: `/produccion/conclusion-informe-final/{id}/anular`
- **Descripción**: Realiza una baja lógica actualizando su estado a `"0"`.
- **Cabeceras**: `Authorization: Bearer <token>`

#### Parámetros Path
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `number` | **Sí** | ID de la conclusión a anular | `1` |

#### Respuesta Exitosa (HTTP 200)
```json
{
  "codigo": "200",
  "mensaje": "Conclusión de informe final anulada correctamente.",
  "data": null,
  "cantidad": 0,
  "error": null
}
```

---

### 7.4 Listar Todas las Conclusiones
- **Método**: `GET`
- **Ruta**: `/produccion/conclusion-informe-final`
- **Descripción**: Retorna la lista completa de conclusiones ordenadas de forma descendente (última creada primero).
- **Cabeceras**: `Authorization: Bearer <token>`, `Accept: application/json`

#### Respuesta Exitosa (HTTP 200)
```json
{
  "codigo": "200",
  "mensaje": "Listado completo de conclusiones obtenido correctamente.",
  "data": [
    {
      "id": 2,
      "descripcion": "La cadena de frío fue interrumpida en zona de preembarque.",
      "formatoInspeccion": {
        "idFormatoInspeccion": 1,
        "descFormatoInspeccion": "FORMATO DE INSPECCIÓN DE EMBARQUE EN FRÍO",
        "estado": "1"
      },
      "estado": "1",
      "fechaCreacion": "2026-08-14 15:15:00",
      "fechaModificacion": null
    },
    {
      "id": 1,
      "descripcion": "La fruta cumple con los estándares comerciales de exportación.",
      "formatoInspeccion": {
        "idFormatoInspeccion": 1,
        "descFormatoInspeccion": "FORMATO DE INSPECCIÓN DE EMBARQUE EN FRÍO",
        "estado": "1"
      },
      "estado": "1",
      "fechaCreacion": "2026-08-14 15:10:00",
      "fechaModificacion": null
    }
  ],
  "cantidad": 2,
  "error": null
}
```

---

### 7.5 Listar Conclusiones Activas
- **Método**: `GET`
- **Ruta**: `/produccion/conclusion-informe-final/activos`
- **Descripción**: Retorna el catálogo de conclusiones en estado activo (`"1"`). Permite filtrado opcional por formato de inspección.
- **Cabeceras**: `Authorization: Bearer <token>`, `Accept: application/json`

#### Parámetros Query
| Parámetro | Tipo | Requerido | Default | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `idFormatoInspeccion` | `number` | No | - | Filtro por formato de inspección asociado | `1` |

#### Respuesta Exitosa (HTTP 200)
Devuelve un listado JSON con estructura idéntica a la sección 7.4 conteniendo solo registros con `estado: "1"`.

---

### 7.6 Obtener Conclusión por ID
- **Método**: `GET`
- **Ruta**: `/produccion/conclusion-informe-final/{id}`
- **Descripción**: Obtiene la información detallada de una conclusión por su ID.
- **Cabeceras**: `Authorization: Bearer <token>`, `Accept: application/json`

#### Parámetros Path
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `number` | **Sí** | ID de la conclusión a consultar | `1` |

#### Respuesta Exitosa (HTTP 200)
Retorna la estructura detallada de la conclusión (idéntica a la sección 7.1).

---

## 8. Resumen de Códigos HTTP de Error

| Código | Significado | Causa Habitual en Frontend |
| :--- | :--- | :--- |
| **`400 BAD REQUEST`** | Petición inválida | Falta el parámetro obligatorio `campana` o el ID de la inspección en el cuerpo de la petición. |
| **`401 UNAUTHORIZED`** | No autenticado | Token JWT no enviado o expirado. |
| **`403 FORBIDDEN`** | Acceso denegado | El usuario no cuenta con los permisos necesarios para la subárea. |
| **`404 NOT FOUND`** | Recurso no encontrado | El ID de inspección, conclusión o instrucción de embarque no existe. |
| **`500 INTERNAL SERVER ERROR`** | Error en servidor | Excepción no controlada en el SP o al almacenar las evidencias. |
