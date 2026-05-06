# Type Check Report - First Batch Preview

Archivo revisado:
- `data/processed/flypath_schools_spain_first_batch_preview.ts`

Tipo objetivo:
- `SchoolEntry` en `types/schools.ts`

Fecha:
- 2026-05-06

## Entidades revisadas

1. `adventia-usal`
2. `european-flyers`
3. `one-air`
4. `eas-barcelona`
5. `barcelona-flight-school`
6. `cesda-urv`

---

## Errores bloqueantes

1. **Campos extra no permitidos por `SchoolEntry` (6/6 entidades)**
   - Si se copian estos objetos directamente a un array tipado como `SchoolEntry[]`, TypeScript marcará exceso de propiedades.
   - Campos extra detectados:
     - `estimatedRealCostEUR`
     - `priceGapEUR`
     - `materialsIncluded`
     - `aircraftAvailabilitySummary`
     - `trainingLanguage`
     - `class1RequirementSummary`
     - `transparencyScore`
     - `costClarityScore`
     - `sourceUrl`
     - `sourceLabel`
     - `internalNotes`

---

## Warnings

1. **Mapeo semántico de `routeType`**
   - Algunas entidades eran conceptualmente `mixed` en investigación y se mapearon a `integrated` para compatibilidad de enum.
   - No rompe tipos, pero sí puede simplificar en exceso la realidad del programa.

2. **Valores placeholder vacíos en ratios**
   - `studentAircraftRatio` e `instructorStudentRatio` están como `""` (válido por tipo `string` opcional), pero conviene acordar convención (`""` vs no incluir campo).

3. **`dataConfidence` conservador**
   - Todas las entidades están en `low`. Es válido por tipo, pero puede ser más estricto de lo necesario para algunos casos.

---

## Verificación detallada de compatibilidad

- **Campos obligatorios de `SchoolEntry`:** presentes en todos los objetos.
  - `id`, `slug`, `name`, `routeType`, `country`, `city`, `baseAirport`, `atoName`, `shortDescription`, `dataStatus`, `lastUpdatedAt`, `dataConfidence`, `advertisedPriceEUR`, `flypathEstimatedRealCostEUR`, `depositOrEnrollmentFeeEUR`, `paymentScheduleSummary`, `refundPolicySummary`, `contractAvailableBeforePayment`, `financingAvailable`, `mccJocIncluded`, `advancedUprtIncluded`, `examFeesIncluded`, `skillTestsIncluded`, `trainingMaterialsIncluded`, `accommodationIncluded`, `fleetSummary`, `aircraftAvailability`, `languageOfInstruction`, `programDurationMonths`, `class1Requirement`, `jobSupportSummary`, `employmentClaimsType`, `scores`, `redFlags`, `pendingData`, `keyQuestions`.

- **Enums:** sin incompatibilidades detectadas.
  - `routeType`: `integrated` / `university_plus_license` (válidos)
  - `dataStatus`: `partial` (válido)
  - `dataConfidence`: `low` (válido)
  - `contractAvailableBeforePayment`: `unknown` (válido)
  - `financingAvailable`: `yes` / `unknown` (válidos)
  - `employmentClaimsType`: `unknown` / `vague` / `guaranteed_claimed` (válidos)
  - `aircraftAvailability`: `unknown` (válido)

- **Tipos primitivos:** sin incompatibilidades detectadas.
  - Números como número: correcto (`advertisedPriceEUR`, `programDurationMonths`, etc.)
  - Arrays de strings: correcto (`redFlags`, `pendingData`, `keyQuestions`)
  - Strings donde corresponde: correcto

- **Duplicados:**
  - `slug` duplicados: **no**
  - `id` duplicados: **no**

---

## Campos a eliminar antes de importar

- `estimatedRealCostEUR`
- `priceGapEUR`
- `materialsIncluded`
- `aircraftAvailabilitySummary`
- `trainingLanguage`
- `class1RequirementSummary`
- `transparencyScore`
- `costClarityScore`
- `sourceUrl`
- `sourceLabel`
- `internalNotes`

---

## Campos a añadir antes de importar

- **Ninguno obligatorio faltante** según el `SchoolEntry` actual.

---

## ¿Está listo para copiar a `schoolsSpain.ts`?

**Aún no, en estado actual.**

Motivo:
- Tiene campos extra que bloquearán type-check si se copia directamente a estructura tipada como `SchoolEntry[]`.

Estado tras ajuste mínimo:
- **Sí quedaría listo** si se eliminan los campos extra listados arriba (sin inventar ni recalcular datos).

