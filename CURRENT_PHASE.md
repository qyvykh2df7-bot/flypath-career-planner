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

## Fase actual

**Fase 6 — Login, cuentas y perfiles**

### Decisiones cerradas

- Una única cuenta general FlyPath para toda la plataforma; no es un producto ni un plan gratuito.
- Login mediante email y código OTP, sin contraseña inicialmente.
- Sesión persistente y Supabase Auth como identidad única.
- Warhome mantiene autorización separada mediante `admin_users`.
- AeroComms puede utilizarse sin cuenta, con acceso gratuito aproximado al 30 % de Cadet y una misión gratuita; el progreso se guarda localmente y la cuenta no desbloquea contenido.
- La cuenta servirá para guardar y sincronizar progreso más adelante; AeroComms Pro requerirá cuenta y Stripe en una fase posterior.
- Career Planner gratuito seguirá sin exigir login; no se implementará guardado de planes en esta fase.
- Stripe, compras y entitlements quedan fuera de Fase 6.

### División de Fase 6

**6A — Fundamentos de identidad y coexistencia con Warhome**

Helpers de sesión, contrato de cuenta y corrección del cierre de sesión accidental de usuarios normales al visitar Warhome.

**6B — Login OTP**

`/login`, `/login/verify`, envío y validación del código, `next` seguro, sesión persistente y logout.

**6C — Perfil y vínculo con leads**

Reutilización idempotente de `profiles`, vínculo de lead por email verificado y prohibición de crear leads automáticamente.

**6D — Account y header**

`/account`, estados de sesión, nombre, email y cierre de sesión, sin dashboard complejo.

**6E — Preparación AeroComms**

Contrato versionado del progreso local, datos sincronizables y exclusión de audio/transcripciones; sin sincronización remota.

**6F — QA, documentación y merge**

QA desktop/móvil/Safari, coexistencia usuario/admin, validaciones, documentación y merge a `main`.

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
- La vinculación de un lead se hará solo con email verificado y de forma idempotente.

## Referencias técnicas

| Área | Ubicación |
|------|-----------|
| Supabase SSR | `lib/supabase/server.ts`, `lib/supabase/browser.ts` |
| Admin Supabase | `lib/supabase/admin.ts` |
| Warhome auth | `lib/warhome/auth.ts`, `lib/warhome/access.ts`, `proxy.ts` |
| Perfiles | `supabase/migrations/20260711190000_create_profiles.sql` |
| Lead opcionalmente vinculado | `supabase/migrations/20260711200000_create_leads.sql` |
| Progreso local AeroComms | `lib/aerocomms/appState.tsx` |

## Limitaciones conocidas

- El progreso de AeroComms permanece principalmente en cliente hasta una fase posterior.
- No existen todavía compras, entitlements ni persistencia remota de progreso.
- Los roles `owner` y `admin` tienen permisos equivalentes en el MVP de Warhome.
