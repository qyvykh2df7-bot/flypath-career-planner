# Tarea activa — Fase 6 (Login y cuentas FlyPath)

## Estado de Fase 5

**Fase 5 — Emails operativos: cerrada.**

No quedan tareas activas de Fase 5. Todos los bloques (5A–5D) están implementados y validados en rama `feature/emails-operativos-phase-5`.

| Bloque | Contenido | Estado |
|--------|-----------|--------|
| 5A | Fundación transaccional (Resend, jobs, deliveries, Career Planner) | Completado (`aac5ceb`) |
| 5B | Pre-PPL y Acompañamiento (confirmaciones + alerta interna) | Completado (`eacbe5d`, `40849ac`) |
| 5C | Warhome Emails + webhooks Resend + engagement | Completado (`b8a6382`, `c4a9fb3`, `68a5918`) |
| 5D | Separación transaccional/marketing, bajas, historial, supresiones | Implementado; **pendiente de commit** |

**Pendiente operativo antes de cerrar la rama:**

- Validación final del working tree 5D.
- Commit y push de `feature/emails-operativos-phase-5`.
- Merge a `main` (cuando se decida).

---

## Objetivo actual

Definir el **alcance inicial de Fase 6 — Login y cuentas FlyPath**: autenticación, cuentas y perfiles.

---

## Alcance previsto (Fase 6 — borrador)

- Supabase Auth (registro, login, recuperación de contraseña).
- Perfiles (`profiles`) vinculados a `auth.users`.
- Sesiones y permisos básicos.
- Relación opcional `leads.user_id` ↔ cuenta.
- Prevención de duplicados lead/cuenta.
- Cuenta común FlyPath y AeroComms (diseño inicial).

---

## Fuera de alcance (Fase 6)

- Persistencia de progreso AeroComms (Fase 7).
- Pagos y suscripciones (Fase 9).
- CRM, campañas y secuencias (Fase 10).
- Warboard completo (Fase 11).

---

## Referencia — Fase 5 completada

### Infraestructura entregada

| Componente | Ubicación / tabla |
|------------|-------------------|
| Envío transaccional | `lib/email/send-transactional-email.ts` |
| Plantillas | `lib/email/templates/` |
| Cola | `email_jobs` |
| Entregas | `email_deliveries` |
| Webhooks | `email_webhook_events`, RPC `apply_resend_email_webhook_event` |
| Suscripciones | `email_subscriptions` |
| Historial consentimiento | `email_subscription_events` |
| Tokens de baja | `email_unsubscribe_tokens` |
| Warhome Emails | `/warhome/emails` |

### Migraciones aplicadas en remoto (hasta `20260712100000`)

`20260712050000` → `20260712100000` (ver `CURRENT_PHASE.md`).

### Validaciones finales Fase 5

- **218 tests** pasando.
- TypeScript y build correctos.
- Migraciones `12090000` y `12100000` revisadas (APROBADO).
- Webhook Resend productivo.
- Tracking open/click desactivado en Resend (decisión operativa).

---

## Fases anteriores (referencia)

| Fase | Estado |
|------|--------|
| 0 — AeroComms en FlyPath | Completada |
| 1 — Backend Core | Completada (`main`) |
| 2 — Captación pública | Completada |
| 3 — Tracking | Completada (`main`) |
| 4 — Warhome MVP | Completada (en rama; pendiente merge `main`) |
| 5 — Emails operativos | Completada (en rama; 5D sin commit) |

---

## Referencias

- `CURRENT_PHASE.md` — fase actual y estado real.
- `ROADMAP.md` — fases 6–11 y trabajo diferido.
- `LAST_SESSION.md` — handoff de la sesión Fase 5.
- `BACKLOG.md` — mejoras Warhome pospuestas.
