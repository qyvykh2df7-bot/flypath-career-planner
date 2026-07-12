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

Panel interno mínimo operativo en rama `feature/warhome-mvp` (`494f335`), pendiente de merge a `main`.

**Entregado:**

- Acceso administrativo seguro: Supabase Auth, `admin_users`, roles `owner`/`admin`, login, logout, proxy y rutas protegidas.
- Shell, sidebar y navegación en `/warhome`.
- Listado real de leads con búsqueda, filtros, paginación y métricas globales básicas.
- Detalle ampliado: intereses, suscripciones y actividad por `lead_id`.
- Solicitudes de acompañamiento cubiertas vía leads, intereses y eventos (sin vista separada).
- Estado operativo básico en lectura (`status`, `funnel_stage`, suscripción).
- 116 tests; TypeScript y build correctos.

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

---

## Fase actual

**Fase 5 — Emails operativos**

### Objetivo inmediato

Conectar un proveedor de email y enviar mensajes transaccionales y avisos internos, con registro de entregas, errores, reintentos y gestión de bajas/consentimientos.

### Alcance previsto

- Proveedor de email y dominio remitente.
- SPF, DKIM y DMARC.
- Plantillas.
- Confirmaciones: Career Planner, Pre-PPL y acompañamiento.
- Avisos internos.
- Registro de envíos, errores y reintentos.
- Bajas y consentimientos.

### Fuera de alcance (Fase 5)

- Automatizaciones avanzadas, secuencias y campañas (Fase 10).
- CRM comercial completo.
- Cambios en Warhome más allá de lo necesario para operar envíos.

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
- Visible en Warhome como lead + interés + evento (sin bandeja dedicada).

---

## Warhome — infraestructura (Fase 4)

| Componente | Ubicación |
|------------|-----------|
| Autorización admin | `lib/warhome/auth.ts` |
| Acceso y rutas | `lib/warhome/access.ts`, `proxy.ts` |
| Login / logout | `lib/warhome/actions.ts`, `app/warhome/login/` |
| Shell y navegación | `components/warhome/`, `lib/warhome/navigation.ts` |
| Listado de leads | `lib/warhome/leads.ts`, `app/warhome/(protected)/leads/` |
| Detalle y actividad | `lib/warhome/lead-detail.ts`, `app/warhome/(protected)/leads/[leadId]/` |

**Rutas:** `/warhome/login`, `/warhome`, `/warhome/leads`, `/warhome/leads/[leadId]`.

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
| Warhome (UI admin) | **Operativo en `feature/warhome-mvp`** (Fase 4 — completada; pendiente merge) |
| Emails operativos | **No existe** (Fase 5 — actual) |
| Login y cuentas FlyPath | **No existe** (Fase 6) |
| Persistencia AeroComms en Supabase | **No existe** (Fase 7; progreso en `localStorage`) |
| Revisión final AeroComms (voces, QA) | **Pendiente** (Fase 8) |
| Pagos (Stripe) | **No existe** (Fase 9) |
| CRM y automatizaciones | **No existe** (Fase 10; tablas preparadas) |
| Warboard completo | **No existe** (Fase 11) |

---

## Roadmap — fases 5 a 11

| Fase | Nombre | Estado |
|------|--------|--------|
| 5 | Emails operativos | **Actual** |
| 6 | Login y cuentas FlyPath | Pendiente |
| 7 | Persistencia de AeroComms | Pendiente |
| 8 | Revisión final de AeroComms | Pendiente |
| 9 | Pagos y monetización | Pendiente |
| 10 | CRM y automatizaciones | Pendiente |
| 11 | Warhome / Warboard completo | Pendiente |

Detalle en `ROADMAP.md`.

---

## Limitaciones conocidas

- `user_events` es append-only; eventos cliente sin observar en producción; actividad en Warhome solo por `lead_id`.
- Progreso AeroComms principalmente en cliente (`localStorage`) hasta Fase 7.
- `email_*` y proveedor SMTP sin operar hasta Fase 5.
- `admin_notes` con esquema listo; UI pospuesta (ver `BACKLOG.md`).
- Roles `owner` y `admin` equivalentes en Warhome MVP.

---

## Definition of done — Fase 4 (Warhome MVP — completada)

- [x] Acceso administrativo seguro (`admin_users`, login, logout, proxy, `service_role` aislado).
- [x] Listado, búsqueda, filtros y paginación de leads.
- [x] Detalle: intereses, suscripciones y actividad por `lead_id`.
- [x] Solicitudes de acompañamiento visibles vía leads/intereses/eventos.
- [x] Estado operativo básico en lectura.
- [x] 116 tests; TypeScript y build correctos.
- [x] Prerrequisitos operativos Supabase verificados.

**Pospuesto (no bloquea cierre):**

- [ ] Notas internas en UI.
- [ ] Edición de etapa/estado.
- [ ] Recorrido anónimo completo en ficha.

## Definition of done — Fase 5 (emails operativos — actual)

- [ ] Proveedor de email y dominio remitente configurados.
- [ ] SPF, DKIM y DMARC.
- [ ] Plantillas transaccionales.
- [ ] Confirmaciones Career Planner, Pre-PPL y acompañamiento.
- [ ] Avisos internos.
- [ ] Registro de envíos, errores y reintentos.
- [ ] Bajas y consentimientos operativos.

---

## Nota sobre AeroComms

AeroComms **ya está dentro de FlyPath** (Fase 0 completada). Lo pendiente no es migración ni repositorio separado, sino **persistencia de usuario** (Fase 7), **revisión de voces, transcripción, evaluación y QA** (Fase 8), y **monetización AeroComms Pro** (Fase 9).
