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

---

## Fase actual

**Fase 3 — Tracking y analítica básica**

### Objetivo inmediato

Registrar comportamiento en web y productos (páginas, CTAs, popups, formularios, UTMs, conversiones, sesiones anónimas) vía `user_events`, sin dashboards avanzados y sin datos sensibles en eventos.

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
- Teléfono y campos del formulario en `user_events.metadata`.
- Sin `email_subscriptions`; no modifica `marketing_consent`.

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
| Tracking / analítica web ampliada | **No existe** (Fase 3 — actual) |
| Warhome (UI admin) | **No existe** (Fase 4) |
| Emails operativos | **No existe** (Fase 5) |
| Login y cuentas FlyPath | **No existe** (Fase 6) |
| Persistencia AeroComms en Supabase | **No existe** (Fase 7; progreso en `localStorage`) |
| Revisión final AeroComms (voces, QA) | **Pendiente** (Fase 8) |
| Pagos (Stripe) | **No existe** (Fase 9) |
| CRM y automatizaciones | **No existe** (Fase 10; tablas preparadas) |
| Warboard completo | **No existe** (Fase 11) |

---

## Roadmap — fases 3 a 11

| Fase | Nombre | Estado |
|------|--------|--------|
| 3 | Tracking y analítica básica | **Actual** |
| 4 | Warhome MVP | Pendiente |
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

- `user_events` es append-only; captación de leads activa; tracking web ampliado pendiente (Fase 3).
- Progreso AeroComms principalmente en cliente (`localStorage`) hasta Fase 7.
- `email_*` y proveedor SMTP sin operar hasta Fase 5.
- `admin_notes` editables vía `service_role` hasta Warhome MVP (Fase 4).

---

## Definition of done — Fase 2 (captación pública)

- [x] Cliente Supabase servidor con `service_role` aislado del bundle cliente.
- [x] Cuatro formularios persisten lead, interés y/o suscripción y evento según flujo.
- [x] Emails normalizados; duplicados gestionados por email.
- [x] Validación local y producción.
- [x] Sin exponer `service_role` al navegador.

## Definition of done — Fase 3 (tracking — fase actual)

- [ ] Eventos de navegación y CTA registrados en `user_events`.
- [ ] Popups y formularios: iniciado, completado, abandonado.
- [ ] UTMs, referer y fuente capturados cuando aplique.
- [ ] Sesiones anónimas y conversiones básicas.
- [ ] Consentimiento de cookies/analítica respetado.
- [ ] Sin datos sensibles en eventos.
- [ ] Sin dashboards avanzados.

## Definition of done — Fase 4 (Warhome MVP — siguiente)

- [ ] Acceso administrativo seguro.
- [ ] Listado, búsqueda, filtros y detalle de leads.
- [ ] Intereses, suscripciones, eventos, solicitudes de acompañamiento y notas.

---

## Nota sobre AeroComms

AeroComms **ya está dentro de FlyPath** (Fase 0 completada). Lo pendiente no es migración ni repositorio separado, sino **persistencia de usuario** (Fase 7), **revisión de voces, transcripción, evaluación y QA** (Fase 8), y **monetización AeroComms Pro** (Fase 9).
