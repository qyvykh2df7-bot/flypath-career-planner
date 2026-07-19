# Tarea activa — Fase 8: Usuarios y actividad de AeroComms

## Estado de la plataforma

- Fases 4, 5 y 6: completadas e integradas en `main`.
- Fase actual: **Fase 8 — Usuarios y actividad de AeroComms**.
- Fase 7: CLOSED / COMPLETED / DEPLOYED. Migración remota aplicada, QA funcional aprobado y deployment completado.

## Estado de Fase 8

La implementación técnica está terminada. Se completaron 8A–8E sin crear leads, suscripciones, compras ni eventos nuevos:

- RPC de directorio aplicada en remoto, con ACL exclusiva de `service_role`.
- Capa server-only para listado y ficha individual con autorización Warhome antes de cada lectura.
- `/warhome/users` con búsqueda, filtros cerrados, orden, paginación y total real.
- `/warhome/users/[userId]` con cuenta, perfil, resumen AeroComms, sesiones recientes acotadas, lead opcional, marketing y placeholder de compras.
- Auditoría cubierta por pruebas: sin N+1 en listado, detalle limitado a lecturas acotadas por usuario, sin metadata Auth, tokens, recibos, hashes ni sesiones cliente en los DTOs.

## Tarea activa

QA manual final de Fase 8 y preparación del commit. Verificar con una cuenta con perfil/progreso/lead y otra sin perfil, progreso ni lead:

- navegación desde Usuarios a la ficha y vuelta;
- búsqueda, filtros combinados, orden y paginación;
- estados vacíos y error genérico;
- separación entre cuenta, progreso, lead y marketing;
- ausencia de creación automática de leads;
- visualización responsive de tabla y ficha.

Después del QA: revisar diff, commit, push y deployment. La siguiente fase estratégica será **Fase 9 — Backend de opiniones de escuelas**.

## Validación técnica actual

- `npm test`: 398 pruebas correctas.
- TypeScript, lint focalizado y `git diff --check`: correctos.
- Build local con webpack: bloqueado únicamente por `ENOTFOUND fonts.googleapis.com` al descargar Geist y Geist Mono; sin error de compilación atribuido a Fase 8.

## Implementado en Fase 7

### Modelo y seguridad

- Migración local `20260712110000_create_aerocomms_progress_persistence.sql` para progreso, ejercicios, misiones, estadísticas, sesiones y recibos de sincronización.
- Todas las tablas dependen de `auth.users`, tienen RLS y no referencian leads, productos, suscripciones, Warhome ni Stripe.
- RPC transaccional e idempotente; repetir el mismo `operation_id` con un payload distinto se rechaza. Navegador sin permisos directos de escritura y `service_role` aislado en servidor.

### Sincronización local-first

- Los usuarios anónimos continúan en `localStorage` con `aerocomms.v2` sin login obligatorio.
- La ruta `/api/aerocomms/progress/sync` usa `auth.getUser()` y valida el catálogo, rangos, zona horaria, versiones y body antes de llamar a Supabase.
- `rfr` se normaliza a `ready-for-radio`; IDs desconocidos o datos corruptos se descartan/rechazan sin inventar métricas.
- Un error de red deja el estado local intacto y conserva el mismo `operation_id` para reintentar sin duplicar sesiones, intentos o estadísticas.
- Un blob local existente sin propietario requiere confirmación explícita antes de importarse; Perfil permite importarlo o empezar desde cero.
- Un reset autenticado se persiste remotamente y evita que sesiones anteriores al corte restauren progreso desde otro dispositivo.
- El propietario de sincronización mantiene un fallback en memoria cuando el almacenamiento del navegador está restringido; los fallos transitorios se reintentan.

### Compatibilidad

- Se preservan métricas agregadas legítimas de `aerocomms.v2` durante la primera importación; el historial local acotado no se usa para fabricar totales.
- Audio, transcripciones, blobs, descriptores ATC, nombre, ajustes, UI state y `subscription` local no cruzan el límite de persistencia.
- El snapshot remoto solo actualiza progreso durable; mantiene ajustes y acceso local sin cambios.
- El nombre de onboarding permanece local para anónimos. Con sesión, `profiles.full_name` prevalece y cualquier cambio desde AeroComms requiere una confirmación explícita.

## Cierre de Fase 7

- Migración remota aplicada.
- QA funcional aprobado para importación, recuperación entre navegadores, aislamiento entre cuentas y nombre de perfil.
- Deployment completado correctamente.
- El build local quedó bloqueado únicamente por `ENOTFOUND fonts.googleapis.com` al descargar Geist y Geist Mono; no hay errores de Fase 7.

## Validación local realizada

- `npm test`: 359 tests correctos.
- `npx tsc --noEmit --pretty false`: correcto.
- `npm run build -- --webpack`: bloqueado únicamente por el acceso a Google Fonts; no hay errores de compilación propios de Fase 7.
- ESLint focalizado y `git diff --check`: correctos.

- Commit: `aaa5f4e feat(aerocomms): close phase 7 persistence`.
- Push realizado a `main`.

## Restricciones de alcance

- Stripe, compras, entitlements y AeroComms Pro.
- Guardado real de Career Planner.
- Google/Apple login, contraseñas, cambio de email y eliminación de cuenta.
- Cambios de ejercicios, scoring, contenido, Free/Pro o configuración de pagos.
- Captación automática de leads, intereses comerciales o suscripciones por uso normal de AeroComms.
