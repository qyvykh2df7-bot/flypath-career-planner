# Tarea activa — Fase 6B (Login OTP)

## Estado de la plataforma

- Fase 4 — Warhome MVP: completada e integrada en `main`.
- Fase 5 — Emails operativos: completada e integrada en `main`.
- **6A — Fundamentos de identidad y coexistencia con Warhome:** completado e integrado en `main`.
- Fase actual: Fase 6 — Login, cuentas y perfiles.
- Bloque activo: **6B — Login OTP** (no implementado).

## Bloque 6A cerrado

| Sub-bloque | Commit | Estado |
|------------|--------|--------|
| 6A.1 — Arranque documental | `687f579` | Completado |
| 6A.2 — Coexistencia FlyPath / Warhome | `7d68608` | Completado |
| 6A.3 — Helpers generales de sesión FlyPath | `ce3d8b7` | Completado |

Auditoría independiente de 6A.3: **APROBADO** — sin hallazgos Critical, Major ni Minor.

## Alcance inicial de 6B — Login OTP

Implementar el flujo público de autenticación por email y código OTP, reutilizando los helpers de sesión de 6A.3.

### Entregables previstos

- **`/login`:** formulario de email, envío del código OTP y manejo de errores sin exponer detalles internos.
- **`/login/verify`:** validación del código, creación o restauración de sesión persistente y redirección segura.
- **Parámetro `next`:** allowlist de rutas internas; rechazar URLs externas, protocol-relative y open redirects.
- **Logout público:** reutilizar `signOutFlyPath()` donde corresponda en el flujo de login.
- **Tests:** envío, verificación, `next` seguro, sesión persistente y casos de error.

### Contrato que debe respetarse

- Supabase Auth como identidad única; email + OTP, sin contraseña en esta fase.
- Server-side: `getFlyPathSessionState()` con `auth.getUser()`; nunca `getSession()` como validación de confianza.
- Client-side: `initializeFlyPathAuthState()` y `signOutFlyPath()` como API pública de sesión.
- Warhome y `admin_users` permanecen separados; 6B no modifica autorización admin ni `proxy.ts`.
- Sin `service_role` en rutas públicas de login.

### Criterio de cierre de 6B

Un usuario puede iniciar sesión con OTP, mantener sesión persistente, cerrar sesión explícitamente y ser redirigido de forma segura mediante `next`.

## Fuera de alcance de 6B

- `/account`, header con estados de sesión y UI de perfil (6D).
- Creación idempotente de `profiles` y vínculo con leads (6C).
- Contrato de progreso AeroComms (6E).
- Stripe, compras, entitlements y AeroComms Pro.
- Google/Apple login, contraseñas, cambio de email y eliminación de cuenta.
- Modificaciones a Warhome, migraciones Supabase o configuración Vercel.

## Referencias

- `CURRENT_PHASE.md` — fase actual y estado de 6A/6B.
- `ROADMAP.md` — división completa de Fase 6.
- `LAST_SESSION.md` — handoff del cierre de 6A.
