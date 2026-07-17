# Última sesión — arranque documental Fase 6

**Fecha:** 2026-07-17
**Rama:** `feature/login-accounts-phase-6`
**Base:** `main` limpia y alineada con `origin/main`
**Merge de referencia:** `aa4f4fe Merge operational emails phase`

## Estado cerrado

- Fase 4 — Warhome MVP: completada e integrada en `main`.
- Fase 5 — Emails operativos: completada e integrada en `main`.
- Fase 6 — Login, cuentas y perfiles: fase actual.

## Contrato de cuenta

- Una única cuenta general FlyPath para toda la plataforma.
- Identidad única en Supabase Auth.
- Login mediante email y código OTP, sin contraseña inicialmente.
- Sesión persistente.
- La autorización de Warhome continúa separada mediante `admin_users`.

## Decisiones de producto

### AeroComms

- Uso sin cuenta, con acceso gratuito aproximado al 30 % de Cadet y una misión gratuita.
- Progreso local durante Fase 6.
- La cuenta no desbloquea contenido; la sincronización se preparará para una fase posterior.
- AeroComms Pro y Stripe quedan fuera de esta fase.

### Career Planner

- El flujo gratuito no exige login.
- No se implementa guardado de planes en Fase 6.

## Bloques de Fase 6

1. **6A — Fundamentos de identidad y coexistencia con Warhome:** helpers de sesión, contrato de cuenta y corrección del cierre de sesión accidental de usuarios normales al visitar Warhome.
2. **6B — Login OTP:** `/login`, `/login/verify`, código, `next` seguro, sesión persistente y logout.
3. **6C — Perfil y vínculo con leads:** `profiles` idempotente, vínculo por email verificado y sin creación automática de leads.
4. **6D — Account y header:** `/account`, iniciar sesión / mi cuenta, nombre, email y cierre de sesión.
5. **6E — Preparación AeroComms:** contrato versionado del progreso local, datos sincronizables y exclusión de audio/transcripciones; sin sync remoto.
6. **6F — QA, documentación y merge:** desktop, móvil, Safari, coexistencia usuario/admin, validaciones y merge a `main`.

## Fuera de alcance

Stripe, compras, entitlements, AeroComms Pro real, persistencia remota de progreso, guardado real de Career Planner, Google/Apple login, contraseñas, cambio de email, eliminación automática de cuenta, dashboard avanzado y notificaciones.

## Próximo paso

Revisar en 6A los helpers actuales de Supabase SSR y el proxy de Warhome, definir el contrato compartido de cuenta y corregir la coexistencia de sesiones antes de construir el login OTP.

## Restricciones de este arranque

No se modificó código de aplicación, esquema Supabase ni configuración de Vercel. No se crearon migraciones, commits ni pushes.
