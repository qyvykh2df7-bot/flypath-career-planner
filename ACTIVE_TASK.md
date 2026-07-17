# Tarea activa — Cierre de Fase 6

## Estado de la plataforma

- Fases 4 y 5: completadas e integradas en `main`.
- 6A: completado e integrado en `main`.
- Fase actual: **Fase 6 — Login, cuentas y perfiles**.
- Estado: implementación 6B–6E finalizada en `feature/login-otp-6b`; pendiente de auditoría independiente, revisión manual y merge.

## Implementado

### 6B — Login OTP

- `/login` solicita OTP y `/login/verify` lo valida con Supabase Auth.
- Email temporal aislado por pestaña (`sessionStorage` con fallback en memoria); nunca viaja en la URL.
- `next` tiene allowlist de rutas internas, limpia query strings y rechaza destinos externos, malformados y Warhome.
- Sesión persistente y logout general explícito mediante `signOutFlyPath()`.

### 6C — Perfil y vínculo con leads

- `lib/account/bootstrap.ts` crea o reutiliza `profiles` de forma idempotente y segura ante concurrencia.
- Solo vincula leads existentes sin `user_id`, usando el email autenticado y confirmado.
- No crea leads ni reasigna leads pertenecientes a otra cuenta.
- Si falla el vínculo después de crear el perfil, el resultado es parcial y se puede reintentar en el siguiente acceso.

### 6D — Cuenta y header

- `/account` protegido server-side; visitante anónimo → `/login?next=/account`.
- Nombre visible validado y guardado en `profiles`; email solo lectura.
- Header público reactivo: estado neutro durante hidratación, “Iniciar sesión” para anónimo y “Mi cuenta” para sesión autenticada.
- Warhome y `admin_users` permanecen independientes.

### 6E — Contrato AeroComms

- `lib/aerocomms/sync-progress.ts` define v1 puro y versionado del progreso sincronizable.
- Mantiene compatibilidad de lectura con el blob local `aerocomms.v2` sin escribirlo.
- Excluye audio, transcripciones, blobs, permisos, UI efímera, suscripción y desbloqueos.
- No hay progreso remoto ni cambios Free/Pro.

## Validación realizada

- `npm test`: 299 tests correctos.
- `npx tsc --noEmit --pretty false`: correcto.
- `npm run build`: correcto.
- `git diff --check`: correcto.
- Lint focalizado de archivos Fase 6: correcto.
- `npm run lint` global no pasa por 57 errores y 77 warnings preexistentes fuera de este alcance, principalmente JSX dentro de `try/catch` en Warhome.

## Siguiente tarea obligatoria

1. Auditoría independiente de 6B–6E.
2. Revisión manual de `/login`, `/login/verify`, `/account` y header en desktop, móvil y Safari.
3. Confirmar la convivencia de sesión FlyPath y Warhome.
4. Resolver o aceptar explícitamente el bloqueo de lint global antes del merge.
5. Commit, push y merge únicamente tras aprobación.

## Fuera de alcance

- Stripe, compras, entitlements y AeroComms Pro.
- Persistencia o sincronización remota de progreso.
- Guardado real de Career Planner.
- Google/Apple login, contraseñas, cambio de email y eliminación de cuenta.
- Cambios de Warhome, migraciones Supabase o configuración Vercel.
