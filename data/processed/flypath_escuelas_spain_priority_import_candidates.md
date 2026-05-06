# FlyPath - Priority Import Candidates (segunda pasada minima)

Fecha: 2026-05-06  
Entrada: `data/processed/flypath_escuelas_spain_priority_research.md`  
Objetivo: identificar entidades prioritarias con **minimos importables** para estado `ready_partial_import` sin inventar datos.

## Criterio aplicado

Se marca `ready_partial_import` si cumple:
- nombre claro
- slug utilizable
- web oficial/sourceUrl valida
- ciudad/base identificable
- routeType razonable
- se puede mostrar con datos pendientes (aunque falten precio/contrato)

Para precio:
- si hay precio publicado: valor publicado
- si no hay precio publicado: `0` + nota `No publica precio completo`

---

## Candidatos (8 entidades revisadas)

### 1) Adventia (USAL)
- nombre: Adventia (European College of Aeronautics)
- slug: `adventia-usal`
- ciudad/base: Salamanca / Matacan
- routeType: `university_plus_license`
- web oficial: https://adventia.usal.es
- sourceUrl:
  - https://usal.es/grado-en-piloto-de-aviacion-comercial-y-operaciones-aereas
  - https://adventia.usal.es/wp-content/uploads/2021/03/Grado_Precios21.pdf
- precioPublicadoEUR: `138219.18` (PDF historico)
- dataStatus: `partial`
- dataConfidence: `medium`
- redFlags:
  - precio publicado en PDF antiguo (2021/22)
  - condiciones contractuales incompletas en abierto
- pendingData:
  - precio vigente por convocatoria
  - clausulas de cancelacion/reembolso completas
- keyQuestions:
  - Cual es el precio oficial 2026/27?
  - Hay contrato tipo accesible antes de matricula?
- importStatus: `ready_partial_import`

### 2) European Flyers
- nombre: European Flyers
- slug: `european-flyers`
- ciudad/base: Madrid (Cuatro Vientos) / Alicante (Mutxamel)
- routeType: `mixed`
- web oficial: https://europeanflyers.com
- sourceUrl:
  - https://europeanflyers.com/cursos-piloto-avion/curso-piloto-comercial-atpl
  - https://europeanflyers.com/cursos-piloto-avion/teoria-atpl
- precioPublicadoEUR: `85000`
- dataStatus: `partial`
- dataConfidence: `medium`
- redFlags:
  - no publica politica clara de reembolso/cancelacion
  - no detalla plazos economicos completos en pagina principal
- pendingData:
  - deposito y calendario de pagos
  - clausulado de baja/cancelacion
- keyQuestions:
  - Existe contrato tipo previo?
  - Que penalizaciones aplican por cancelacion?
- importStatus: `ready_partial_import`

### 3) AEROTEC
- nombre: AEROTEC Escuela de Pilotos
- slug: `aerotec`
- ciudad/base: Madrid (Cuatro Vientos) / Sevilla (y presencia en Palma)
- routeType: `mixed`
- web oficial: https://www.aerotec.es
- sourceUrl:
  - https://aerotec.es/nuestros-cursos/piloto/
  - https://aerotec.es/
- precioPublicadoEUR: `0`
- precioNota: `No publica precio completo`
- dataStatus: `partial`
- dataConfidence: `low`
- redFlags:
  - no publica precio del integrado en fuente revisada
  - no publica condiciones contractuales abiertas
- pendingData:
  - precio oficial vigente (205h y 245h)
  - pagos, reembolso y cancelacion
- keyQuestions:
  - Precio actual por modalidad?
  - Contrato previo y politica de devolucion?
- importStatus: `ready_partial_import`

### 4) One Air
- nombre: One Air Aviacion
- slug: `one-air`
- ciudad/base: Malaga / La Axarquia
- routeType: `mixed`
- web oficial: https://www.oneair.es
- sourceUrl:
  - https://www.oneair.es/curso-piloto-comercial/
  - https://www.oneair.es/curso-atpl-airline-pilot-programme/
- precioPublicadoEUR:
  - integrated: `86500`
  - airline_pilot_programme_desde: `79500`
  - international_programme: `132500`
- dataStatus: `partial`
- dataConfidence: `medium`
- redFlags:
  - parte de la informacion se presenta en formato comercial/promocional
  - sin politica publica de reembolso/cancelacion en fuentes revisadas
- pendingData:
  - condiciones contractuales de garantia laboral
  - calendario de pagos exacto por programa
- keyQuestions:
  - Que condiciones exactas tiene la garantia de trabajo?
  - Que costes fuera de curso pueden aplicar?
- importStatus: `ready_partial_import`

### 5) EAS Barcelona
- nombre: EAS Barcelona
- slug: `eas-barcelona`
- ciudad/base: Barcelona / Sabadell
- routeType: `mixed`
- web oficial: https://easbcn.com
- sourceUrl:
  - https://easbcn.com/curso-de-piloto-de-avion-comercial/
  - https://easbcn.com/c/curso-atpl-modular/
- precioPublicadoEUR: `0`
- precioNota: `No publica precio completo`
- dataStatus: `partial`
- dataConfidence: `medium`
- redFlags:
  - no publica precio oficial del integrado/modular en estas paginas
  - reembolso/cancelacion no visible en abierto
- pendingData:
  - precio y plazos de pago
  - clausulas de devolucion
- keyQuestions:
  - Precio vigente de integrado y modular?
  - Hay politica de reembolso previa a firma?
- importStatus: `ready_partial_import`

### 6) Barcelona Flight School
- nombre: Barcelona Flight School
- slug: `barcelona-flight-school`
- ciudad/base: Sabadell
- routeType: `mixed`
- web oficial: https://barcelonaflightschool.com
- sourceUrl:
  - https://barcelonaflightschool.com/pilot-training/integrated-airline-transport-pilot-atpl-fast-track-course/
  - https://barcelonaflightschool.com/
- precioPublicadoEUR: `0`
- precioNota: `No publica precio completo`
- dataStatus: `partial`
- dataConfidence: `medium`
- redFlags:
  - precio no publicado en pagina revisada
  - condiciones de baja/reembolso no publicadas en abierto
- pendingData:
  - precio por programa
  - contrato y cancelacion
- keyQuestions:
  - Precio oficial 2026 de integrado/modular?
  - Contrato tipo disponible antes de reserva?
- importStatus: `ready_partial_import`

### 7) Aerodynamics Academy
- nombre: Aerodynamics Academy
- slug: `aerodynamics-academy`
- ciudad/base: Malaga (principal)
- routeType: `integrated`
- web oficial: https://aerodynamics.es
- sourceUrl:
  - https://aerodynamics.es/curso-de-piloto-comercial/
  - https://aerodynamics.es/
- precioPublicadoEUR: `0`
- precioNota: `No publica precio completo`
- dataStatus: `partial`
- dataConfidence: `medium`
- redFlags:
  - sin precio oficial publicado para Classic/Platinum
  - condiciones contractuales no publicadas en abierto
- pendingData:
  - precio, pagos, reembolso/cancelacion
  - incluidos/no incluidos por programa
- keyQuestions:
  - Precio oficial Classic y Platinum?
  - Politica de cancelacion y devolucion?
- importStatus: `ready_partial_import`

### 8) CESDA / URV
- nombre: CESDA / Universitat Rovira i Virgili
- slug: `cesda-urv`
- ciudad/base: Reus
- routeType: `university_plus_license`
- web oficial: https://www.cesda.com
- sourceUrl:
  - https://www.cesda.com/grado-piloto/presentacion
  - https://www.cesda.com/grado-piloto/futuros-estudiantes/financiacion
  - https://www.cesda.com/grado-piloto/futuros-estudiantes/preinscripcion-y-matricula
- precioPublicadoEUR: `0`
- precioNota: `No publica precio completo` (remite a dossier externo)
- dataStatus: `partial`
- dataConfidence: `medium`
- redFlags:
  - precio exacto no visible en pagina principal
  - normativa/reembolso no extraida aun del PDF completo
- pendingData:
  - precio oficial detallado 2026/27
  - clausulas de reembolso/cancelacion
- keyQuestions:
  - Precio total y por curso vigente?
  - Politica de devolucion tras matricula?
- importStatus: `ready_partial_import`

---

## Entidades ahora listas para importación parcial

1. Adventia (USAL)
2. European Flyers
3. AEROTEC
4. One Air
5. EAS Barcelona
6. Barcelona Flight School
7. Aerodynamics Academy
8. CESDA / URV

## Entidades que siguen bloqueadas (en esta tanda de 8)

- Ninguna bloqueada para **importacion parcial minima**.

## Motivo de bloqueo (si se exigiera importacion con precio y contrato completos)

Las 8 quedarían parcialmente bloqueadas por al menos uno de estos motivos:
- precio no publicado o no plenamente vigente/confirmado;
- ausencia de politica publica de reembolso/cancelacion;
- falta de calendario de pagos contractual detallado en abierto.

## Recomendación final (primera tanda)

- Recomendacion de importacion inicial: **6 entidades** de mayor valor y trazabilidad:
  1) Adventia (USAL)  
  2) European Flyers  
  3) One Air  
  4) EAS Barcelona  
  5) Barcelona Flight School  
  6) CESDA / URV

- Dejar en segunda tanda (tambien listas en parcial):  
  - AEROTEC (sin precio publicado)  
  - Aerodynamics Academy (sin precio publicado)

Razon: primera tanda combina mayor reconocimiento de marca + cobertura geografica + mix ATO/universitario, manteniendo riesgo controlado con `dataStatus: partial` y `pendingData` visibles.

