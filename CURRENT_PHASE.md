# FlyPath — Fase actual

## Proyecto

**FlyPath** — plataforma de carrera y productos para aspirantes a piloto. **AeroComms** es uno de sus productos (entrenamiento de radiotelefonía), ya integrado en `/aerocomms/app`.

## Fases completadas

### Fase 0 — AeroComms en FlyPath

Producto integrado en el monorepo; prácticamente terminado en alcance funcional actual. Sin fase futura de migración.

### Fase 1 — Backend Core

Esquema Supabase aplicado y fusionado en `main` (2026-07-11, merge `61a0df6`).

### Fase 2 — Captación pública de leads

Cuatro superficies conectadas al Backend Core, validadas en local y en producción.

### Fase 3 — Tracking y analítica básica

Tracking implementado en `main` (`779887a`): infraestructura en `lib/tracking/`, ingesta cliente vía `/api/tracking/events` y conversiones server-side en rutas de leads. Las conversiones server-side históricas de captación sí existen en producción; los eventos cliente (`page_viewed`, `form_completed`, `cta_clicked`, `form_started`, `popup_opened`) siguen sin registros observados en Supabase remoto. Migraciones `20260712020000` y `20260712030000` aplicadas en remoto.

### Fase 4 — Warhome MVP

Panel interno mínimo operativo. Integrado en rama `feature/emails-operativos-phase-5` (merge `b335d10` desde `feature/warhome-mvp`); **pendiente de merge a `main`**.

**Entregado:**

- Acceso administrativo seguro: Supabase Auth, `admin_users`, roles `owner`/`admin`, login, logout, proxy y rutas protegidas.
- Shell, sidebar y navegación en `/warhome`.
- Listado real de leads con búsqueda, filtros, paginación y métricas globales básicas.
- Detalle ampliado: intereses, suscripciones y actividad por `lead_id`.
- Solicitudes de acompañamiento cubiertas vía leads, intereses y eventos (sin vista separada).
- Estado operativo básico en lectura (`status`, `funnel_stage`, suscripción).

**Prerrequisitos operativos verificados:**

- Migración `20260712040000_create_admin_users.sql` aplicada en Supabase.
- Primer usuario Auth registrado como `owner` activo.
- Login, logout y acceso protegido probados manualmente.

**Pospuesto conscientemente:**

- Notas internas en UI.
- Edición de etapa/estado.
- Recorrido anónimo completo.
- Overview redundante con Leads.
- Refinamiento visual avanzado.
- Diferenciación `owner` vs `admin`.

### Fase 5 — Emails operativos

Completada en rama `feature/emails-operativos-phase-5`. El bloque **5D** (consentimiento, bajas e historial) está implementado y validado, **pendiente de commit final**.

**Entregado:**

| Área | Detalle |
|------|---------|
| **Proveedor** | Resend configurado; dominio remitente operativo (SPF, DKIM, DMARC). |
| **Transaccionales** | Confirmaciones Career Planner, Pre-PPL y Acompañamiento. |
| **Alerta interna** | `mentorship_internal_alert` → `INTERNAL_ALERT_EMAIL`. |
| **Cola y registro** | `email_jobs` + `email_deliveries` con idempotencia por conversión. |
| **Webhooks** | Recepción segura Resend (`/api/webhooks/resend`); deduplicación por `provider_event_id`. |
| **Estados de entrega** | `delivered`, `bounced`, `failed` y timestamps de engagement en `email_deliveries`. |
| **Warhome Emails** | Vista `/warhome/emails` con filtros, entregas y engagement. |
| **Consentimiento** | Marketing separado de transaccional; textos UI = servidor por flujo. |
| **Bajas** | Baja segura por lista (`/email/unsubscribe` + token opaco hasheado). |
| **Historial** | `email_subscription_events` append-only. |
| **Supresiones** | Propagación webhook de `bounced` / `complained` / `suppressed` → suscripciones existentes. |

**Migraciones Supabase (remoto, hasta `20260712100000`):**

- `20260712050000` — jobs transaccionales.
- `20260712060000` — template Pre-PPL.
- `20260712070000` — templates mentoría.
- `20260712080000` — webhooks Resend y engagement en deliveries.
- `20260712090000` — historial de consentimiento y tokens de baja.
- `20260712100000` — propagación de supresiones a suscripciones.

**Operativa en producción:**

- Webhook Resend productivo funcionando.
- Tracking de aperturas y clics **desactivado** en Resend (reputación del dominio); el esquema y Warhome lo soportan cuando se reactive.

**Commits principales (5A–5C, en rama):**

| Commit | Descripción |
|--------|-------------|
| `aac5ceb` | Add Career Planner transactional email foundation |
| `eacbe5d` | Add Pre-PPL transactional confirmation email |
| `40849ac` | Add mentorship confirmation and internal alert emails |
| `b8a6382` | Add Warhome operational email monitoring |
| `c4a9fb3` | Add secure Resend webhook processing |
| `68a5918` | Show email delivery and engagement in Warhome |

**Aplazado conscientemente (ver `ROADMAP.md`):**

- Reintentos automáticos.
- Campañas, secuencias y centro de preferencias.
- Baja global y reactivación manual en Warhome.
- Hardening de permisos de tablas de consentimiento.
- Reactivación de tracking open/click en Resend.

---

## Fase actual

**Fase 6 — Login y cuentas FlyPath**

### Objetivo inmediato

Definir e implementar el alcance inicial de autenticación, cuentas y perfiles: Supabase Auth, registro, login, recuperación de contraseña, perfiles y relación lead–usuario.

### Preparado (esquema)

- Tabla `profiles` vinculada a `auth.users`.
- `leads.user_id` opcional en esquema.

---

## Captación pública — flujos operativos (Fase 2)

| Superficie | API | `product_key` | `email_subscriptions` | Persiste |
|------------|-----|---------------|----------------------|----------|
| Career Planner | `/api/leads/career-planner-report` | `career_planner` | `career_planner` | lead, interés, suscripción, evento |
| Newsletter home | `/api/leads/home-newsletter` | — | `home_newsletter` | lead, suscripción, evento |
| Pre-PPL (lista de espera) | `/api/leads/preppl-waitlist` | `preppl_guide` | `preppl` | lead, interés (`waitlist`), suscripción, evento |
| Acompañamiento | `/api/leads/mentorship-support` | `flypath_accompaniment` | — | lead, interés (`interested`), evento |

### Decisiones — acompañamiento

- `leads.source` = `mentoring`; `user_events.source` = `mentorship`.
- Sin `email_subscriptions`; no modifica `marketing_consent`.
- Confirmación transaccional al lead e alerta interna; no dependen de consentimiento marketing.

### Decisiones — consentimiento y email (Fase 5)

- **Transaccionales** no dependen de `email_subscriptions.status = subscribed`.
- **`unsubscribed`** no bloquea confirmaciones transaccionales.
- **`bounced`**, **`complained`** y **`blocked`** sí bloquean envío al lead.
- **`email_subscriptions`** gobierna marketing por lista (`list_key`).
- Bajas por lista mediante token opaco (SHA-256 en BD).
- Historial append-only en `email_subscription_events`.

---

## Warhome — infraestructura

| Componente | Ubicación |
|------------|-----------|
| Autorización admin | `lib/warhome/auth.ts` |
| Acceso y rutas | `lib/warhome/access.ts`, `proxy.ts` |
| Login / logout | `lib/warhome/actions.ts`, `app/warhome/login/` |
| Shell y navegación | `components/warhome/`, `lib/warhome/navigation.ts` |
| Listado de leads | `lib/warhome/leads.ts`, `app/warhome/(protected)/leads/` |
| Detalle y actividad | `lib/warhome/lead-detail.ts`, `app/warhome/(protected)/leads/[leadId]/` |
| Emails operativos | `lib/warhome/emails.ts`, `app/warhome/(protected)/emails/` |

**Rutas:** `/warhome/login`, `/warhome`, `/warhome/leads`, `/warhome/leads/[leadId]`, `/warhome/emails`.

**Seguridad:** `getWarhomeAuthorization()` antes de consultas; `service_role` solo servidor; selects cerrados; metadata whitelisted en actividad.

---

## Tracking — infraestructura (Fase 3)

| Componente | Ubicación |
|------------|-----------|
| Cliente de tracking (consentimiento, sesión, eventos) | `lib/tracking/client.ts` |
| Contexto de sesión (`anonymous_id`, UTMs, referrer) | `lib/tracking/session.ts` |
| Definiciones y validación de eventos | `lib/tracking/events.ts` |
| Validación servidor e ingesta | `lib/tracking/server.ts` |
| API de eventos cliente | `app/api/tracking/events/route.ts` |

**Producción:** conversiones server-side observadas; eventos cliente instrumentados pero sin registros observados en remoto aún.

---

## Infraestructura de email (Fase 5)

| Componente | Ubicación |
|------------|-----------|
| Envío transaccional | `lib/email/send-transactional-email.ts` |
| Plantillas | `lib/email/templates/` |
| Jobs y deliveries | `lib/email/jobs.ts`, `lib/email/deliveries.ts` |
| Webhooks Resend | `lib/email/resend-webhooks.ts`, `app/api/webhooks/resend/route.ts` |
| Bajas seguras | `lib/email/unsubscribe.ts`, `app/api/email/unsubscribe/route.ts`, `app/email/unsubscribe/` |
| Captación y suscripciones | `lib/leads/capture-shared.ts` |

---

## Realidad actual

| Área | Estado |
|------|--------|
| AeroComms en FlyPath (`/aerocomms/app`) | **Operativa** (Fase 0) |
| Captación pública de leads | **Operativa** (Fase 2) |
| Tracking / analítica web básica | **En `main`** (Fase 3; eventos cliente sin observar en producción) |
| Warhome (UI admin) | **Operativo en `feature/emails-operativos-phase-5`** (Fase 4; pendiente merge a `main`) |
| Emails operativos | **Completado en `feature/emails-operativos-phase-5`** (Fase 5; 5D pendiente de commit) |
| Login y cuentas FlyPath | **Siguiente** (Fase 6) |
| Persistencia AeroComms en Supabase | **No existe** (Fase 7) |
| Revisión final AeroComms | **Pendiente** (Fase 8) |
| Pagos (Stripe) | **No existe** (Fase 9) |
| CRM y automatizaciones | **No existe** (Fase 10; tablas preparadas) |
| Warboard completo | **No existe** (Fase 11) |

---

## Roadmap — fases 6 a 11

| Fase | Nombre | Estado |
|------|--------|--------|
| 6 | Login y cuentas FlyPath | **Actual** |
| 7 | Persistencia de AeroComms | Pendiente |
| 8 | Revisión final de AeroComms | Pendiente |
| 9 | Pagos y monetización | Pendiente |
| 10 | CRM y automatizaciones | Pendiente |
| 11 | Warhome / Warboard completo | Pendiente |

Detalle en `ROADMAP.md`.

---

## Limitaciones conocidas

- `user_events` es append-only; eventos cliente sin observar en producción.
- Progreso AeroComms principalmente en cliente (`localStorage`) hasta Fase 7.
- Tracking open/click en Resend desactivado por reputación del dominio; esquema listo.
- Reintentos automáticos de email aplazados hasta mayor volumen.
- `admin_notes` con esquema listo; UI pospuesta (ver `BACKLOG.md`).
- Roles `owner` y `admin` equivalentes en Warhome MVP.
- Rama `feature/emails-operativos-phase-5` **no mergeada** a `main`.

---

## Definition of done — Fase 5 (completada)

- [x] Proveedor Resend y dominio remitente configurados.
- [x] SPF, DKIM y DMARC.
- [x] Plantillas transaccionales Career Planner, Pre-PPL y Acompañamiento.
- [x] Aviso interno de mentoría.
- [x] Registro de envíos en `email_jobs` y `email_deliveries`.
- [x] Webhooks Resend seguros e idempotentes.
- [x] Warhome `/warhome/emails`.
- [x] Separación transaccional / marketing.
- [x] Bajas seguras por lista e historial append-only.
- [x] Propagación de supresiones técnicas vía webhook.
- [ ] Commit final del bloque 5D (código en working tree, sin commit aún).

---

## Nota sobre AeroComms

AeroComms **ya está dentro de FlyPath** (Fase 0 completada). Lo pendiente no es migración ni repositorio separado, sino **persistencia de usuario** (Fase 7), **revisión de voces, transcripción, evaluación y QA** (Fase 8), y **monetización AeroComms Pro** (Fase 9).
