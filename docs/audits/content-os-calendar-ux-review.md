# Auditoría QA — Content OS Calendar Experience Upgrade

**Bloque:** 12A.3 — Content OS Calendar Experience Upgrade
**Ámbito:** revisión independiente posterior a la corrección UX
**Fecha:** 2026-07-29

## Veredicto

**APROBADO.** El calendario está listo para commit desde el punto de vista funcional, de seguridad y de regresión revisado. No se han encontrado bloqueos críticos o mayores.

Las observaciones menores quedan documentadas como deuda de cobertura y no impiden el cierre del bloque:

- La interacción de drag & drop es apropiada para escritorio; en móvil la edición se realiza mediante el modal, evitando una interacción táctil frágil.
- La cobertura automatizada valida las funciones de fechas y posicionamiento, pero no existe todavía una suite de renderizado/interacción de React para cada gesto visual.
- Dos eventos solapados en la misma franja pueden compartir espacio visual; siguen siendo accesibles y editables, pero una futura iteración podría mejorar la distribución de columnas.

## Archivos revisados

- `components/warhome/content/ContentCalendar.tsx`
- `components/warhome/content/ContentCalendarEventModal.tsx`
- `components/warhome/content/ContentCalendarEventForm.tsx`
- `components/warhome/content/content-calendar-utils.ts`
- `components/warhome/content/content-calendar-utils.test.ts`
- `app/warhome/(protected)/content/actions.ts`
- `app/warhome/(protected)/content/page.tsx`
- `lib/warhome/content-os.ts`
- `lib/warhome/content-os-contract.ts`
- `lib/warhome/auth.ts`
- `lib/warhome/client-security.test.ts`
- `supabase/migrations/20260729120000_create_content_os_pilotfeliu_mvp.sql`
- `docs/ai/content-os/pilotfeliu-content-os-command-center.md`
- `ROADMAP.md`
- `CURRENT_PHASE.md`
- `ACTIVE_TASK.md`
- `LAST_SESSION.md`

## 1. UX del calendario

| Comprobación | Resultado | Evidencia |
| --- | --- | --- |
| Vista semanal | OK | La semana se presenta como siete columnas, con cabecera por día, escala horaria visible de 07:00 a 23:00 y bloques posicionados por hora y duración en `ContentCalendar.tsx`. |
| Vista mensual | OK | La vista usa una cuadrícula real de siete columnas y seis filas de días; cada celda contiene sus eventos y permite crear bloques. |
| Eventos visibles | OK | Cada bloque muestra título, tipo, hora y, cuando existe, estado del contenido asociado. Los estilos distinguen grabación, edición y publicación. |
| Posicionamiento | OK | `getContentOsWeekEventLayout()` traduce inicio y duración a posición y altura dentro de la rejilla horaria, manteniendo límites visuales. |
| Creación contextual | OK | Los huecos horarios de la semana, las celdas del mes y los botones `+` abren el modal con fecha y hora preseleccionadas. |
| Edición desde evento | OK | Cada evento es un botón accesible que abre el detalle/modal con edición, contenido asociado y notas. |
| Lectura rápida | OK | La planificación deja de ser una lista plana: la semana permite escanear días, horas, volumen y tipos de producción de un vistazo. |

## 2. Funcionalidad 12A.3

| Flujo | Resultado | Revisión |
| --- | --- | --- |
| Crear desde hueco vacío | OK | `openCreate()` prepara un bloque de una hora y el formulario permite título, tipo, horario, notas y contenido opcional. |
| Crear desde el botón general | OK | `Nuevo bloque`, `Añadir bloque` y el resumen lateral conservan la alternativa manual. |
| Editar | OK | `updateContentOsCalendarEventAction` valida el formulario y actualiza el evento dentro del workspace. |
| Eliminar | OK | El modal usa `DeleteContentCalendarEventButton`; la acción devuelve estado controlado y revalida las superficies relacionadas. |
| Drag & drop | OK | En escritorio, el evento es draggable y el destino calcula día/hora; en mes conserva la hora local y en semana permite cambiarla. |
| Persistencia | OK | Las mutaciones usan acciones server-side y la capa `lib/warhome/content-os.ts`; no hay persistencia simulada en el cliente. |
| Actualización optimista | OK | El movimiento actualiza temporalmente la posición con `useOptimistic`, muestra estado de actualización y refresca o revierte visualmente mediante `router.refresh()` si falla. |
| Asociación con contenido | OK | El selector solo ofrece piezas del catálogo cargado; el servidor vuelve a comprobar que la pieza pertenece a `pilotfeliu`. El modal muestra título, estado y enlace a la ficha. |
| Propuesta futura IA | OK | El modelo conserva `proposal_source` y `proposal_status`, pero la UI actual crea propuestas manuales aprobadas; no se han activado agentes ni APIs externas. |

## 3. Seguridad y permisos

**Resultado: OK.**

- La página vive bajo `app/warhome/(protected)/content/page.tsx`.
- Las mutaciones están declaradas como Server Actions en `app/warhome/(protected)/content/actions.ts`.
- La capa de datos ejecuta `requireWarhomeAdmin()` antes de crear, editar, mover o eliminar eventos.
- Las consultas y escrituras acotan `content_calendar_events` al workspace fijo `pilotfeliu`.
- La asociación de contenido se valida server-side con `assertContentOsItem()` y el mismo workspace.
- Los identificadores recibidos por acciones se validan como UUID y las fechas se validan mediante el contrato compartido; el movimiento exige una duración válida de hasta 24 horas.
- La migración mantiene RLS cerrada y revoca acceso a `PUBLIC`, `anon` y `authenticated`; no se ha creado ninguna ruta pública ni una policy adicional para el calendario.
- Las comprobaciones de seguridad de componentes cliente no detectan `SUPABASE_SERVICE_ROLE_KEY` ni acceso administrativo en el bundle.

No se observa confianza en estado React, query params o `localStorage` para autorizar operaciones.

## 4. Calidad y regresiones

### Fortalezas confirmadas

- La UX visual reutiliza el modelo de datos y las acciones existentes; no se ha creado una arquitectura paralela.
- Los tipos de evento y los estados de contenido proceden de conjuntos cerrados del contrato.
- Las fechas se convierten con la zona horaria `Europe/Madrid`, tanto al preparar formularios como al pintar y mover eventos.
- Los errores de mutación no exponen detalles de Supabase y fuerzan una actualización del estado visible.
- La eliminación, actualización y movimiento revalidan calendario, ideas, biblioteca y ficha cuando corresponde.

### Observaciones menores

1. **Cobertura de componentes:** la suite cubre las funciones puras de fechas, duración, movimiento y layout, pero no un test de DOM para click en hueco, modal y drag & drop. El riesgo está limitado porque los handlers son directos y las acciones server-side están cubiertas por el contrato existente.
2. **Solapamiento visual:** el layout semanal no calcula columnas para eventos concurrentes. Los eventos no desaparecen y siguen pudiendo abrirse desde el bloque, pero una mejora futura podría repartir el ancho cuando haya solapes.
3. **Táctil:** no se fuerza drag & drop en móvil. El comportamiento previsto es desplazamiento horizontal del calendario y edición/creación mediante modal, una degradación controlada y coherente con el alcance del bloque.

No se encontraron cambios de esquema, APIs externas, agentes IA, publicación automática ni cambios en progreso, pagos, entitlements, Cal.com o contenido pedagógico.

## 5. Responsive

- **Escritorio:** la vista semanal dispone de columnas y rejilla horaria; la vista mensual mantiene una cuadrícula editorial de siete columnas. El resumen lateral acompaña la planificación en pantallas amplias.
- **Móvil:** el calendario conserva una anchura mínima con desplazamiento horizontal para no colapsar las columnas; las acciones de creación y edición se mantienen utilizables y el modal ocupa la pantalla con scroll interno.
- **Modal:** usa `role="dialog"`, `aria-modal`, título asociado, cierre por Escape, restauración del foco y bloqueo temporal del scroll del `body`. En móvil se ancla al borde inferior y en escritorio se centra.

## Validación ejecutada

- Tests focalizados de calendario y página Content OS: **6 tests correctos**.
- TypeScript (`npx tsc --noEmit --pretty false`): **correcto**.
- ESLint focalizado sobre calendario, modal, formulario, acciones y seguridad cliente: **correcto**.
- `git diff --check`: **correcto**.
- La validación completa previa del bloque registró **804 tests correctos**, build Webpack correcto y revisión visual sintética de semana, mes y móvil.

## Estado del worktree y alcance de esta auditoría

Esta auditoría no ha modificado código, migraciones ni historial Git. El informe es el único archivo creado por este trabajo. Los cambios funcionales del calendario y dos informes CRM no relacionados que ya estaban presentes en el worktree se han dejado intactos.

**Conclusión:** 12A.3 queda **APROBADO** y listo para revisión/commit. Las observaciones menores pueden abordarse en una iteración posterior sin bloquear el uso del Content Planner.
