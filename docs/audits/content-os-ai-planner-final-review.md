# Auditoría final — Content OS AI Planner 12A.6

**Fecha:** 2026-07-29
**Alcance:** revisión de las correcciones del roster y del planificador IA MVP antes de la aplicación remota y el QA sintético.

## Veredicto

**APROBADO**

La implementación local corrige los hallazgos anteriores de solapamientos, disponibilidad y protección de coste. El flujo mantiene el modelo aprobado: la IA propone y PilotFeliu revisa y decide. No se detectan bloqueos críticos, mayores ni menores que impidan pasar a la aplicación de la migración y al QA remoto.

Posteriormente, la migración se aplicó en Supabase remoto y el QA sintético quedó completado.

## Resumen de hallazgos

| Área | Resultado | Severidad |
|---|---|---|
| Solapamientos con calendario existente | Correcto, con protección transaccional | OK |
| Solapamientos dentro de una propuesta | Rechazados antes de persistir | OK |
| Carreras entre aprobación y edición manual | Serializadas mediante lock compartido y trigger | OK |
| Conflictos del roster | Rechazados por contrato, servidor y trigger SQL | OK |
| Autorización Warhome | Requerida en las acciones server-side y RPC | OK |
| RLS y ACL | Cerradas a usuarios públicos; operación por `service_role` | OK |
| Salida IA | JSON estructurado, validado y sin almacenamiento del proveedor | OK |
| Límite de frecuencia | RPC atómica y configurable | OK |
| Autonomía no aprobada | No existe publicación ni modificación automática | OK |
| QA remoto | Completado tras aplicar la migración | OK |

## 1. Solapamientos

### Eventos existentes

La aprobación de una propuesta se ejecuta en una RPC transaccional que:

- bloquea la propuesta objetivo;
- adquiere el mismo advisory lock usado por las escrituras del calendario;
- comprueba los intervalos de la propuesta contra los eventos existentes;
- inserta los eventos definitivos únicamente si no hay conflicto.

Además, el trigger de calendario impide solapamientos de eventos generados con `proposal_source = 'ai'`. Las escrituras manuales también pasan por el lock del calendario, por lo que una edición concurrente no puede intercalarse entre la comprobación y la inserción de una propuesta aprobada.

### Eventos dentro de una propuesta

El contrato `parseContentOsPlanningOutput` valida los intervalos y rechaza propuestas cuyos eventos se solapan entre sí. La RPC de creación vuelve a comprobar esta condición antes de insertar los eventos de la propuesta. La transacción se revierte completa si se detecta un conflicto.

### Carreras con edición manual

La protección no depende solo del cliente: el lock transaccional compartido y el trigger SQL cubren tanto la aprobación IA como las escrituras manuales. Esto evita que una comprobación válida quede obsoleta antes de persistir el evento.

## 2. Roster y disponibilidad

Los tipos de disponibilidad admitidos son:

- `work`;
- `travel`;
- `rest`;
- `recording_available`.

Los intervalos inválidos se rechazan. Los slots conflictivos se detectan en la capa de contrato, en la capa server-side y en el trigger SQL, con lock para evitar carreras.

La política aplicada considera conflicto:

- entre slots del mismo tipo;
- cuando uno de los slots es `work` o `travel`.

La coexistencia entre `rest` y `recording_available` queda permitida de forma intencionada por la política del MVP. No hay sincronización con calendarios externos ni bloqueo automático de la agenda.

## 3. Seguridad y permisos

La integración respeta la seguridad existente de Warhome:

- las acciones server-side exigen autorización mediante `requireWarhomeAdmin`;
- el acceso operativo a Supabase se realiza server-side mediante el cliente administrativo existente;
- las tablas nuevas mantienen RLS habilitada y cerrada para acceso público;
- los permisos directos se revocan a `PUBLIC`, `anon` y `authenticated`;
- las RPC de generación y revisión solo conceden `EXECUTE` a `service_role`;
- las funciones `SECURITY DEFINER` fijan `search_path` de forma explícita;
- no se expone una ruta pública para leer o modificar roster, propuestas o métricas.

La autorización no depende de flags del cliente, estado local ni de la interfaz de revisión.

## 4. Capa IA

La capa del planificador:

- recibe entradas acotadas de ideas, contenidos pendientes, objetivos y disponibilidad;
- solicita una respuesta JSON estructurada;
- valida la respuesta antes de convertirla en propuestas;
- rechaza intervalos inválidos o solapados;
- no almacena innecesariamente prompts, respuestas completas ni payloads del proveedor;
- utiliza configuración server-side;
- mantiene la política `store: false` del proveedor cuando aplica.

La IA no puede publicar contenido, aprobar propuestas, mover eventos ni ejecutar acciones comerciales. El flujo es explícitamente:

**IA propone → PilotFeliu revisa → PilotFeliu decide.**

No se implementan agentes autónomos, memoria avanzada, ejecución continua ni APIs externas de redes sociales.

## 5. Protección frente a coste y ejecuciones repetidas

La generación reclama un intervalo de frecuencia mediante `claim_content_os_planning_generation` antes de llamar al proveedor IA. La operación es atómica y aplica un intervalo configurable:

- valor por defecto: 60 segundos;
- mínimo permitido: 15 segundos;
- máximo permitido: 3600 segundos.

Una repetición dentro del intervalo devuelve un error controlado y no llama al proveedor. La respuesta de la acción server-side no expone detalles internos.

La reserva del intervalo ocurre antes de la llamada externa, por lo que un fallo del proveedor también consume temporalmente la ventana. Es una decisión conservadora de protección de coste y no un bloqueo funcional del MVP.

## 6. Migración y modelo SQL

La migración `20260729130000_add_content_os_roster_and_ai_planner.sql` incluye:

- `content_availability_slots`;
- `content_planning_proposals`;
- `content_planning_proposal_events`;
- `content_planning_generation_throttles`;
- relación de eventos de propuesta con `content_calendar_events`;
- triggers de conflicto para disponibilidad y calendario;
- RPC de reclamación de frecuencia;
- RPC transaccional de revisión de propuestas.

Se revisó que:

- las claves e índices necesarios están definidos;
- los estados y referencias se validan antes de crear eventos definitivos;
- la aprobación es idempotente para la misma decisión;
- una decisión posterior incompatible se rechaza;
- la creación de eventos usa una referencia única de evento de propuesta;
- los triggers fijan `search_path` y toman el lock necesario;
- las tablas y RPC mantienen ACL cerrada.

La migración usa patrones idempotentes nominales del repositorio. Como en cualquier migración basada en `CREATE ... IF NOT EXISTS`, una tabla preexistente con una estructura incompatible requeriría inspección manual; no es un riesgo esperado para estas entidades nuevas y debe comprobarse en el paso de aplicación remota.

## 7. Flujo revisado

1. PilotFeliu introduce o edita disponibilidad desde Content OS.
2. La capa de contrato y la base de datos rechazan intervalos conflictivos.
3. PilotFeliu solicita una propuesta.
4. La RPC de frecuencia limita ejecuciones repetidas antes de la llamada IA.
5. La respuesta estructurada se valida y se guarda como propuesta, sin tocar el calendario definitivo.
6. PilotFeliu rechaza o aprueba manualmente.
7. La aprobación vuelve a validar propuesta, calendario y concurrencia dentro de una transacción.
8. Solo entonces se crean los eventos definitivos con origen IA.

## 8. Validación realizada

Validaciones disponibles para esta implementación:

- tests focalizados de contrato, planning, IA y migración: correctos;
- suite completa: **823 tests correctos**;
- TypeScript: correcto;
- lint focalizado: correcto;
- build Webpack: correcto;
- `git diff --check`: correcto.

El lint global mantiene incidencias preexistentes fuera de este bloque; no forman parte de las correcciones auditadas. La migración remota y el QA sintético posterior están completados.

No se realizó una llamada adicional al proveedor IA durante el QA remoto; las propuestas sintéticas validaron la persistencia, los conflictos, la aprobación y la idempotencia sin generar coste innecesario.

## 9. Riesgos y siguientes pasos

No hay hallazgos bloqueantes. El bloque queda listo para cierre documental y commit. Como seguimiento operativo quedan:

1. mantener la observabilidad sin registrar prompts, respuestas completas ni datos privados;
2. considerar parsing multipart/streaming, limpieza automática de throttles y pruebas adicionales de concurrencia como hardening posterior;
3. no activar agentes autónomos, publicación automática ni APIs sociales dentro de este bloque.

El parsing multipart/streaming, la limpieza automática de throttles y una prueba de concurrencia real contra Supabase siguen siendo hardening posterior, no bloqueantes del MVP actual.

## Archivos revisados

- `docs/audits/content-os-ai-planner-audit.md`
- `docs/ai/content-os/pilotfeliu-content-os-command-center.md`
- `supabase/migrations/20260729130000_add_content_os_roster_and_ai_planner.sql`
- `lib/warhome/content-os-planning.ts`
- `lib/warhome/content-os-planning-contract.ts`
- `app/warhome/(protected)/content/actions.ts`
- tests de planning, contrato, IA y migración relacionados.

## Cambios realizados durante esta auditoría

Únicamente se creó este informe. En el momento de esta auditoría no se modificó código, migración ni configuración; la aplicación remota y el QA sintético se realizaron posteriormente, antes del cierre de commit. No se hizo commit ni push en esta auditoría.
