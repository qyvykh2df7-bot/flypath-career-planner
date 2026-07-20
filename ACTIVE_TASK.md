# Tarea activa — Fase 10: Pagos, monetización y entitlements

## Estado de la plataforma

- Fases 4, 5 y 6: completadas e integradas en `main`.
- Fase actual: **Fase 10 — Pagos, monetización y entitlements**.
- Fase 7: CLOSED / COMPLETED / DEPLOYED. Migración remota aplicada, QA funcional aprobado y deployment completado.

## Cierre de Fase 8

Fase 8 está **CLOSED / COMPLETED / DEPLOYED**:

- Commit `73758c1 feat(warhome): add AeroComms user operations`, publicado en `main`.
- Migración `20260712120000_create_warhome_user_directory.sql` aplicada en Supabase remoto.
- 398 pruebas correctas, TypeScript correcto, lint focalizado y `git diff --check` correctos.
- QA manual aprobado y deployment de Vercel confirmado manualmente.
- Todas las cuentas FlyPath/AeroComms son visibles en Warhome, tengan o no lead; no se crean leads automáticamente por el uso normal de AeroComms.

## Cierre de Fase 9

- 9A endureció el catálogo público y retiró campos editoriales/internos del navegador. Migración `20260712130000_harden_public_school_catalog_access.sql` aplicada.
- 9B–9C crearon y conectaron el backend privado de opiniones, verificación por email y formulario real. Migración `20260712140000_create_school_reviews_backend.sql` aplicada.
- 9D muestra datos públicos reales solo cuando la reseña está `approved`; fichas y comparador usan agregados seguros sin N+1 ni mezcla con `school_scores`.
- Career Planner reutiliza el mismo agregado público por lote: convierte la media real `1–10` a estrellas `0–5`, conserva fracciones y muestra “Sin opiniones” sin fallback editorial.
- 9E añadió moderación protegida en `/warhome/reviews` y detalle privado con acciones cerradas e historial.
- La migración `20260712150000_make_school_review_moderation_atomic.sql` deja las transiciones de moderación y su evento append-only en una única RPC transaccional, con `EXECUTE` exclusivo de `service_role`.
- Fase 9 está **CLOSED / COMPLETED / DEPLOY READY**. El QA manual end-to-end confirmó envío, verificación, moderación, publicación, agregados, comparador, fichas y estrellas del Career Planner.
- La validación actual deja 512 pruebas, TypeScript, lint focalizado y `git diff --check` correctos.
- Mejora futura acotada: iterar el layout visual de las opiniones públicas. No bloquea la funcionalidad ni el cierre de fase.

## Tarea activa — 10C

Diseñar e implementar Checkout seguro para pagos únicos sobre la base comercial ya aplicada.

- `20260712170000_create_commerce_foundation.sql` está aplicada y validada en remoto: precios, pedidos, pagos, suscripciones, eventos Stripe minimizados, compradores invitados, reclamaciones seguras, bundles y concesiones de acceso idempotentes están disponibles, sin filas de catálogo comercial ni cobros creados.
- Los contratos puros y pruebas viven en `lib/commerce/`; el acceso efectivo se resuelve en servidor y RLS permanece cerrada.
- 10C debe crear solo el flujo server-side mínimo y seguro para Checkout de pago único; ningún navegador decide precio, acceso ni estado de pago.
- Stripe SDK, secretos, endpoints de cobro, CTAs y webhooks HTTP no se activan hasta que el diseño específico de 10C lo cierre.
- Las decisiones de canal son: Career Planner y guías digitales con Stripe como invitado; AeroComms Pro reclamable si se compró sin cuenta; Mentorías mediante Cal.com; guía física mediante Amazon; Pre-PPL sigue en waitlist.

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
