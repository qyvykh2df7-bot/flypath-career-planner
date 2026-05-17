# Propuesta de schema Supabase para paridad exacta con `schoolsSpain.ts`

**Fecha:** 2026-05-17  
**Alcance:** Diagnóstico y SQL propuesto. **No ejecutar** hasta revisión.  
**No modifica:** `/schools`, `schoolsSpain.ts`, comparador, mapper ni datos en producción.

---

## 1. Resumen ejecutivo

Hoy `mapSupabaseProfileToSchoolEntry()` **no puede** reconstruir un `SchoolEntry` idéntico al de `lib/schools/schoolsSpain.ts` porque:

1. Faltan columnas/tablas para copy, flags del comparador, scores, listas ordenadas y track universitario.
2. Varios campos se **derivan** con reglas distintas (p. ej. `redFlags` desde `risk_flags` por categoría, `dataConfidence` desde `data_status`, `atoName` = `school.name`).
3. El campo `id` en TS (`es-adventia-usal`) no coincide con `school_id` UUID de Supabase.
4. `universityTrack` no existe en el dataset TS actual, pero el tipo lo contempla; conviene reservar tabla.

**Recomendación:** schema **híbrido** (columnas tipadas + tablas dedicadas). Evitar un único `jsonb` como fuente de verdad si el objetivo es paridad auditable campo a campo.

**Paridad objetivo:** tras migración + seed desde `schoolsSpain.ts`, la auditoría en `/supabase-parity-audit` debería acercarse a **100%** en escuelas con `slug` coincidente (salvo `id` si se mantiene UUID interno y `legacy_entry_id` como campo de paridad).

---

## 2. Mapa campo a campo (`SchoolEntry` → Supabase actual)

| Campo `SchoolEntry` | Cobertura actual | Equivalente Supabase / notas |
|---|---|---|
| `id` | Parcial | `schools.school_id` (UUID). TS usa `es-*`. **Gap:** hace falta `legacy_entry_id`. |
| `slug` | OK | `schools.slug` |
| `name` | OK | `schools.name` |
| `routeType` | Parcial | `programs.route_type` (programa principal). Normalización distinta (`integrated_modular` → `integrated`). |
| `country` | OK | `schools.country` |
| `city` | OK | `schools.city` |
| `baseAirport` | OK | `schools.main_base` |
| `atoName` | **No** | Mapper usa `school.name`. **Gap:** columna `ato_name`. |
| `associatedUniversity` | **No** | **Gap:** columna `associated_university`. |
| `shortDescription` | Parcial | `schools.public_notes` (semántica distinta). **Gap:** `short_description`. |
| `listingCardSummary` | Parcial | Mapper copia `public_notes`. **Gap:** `listing_card_summary`. |
| `dataStatus` | OK | `schools.data_status` |
| `dataConfidence` | **No** | Se **calcula** desde `data_status`. **Gap:** columna `data_confidence` (`high`/`medium`/`low`). |
| `lastUpdatedAt` | OK | `schools.last_updated_at` |
| `advertisedPriceEUR` | Parcial | `programs.advertised_price_eur` |
| `flypathEstimatedRealCostEUR` | Parcial | `programs.estimated_real_cost_eur` |
| `depositOrEnrollmentFeeEUR` | Parcial | `costs_and_payments.deposit_or_enrollment_fee_eur` |
| `paymentScheduleSummary` | Parcial | `costs_and_payments.payment_schedule_summary` |
| `refundPolicySummary` | Parcial | `costs_and_payments.refund_policy_summary` |
| `contractAvailableBeforePayment` | Parcial | `costs_and_payments.contract_available_before_payment` |
| `financingAvailable` | Parcial | `costs_and_payments.financing_available` |
| `examFeesIncluded` | Parcial | `extras.exam_fees_status` (mapeo `included`→`yes`) |
| `skillTestsIncluded` | Parcial | `extras.skill_tests_status` |
| `trainingMaterialsIncluded` | Parcial | `extras.materials_status` |
| `accommodationIncluded` | Parcial | `extras.accommodation_status` |
| `mccJocIncluded` | **No** | Mapper fija `"unknown"`. **Gap:** `extras.mcc_joc_status` o columna en programa. |
| `advancedUprtIncluded` | **No** | Mapper fija `"unknown"`. **Gap:** `extras.advanced_uprt_status`. |
| `fleetSummary` | Parcial | Derivado de `programs.fleet` + `simulators`. **Gap:** `comparator_fleet_summary` si se quiere texto exacto. |
| `aircraftAvailability` | **No** | Mapper `"unknown"`. **Gap:** columna enum. |
| `studentAircraftRatio` | **No** | **Gap:** texto nullable. |
| `instructorStudentRatio` | **No** | **Gap:** texto nullable. |
| `languageOfInstruction` | Parcial | `programs.language` |
| `programDurationMonths` | Parcial | `programs.duration_months` |
| `class1Requirement` | Parcial | `programs.medical_required` |
| `jobSupportSummary` | **No** | Mapper `""`. **Gap:** columna texto. |
| `employmentClaimsType` | **No** | Mapper `"unknown"`. **Gap:** columna enum. |
| `scores.*` (6) | **No** | Mapper pone 5×`0` + score derivado. **Gap:** tabla `school_scores`. |
| `redFlags` | **No exacto** | Derivado de `risk_flags` con reglas. **Gap:** lista ordenada dedicada. |
| `pendingData` | **No exacto** | Solo categorías `PENDING_RISK_CATEGORIES`. **Gap:** lista ordenada. |
| `keyQuestions` | **No exacto** | Solo `question_to_school` de flags. **Gap:** lista ordenada. |
| `excludedFromPublicComparator` | **No** | 18 escuelas en TS. **Gap:** columnas boolean + nota. |
| `comparatorExclusionNote` | **No** | **Gap:** texto nullable. |
| `universityTrack` | **No** | No usado en TS hoy; tipo existe. **Gap:** tabla `university_tracks`. |

---

## 3. Campos faltantes o mal cubiertos (lista priorizada)

### Críticos (rompen paridad y comportamiento del comparador)

1. `scores` (los 6 subcampos + no recalcular desde `data_status`)
2. `redFlags`, `pendingData`, `keyQuestions` (texto y orden exactos)
3. `dataConfidence` (independiente de `data_status`)
4. `excludedFromPublicComparator` + `comparatorExclusionNote`
5. `atoName`, `shortDescription`, `listingCardSummary`
6. `employmentClaimsType`, `jobSupportSummary`
7. `mccJocIncluded`, `advancedUprtIncluded`
8. `legacy_entry_id` (paridad del campo `id` de TS)

### Importantes (afectan fichas y ranking)

9. `associatedUniversity`
10. `aircraftAvailability`, `studentAircraftRatio`, `instructorStudentRatio`
11. Precios y pagos del programa principal (validar que cada slug tenga filas `programs` + `costs` + `extras` alineadas)
12. `fleetSummary` literal (opcional: override `comparator_fleet_summary` vs seguir concatenando fleet+sim)

### Reservados / futuro

13. `universityTrack` (objeto; 0 filas en TS hoy, 6× `associatedUniversity`)

---

## 4. Decisión de schema recomendada

| Opción | Uso recomendado |
|---|---|
| **A) Columnas en `schools`** | Identidad comparador, copy, flags exclusión, ratios, empleo, `data_confidence`, `legacy_entry_id` |
| **B) Tabla `school_scores`** | 1 fila por escuela, 6 enteros — **sí** |
| **C) Tabla listas de texto** | `school_text_list_items` con `list_type` + `sort_index` — **sí** (paridad exacta de arrays) |
| **D) Tabla `university_tracks`** | 0..1 por escuela — **sí** (tipo ya definido en TS) |
| **E) JSONB** | Solo como respaldo opcional (`school_entry_snapshot jsonb`) para auditoría diff, **no** como fuente primaria |

**No sustituir** `risk_flags` por las listas: mantener `risk_flags` para investigación; las listas del comparador son la fuente de verdad para paridad con TS.

**Nivel programa vs escuela:** En TS todo vive en un único `SchoolEntry` por slug (programa principal implícito). Recomendación:

- Campos de **programa principal** → actualizar filas existentes en `programs` / `costs_and_payments` / `extras` donde `is_main_program = true`.
- Campos **solo de escuela** o **snapshot comparador** → `schools` + `school_scores` + listas.

---

## 5. SQL propuesto (migración — NO EJECUTAR)

```sql
-- =============================================================================
-- FlyPath: paridad SchoolEntry ↔ schoolsSpain.ts
-- Versión: 2026-05-17 (propuesta, no aplicada)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- A) Extensión tabla schools
-- -----------------------------------------------------------------------------
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS legacy_entry_id text,
  ADD COLUMN IF NOT EXISTS ato_name text,
  ADD COLUMN IF NOT EXISTS associated_university text,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS listing_card_summary text,
  ADD COLUMN IF NOT EXISTS data_confidence text
    CHECK (data_confidence IS NULL OR data_confidence IN ('high', 'medium', 'low')),
  ADD COLUMN IF NOT EXISTS excluded_from_public_comparator boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS comparator_exclusion_note text,
  ADD COLUMN IF NOT EXISTS aircraft_availability text
    CHECK (aircraft_availability IS NULL OR aircraft_availability IN ('high', 'medium', 'low', 'unknown')),
  ADD COLUMN IF NOT EXISTS student_aircraft_ratio text,
  ADD COLUMN IF NOT EXISTS instructor_student_ratio text,
  ADD COLUMN IF NOT EXISTS job_support_summary text,
  ADD COLUMN IF NOT EXISTS employment_claims_type text
    CHECK (
      employment_claims_type IS NULL OR employment_claims_type IN (
        'none', 'vague', 'clear_non_guaranteed', 'guaranteed_claimed', 'unknown'
      )
    );

CREATE UNIQUE INDEX IF NOT EXISTS schools_legacy_entry_id_key
  ON public.schools (legacy_entry_id)
  WHERE legacy_entry_id IS NOT NULL;

COMMENT ON COLUMN public.schools.legacy_entry_id IS
  'ID estable de SchoolEntry en schoolsSpain.ts (ej. es-adventia-usal). Paridad con campo id TS.';
COMMENT ON COLUMN public.schools.short_description IS
  'Copy ficha/comparador; no confundir con public_notes operativas.';

-- -----------------------------------------------------------------------------
-- B) Tabla school_scores (1:1 con schools)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_scores (
  school_id uuid PRIMARY KEY REFERENCES public.schools (school_id) ON DELETE CASCADE,
  document_transparency smallint NOT NULL DEFAULT 0,
  cost_clarity smallint NOT NULL DEFAULT 0,
  financial_risk smallint NOT NULL DEFAULT 0,
  commercial_risk smallint NOT NULL DEFAULT 0,
  operational_solidity smallint NOT NULL DEFAULT 0,
  data_confidence_score smallint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT school_scores_nonneg CHECK (
    document_transparency >= 0 AND cost_clarity >= 0 AND financial_risk >= 0
    AND commercial_risk >= 0 AND operational_solidity >= 0 AND data_confidence_score >= 0
  )
);

-- -----------------------------------------------------------------------------
-- C) Listas ordenadas: redFlags, pendingData, keyQuestions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_text_list_items (
  item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools (school_id) ON DELETE CASCADE,
  list_type text NOT NULL CHECK (list_type IN ('red_flags', 'pending_data', 'key_questions')),
  sort_index integer NOT NULL CHECK (sort_index >= 0),
  item_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, list_type, sort_index)
);

CREATE INDEX IF NOT EXISTS school_text_list_items_school_list_idx
  ON public.school_text_list_items (school_id, list_type, sort_index);

-- -----------------------------------------------------------------------------
-- D) University track (0..1 por escuela)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.university_tracks (
  school_id uuid PRIMARY KEY REFERENCES public.schools (school_id) ON DELETE CASCADE,
  university_name text NOT NULL,
  degree_type text NOT NULL,
  degree_name text NOT NULL,
  academic_duration_years numeric(4,1) NOT NULL,
  ects integer NOT NULL,
  license_included_mode text NOT NULL,
  actual_license_outcome text NOT NULL,
  partner_ato text NOT NULL,
  academic_cost_eur integer NOT NULL DEFAULT 0,
  flight_cost_eur integer NOT NULL DEFAULT 0,
  total_estimated_cost_eur integer NOT NULL DEFAULT 0,
  class1_failure_policy text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Extras: MCC/JOC y UPRT (mismo vocabulario que exam_fees_status)
-- -----------------------------------------------------------------------------
ALTER TABLE public.extras
  ADD COLUMN IF NOT EXISTS mcc_joc_status text,
  ADD COLUMN IF NOT EXISTS mcc_joc_notes text,
  ADD COLUMN IF NOT EXISTS advanced_uprt_status text,
  ADD COLUMN IF NOT EXISTS advanced_uprt_notes text;

-- Opcional: texto exacto de fleetSummary en programa principal
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS comparator_fleet_summary text;

-- Opcional: snapshot JSON para auditoría / rollback (no fuente primaria)
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS school_entry_snapshot jsonb;

COMMIT;
```

### Vocabulario `extras.*_status` (alinear con mapper)

Valores ya usados: `included`, `not_included`, `partial`, `not_applicable`, `unknown`, `yes`, `no`.  
El seed desde TS debe escribir el equivalente que el mapper mapee a `yes`/`no`/`optional`/`unknown`.

---

## 6. Estrategia de importación desde `schoolsSpain.ts`

### Enfoque recomendado

Script Node/TS **temporal** (p. ej. `scripts/seed-school-entry-parity-from-spain.ts`):

1. `import { schoolsSpainDataset } from '@/lib/schools/schoolsSpain'`
2. Por cada `entry`, resolver `schools` por **`slug`** (no por UUID).
3. `UPSERT` columnas nuevas en `schools`.
4. Resolver `mainProgram` (`is_main_program = true` o crear si falta).
5. `UPSERT` `costs_and_payments` y `extras` del programa principal.
6. `UPSERT` `school_scores`.
7. `DELETE` + `INSERT` ordenado en `school_text_list_items` (3 listas).
8. `UPSERT` / `DELETE` `university_tracks` si `entry.universityTrack` existe.

**No borrar** `risk_flags` existentes; conviven con las listas del comparador.

### Pseudocódigo de mapeo

```ts
for (const entry of schoolsSpainDataset) {
  const school = await getSchoolBySlug(entry.slug);
  if (!school) { reportMissingSlug(entry); continue; }

  await updateSchool(school.school_id, {
    legacy_entry_id: entry.id,
    ato_name: entry.atoName,
    associated_university: entry.associatedUniversity ?? null,
    short_description: entry.shortDescription,
    listing_card_summary: entry.listingCardSummary ?? null,
    data_status: entry.dataStatus,
    data_confidence: entry.dataConfidence,
    last_updated_at: entry.lastUpdatedAt,
    excluded_from_public_comparator: entry.excludedFromPublicComparator ?? false,
    comparator_exclusion_note: entry.comparatorExclusionNote ?? null,
    aircraft_availability: entry.aircraftAvailability,
    student_aircraft_ratio: entry.studentAircraftRatio ?? null,
    instructor_student_ratio: entry.instructorStudentRatio ?? null,
    job_support_summary: entry.jobSupportSummary,
    employment_claims_type: entry.employmentClaimsType,
    school_entry_snapshot: entry, // opcional
  });

  const programId = await ensureMainProgram(school.school_id, entry);
  await upsertCosts(programId, entry);
  await upsertExtras(programId, entry); // incl. mcc/uprt

  await upsertSchoolScores(school.school_id, entry.scores);
  await replaceTextLists(school.school_id, 'red_flags', entry.redFlags);
  await replaceTextLists(school.school_id, 'pending_data', entry.pendingData);
  await replaceTextLists(school.school_id, 'key_questions', entry.keyQuestions);

  if (entry.universityTrack) await upsertUniversityTrack(school.school_id, entry.universityTrack);
}
```

### Helpers de conversión enum → Supabase

| TS | Columna extras / costs |
|---|---|
| `examFeesIncluded: "yes"` | `exam_fees_status: 'included'` |
| `contractAvailableBeforePayment: "partial"` | `contract_available_before_payment: 'partial'` |
| `financingAvailable: "yes"` | `financing_available: 'yes'` |

### SQL alternativo (solo listas, vía staging)

Si prefieres SQL puro para listas después del seed TS:

```sql
-- Ejemplo: insertar red flags (repetir por escuela y list_type)
-- INSERT INTO school_text_list_items (school_id, list_type, sort_index, item_text)
-- SELECT s.school_id, 'red_flags', 0, 'Texto exacto...'
-- FROM schools s WHERE s.slug = 'adventia-usal';
```

Generar esos `INSERT` con un script que exporte CSV desde `schoolsSpain.ts` es más mantenible que SQL manual.

---

## 7. Orden recomendado de ejecución

| Paso | Acción | Verificación |
|---|---|---|
| 1 | Backup Supabase (schema + datos) | — |
| 2 | Ejecutar migración SQL (sección 5) en staging | `\d schools`, tablas nuevas |
| 3 | Ejecutar script seed desde `schoolsSpain.ts` en staging | Conteos por tabla |
| 4 | Abrir `/supabase-parity-audit` | Paridad % y diffs por slug |
| 5 | Ajustar mapper (`mapSupabaseProfileToSchoolEntry`) para leer nuevas columnas/tablas | Misma auditoría → ~100% |
| 6 | Probar `/schools-supabase` (ya existe) sin tocar `/schools` | Comparación visual |
| 7 | Solo cuando paridad ≥ umbral acordado: planificar switch en `/schools` | QA manual + móvil |

---

## 8. Criterios de “listo para sustituir”

Supabase estará listo para sustituir `schoolsSpain.ts` **sin cambiar datos visibles** cuando:

- [ ] 38/38 slugs de TS existen en `schools` (o decisión documentada de slugs solo en BD).
- [ ] `/supabase-parity-audit` ≥ **95%** paridad en campos comparables por escuela activa.
- [ ] `redFlags` / `pendingData` / `keyQuestions`: **0** textos solo en local para escuelas comparables.
- [ ] `scores.*` y `dataConfidence` coinciden literalmente.
- [ ] Escuelas con `excludedFromPublicComparator: true` quedan excluidas igual que hoy.
- [ ] Mapper actualizado lee las nuevas fuentes (paso posterior al schema + seed).

---

## 9. Riesgos y decisiones abiertas

1. **`id` vs UUID:** Mantener UUID interno y usar `legacy_entry_id` para paridad TS, o cambiar `SchoolEntry.id` a slug en el futuro.
2. **`risk_flags` vs listas:** Dos fuentes; definir en mapper prioridad: `school_text_list_items` > derivación de `risk_flags`.
3. **Escuelas excluidas en TS pero `status=active` en BD:** El seed debe forzar `excluded_from_public_comparator` aunque sigan activas para investigación.
4. **`fleetSummary`:** ¿Override literal en `programs.comparator_fleet_summary` o seguir `fleet`+`simulators`?
5. **Programas no principales:** Paridad solo del main program; rutas modulares siguen en `modular_modules` (fuera de `SchoolEntry` actual).

---

## 10. Archivos de referencia en el repo

| Archivo | Rol |
|---|---|
| `types/schools.ts` | Contrato `SchoolEntry` |
| `lib/schools/schoolsSpain.ts` | Fuente de verdad actual (38 entradas) |
| `lib/schoolMapper.ts` | Mapeo actual (gaps documentados) |
| `lib/schoolQueries.ts` | Schema implícito actual |
| `lib/schools/supabaseParityAudit.ts` | Motor de diff |
| `app/supabase-parity-audit/page.tsx` | Informe visual |

---

## 11. Conclusión

**Supabase no está listo hoy** para sustituir `schoolsSpain.ts` sin cambios de schema y seed.  
Con la migración propuesta + importación desde TS + ajuste posterior del mapper, la paridad exacta es **alcanzable** manteniendo `risk_flags` y el modelo relacional existente.

**Siguiente paso sugerido (cuando apruebes):** implementar `scripts/seed-school-entry-parity-from-spain.ts` y actualizar `mapSupabaseProfileToSchoolEntry` en una rama aparte, validando con `/supabase-parity-audit`.
