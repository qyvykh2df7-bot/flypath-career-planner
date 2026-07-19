# Fase 9: contrato de catálogo y diseño de opiniones de escuelas

**Estado:** 9A completado localmente; el hardening `20260712130000` está pendiente de aplicar.

## 1. Decisiones cerradas de 9A

- `schools` y las tablas relacionadas son un catálogo editorial; no son una API pública por
  columnas.
- El navegador solo consume `PublicSchoolEntry` desde `GET /api/schools/catalog`. La ruta usa
  una capa `server-only` y el cliente de servicio de Supabase; los fallos vuelven al dataset
  local `schoolsSpain.ts`.
- `internal_notes`, `school_entry_snapshot`, `comparator_exclusion_note` y `sources.notes` son
  editoriales o internas. No forman parte del DTO, de la respuesta JSON ni de las fichas
  públicas. `sources.notes` queda clasificada como **editorial/interna** hasta que producto
  defina una versión pública distinta.
- El flag editorial de exclusión se aplica antes de formar la respuesta. No se serializa al
  navegador. Los slugs públicos y sus alias se conservan a través del mapper existente.
- `school_scores` sigue siendo editorial y separado de las futuras opiniones: no contiene ni
  calculará valoración de alumnos.

## 2. Fuente pública y fuente editorial

| Capa | Acceso | Uso |
| --- | --- | --- |
| `lib/schools/public-school-catalog.ts` | Solo servidor | Construye y reduce el catálogo al contrato público cerrado. |
| `GET /api/schools/catalog` | Público | Entrega únicamente escuelas comparables y datos usados por `SchoolEntry`. |
| `lib/schoolQueries.ts` y `lib/schoolMapper.ts` | `server-only`, `service_role` | Lectura editorial, mapeo y herramientas internas. Nunca se importan desde la página cliente del comparador. |
| Tablas base `public.*` | Solo `service_role` tras 20260712130000 | Fuente de datos sin acceso directo de `anon` o `authenticated`. |
| `schoolsSpain.ts` | Fallback local | Mantiene `/schools`, comparador y Career Planner si el remoto no está activo o no responde. Las notas de exclusión ya no están en ese módulo público. |

`PublicSchoolEntry` conserva los campos de `SchoolEntry` que muestran el listado, comparador y
ficha. Excluye decisiones editoriales y cualquier clave no prevista. La API responde con
`{ schools: PublicSchoolEntry[] }` o un error genérico, sin mensajes de Supabase.

## 3. Esquema remoto observado el 2026-07-19

### Método y alcance de la captura

Se consultó el OpenAPI de PostgREST con credenciales administrativas **sin leer filas ni PII**.
También se comprobó la lectura efectiva con `anon`: antes del hardening, las diez tablas
aceptaban `SELECT`, y `schools` devolvía las columnas `internal_notes` y
`school_entry_snapshot`. Un intento de `supabase db dump --linked --schema public` no produjo
un archivo en este entorno, por lo que los nombres exactos de todas las policies y los índices
heredados que no están en migraciones locales permanecen **no verificados por catálogo**. No se
infieren en esta especificación.

En el OpenAPI, una columna incluida en `required` es obligatoria en inserciones; las demás no se
deben interpretar como `NOT NULL` solo por su representación OpenAPI. Los campos que los tipos
de consulta actuales tratan como `null` se documentan como opcionales de lectura hasta una
captura de `pg_catalog` disponible.

### Tablas y columnas

| Tabla | Clave y columnas observadas |
| --- | --- |
| `schools` | `school_id text` (identidad canónica), `slug`, `name`, `country`, `city`, `main_base`, `other_bases`, `website_url`, `logo_url`, `image_category`, `school_type`, `status`, `data_status`, `last_updated_at date`, `public_notes`, `internal_notes`, `created_at`, `updated_at`, `legacy_entry_id`, `ato_name`, `associated_university`, `short_description`, `listing_card_summary`, `data_confidence`, `excluded_from_public_comparator boolean`, `comparator_exclusion_note`, `aircraft_availability`, `student_aircraft_ratio`, `instructor_student_ratio`, `job_support_summary`, `employment_claims_type`, `school_entry_snapshot jsonb`. OpenAPI requiere `school_id`, `slug`, `name` y `excluded_from_public_comparator` al insertar. |
| `programs` | `program_id text`, `school_id text`, `program_name`, `route_type`, `program_category`, `is_main_program boolean`, precios y horas `numeric`, `language`, `bases`, `fleet`, `simulators`, requisitos, `status`, timestamps y `comparator_fleet_summary`. OpenAPI requiere `program_id`, `school_id`, `program_name`. |
| `modular_modules` | `module_id text`, `school_id text`, `program_id text`, `module_name`, `module_order integer`, `price_eur numeric`, `price_notes`, `is_required_for_route boolean`, `source_url`, timestamps. |
| `costs_and_payments` | `cost_id text`, `program_id text`, `school_id text`, disponibilidad y resúmenes de contrato, reembolso y pagos, `deposit_or_enrollment_fee_eur numeric`, financiación, inclusiones, `price_year integer`, `price_validity_notes`, timestamps. |
| `extras` | `extras_id text`, `program_id text`, `school_id text`, pares `*_status`/`*_notes` de tasas, materiales, uniforme, headset, iPad, alojamiento, transporte, médico, seguro, MCC/JOC y A-UPRT, timestamps. |
| `risk_flags` | `risk_id text`, `school_id text`, `program_id text`, `risk_category`, `risk_level`, `risk_title`, `risk_text`, `question_to_school`, `source_url`, `status`, timestamps. |
| `sources` | `source_id text`, `school_id text`, `program_id text`, `source_type`, `source_title`, `source_url`, `accessed_at date`, `published_date date`, `notes`, `reliability`, timestamps. `notes` no es público. |
| `school_scores` | `school_id text`, seis scores `smallint` (`document_transparency`, `cost_clarity`, `financial_risk`, `commercial_risk`, `operational_solidity`, `data_confidence_score`) y `updated_at timestamptz`. |
| `school_text_list_items` | `item_id uuid`, `school_id text`, `list_type`, `sort_index integer`, `item_text`, `created_at timestamptz`. |
| `university_tracks` | `track_id uuid`, `school_id text`, universidad, grado, duración `numeric`, `ects integer`, resultado de licencia, ATO, costes `integer`, política Class 1 y `updated_at timestamptz`. |

### Relaciones, constraints e índices confirmados

La migración aplicada `20260517120000_school_entry_parity_schema.sql` confirma que
`schools.school_id` es **text** y es la FK futura correcta. Confirma además:

- `school_scores.school_id` es PK y FK a `schools(school_id) ON DELETE CASCADE`.
- `school_text_list_items.school_id` es FK `ON DELETE CASCADE`; tiene único
  `(school_id, list_type, sort_index)` e índice del mismo prefijo.
- `university_tracks.school_id` es FK `ON DELETE CASCADE`, único por escuela e indexado.
- `schools_legacy_entry_id_key` es único parcial para `legacy_entry_id IS NOT NULL`.
- checks conocidos: los seis scores no negativos; `list_type` cerrado;
  `sort_index >= 0`; `data_confidence`, disponibilidad y empleo con catálogos cerrados.

Las FKs de `programs`, módulos, costes, extras, riesgos y fuentes se usan como `text` en el
contrato remoto y en las consultas actuales, pero su acción `ON DELETE`, nombres de constraints,
índices heredados y defaults deben capturarse desde `pg_catalog` antes de cambiar su DDL.

### RLS y grants reales

- **Antes de 20260712130000:** el `anon` efectivo puede seleccionar las diez tablas. La
  exposición demostrada de `schools.internal_notes` y `schools.school_entry_snapshot` confirma
  que las policies actuales no son suficientes para aislar columnas.
- `20260517120000` creó `school_scores_select_public`,
  `school_text_list_items_select_public` y `university_tracks_select_public` para `anon` y
  `authenticated`, además de `GRANT SELECT` a esos roles.
- **Después de 20260712130000:** RLS queda activado, se revoca `ALL` a `PUBLIC`, `anon` y
  `authenticated`, se eliminan policies `SELECT`/`ALL` de las diez tablas y se conserva
  `SELECT` para `service_role`. El administrador de servidor es la única fuente del catálogo.

No se han modificado datos de escuelas ni puntuaciones editoriales.

## 4. Compatibilidad de producto

- `/schools`: conserva selección, filtros y fallback local. Con la bandera pública activa usa
  solo `/api/schools/catalog`.
- `/schools/[slug]`: resuelve la misma fuente segura en servidor y conserva el fallback local.
- Comparador y Career Planner siguen recibiendo `SchoolEntry`; no hay cambio de contrato visible.
- Las antiguas rutas de diagnóstico que serializaban perfiles completos redirigen a `/schools`.
- No existe ningún cambio de modelo ni mezcla con `school_scores` para opiniones.

## 5. Especificación de diseño para 9B: opiniones verificadas

### Reglas de producto

- No se exige cuenta para enviar una opinión, pero el email debe verificarse antes de que pase a
  moderación. Una sesión FlyPath autenticada y con email confirmado evita la verificación
  adicional y guarda `user_id` opcional.
- Una opinión activa por email verificado y `school_id`; un usuario autenticado no puede tener
  dos opiniones activas para la misma escuela. No se crea lead ni suscripción de marketing.
- La identidad pública es `Alumno verificado` u `Opinión anónima verificada`. Nunca se muestra
  nombre completo ni email. Se pueden mostrar programa, relación con la escuela y año aproximado.
- Ciclo mínimo: `awaiting_verification` → `pending` → `approved` / `rejected`; una moderación
  posterior puede marcar `hidden`; borrar inicia `deletion_requested` y termina en `deleted`.

### Tablas propuestas

1. `school_reviews`
   - `id uuid PK`, `school_id text NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT`,
     `user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL`.
   - `author_email_hash text NOT NULL` calculado en servidor con HMAC-SHA-256 del email
     normalizado; nunca usar hash sin secreto para identificar personas.
   - estado, anonimato, relación, programa, año aproximado, siete ratings `smallint CHECK 1..10`,
     respuestas cerradas y textos limitados. Timestamps de envío, verificación y moderación.
   - único parcial `(school_id, author_email_hash) WHERE status <> 'deleted'`; único parcial
     `(school_id, user_id) WHERE user_id IS NOT NULL AND status <> 'deleted'`.
2. `school_review_contacts`
   - `review_id uuid PK FK school_reviews ON DELETE CASCADE`, `email citext NOT NULL`, hash y
     timestamps. Es la única tabla que almacena email; no recibe grants públicos.
3. `school_review_tokens`
   - `id uuid PK`, `review_id FK`, `token_hash char(64) UNIQUE`, propósito cerrado
     `verify_email | manage_review`, expiración, consumo e invalidación. El token aleatorio de
     256 bits nunca se persiste en claro.
4. `school_review_versions`
   - snapshot de campos publicables y ratings, `revision`, autor de la acción y fecha. Permite
     volver a `pending` tras una edición material sin perder auditoría.
5. `school_review_moderation_events`
   - revisión, actor admin, cambio de estado, código de motivo cerrado, nota interna y fecha.

### Seguridad y operación

- Sin `INSERT`, `UPDATE` ni `DELETE` directo para `anon`/`authenticated`. Las rutas servidor
  validan payload, origen, rate limit y PII; `service_role` queda solo en servidor.
- El listado público se sirve desde un DTO/RPC que filtra exclusivamente `approved`; nunca desde
  `school_reviews` bruto. Warhome usa su autorización administrativa ya existente.
- No se usan `leads`, `email_subscriptions`, `user_events` ni `school_scores` como fuente de la
  opinión. Un evento operativo de moderación puede añadirse después, sin duplicar el contenido.
- Verificación y enlace de gestión se limitan y caducan; reenvíos y abuso requieren rate limit
  persistente/distribuido antes de producción.
- `deletion_requested` deja de ser público inmediatamente. La retención final de email, tokens y
  versiones necesita una decisión legal/producto antes de implementar borrado definitivo.

### Agregados

Las medias, distribución de estrellas y total se calculan solo sobre `approved`, mediante una
vista/RPC segura o una proyección persistida mantenida transaccionalmente. Una edición, ocultación
o borrado debe recalcular el mismo agregado. Nunca mezclar estas métricas con `school_scores`.

## 6. Secuencia propuesta de 9B

1. Migración de reviews, contactos, tokens, versiones y moderación con RLS/grants cerrados.
2. Endpoints server-side de envío, verificación y gestión segura; pruebas de idempotencia y abuso.
3. Formulario público reutilizando las categorías ya existentes, sin conectarlo hasta los pasos
   anteriores.
4. Lectura pública de opiniones aprobadas y agregados separados del comparador editorial.
5. Operación Warhome: cola, filtro, aprobación, rechazo, ocultación y motivo interno.

No se debe iniciar 9B antes de aplicar y verificar `20260712130000` en remoto.
