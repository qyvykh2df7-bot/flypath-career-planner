# Tarea activa — Fase 7: Persistencia AeroComms

## Estado de la plataforma

- Fases 4, 5 y 6: completadas e integradas en `main`.
- Fase actual: **Fase 7 — Persistencia AeroComms**.
- Estado: implementación completada; migración remota aplicada y QA funcional aprobado.

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

## Pendiente antes de cierre

- Revisión final de migración y aplicación controlada en Supabase remoto.
- El build local queda pendiente únicamente por `ENOTFOUND fonts.googleapis.com` al descargar Geist y Geist Mono; validar en Vercel o en un entorno con red.

## Validación local realizada

- `npm test`: 359 tests correctos.
- `npx tsc --noEmit --pretty false`: correcto.
- `npm run build -- --webpack`: bloqueado únicamente por el acceso a Google Fonts; no hay errores de compilación propios de Fase 7.
- ESLint focalizado y `git diff --check`: correctos.

## Restricciones de alcance

- Stripe, compras, entitlements y AeroComms Pro.
- Guardado real de Career Planner.
- Google/Apple login, contraseñas, cambio de email y eliminación de cuenta.
- Cambios de Warhome, ejercicios, scoring, contenido, Free/Pro o configuración de pagos.
