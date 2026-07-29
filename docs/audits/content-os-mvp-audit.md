# Auditoría independiente — Fase 12A Content OS PilotFeliu MVP

**Fecha:** 2026-07-29
**Alcance:** auditoría local previa a aplicar `20260729120000_create_content_os_pilotfeliu_mvp.sql` en Supabase remoto.
**Resultado original:** **APROBADO CON CAMBIOS**

La implementación es segura para permanecer local y está preparada para QA. Las observaciones MINOR de este informe quedaron corregidas localmente en una revisión posterior; la migración sigue pendiente de revisión final y de aplicación remota.

## Seguimiento de observaciones MINOR

- **Aislamiento de calendario:** `content_calendar_events` incorpora `workspace_key = 'pilotfeliu'`, un check cerrado, un índice por workspace y fecha, y todas las operaciones server-side se limitan a ese workspace.
- **Promoción editorial:** una idea `discarded` ya no puede crear una pieza. La capa server-side corta la operación y la RPC mantiene la comprobación dentro de su transacción. Una promoción ya realizada conserva su retorno idempotente.
- **Reejecución nominal de DDL:** las constraints nuevas sobre `content_items` y su FK se protegen por nombre mediante bloques `DO`, ya que PostgreSQL no ofrece `ADD CONSTRAINT IF NOT EXISTS`.
- **Límites de longitud:** PostgreSQL valida ahora los máximos críticos de ideas, piezas, eventos y métricas, alineados con `content-os-contract.ts` y los formularios.
- **Campos editoriales diferidos:** audiencia, estructura, cámara, planos, edición, copy, hashtags y retención permanecen fuera de 12A por decisión explícita de alcance; se documentan en la especificación maestra, no se han descartado.

## Archivos revisados

- `docs/ai/content-os/pilotfeliu-content-os-command-center.md`
- `ROADMAP.md`
- `CURRENT_PHASE.md`
- `ACTIVE_TASK.md`
- `LAST_SESSION.md`
- `supabase/migrations/20260729120000_create_content_os_pilotfeliu_mvp.sql`
- `lib/warhome/content-os-contract.ts`
- `lib/warhome/content-os.ts`
- `app/warhome/(protected)/content/actions.ts`
- `components/warhome/content/ContentCalendar.tsx`
- `components/warhome/content/ContentCalendarEventForm.tsx`
- `components/warhome/content/ContentIdeaWorkspace.tsx`
- `components/warhome/content/ContentItemForm.tsx`
- `components/warhome/content/ContentLibrary.tsx`
- `components/warhome/content/ContentMetricsPanel.tsx`
- `components/warhome/content/ContentOsTabs.tsx`
- `lib/warhome/auth.ts`
- `app/warhome/(protected)/layout.tsx`
- `lib/warhome/navigation.ts`

## 1. Modelo de datos

### `content_items`

**Estado: OK.**

La migración reutiliza el catálogo existente creado por `20260711270000_create_content_items.sql`. Añade `workspace_key`, relación opcional con `content_ideas`, plataforma, objetivo, categoría, hook, guion, CTA, notas, fechas previstas y estado de propuesta.

Correcto:

- no se crea una segunda tabla de piezas;
- `source_idea_id` tiene FK a `content_ideas` y un índice único parcial;
- los valores de plataforma, objetivo, categoría y estados están cerrados mediante checks;
- las fechas de grabación y publicación mantienen orden válido;
- se mantienen los checks existentes de publicación y archivado;
- los índices cubren workspace, estado, plataforma y fecha de publicación.

Seguimiento resuelto localmente:

- las constraints nombradas de `content_items` y su FK se protegen con comprobaciones de existencia; la migración conserva su transacción y soporta una reejecución nominal;
- PostgreSQL ya impone los límites críticos del contrato para contenido y métricas;
- el modelo MVP no incluye todavía audiencia, cámara, planos, edición, copy, hashtags ni retención. Es una limitación de alcance documentada, no un riesgo de seguridad.

### `content_ideas`

**Estado: OK.**

Incluye título, descripción, categoría, plataforma, objetivo, estado, estado de propuesta, autoría y timestamps. Los checks impiden valores editoriales desconocidos y textos vacíos. La relación idea → pieza se resuelve desde `content_items.source_idea_id`.

### `content_calendar_events`

**Estado: OK.**

Incluye bloques `record`, `edit` y `publish`, fechas con `ends_at > starts_at`, zona horaria, notas, propuesta y autoría. Tiene índices por fecha, pieza y estado de propuesta.

El calendario usa un `workspace_key` cerrado a `pilotfeliu`; las lecturas, altas, ediciones, movimientos y borrados se acotan a esa clave. Cuando un bloque se asocia a una pieza, una FK compuesta exige que ambas pertenezcan al mismo workspace. Los bloques independientes permanecen permitidos dentro de PilotFeliu.

### `content_metrics`

**Estado: OK para el MVP.**

Contiene snapshots manuales por pieza y fecha, con unicidad `(content_item_id, recorded_on)`, checks no negativos, FK con `ON DELETE CASCADE` e índices por fecha y pieza. La capa muestra el snapshot más reciente y conserva el histórico sin sumarlo artificialmente.

La capa server-only comprueba que la pieza pertenece a `workspace_key = 'pilotfeliu'` antes de insertar métricas. La tabla no tiene workspace propio, pero la relación con la pieza cubre el límite actual.

## 2. Seguridad y permisos

**Estado: OK.**

- Las páginas privadas están bajo `app/warhome/(protected)/layout.tsx`.
- La autorización usa `getUser()` server-side y consulta `admin_users` para exigir rol `admin` u `owner` activo.
- `lib/warhome/content-os.ts` importa `server-only` y usa `getSupabaseAdmin()` únicamente en servidor.
- Las Server Actions importan la capa server-only; los componentes cliente no reciben service role ni cliente Supabase.
- `content_ideas`, `content_calendar_events` y `content_metrics` habilitan RLS.
- La migración revoca permisos a `PUBLIC`, `anon` y `authenticated`, y concede operaciones a `service_role`.
- `content_items` ya tenía RLS activa y sin policies para clientes en su migración base; la extensión no abre lectura pública.
- Los DTOs devueltos por la capa son cerrados y no incluyen metadata de Auth, tokens, payloads ni secretos.
- Los errores visibles son genéricos y las acciones no devuelven detalles de Supabase.

No se encontró una ruta pública, importación de cliente admin ni acceso directo desde navegador a estas tablas.

## 3. RPC `promote_content_os_idea`

**Estado: OK.**

La función:

- es `SECURITY DEFINER`;
- fija `search_path = public, pg_temp`;
- exige un usuario activo con rol `admin` u `owner`;
- bloquea la idea con `FOR UPDATE`;
- devuelve una pieza ya existente si la relación única ya existe;
- crea idea → pieza e idea → estado `production` dentro de la misma transacción;
- está revocada para `PUBLIC`, `anon` y `authenticated` y solo tiene `EXECUTE` para `service_role`.

La unicidad parcial de `source_idea_id` y el bloqueo de la idea hacen que dos promociones concurrentes sean idempotentes.

La capa server-side y la RPC rechazan ahora una idea `discarded` antes de crear una pieza. La comprobación de la RPC ocurre tras bloquear la fila; una promoción que ya existiera sigue devolviendo su pieza para conservar idempotencia.

## 4. Integración con Warhome

**Estado: OK.**

La navegación incorpora `Content OS` en `/warhome/content`. Las superficies implementadas son:

- `/warhome/content`: calendario semanal y mensual;
- `/warhome/content/ideas`: banco de ideas;
- `/warhome/content/library`: biblioteca;
- `/warhome/content/library/new`: alta de pieza;
- `/warhome/content/library/[contentId]`: ficha, calendario asociado y métricas.

La autorización se delega al layout protegido existente y cada lectura/escritura vuelve a exigir autorización en la capa de datos. La navegación, el loading, los estados vacíos, los errores genéricos y los patrones visuales siguen el shell actual.

El arrastre del calendario es una mejora de escritorio; en móvil existe edición explícita de fecha y hora. Las fechas `datetime-local` se normalizan a `Europe/Madrid` antes de persistirse.

## 5. Funcionalidad MVP

| Capacidad | Estado | Evidencia |
|---|---|---|
| Banco de ideas | OK | Alta, edición y estados cerrados |
| Idea → contenido | OK | RPC atómica e idempotente |
| Biblioteca | OK | Listado, estados, plataforma, objetivo y métricas recientes |
| Calendario semanal | OK | Vista por defecto, navegación y movimiento |
| Calendario mensual | OK | Rejilla mensual y navegación |
| Eventos de grabación/edición/publicación | OK | Tipo cerrado en contrato y SQL |
| Ficha de contenido | OK | Hook, guion, CTA, fechas, estado y notas |
| Métricas manuales | OK | Snapshots por día con histórico |
| Roster | Pendiente | Preparado conceptualmente, no implementado |
| Agentes IA | Pendiente | Contrato de propuesta preparado, sin agentes activos |
| APIs externas de plataformas | Pendiente | Fuera del MVP |

## 6. Hallazgos por severidad

### CRITICAL

Ninguno.

### MAJOR

Ninguno.

### MINOR

No quedan hallazgos MINOR bloqueantes en la implementación local. Los campos editoriales de segunda fase (audiencia, cámara, planos, edición, copy, hashtags y retención) siguen diferidos por alcance, según la especificación maestra.

### OK

- acceso privado y autorización Warhome;
- RLS y ACL cerradas para las tablas nuevas;
- service role aislado del navegador;
- FK, checks, índices y timestamps principales;
- atomicidad e idempotencia de promoción;
- separación de ideas, piezas, eventos y métricas;
- ausencia de acceso público, pagos, CRM, marketing o automatizaciones nuevas;
- compatibilidad con el shell existente de Warhome;
- estados vacíos y errores genéricos.

## 7. Verificaciones realizadas

La implementación local ya tenía las siguientes validaciones y las he contrastado durante la auditoría:

- suite completa: 796 tests correctos;
- TypeScript: correcto;
- lint focalizado: correcto;
- build Webpack: correcto;
- `git diff --check`: correcto.

Estas comprobaciones no sustituyen una validación de esquema remoto ni QA con datos sintéticos.

## 8. Recomendaciones antes de aplicar en remoto

1. Confirmar en remoto que `content_items` existe exactamente con la migración base `20260711270000`, sus checks existentes y RLS activa.
2. Comprobar que no existen ya las constraints o tablas de la migración 12A con nombres parcialmente creados.
3. Aplicar la migración en un flujo trazable y verificar ACL, RLS, índices, FK y RPC.
4. Ejecutar QA sintético de alta, edición, promoción concurrente, calendario, borrado de evento y upsert de métricas.
5. Mantener roster, agentes IA, integraciones externas y automatizaciones fuera de esta aplicación remota hasta sus bloques correspondientes.

## 9. Veredicto

**APROBADO PARA APLICAR, PENDIENTE DE VERIFICACIÓN REMOTA.**

No hay hallazgos críticos, mayores ni menores bloqueantes y la migración no muestra una vía pública de acceso ni una ruptura inmediata del MVP. Antes de aplicar en Supabase remoto solo deben confirmarse las precondiciones remotas, aplicar de forma trazable y ejecutar QA sintético.

## Estado de cambios

- Archivo creado: `docs/audits/content-os-mvp-audit.md`.
- Archivos de código modificados: ninguno.
- Migraciones modificadas: ninguna.
- Migración remota aplicada: no.
- Commit o push: no.
