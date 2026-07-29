# Auditoría final independiente — Content OS PilotFeliu MVP

**Fecha:** 2026-07-29
**Alcance:** revisión final del bloque 12A antes de commit.
**Resultado:** **APROBADO**

## Resumen ejecutivo

El MVP implementado respeta el alcance funcional aprobado: calendario editorial semanal y mensual, banco de ideas, biblioteca, ficha de contenido, métricas manuales e integración privada dentro de Warhome.

La arquitectura mantiene el patrón existente de FlyPath: páginas Server Component protegidas por Warhome, acciones server-only, DTOs cerrados, acceso a Supabase mediante `service_role` y una RPC `SECURITY DEFINER` para la promoción atómica de ideas. La migración se aplicó en Supabase remoto y el QA sintético confirmó creación, edición, promoción idempotente, aislamiento de calendario, métricas, rechazo de ideas descartadas, autorización y limpieza de datos de prueba.

No se observan hallazgos críticos, mayores ni bloqueos documentales después de actualizar el estado de la migración y la validación.

## 1. Cumplimiento funcional

| Requisito | Estado | Evidencia |
|---|---|---|
| Calendario semanal | OK | `/warhome/content`, `ContentCalendar` y parámetros de semana |
| Calendario mensual | OK | Vista mensual de `ContentCalendar` y parámetros de mes |
| Banco de ideas | OK | `/warhome/content/ideas`, `ContentIdeaWorkspace` |
| Estados de ideas | OK | `new`, `approved`, `production`, `published`, `discarded` |
| Promoción idea → contenido | OK | Acción server-side y RPC transaccional idempotente |
| Biblioteca | OK | `/warhome/content/library`, `ContentLibrary` |
| Ficha de contenido | OK | `/warhome/content/library/[contentId]`, `ContentItemForm` |
| Calendario asociado a piezas | OK | `ContentCalendarEventForm` y FK compuesta por workspace |
| Métricas manuales | OK | `ContentMetricsPanel`, snapshots por pieza y fecha |
| Integración Warhome | OK | Navegación activa y rutas bajo el shell protegido |
| Roster | Fuera de MVP | Preparado conceptualmente, no implementado |
| Agentes IA reales | Fuera de MVP | Solo existen campos de propuesta; no hay ejecución de agentes |
| APIs externas o publicación automática | Fuera de MVP | No se han añadido integraciones sociales ni automatizaciones |

La interfaz mantiene el calendario como pantalla principal y ofrece accesos coherentes a ideas, biblioteca y nueva pieza. Los estados vacíos y de error tienen presentación propia; no se exponen errores de Supabase al usuario.

## 2. Arquitectura revisada

### Rutas y componentes

- `app/warhome/(protected)/content/page.tsx`: calendario.
- `app/warhome/(protected)/content/ideas/page.tsx`: banco de ideas.
- `app/warhome/(protected)/content/library/page.tsx`: biblioteca.
- `app/warhome/(protected)/content/library/new/page.tsx`: alta de piezas.
- `app/warhome/(protected)/content/library/[contentId]/page.tsx`: detalle y métricas.
- `app/warhome/(protected)/content/actions.ts`: Server Actions con validación de entrada, revalidación y mensajes genéricos.
- `components/warhome/content/*`: componentes de calendario, ideas, biblioteca, ficha, métricas, navegación interna y estados vacíos.

Las páginas no importan helpers de navegador para acceder a datos privados. La capa `lib/warhome/content-os.ts` declara `server-only`, centraliza el acceso y devuelve contratos cerrados definidos en `lib/warhome/content-os-contract.ts`.

### Supabase y migración

La migración `supabase/migrations/20260729120000_create_content_os_pilotfeliu_mvp.sql`:

- reutiliza `public.content_items` en lugar de duplicar la biblioteca;
- añade columnas y constraints específicas de Content OS a las piezas del workspace `pilotfeliu`;
- crea `content_ideas`, `content_calendar_events` y `content_metrics`;
- limita plataformas, objetivos, categorías, estados y tipos de evento mediante checks;
- aplica límites de longitud alineados con el contrato TypeScript;
- impone fechas válidas y métricas no negativas;
- mantiene unicidad de una métrica por pieza y fecha;
- añade índices para workspace, estado, plataforma, calendario y métricas;
- mantiene la promoción de ideas atómica mediante `promote_content_os_idea`.

La migración fue aplicada en Supabase remoto. El QA sintético posterior comprobó las tablas, constraints, RLS, ACL, RPC, flujo de ideas, biblioteca, calendario, métricas y rollback de los datos sintéticos.

## 3. Seguridad

### Autorización de aplicación

Todas las lecturas y escrituras de `lib/warhome/content-os.ts` comienzan con `requireWarhomeAdmin()`. La autorización usa `auth.getUser()` server-side y después verifica en `admin_users` que la cuenta está activa y tiene rol `admin` u `owner`.

Las Server Actions no aceptan `user_id`, `workspace_key` ni permisos desde el navegador. El usuario autenticado se obtiene server-side y se utiliza para auditoría (`created_by`/`updated_by`).

### Base de datos

- `content_ideas`, `content_calendar_events` y `content_metrics` tienen RLS habilitada.
- Se revocó el acceso a `PUBLIC`, `anon` y `authenticated`.
- Las operaciones se conceden únicamente a `service_role`.
- `content_items` hereda la RLS cerrada y los grants de su migración base.
- La RPC usa `SECURITY DEFINER`, fija `search_path = public, pg_temp`, verifica el administrador activo y tiene `EXECUTE` revocado para clientes públicos y autenticados.
- No se almacenan secretos, tokens ni credenciales en las entidades de Content OS.
- Los errores de acciones se transforman en mensajes genéricos; los logs no incluyen payloads completos.

### Promoción idempotente y concurrencia

La RPC bloquea la idea con `FOR UPDATE`, rechaza una idea descartada antes de crear una pieza y devuelve la pieza existente cuando la promoción ya se completó. La unicidad parcial de `source_idea_id` evita duplicados persistentes. La capa server-side repite la validación para dar un fallo temprano y conserva la idempotencia ante una promoción ya realizada.

## 4. Integridad y relaciones

| Relación | Resultado |
|---|---|
| Idea → pieza | FK opcional `source_idea_id`, única cuando existe, `ON DELETE SET NULL` |
| Evento → pieza | FK compuesta `(content_item_id, workspace_key)` para evitar cruzar el workspace |
| Métrica → pieza | FK a `content_items`, `ON DELETE CASCADE`; acceso de aplicación validado contra `pilotfeliu` |
| Auditoría → usuario | `created_by` y `updated_by` referencian `auth.users` con `ON DELETE SET NULL` |
| Promoción repetida | Idempotente por idea de origen |

La separación de calendario es explícita: el workspace está fijado a `pilotfeliu` tanto en la capa de datos como en el contrato de aplicación. No se ha creado un sistema multiusuario ni una abstracción prematura de workspaces, coherente con la decisión de producto.

Como observación de diseño futuro, `content_ideas` y `content_metrics` no llevan una columna propia `workspace_key`. En el MVP privado de un único workspace no abre acceso público ni permite operaciones desde la aplicación fuera de piezas previamente validadas; si Content OS se amplía a más módulos o usuarios, habrá que valorar un aislamiento explícito también en esas tablas.

## 5. Calidad y consistencia del código

### Puntos confirmados

- El contrato de tipos, los parsers de formularios y los checks SQL comparten límites y vocabularios cerrados.
- Los DTOs no devuelven filas Supabase directamente.
- Los parámetros de calendario y los identificadores de detalle se validan antes de consultar.
- Las consultas relevantes filtran por `workspace_key = 'pilotfeliu'`.
- La paginación defensiva de biblioteca e ideas limita las lecturas a 300 registros por vista.
- La ruta de detalle devuelve `404` para identificadores inválidos o piezas inexistentes.
- No se observan duplicaciones de arquitectura: Content OS reutiliza `content_items`, `admin_users`, Supabase admin y el shell de Warhome.

### Observaciones no bloqueantes

1. El acceso a ideas es global dentro de la tabla `content_ideas`, aunque el módulo es deliberadamente privado y de un solo workspace. Documentado como deuda futura si se amplía el alcance.
2. La migración amplía el check global de estados de `content_items` para soportar `production`. La aplicación local y la migración remota son coherentes; cualquier futuro consumidor de `content_items` deberá usar el conjunto ampliado de estados.
3. El estado documental ya se ha alineado con la migración aplicada, el QA remoto completado y la suite actual.

## 6. Alcance y exclusiones

La revisión no encuentra implementación fuera del MVP aprobado:

- no hay agentes IA ejecutables;
- no hay llamadas a OpenAI ni APIs de plataformas;
- no hay publicación automática;
- no hay sincronización social;
- no hay automatizaciones de calendario generadas por IA;
- no hay tracking externo nuevo;
- no hay Commerce, Stripe, pagos, productos ni entitlements;
- no hay acceso público ni componente separado de Content OS.

Los campos `proposal_source` y `proposal_status` dejan preparado el contrato para propuestas futuras, pero el MVP solo crea propuestas manuales y no concede capacidad de ejecución automática.

## 7. Validación disponible

Validaciones realizadas durante la implementación y el QA remoto:

- Tests focalizados de Content OS: correctos.
- Suite completa: **823 tests correctos**.
- TypeScript: correcto.
- Lint focalizado: correcto.
- Build Webpack: correcto.
- `git diff --check`: correcto.
- Migración remota: aplicada y alineada.
- QA sintético: correcto, con rollback y sin registros residuales.

La auditoría de este documento no ejecutó una nueva mutación remota ni creó datos adicionales.

## 8. Hallazgos

| Severidad | Hallazgo | Estado | Acción |
|---|---|---|---|
| CRITICAL | Exposición pública o bypass de Warhome | No encontrado | Ninguna |
| MAJOR | RPC sin autorización, sin atomicidad o con acceso cliente | No encontrado | Ninguna |
| MAJOR | Cruce de workspace en calendario | No encontrado | FK compuesta y filtros verificados |
| MINOR | Ideas/métricas sin workspace propio | Observación aceptable para MVP privado | Revisar solo al ampliar a más workspaces |
| MINOR | Documentación histórica desactualizada | Corregido | Estado remoto y validación actualizados |

## 9. Veredicto

**APROBADO.**

El código, la migración aplicada y la seguridad están listos para commit. El cierre documental refleja ahora que:

- `20260729120000_create_content_os_pilotfeliu_mvp.sql` y `20260729130000_add_content_os_roster_and_ai_planner.sql` están aplicadas en remoto;
- el QA sintético remoto está completado;
- la validación actual es de 823 tests, además de TypeScript, lint, build y diff check.

No se modificaron código ni migraciones durante esta auditoría. El único archivo añadido es este informe: `docs/audits/content-os-final-review.md`.
