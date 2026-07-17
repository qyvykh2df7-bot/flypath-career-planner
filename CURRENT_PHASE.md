# FlyPath — Fase actual

## Proyecto

**FlyPath** — plataforma de carrera y productos para aspirantes a piloto. **AeroComms** es uno de sus productos y ya está integrado en `/aerocomms/app`.

## Fases completadas

### Fase 0 — AeroComms en FlyPath

Producto integrado en el monorepo; no queda una migración de repositorio pendiente.

### Fase 1 — Backend Core

Esquema Supabase aplicado y fusionado en `main`.

### Fase 2 — Captación pública de leads

Superficies públicas conectadas al Backend Core y validadas.

### Fase 3 — Tracking y analítica básica

Infraestructura de tracking y conversiones server-side integrada en `main`.

### Fase 4 — Warhome MVP

Completada e integrada en `main` mediante el merge `aa4f4fe`.

- Acceso administrativo seguro con Supabase Auth, `admin_users`, roles `owner`/`admin`, login, logout y proxy.
- Shell y navegación en `/warhome`.
- Listado real de leads, búsqueda, filtros, paginación y detalle con intereses, suscripciones y actividad por `lead_id`.
- Sin edición de leads ni UI de notas internas.

### Fase 5 — Emails operativos

Completada e integrada en `main` mediante el merge `aa4f4fe`.

- Jobs, deliveries y plantillas transaccionales para Career Planner, Pre-PPL y Acompañamiento.
- Aviso interno de mentoría.
- Webhook seguro de Resend con deduplicación e idempotencia.
- Warhome `/warhome/emails` con estados, filtros y engagement disponible.
- Separación transaccional/marketing, bajas seguras, historial append-only y propagación de supresiones.
- Tracking de aperturas y clics desactivado en Resend por decisión operativa; el esquema está preparado.

## Fase 6 — Login, cuentas y perfiles

**Completada e integrada en `main`.**

### Decisiones cerradas

- Una única cuenta general FlyPath para toda la plataforma; no es un producto ni un plan gratuito.
- Login mediante email y código OTP, sin contraseña inicialmente.
- Sesión persistente y Supabase Auth como identidad única.
- Warhome mantiene autorización separada mediante `admin_users`.
- AeroComms puede utilizarse sin cuenta, con acceso gratuito aproximado al 30 % de Cadet y una misión gratuita; el progreso se guarda localmente y la cuenta no desbloquea contenido.
- La cuenta servirá para guardar y sincronizar progreso más adelante; AeroComms Pro requerirá cuenta y Stripe en una fase posterior.
- Career Planner gratuito seguirá sin exigir login; no se implementará guardado de planes en esta fase.
- Stripe, compras y entitlements quedan fuera de Fase 6.

### Implementación de Fase 6

**6A — Fundamentos de identidad y coexistencia con Warhome**

#### 6A — Completado

Integrado en `main`. Auditoría independiente de 6A.3: **APROBADO** — sin hallazgos Critical, Major ni Minor.

- **6A.1 — Arranque documental:** `687f579` (`Start login and accounts phase`).
- **6A.2 — Coexistencia FlyPath / Warhome:** `7d68608` (`Preserve FlyPath sessions outside Warhome`). Usuario autenticado sin rol admin → `/` sin perder sesión; anónimo en ruta protegida → `/warhome/login`; admin activo → acceso. Solo `logoutWarhome()` cierra sesión explícitamente.
- **6A.3 — Helpers generales de sesión FlyPath:** `ce3d8b7` (`fix(auth): preserve unavailable state and prevent initial session races`). Contrato server-side con `getFlyPathSessionState()` (`authenticated` / `anonymous` / `unavailable`); client-side con `initializeFlyPathAuthState()` y `signOutFlyPath()`. Sin `admin_users`, sin `service_role`, sin cierre automático.

#### 6B–6F — Completadas e integradas en `main`

**6B — Login OTP**

- `/login` solicita OTP y `/login/verify` lo valida con `requestFlyPathLoginOtp()` y `verifyFlyPathLoginOtp()`.
- El email se conserva por pestaña en `sessionStorage`, con fallback en memoria cuando el storage está restringido; nunca se incluye en la URL.
- `next` tiene allowlist de rutas internas, elimina query strings y rechaza destinos externos, malformados o Warhome.
- `signOutFlyPath()` sigue siendo el único logout general explícito.

**6C — Perfil y vínculo con leads**

- `lib/account/bootstrap.ts` asegura `profiles` de forma idempotente y tolerante a carreras.
- Solo vincula leads existentes sin `user_id` mediante email autenticado y confirmado; nunca crea ni reasigna leads.
- Si el perfil se crea pero el vínculo falla, el resultado es parcial y recuperable en el siguiente acceso.
- La lógica es `server-only`; el cliente no recibe `service_role`.

**6D — Account y header**

- `/account` se protege en servidor y redirige anónimo a `/login?next=/account`.
- El nombre se valida y se guarda en `profiles`; el email autenticado se muestra solo lectura.
- El header usa `initializeFlyPathAuthState()` y muestra estado neutro durante hidratación, “Iniciar sesión” para anónimo y “Mi cuenta” para autenticado.
- No se consulta `admin_users` ni se modifica la separación de Warhome.

**6E — Preparación AeroComms**

- `lib/aerocomms/sync-progress.ts` define el contrato local v1, tipado y puro para futura sincronización.
- Lee el blob histórico `aerocomms.v2` sin escribirlo, sin Supabase y sin cambiar Free/Pro.
- Conserva ejercicios, misiones, puntuaciones y sesiones realmente puntuadas; excluye audio, transcripciones, blobs, permisos, ajustes y UI efímera.

**6F — QA y cierre**

- 309 tests correctos; TypeScript, build y `git diff --check` correctos.
- El lint focalizado de Fase 6 es correcto. `npm run lint` global sigue bloqueado por 57 errores y 77 warnings preexistentes fuera del alcance, principalmente JSX dentro de `try/catch` en Warhome.
- La Fase 6 queda cerrada con la implementación integrada en `main`.

### Fuera de alcance

Stripe, compras, entitlements, AeroComms Pro real, persistencia remota de progreso, guardado real de Career Planner, Google/Apple login, contraseñas, cambio de email, eliminación automática de cuenta, dashboard avanzado y notificaciones.

## Preparado en el esquema

- `profiles` vinculado a `auth.users`.
- `leads.user_id` opcional para vincular una cuenta existente.
- `admin_users` separado para autorización de Warhome.

## Reglas de coexistencia

- El usuario general y el administrador de Warhome comparten identidad en Supabase Auth, pero no permisos.
- La autorización de Warhome siempre se comprueba server-side mediante `admin_users`.
- No se crea un lead automáticamente al crear una cuenta.
- La vinculación de leads está implementada solo con email verificado y de forma idempotente.

## Referencias técnicas

| Área | Ubicación |
|------|-----------|
| Supabase SSR | `lib/supabase/server.ts`, `lib/supabase/browser.ts` |
| Admin Supabase | `lib/supabase/admin.ts` |
| Warhome auth | `lib/warhome/auth.ts`, `lib/warhome/access.ts`, `proxy.ts` |
| Perfiles | `supabase/migrations/20260711190000_create_profiles.sql` |
| Lead opcionalmente vinculado | `supabase/migrations/20260711200000_create_leads.sql` |
| Progreso local AeroComms | `lib/aerocomms/appState.tsx`, `lib/aerocomms/sync-progress.ts` |

## Limitaciones conocidas

- El progreso de AeroComms permanece principalmente en cliente hasta una fase posterior.
- No existen todavía compras, entitlements ni persistencia remota de progreso.
- Los roles `owner` y `admin` tienen permisos equivalentes en el MVP de Warhome.
- La cuenta no sincroniza todavía datos de AeroComms ni desbloquea contenido.
- El lint global permanece bloqueado por errores previos no modificados en esta fase.
