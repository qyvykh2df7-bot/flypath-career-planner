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

Tracking implementado en `main` (`996d3fc`): infraestructura en `lib/tracking/`, ingesta cliente vía `/api/tracking/events` y conversiones server-side en rutas de leads. Las conversiones server-side históricas de captación sí existen en producción; los eventos cliente (`page_viewed`, `form_completed`, `cta_clicked`, `form_started`, `popup_opened`) siguen sin registros observados en Supabase remoto. Migración `20260712020000` aplicada; `20260712030000` aplicada en remoto con archivo pendiente de commit en `chore/close-tracking-phase-3`.

---

## Fase actual

**Fase 4 — Warhome MVP**

### Objetivo inmediato

Panel interno mínimo para operar leads, solicitudes de acompañamiento, suscripciones, eventos y notas internas, con acceso administrativo seguro.

---

## Captación pública — flujos operativos (Fase 2)

| Superficie | API | `product_key` | `email_subscriptions` | Persiste |
|------------|-----|---------------|----------------------|----------|
| Career Planner | `/api/leads/career-planner-report` | `career_planner` | `career_planner` | lead, interés, suscripción, evento |
| Newsletter home | `/api/leads/home-newsletter` | — | `home_newsletter` | lead, suscripción, evento |
| Pre-PPL (lista de espera) | `/api/leads/preppl-waitlist` | `preppl_guide` | `preppl` | lead, interés (`waitlist`), suscripción, evento |
| Acompañamiento | `/api/leads/mentorship-support` | `flypath_accompaniment` | — | lead, interés (`interested`), evento |

### Decisiones actuales — acompañamiento

- `leads.source` = `mentoring`; `user_events.source` = `mentorship`.
- `interest_intent` = `inquiry` en `user_events.metadata`.
- Metadata de eventos sin PII: solo `interest_intent`, `popup_id` y `form_id`.
- Eventos históricos con PII saneados por migración `20260712030000`.
- Sin `email_subscriptions`; no modifica `marketing_consent`.

---

## Tracking — infraestructura (Fase 3)

| Componente | Ubicación |
|------------|-----------|
| Cliente de tracking (consentimiento, sesión, eventos) | `lib/tracking/client.ts` |
| Contexto de sesión (`anonymous_id`, UTMs, referrer) | `lib/tracking/session.ts` |
| Definiciones y validación de eventos | `lib/tracking/events.ts` |
| Validación servidor e ingesta | `lib/tracking/server.ts` |
| API de eventos cliente | `app/api/tracking/events/route.ts` |

**Contexto capturado:** `anonymous_id`, `session_id`, `landing_page`, `referrer` saneado, UTMs, `page_path`.

**Eventos instrumentados:** `form_started`, `popup_opened`, `cta_clicked`, `page_viewed`, `form_completed` y conversiones server-side por flujo de captación.

**Producción:** conversiones server-side observadas; eventos cliente instrumentados pero sin registros observados en remoto aún.

**Exclusiones conscientes:** `form_abandoned`, blog, páginas individuales de escuelas, navegación global, AeroComms in-app.

---

## Infraestructura existente

| Componente | Ubicación |
|------------|-----------|
| Cliente Supabase admin (`service_role`) | `lib/supabase/admin.ts` |
| Helpers compartidos de leads | `lib/leads/capture-shared.ts` |
| Normalización de email | `lib/leads/normalize-email.ts` |
| Rutas API de captación | `app/api/leads/*` |
| Variables de entorno | `.env.example` |

---

## Realidad actual

| Área | Estado |
|------|--------|
| AeroComms en FlyPath (`/aerocomms/app`) | **Operativa** (Fase 0 — completada) |
| Captación pública de leads | **Operativa** (Fase 2 — 4 flujos) |
| Tracking / analítica web básica | **Implementado en `main`** (Fase 3 — completada; eventos cliente sin observar en producción) |
| Warhome (UI admin) | **No existe** (Fase 4 — actual) |
| Emails operativos | **No existe** (Fase 5) |
| Login y cuentas FlyPath | **No existe** (Fase 6) |
| Persistencia AeroComms en Supabase | **No existe** (Fase 7; progreso en `localStorage`) |
| Revisión final AeroComms (voces, QA) | **Pendiente** (Fase 8) |
| Pagos (Stripe) | **No existe** (Fase 9) |
| CRM y automatizaciones | **No existe** (Fase 10; tablas preparadas) |
| Warboard completo | **No existe** (Fase 11) |

---

## Roadmap — fases 4 a 11

| Fase | Nombre | Estado |
|------|--------|--------|
| 4 | Warhome MVP | **Actual** |
| 5 | Emails operativos | Pendiente |
| 6 | Login y cuentas FlyPath | Pendiente |
| 7 | Persistencia de AeroComms | Pendiente |
| 8 | Revisión final de AeroComms | Pendiente |
| 9 | Pagos y monetización | Pendiente |
| 10 | CRM y automatizaciones | Pendiente |
| 11 | Warhome / Warboard completo | Pendiente |

Detalle en `ROADMAP.md`.

---

## Limitaciones conocidas

- `user_events` es append-only; tracking implementado en `main`; eventos cliente sin observar en producción; sin `form_abandoned` ni dashboards.
- Progreso AeroComms principalmente en cliente (`localStorage`) hasta Fase 7.
- `email_*` y proveedor SMTP sin operar hasta Fase 5.
- `admin_notes` editables vía `service_role` hasta Warhome MVP (Fase 4).

---

## Definition of done — Fase 3 (tracking — completada)

**Implementación (completada):**

- [x] Infraestructura de tracking en `lib/tracking/` y `/api/tracking/events`.
- [x] Instrumentación de navegación, CTAs, popups y formularios en flujos clave.
- [x] UTMs, referer y sesión anónima capturados en contexto.
- [x] Conversiones server-side por flujo de captación.
- [x] Consentimiento de cookies/analítica respetado en eventos cliente.
- [x] Sin datos sensibles en eventos (validación + saneamiento histórico).
- [x] Sin dashboards avanzados.

**Observación en producción (no requerida para cerrar la fase):**

- [ ] Eventos cliente (`page_viewed`, `form_completed`, `cta_clicked`, `form_started`, `popup_opened`) con registros observados en Supabase remoto.

## Definition of done — Fase 4 (Warhome MVP — actual)

- [ ] Acceso administrativo seguro.
- [ ] Listado, búsqueda, filtros y detalle de leads.
- [ ] Intereses, suscripciones, eventos, solicitudes de acompañamiento y notas.

---

## Nota sobre AeroComms

AeroComms **ya está dentro de FlyPath** (Fase 0 completada). Lo pendiente no es migración ni repositorio separado, sino **persistencia de usuario** (Fase 7), **revisión de voces, transcripción, evaluación y QA** (Fase 8), y **monetización AeroComms Pro** (Fase 9).
