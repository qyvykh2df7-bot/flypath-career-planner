# Auditoría independiente — Content OS PilotFeliu 12A.6.1 + 12A.6.2

**Fecha:** 2026-07-29
**Alcance:** auditoría inicial del roster/disponibilidad y primer asistente IA planificador, realizada antes de aplicar la migración `20260729130000_add_content_os_roster_and_ai_planner.sql`.

## Veredicto

**APROBADO CON CAMBIOS**

La base de seguridad, autorización, contratos y transacciones era adecuada para un módulo privado de Warhome. La auditoría identificó inicialmente solapamientos de calendario; fueron corregidos antes de la aplicación remota y verificados posteriormente mediante QA sintético.

La auditoría no ha modificado código ni migraciones, no ha aplicado cambios en Supabase y no ha hecho commit ni push.

## Resumen ejecutivo

| Área | Estado | Observación |
| --- | --- | --- |
| Modelo de datos | OK | Tablas privadas, acotadas a `pilotfeliu`, con constraints e índices razonables. |
| Seguridad | OK | RLS cerrada, acceso de tablas y RPC limitado a `service_role`, autorización Warhome en la capa server-only. |
| RPC de creación | OK | Validación y creación de propuesta/eventos en una transacción. |
| RPC de revisión | OK | `FOR UPDATE`, aprobación/rechazo idempotente y creación de eventos con clave de origen única. |
| Capa IA | OK | `server-only`, JSON estructurado, límites, `store: false` y rechazo de respuestas inválidas. |
| Conflictos de calendario | **MINOR A CORREGIR** | No hay comprobación entre sugerencias ni frente a eventos ya existentes. |
| Coste operativo IA | LOW | No hay límite distribuido de generación; el módulo es privado y de un único operador. |
| Migración remota | Aplicada y verificada | La migración se aplicó después de corregir los solapamientos y el QA remoto quedó completado. |

## 1. Modelo de datos

### `content_availability_slots`

La migración crea una entidad de disponibilidad manual privada con:

- `workspace_key` obligatorio y restringido a `pilotfeliu`.
- Tipos cerrados: `work`, `rest`, `travel`, `recording_available`.
- Intervalos válidos, con fin posterior al inicio y duración máxima de 31 días.
- Zona horaria fija `Europe/Madrid`.
- Notas limitadas a 5.000 caracteres.
- Referencias opcionales a `auth.users` para creador y modificador.
- Índices por workspace, fecha y tipo.

La capa de contrato y la acción server-side aplican los mismos tipos, zona horaria y límites. El flujo de crear, editar y eliminar pasa por `requireWarhomeAdmin()` y por el cliente Supabase server-side.

### `content_planning_proposals`

La propuesta conserva:

- periodo máximo de 14 días;
- estado cerrado `proposed`, `approved` o `rejected`;
- resumen, modelo utilizado e `input_hash` SHA-256;
- timestamps de generación y revisión;
- usuario creador y revisor.

La constraint de revisión obliga a que una propuesta `proposed` no tenga datos de revisión y que una propuesta revisada sí los tenga. El modelo no almacena el prompt completo ni la respuesta completa del proveedor.

### `content_planning_proposal_events`

Cada propuesta tiene eventos propios con:

- tipo cerrado `record`, `edit` o `publish`;
- título y notas limitados;
- intervalo máximo de 24 horas;
- zona horaria fija;
- referencia opcional a un `content_item` o `content_idea`.

Las referencias de contenido se validan en el contrato, en la RPC y mediante las claves foráneas existentes. Las ideas descartadas se rechazan en la RPC.

Riesgo residual aceptable: la tabla permite que un insert interno tenga ambas referencias de contenido a `NULL`, aunque la RPC y el contrato exigen al menos una. Como el acceso directo está limitado a `service_role`, no es una exposición pública, pero conviene reforzar esa invariancia si la tabla va a tener consumidores internos adicionales.

### Relación con calendario

La migración añade `content_calendar_events.source_proposal_event_id` y un índice único parcial. Esto permite identificar el origen de cada evento aprobado y evita duplicar un evento al reintentar la aprobación.

## 2. Seguridad y permisos

### RLS y ACL

La migración:

- habilita RLS en las tres tablas nuevas;
- revoca permisos a `PUBLIC`, `anon` y `authenticated`;
- concede operaciones de tabla únicamente a `service_role`;
- revoca y concede `EXECUTE` de las RPC únicamente a `service_role`.

No existe una ruta pública de lectura o escritura para el contenido del roster o las propuestas.

### Autorización Warhome

La capa `lib/warhome/content-os-planning.ts` exige `requireWarhomeAdmin()` en lectura, CRUD del roster, generación y revisión. La autorización combina sesión autenticada con pertenencia activa a Warhome; el cliente no decide el workspace ni puede activar la propuesta directamente.

Las RPC reciben el identificador del administrador, pero solo son invocables por `service_role` y vuelven a comprobar que dicho usuario existe como administrador/owner activo en `admin_users`. Esto constituye una defensa en profundidad coherente con la arquitectura actual.

### Datos enviados a IA

El proveedor recibe únicamente el contexto necesario para esta propuesta: periodo, disponibilidad, títulos/estado/objetivo/plataforma de ideas y contenidos pendientes. No se guarda el prompt ni el texto completo de la respuesta; la llamada usa `store: false`. El modelo y el `input_hash` sí quedan registrados para trazabilidad.

Observación no bloqueante: antes de uso continuado debe quedar cubierta la política operativa de tratamiento de los títulos, notas de disponibilidad y demás datos privados enviados al proveedor. El módulo es interno y no hay una superficie pública de abuso en el estado actual.

## 3. RPC y transacciones

### `create_content_os_planning_proposal`

La RPC en la migración:

- usa `SECURITY DEFINER`;
- fija `search_path = public, pg_temp`;
- comprueba administrador activo;
- valida periodo, resumen, modelo, hash y número de sugerencias;
- valida tipo, referencias, fechas, duración y límites de cada evento;
- rechaza ideas descartadas;
- inserta la propuesta y sus eventos dentro de la misma transacción.

Si una sugerencia falla, la operación completa revierte. No se crea una propuesta parcialmente poblada.

### `review_content_os_planning_proposal`

La RPC:

- comprueba administrador activo y decisión cerrada;
- bloquea la fila objetivo con `FOR UPDATE`;
- rechaza propuestas inexistentes o decisiones incompatibles;
- devuelve correctamente una repetición de la misma decisión;
- inserta eventos de calendario solo al aprobar;
- usa `source_proposal_event_id` y `ON CONFLICT DO NOTHING` para idempotencia;
- marca la propuesta como revisada dentro de la misma operación.

La aprobación y el cambio de estado son atómicos. El rechazo no crea eventos.

## 4. Hallazgos

### MAJOR — ninguno

No se ha encontrado una vía de acceso público, una concesión automática de permisos, una exposición de secretos ni una operación IA autónoma.

### MINOR — M12A6-01: falta protección contra solapamientos

**Evidencia:**

- `lib/warhome/content-os-ai-planner.ts:47-70` comprueba cada sugerencia contra disponibilidad bloqueada y franjas permitidas.
- `lib/warhome/content-os-planning-contract.ts:176-268` valida cada sugerencia de forma individual.
- `supabase/migrations/20260729130000_add_content_os_roster_and_ai_planner.sql:363-396` copia los eventos aprobados al calendario sin consultar eventos existentes ni comparar los eventos de la propia propuesta.

**Impacto:** una respuesta IA válida individualmente puede contener dos bloques que se solapen entre sí o con un evento manual/ya aprobado. La aprobación podría dejar un calendario editorial imposible o ambiguo.

**Corrección necesaria antes del QA remoto:** añadir una comprobación server-side y preferiblemente transaccional que rechace o marque para revisión cualquier conflicto entre:

1. eventos de la misma propuesta;
2. eventos propuestos y `content_calendar_events` existentes;
3. eventos con el mismo workspace y rango temporal.

No se ha implementado durante esta auditoría.

### MINOR — M12A6-02: intervalos de disponibilidad solapados

La base de datos permite guardar franjas de disponibilidad que se solapan entre sí, incluso con tipos potencialmente contradictorios. El planificador prioriza el bloqueo de `work`/`travel`, pero el roster puede quedar ambiguo para el operador.

**Recomendación:** validar solapamientos al guardar o documentar una prioridad explícita entre tipos. No bloquea la seguridad del módulo, pero conviene resolverlo antes de considerar el roster maduro.

### LOW — M12A6-03: ausencia de límite de coste de generación

La generación requiere administrador Warhome, limita el contexto y la propuesta, y no existe acceso público. Aun así, cada pulsación autorizada puede llamar al proveedor IA y generar coste.

**Recomendación:** añadir más adelante cooldown, idempotencia por hash de contexto o límite de generación. No es bloqueante para el MVP privado.

### LOW — M12A6-04: estado documental ambiguo

La documentación maestra describía inicialmente el MVP 12A como completado, mientras que el bloque 12A.6 todavía estaba en revisión. Tras la aplicación remota y el QA sintético, el estado de la documentación queda alineado.

**Estado posterior:** 12A MVP y 12A.6.1/12A.6.2 están aplicados, auditados y validados remotamente.

## 5. Capa IA

La implementación cumple el modelo operativo cerrado y fue validada después de las correcciones:

`IA propone → PilotFeliu revisa → PilotFeliu decide`.

Se observan estas protecciones:

- módulo server-only;
- clave OpenAI leída solo en servidor;
- modelo configurable, sin permitir selección desde cliente;
- esquema JSON estricto con propiedades cerradas;
- validación de IDs contra el contexto cargado;
- validación de fechas, duración, tipos y periodo;
- rechazo genérico si el proveedor falla o devuelve JSON inválido;
- instrucción explícita para no afirmar que el calendario ya se modificó;
- ningún cron, publicación automática o llamada a plataformas externas.

No se ha encontrado almacenamiento innecesario de prompts, respuestas completas, audio, credenciales o payloads del proveedor.

## 6. Flujo completo auditado

### Crear roster

La UI de disponibilidad crea, edita y elimina franjas mediante server actions. Las acciones validan el formulario y delegan en la capa server-only, que exige administrador Warhome. La persistencia real quedó validada tras aplicar la migración remota y completar el QA sintético.

### Generar propuesta

La UI solicita una propuesta. La capa server-only carga disponibilidad, ideas y biblioteca, excluye ideas descartadas y contenidos publicados/archivados, envía un contexto limitado al proveedor y valida la respuesta antes de llamar a la RPC de creación.

La propuesta queda en estado `proposed`; no cambia el calendario.

### Rechazar

La revisión con decisión `rejected` se ejecuta mediante RPC bloqueada y no inserta eventos de calendario. Repetir la misma decisión es idempotente; cambiar después a otra decisión se rechaza.

### Aprobar

La revisión con decisión `approved` bloquea la propuesta, crea eventos con `proposal_source = 'ai'` y `proposal_status = 'approved'`, y deja el vínculo de origen. La operación es idempotente por `source_proposal_event_id`.

La aprobación funcional está completa, pero debe incorporar la protección de conflictos descrita en M12A6-01 antes de considerarse lista para QA remoto.

## 7. Validación ejecutada

- `npm test`: **823 tests correctos**, 187 archivos de test.
- `npx tsc --noEmit --pretty false`: **correcto**.
- lint focalizado de los archivos del bloque: **correcto**.
- `node_modules/.bin/next build --webpack`: **correcto**; las rutas de disponibilidad y planner se incluyen en el build.
- `git diff --check`: **correcto**.
- Migración `20260729130000_add_content_os_roster_and_ai_planner.sql`: aplicada en remoto.
- QA sintético remoto: roster, conflictos, aprobación, rechazo, idempotencia, autorización y límite de frecuencia correctos.

El lint global mantiene errores preexistentes fuera del bloque auditado. No se corrigieron porque esta tarea no autoriza cambios de código ajenos ni modificaciones funcionales.

No se realizó QA remoto de datos, RPC o RLS porque la migración aún no está aplicada. Tampoco se ejecutó una llamada real al proveedor IA.

## 8. Recomendación de siguiente paso

1. Corregir M12A6-01 con una validación transaccional de conflictos.
2. Decidir si el roster debe impedir solapamientos o aplicar una prioridad explícita.
3. Repetir tests focalizados y revisión de migración.
4. Aplicar la migración remota.
5. Ejecutar QA sintético de crear roster, generar, rechazar, aprobar y verificar calendario.

Hasta completar el primer punto, el bloque queda **APROBADO CON CAMBIOS** y no se recomienda aplicar la migración a Supabase remoto.

## 9. Archivos revisados

- `docs/ai/content-os/pilotfeliu-content-os-command-center.md`
- `ROADMAP.md`
- `CURRENT_PHASE.md`
- `ACTIVE_TASK.md`
- `LAST_SESSION.md`
- `supabase/migrations/20260729130000_add_content_os_roster_and_ai_planner.sql`
- `lib/warhome/content-os-ai-planner.ts`
- `lib/warhome/content-os-planning.ts`
- `lib/warhome/content-os-planning-contract.ts`
- `app/warhome/(protected)/content/actions.ts`
- `app/warhome/(protected)/content/availability/page.tsx`
- `app/warhome/(protected)/content/planner/page.tsx`
- `components/warhome/content/ContentAvailabilityWorkspace.tsx`
- `components/warhome/content/ContentAiPlannerWorkspace.tsx`
- tests de contratos, IA, migración, capa server y workspace de Content OS.

**Archivos modificados en esta auditoría:** únicamente este informe. No se modificó código ni migraciones.
