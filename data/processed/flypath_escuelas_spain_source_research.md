# FlyPath Escuelas Spain - Source Research (manual)

Fecha de elaboración: 2026-05-06
Alcance: investigación manual preliminar para futura carga en `schoolsSpain.ts` (sin importar todavía).

## Criterio de esta versión

- Esta investigación **no usa el CSV degradado como fuente de verdad**.
- Solo se consolidan referencias oficiales detectables (web oficial / páginas de programa / PDFs cuando se conocen).
- Cuando falta evidencia explícita en fuente oficial: **`no publicado`**.
- No se calcula `coste estimado FlyPath` en esta fase salvo justificación clara (en esta versión: `no calculado`).

---

## 1) Adventia

### Identidad
- nombre: Adventia (European College of Aeronautics)
- slug sugerido: `adventia-salamanca`
- tipo de entidad: universidad_plus_license (escuela adscrita + grado)
- ciudad: Salamanca
- aeropuerto/base: Salamanca Matacán
- web oficial: https://adventia.org

### Formación
- tipo de ruta: `university_plus_license`
- programas publicados: integrado ATPL + grado asociado (según materiales públicos de escuela/universidad)
- licencia o resultado publicado: ATPL frozen (declarado comercialmente)
- duración publicada: no publicado de forma única consolidada en web pública
- idioma formación: no publicado (consolidado)
- Class 1 requerido cuándo: no publicado (consolidado)

### Costes
- precio publicado: detectado en fuentes públicas históricas, **pendiente de confirmación oficial vigente**
- depósito/matrícula: no publicado (consolidado)
- calendario de pagos: no publicado (consolidado)
- financiación: no publicado (consolidado)
- qué está incluido: no publicado (consolidado)
- qué no está incluido: no publicado (consolidado)
- coste estimado FlyPath: no calculado

### Condiciones
- contrato antes de pagar: no publicado
- política de reembolso: no publicado
- cancelación: no publicado

### Operación
- flota: no publicado (consolidado)
- simuladores: no publicado (consolidado)
- disponibilidad aviones: no publicado
- ratios alumno/avión o instructor/alumno: no publicado
- mantenimiento: no publicado

### Empleo/marketing
- apoyo empleo: no publicado
- convenios: no publicado
- promesas laborales: no publicado
- garantía entrevista/trabajo: no publicado
- claims comerciales relevantes: no publicado

### Control de datos
- sourceUrl: https://adventia.org
- sourceLabel: web oficial Adventia
- fecha consulta: 2026-05-06
- dataConfidence: `medium`
- dataStatus: `partial`
- redFlags:
  - No publica en una sola vista pública contrato/reembolso/pagos.
  - Precio y alcance requieren verificación documental vigente.
- pendingData:
  - Contrato pre-pago.
  - Reembolso y cancelación.
  - Desglose coste actual.
- keyQuestions:
  - ¿Se entrega contrato completo antes de cualquier pago?
  - ¿Qué costes y tasas quedan fuera del precio anunciado?
  - ¿Cuál es el calendario exacto de pagos por hitos?
- internalNotes: revisar PDF/condiciones vigentes 2026 antes de alta en TypeScript.

---

## 2) FTE Jerez

### Identidad
- nombre: FTE Jerez
- slug sugerido: `fte-jerez`
- tipo de entidad: ATO
- ciudad: Jerez de la Frontera
- aeropuerto/base: Jerez
- web oficial: https://www.ftejerez.com

### Formación
- tipo de ruta: `integrated` (con oferta modular parcial)
- programas publicados: integrated airline programme + cursos adicionales
- licencia o resultado publicado: ATPL frozen (ruta integrada)
- duración publicada: no publicado (consolidado único)
- idioma formación: no publicado (consolidado único)
- Class 1 requerido cuándo: no publicado (consolidado único)

### Costes
- precio publicado: no publicado en esta revisión manual consolidada
- depósito/matrícula: no publicado
- calendario de pagos: no publicado
- financiación: no publicado
- incluidos/no incluidos: no publicado consolidado
- coste estimado FlyPath: no calculado

### Condiciones
- contrato antes de pagar: no publicado
- política de reembolso: no publicado
- cancelación: no publicado

### Operación
- flota/simuladores: no publicado consolidado
- disponibilidad/ratios/mantenimiento: no publicado

### Empleo/marketing
- apoyo empleo: no publicado consolidado
- convenios/promesas/garantías: no publicado consolidado
- claims: no publicado

### Control de datos
- sourceUrl: https://www.ftejerez.com
- sourceLabel: web oficial FTE Jerez
- fecha consulta: 2026-05-06
- dataConfidence: `medium`
- dataStatus: `partial`
- redFlags:
  - Faltan condiciones contractuales/reembolso visibles en bloque único.
- pendingData:
  - Precio y pagos vigentes.
  - Contrato antes de pagar.
  - Política de cancelación.
- keyQuestions:
  - ¿Cuál es el precio total y desglose actualizado?
  - ¿Existe contrato disponible antes del depósito?
  - ¿Qué política de devolución aplica por baja o no aptitud médica?
- internalNotes: completar con PDF oficial vigente si existe página “price sheet” actual.

---

## 3) European Flyers

### Identidad
- nombre: European Flyers
- slug sugerido: `european-flyers`
- tipo de entidad: ATO / universidad_plus_license (según programa)
- ciudad: Madrid / Alicante (según sedes publicadas)
- aeropuerto/base: Cuatro Vientos / Mutxamel
- web oficial: https://europeanflyers.com

### Formación
- tipo de ruta: `mixed`
- programas publicados: integrado + modular + posibles acuerdos académicos
- licencia resultado: ATPL frozen (rutas de piloto)
- duración publicada: no publicado consolidado
- idioma formación: no publicado consolidado
- Class 1 requerido cuándo: no publicado

### Costes
- precio publicado: no publicado consolidado (en esta pasada)
- depósito: no publicado
- calendario pagos: no publicado
- financiación: no publicado
- incluidos/no incluidos: no publicado consolidado
- coste estimado FlyPath: no calculado

### Condiciones / Operación / Empleo
- contrato/reembolso/cancelación: no publicado
- flota/simuladores/ratios/mantenimiento: no publicado consolidado
- apoyo empleo/convenios/promesas: no publicado consolidado

### Control de datos
- sourceUrl: https://europeanflyers.com
- sourceLabel: web oficial European Flyers
- fecha consulta: 2026-05-06
- dataConfidence: `medium`
- dataStatus: `partial`
- redFlags:
  - Oferta extensa pero sin consolidado único de condiciones económicas/contractuales.
- pendingData:
  - Precio vigente por ruta.
  - Contrato pre-pago y reembolso.
  - Ratios operativos.
- keyQuestions:
  - ¿Qué coste final aplica a cada ruta (integrada/modular)?
  - ¿Qué se firma antes del primer pago?
  - ¿Qué extras no incluidos son más frecuentes?
- internalNotes: entidad válida para V1 en modo datos pendientes tras revisión documental.

---

## 4) Quality Fly

### Identidad
- nombre: Quality Fly
- slug sugerido: `quality-fly`
- tipo de entidad: ATO
- ciudad: Madrid
- aeropuerto/base: Cuatro Vientos
- web oficial: https://www.qualityfly.com

### Formación
- tipo de ruta: `integrated` (con oferta adicional modular)
- programas publicados: integrado + cursos adicionales
- licencia resultado: ATPL frozen (ruta principal declarada)
- duración publicada: no publicado consolidado
- idioma formación: no publicado consolidado
- Class 1 requerido cuándo: no publicado consolidado

### Costes
- precio publicado: no publicado (consolidado manual)
- depósito/pagos/financiación: no publicado consolidado
- incluidos/no incluidos: no publicado consolidado
- coste estimado FlyPath: no calculado

### Condiciones / Operación / Empleo
- contrato/reembolso/cancelación: no publicado
- flota/sim/ratios/mantenimiento: no publicado consolidado
- apoyo empleo/convenios/promesas: no publicado consolidado

### Control de datos
- sourceUrl: https://www.qualityfly.com
- sourceLabel: web oficial Quality Fly
- fecha consulta: 2026-05-06
- dataConfidence: `medium`
- dataStatus: `partial`
- redFlags:
  - Información contractual y de pagos no consolidada en bloque público único.
- pendingData:
  - Precio total actualizado.
  - Condiciones de baja/cancelación.
  - Política de reembolso.
- keyQuestions:
  - ¿Cuál es el calendario de pagos oficial por fases?
  - ¿Qué costes adicionales pueden aparecer por horas extra/reintentos?
  - ¿El contrato se entrega completo antes de pagar?
- internalNotes: incluir solo tras validar una fuente de precios y contrato vigentes.

---

## 5) FlyBy Aviation Academy

### Identidad
- nombre: FlyBy Aviation Academy
- slug sugerido: `flyby-aviation-academy`
- tipo de entidad: ATO
- ciudad: Burgos
- aeropuerto/base: Burgos
- web oficial: https://www.flybyschool.com

### Formación
- tipo de ruta: `integrated` (con oferta modular parcial)
- programas publicados: integrado + cursos complementarios
- licencia resultado: ATPL frozen (ruta declarada)
- duración publicada: no publicado consolidado
- idioma formación: no publicado consolidado
- Class 1 requerido cuándo: no publicado

### Costes / Condiciones / Operación / Empleo
- precio/deposito/pagos/financiación: no publicado consolidado
- contrato/reembolso/cancelación: no publicado
- flota/sim/ratios/mantenimiento: no publicado consolidado
- apoyo empleo/convenios/promesas: no publicado consolidado
- coste estimado FlyPath: no calculado

### Control de datos
- sourceUrl: https://www.flybyschool.com
- sourceLabel: web oficial FlyBy
- fecha consulta: 2026-05-06
- dataConfidence: `low`
- dataStatus: `unknown`
- redFlags:
  - Falta consolidado público robusto para costes y condiciones.
- pendingData:
  - Precio total vigente.
  - Contrato antes de pago.
  - Reembolso/cancelación.
- keyQuestions:
  - ¿Qué incluye exactamente el precio base?
  - ¿Qué costes quedan fuera?
  - ¿Existe contrato pre-pago descargable?
- internalNotes: mantener como entidad válida pero no lista para importación sin revisión.

---

## 6) Canavia

### Identidad
- nombre: Canavia Flight School
- slug sugerido: `canavia-flight-school`
- tipo de entidad: ATO
- ciudad: Las Palmas de Gran Canaria
- aeropuerto/base: Gran Canaria
- web oficial: https://flycanavia.com

### Formación
- tipo de ruta: `mixed`
- programas publicados: integrado/modular según oferta pública
- licencia resultado: ATPL frozen (rutas declaradas)
- duración publicada: no publicado consolidado
- idioma formación: no publicado consolidado
- Class 1 requerido cuándo: no publicado consolidado

### Costes
- precio publicado: no publicado consolidado en esta pasada
- depósito/pagos/financiación: no publicado
- incluidos/no incluidos: no publicado consolidado
- coste estimado FlyPath: no calculado

### Condiciones / Operación / Empleo
- contrato/reembolso/cancelación: no publicado
- flota/sim/ratios/mantenimiento: no publicado consolidado
- apoyo empleo/convenios/promesas: no publicado consolidado

### Control de datos
- sourceUrl: https://flycanavia.com
- sourceLabel: web oficial Canavia
- fecha consulta: 2026-05-06
- dataConfidence: `medium`
- dataStatus: `partial`
- redFlags:
  - Datos económicos/contractuales no cerrados en una sola fuente verificable.
- pendingData:
  - Precio vigente por programa.
  - Contrato y política de reembolso.
  - Calendario de pagos.
- keyQuestions:
  - ¿Qué precio final aplica a cada itinerario?
  - ¿Qué condiciones de cancelación/reembolso existen?
  - ¿Qué extras no están incluidos?
- internalNotes: candidata V1 tras verificación documental puntual.

---

## 7) Corflight School

### Identidad
- nombre: Corflight School
- slug sugerido: `corflight-school`
- tipo de entidad: ATO
- ciudad: Madrid
- aeropuerto/base: Cuatro Vientos
- web oficial: https://corflightschool.com

### Formación
- tipo de ruta: `integrated`
- programas publicados: integrado (información pública limitada)
- licencia resultado: no publicado (consolidado)
- duración publicada: no publicado
- idioma formación: no publicado
- Class 1 requerido cuándo: no publicado

### Costes
- precio publicado: no publicado consolidado fiable
- depósito/pagos/financiación: no publicado
- incluidos/no incluidos: no publicado
- coste estimado FlyPath: no calculado

### Condiciones / Operación / Empleo
- contrato/reembolso/cancelación: no publicado
- flota/sim/ratios/mantenimiento: no publicado
- apoyo empleo/convenios/promesas: no publicado

### Control de datos
- sourceUrl: https://corflightschool.com
- sourceLabel: web oficial Corflight
- fecha consulta: 2026-05-06
- dataConfidence: `low`
- dataStatus: `unknown`
- redFlags:
  - Publicación de datos operativos y económicos insuficiente para comparación fiable.
- pendingData:
  - Precio y desglose real.
  - Contrato pre-pago.
  - Reembolso y pagos.
- keyQuestions:
  - ¿Cuál es el precio total actualizado y qué incluye?
  - ¿Qué ocurre en caso de abandono/cancelación?
  - ¿Qué módulos están incluidos en tarifa base?
- internalNotes: mantener en índice, no apta para importación inmediata.

---

## 8) Flyschool Air Academy

### Identidad
- nombre: Flyschool Air Academy
- slug sugerido: `flyschool-air-academy`
- tipo de entidad: ATO
- ciudad: Madrid / Mallorca
- aeropuerto/base: Cuatro Vientos / Son Bonet
- web oficial: https://flyschool.es

### Formación
- tipo de ruta: `mixed`
- programas publicados: integrado + modular + cursos asociados
- licencia resultado: ATPL frozen (rutas de piloto)
- duración publicada: no publicado consolidado
- idioma formación: no publicado consolidado
- Class 1 requerido cuándo: no publicado

### Costes / Condiciones / Operación / Empleo
- precio: no publicado consolidado en esta pasada
- depósito/pagos/financiación: no publicado
- contrato/reembolso/cancelación: no publicado
- flota/sim/ratios/mantenimiento: no publicado consolidado
- apoyo empleo/convenios/promesas: no publicado consolidado
- coste estimado FlyPath: no calculado

### Control de datos
- sourceUrl: https://flyschool.es
- sourceLabel: web oficial Flyschool
- fecha consulta: 2026-05-06
- dataConfidence: `medium`
- dataStatus: `partial`
- redFlags:
  - Falta consolidado contractual/económico en un único documento verificable.
- pendingData:
  - Precio final vigente por modalidad.
  - Contrato y reembolso.
  - Calendario de pagos.
- keyQuestions:
  - ¿Qué paquetes siguen vigentes y a qué precio final?
  - ¿Qué incluye/no incluye cada paquete?
  - ¿Existe contrato completo antes de pagar?
- internalNotes: potencial V1 tras validación de precios y condiciones.

---

## 9) Airpull Aviation Academy

### Identidad
- nombre: Airpull Aviation Academy
- slug sugerido: `airpull-aviation-academy`
- tipo de entidad: ATO
- ciudad: Requena (Valencia)
- aeropuerto/base: Requena
- web oficial: https://airpullaviationacademy.com

### Formación
- tipo de ruta: `mixed`
- programas publicados: integrado/modular (según web pública)
- licencia resultado: no publicado consolidado
- duración publicada: no publicado consolidado
- idioma formación: no publicado
- Class 1 requerido cuándo: no publicado

### Costes
- precio publicado: no publicado consolidado fiable
- depósito/pagos/financiación: no publicado
- incluidos/no incluidos: no publicado
- coste estimado FlyPath: no calculado

### Condiciones / Operación / Empleo
- contrato/reembolso/cancelación: no publicado
- flota/sim/ratios/mantenimiento: no publicado consolidado
- apoyo empleo/convenios/promesas: no publicado consolidado

### Control de datos
- sourceUrl: https://airpullaviationacademy.com
- sourceLabel: web oficial Airpull
- fecha consulta: 2026-05-06
- dataConfidence: `low`
- dataStatus: `unknown`
- redFlags:
  - Información económica pública no consolidada y posiblemente promocional.
- pendingData:
  - Tarifas oficiales en documento vigente.
  - Condiciones contractuales/reembolso.
  - Calendario de pagos.
- keyQuestions:
  - ¿Cuál es el precio oficial por ruta y qué incluye?
  - ¿Se publica contrato antes del depósito?
  - ¿Qué gastos quedan fuera?
- internalNotes: mantener como entidad indexada; requiere investigación adicional antes de V1.

---

## 10) One Air

### Identidad
- nombre: One Air Aviation Academy
- slug sugerido: `one-air-aviation`
- tipo de entidad: ATO
- ciudad: Málaga
- aeropuerto/base: Málaga-Costa del Sol
- web oficial: https://oneair.es

### Formación
- tipo de ruta: `mixed`
- programas publicados: integrated/modular (según catálogo público)
- licencia resultado: no publicado consolidado
- duración publicada: no publicado
- idioma formación: no publicado
- Class 1 requerido cuándo: no publicado

### Costes
- precio publicado: no publicado
- depósito/pagos/financiación: no publicado
- incluidos/no incluidos: no publicado
- coste estimado FlyPath: no calculado

### Condiciones / Operación / Empleo
- contrato/reembolso/cancelación: no publicado
- flota/simuladores/ratios/mantenimiento: no publicado consolidado
- apoyo empleo/convenios/promesas: no publicado consolidado

### Control de datos
- sourceUrl: https://oneair.es
- sourceLabel: web oficial One Air
- fecha consulta: 2026-05-06
- dataConfidence: `low`
- dataStatus: `unknown`
- redFlags:
  - Falta de coste público verificable en esta revisión.
- pendingData:
  - Precio oficial vigente.
  - Contrato antes de pagar.
  - Reembolso y cancelación.
- keyQuestions:
  - ¿Qué precio final aplica hoy y qué cubre?
  - ¿Hay contrato público previo al pago?
  - ¿Qué política de devoluciones aplica?
- internalNotes: no descartar entidad; mantener en backlog de investigación.

---

## 11) EAS Barcelona

### Identidad
- nombre: EAS Barcelona
- slug sugerido: `eas-barcelona`
- tipo de entidad: ATO
- ciudad: Barcelona / Sabadell
- aeropuerto/base: Sabadell
- web oficial: https://easbcn.com

### Formación
- tipo de ruta: `integrated`
- programas publicados: integrado ATPL (según material público)
- licencia resultado: ATPL frozen (ruta integrada)
- duración publicada: no publicado consolidado
- idioma formación: no publicado consolidado
- Class 1 requerido cuándo: no publicado consolidado

### Costes / Condiciones / Operación / Empleo
- precio/deposito/pagos/financiación: no publicado consolidado fiable
- contrato/reembolso/cancelación: no publicado
- flota/sim/ratios/mantenimiento: no publicado consolidado
- apoyo empleo/convenios/promesas: no publicado consolidado
- coste estimado FlyPath: no calculado

### Control de datos
- sourceUrl: https://easbcn.com
- sourceLabel: web oficial EAS Barcelona
- fecha consulta: 2026-05-06
- dataConfidence: `medium`
- dataStatus: `partial`
- redFlags:
  - Falta de consolidado contractual/económico público inequívoco.
- pendingData:
  - Precio final vigente.
  - Contrato y reembolso.
  - Ratios operativos.
- keyQuestions:
  - ¿Qué importe exacto aplica hoy y en qué hitos se paga?
  - ¿Qué tasas/extras quedan fuera?
  - ¿Existe contrato descargable antes de matrícula?
- internalNotes: candidata V1 tras validación documental.

---

## 12) Barcelona Flight School

### Identidad
- nombre: Barcelona Flight School
- slug sugerido: `barcelona-flight-school`
- tipo de entidad: ATO
- ciudad: Sabadell
- aeropuerto/base: Sabadell
- web oficial: https://barcelonaflightschool.com

### Formación
- tipo de ruta: `integrated`
- programas publicados: integrado + oferta modular complementaria
- licencia resultado: ATPL frozen (según programa)
- duración publicada: no publicado consolidado
- idioma formación: no publicado
- Class 1 requerido cuándo: no publicado

### Costes / Condiciones / Operación / Empleo
- precio: no publicado consolidado fiable
- depósito/pagos/financiación: no publicado
- contrato/reembolso/cancelación: no publicado
- flota/sim/ratios/mantenimiento: no publicado consolidado
- apoyo empleo/convenios/promesas: no publicado consolidado
- coste estimado FlyPath: no calculado

### Control de datos
- sourceUrl: https://barcelonaflightschool.com
- sourceLabel: web oficial Barcelona Flight School
- fecha consulta: 2026-05-06
- dataConfidence: `low`
- dataStatus: `unknown`
- redFlags:
  - Sin consolidado robusto de pagos/contrato/reembolso en esta fase.
- pendingData:
  - Precio oficial vigente y desglose.
  - Contrato pre-pago.
  - Política de cancelación.
- keyQuestions:
  - ¿Qué incluye exactamente el precio base?
  - ¿Qué gastos adicionales son habituales?
  - ¿Qué condiciones de devolución aplican?
- internalNotes: revisar documentación oficial de curso vigente antes de V1.

---

## 13) World Aviation ATO

### Identidad
- nombre: World Aviation ATO
- slug sugerido: `world-aviation-ato`
- tipo de entidad: ATO
- ciudad: Málaga / Madrid (según sedes)
- aeropuerto/base: Málaga-Costa del Sol / Cuatro Vientos
- web oficial: https://worldaviationato.com

### Formación
- tipo de ruta: `mixed`
- programas publicados: modular avión + oferta helicóptero/integrado H (según web)
- licencia resultado: no publicado consolidado único
- duración publicada: no publicado consolidado
- idioma formación: no publicado
- Class 1 requerido cuándo: no publicado

### Costes / Condiciones / Operación / Empleo
- precio: no publicado consolidado fiable para ruta avión comparable
- depósito/pagos/financiación: no publicado
- contrato/reembolso/cancelación: no publicado
- flota/sim/ratios/mantenimiento: no publicado consolidado
- apoyo empleo/convenios/promesas: no publicado consolidado
- coste estimado FlyPath: no calculado

### Control de datos
- sourceUrl: https://worldaviationato.com
- sourceLabel: web oficial World Aviation ATO
- fecha consulta: 2026-05-06
- dataConfidence: `low`
- dataStatus: `unknown`
- redFlags:
  - Mezcla de producto avión/helicóptero complica comparación sin normalización.
- pendingData:
  - Ruta avión exacta comparable ATPL frozen.
  - Precio total y pagos.
  - Condiciones contractuales.
- keyQuestions:
  - ¿Qué itinerario avión es el comparable para FlyPath?
  - ¿Qué costes incluye/excluye?
  - ¿Qué contrato y reembolso aplican?
- internalNotes: mantener fuera de primera importación hasta separar producto avión/helicóptero.

---

## 14) CESDA / Universitat Rovira i Virgili

### Identidad
- nombre: CESDA / Universitat Rovira i Virgili
- slug sugerido: `cesda-urv`
- tipo de entidad: universidad_plus_license
- ciudad: Reus
- aeropuerto/base: Reus
- web oficial: https://www.cesda.com
- web universitaria: https://www.urv.cat

### Formación
- tipo de ruta: `university_plus_license`
- programas publicados: grado en piloto comercial y operaciones aéreas (según posicionamiento público CESDA/URV)
- licencia resultado: no publicado consolidado en esta fase
- duración publicada: no publicado consolidado
- idioma formación: no publicado consolidado
- Class 1 requerido cuándo: no publicado consolidado

### Costes / Condiciones / Operación / Empleo
- precio/deposito/pagos/financiación: no publicado consolidado
- contrato/reembolso/cancelación: no publicado
- flota/sim/ratios/mantenimiento: no publicado consolidado
- apoyo empleo/convenios/promesas: no publicado consolidado
- coste estimado FlyPath: no calculado

### Control de datos
- sourceUrl: https://www.cesda.com
- sourceLabel: web oficial CESDA
- fecha consulta: 2026-05-06
- dataConfidence: `medium`
- dataStatus: `partial`
- redFlags:
  - Falta de consolidado económico/contractual único para importación directa.
- pendingData:
  - Coste total (académico + vuelo) vigente.
  - Contrato antes de pago y reembolso.
  - Qué licencia exacta se garantiza.
- keyQuestions:
  - ¿Cuál es el coste total anual y total del itinerario?
  - ¿Qué ocurre si no se obtiene Class 1?
  - ¿Qué parte del vuelo está garantizada contractualmente?
- internalNotes: entidad universitaria prioritaria para V1 una vez validado bloque de costes/condiciones.

---

## Tabla resumen (14 entidades)

| Entidad | Slug sugerido | routeType (preliminar) | dataConfidence | dataStatus | Recomendación inicial |
|---|---|---|---|---|---|
| Adventia | `adventia-salamanca` | university_plus_license | medium | partial | candidata tras validación de precios/contrato |
| FTE Jerez | `fte-jerez` | integrated | medium | partial | candidata tras validación documental |
| European Flyers | `european-flyers` | mixed | medium | partial | candidata tras validación de condiciones |
| Quality Fly | `quality-fly` | integrated | medium | partial | candidata tras validación de pagos/reembolso |
| FlyBy Aviation Academy | `flyby-aviation-academy` | integrated | low | unknown | mantener en backlog de investigación |
| Canavia | `canavia-flight-school` | mixed | medium | partial | candidata tras validar costes y contrato |
| Corflight School | `corflight-school` | integrated | low | unknown | investigación adicional obligatoria |
| Flyschool Air Academy | `flyschool-air-academy` | mixed | medium | partial | candidata tras limpieza documental |
| Airpull Aviation Academy | `airpull-aviation-academy` | mixed | low | unknown | investigación adicional obligatoria |
| One Air | `one-air-aviation` | mixed | low | unknown | investigación adicional obligatoria |
| EAS Barcelona | `eas-barcelona` | integrated | medium | partial | candidata tras validación de costes |
| Barcelona Flight School | `barcelona-flight-school` | integrated | low | unknown | investigación adicional obligatoria |
| World Aviation ATO | `world-aviation-ato` | mixed | low | unknown | separar producto avión/helicóptero antes de importar |
| CESDA / URV | `cesda-urv` | university_plus_license | medium | partial | candidata prioritaria tras validar bloque económico |

---

## Recomendación de entrada inicial en `schoolsSpain.ts` (cuando toque)

Priorizar primero (con carga `partial`, nunca `verified` sin documento cerrado):

1. Adventia  
2. FTE Jerez  
3. European Flyers  
4. Canavia  
5. Flyschool Air Academy  
6. EAS Barcelona  
7. CESDA / URV  
8. Quality Fly

Dejar en segunda ola (investigación adicional):

- FlyBy Aviation Academy
- Corflight School
- Airpull Aviation Academy
- One Air
- Barcelona Flight School
- World Aviation ATO

---

## Advertencias de datos pendientes (global)

- Falta generalizada de publicación clara en:
  - contrato antes de pagar,
  - política de reembolso/cancelación,
  - calendario de pagos por hitos,
  - ratios operativos.
- En varias entidades, los costes públicos no están en un único documento actualizado y trazable.
- No usar `verified` hasta confirmar cada bloque con fuente oficial explícita.

---

## URLs oficiales consultadas / base inicial

- https://adventia.org
- https://www.ftejerez.com
- https://europeanflyers.com
- https://www.qualityfly.com
- https://www.flybyschool.com
- https://flycanavia.com
- https://corflightschool.com
- https://flyschool.es
- https://airpullaviationacademy.com
- https://oneair.es
- https://easbcn.com
- https://barcelonaflightschool.com
- https://worldaviationato.com
- https://www.cesda.com
- https://www.urv.cat

