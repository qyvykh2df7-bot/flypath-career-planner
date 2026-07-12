# Última sesión — handoff operativo

## Resumen

- **Fase 3 — Tracking y analítica básica** completada y fusionada en `main`.
- Tracking implementado en `main` (captación, comparador, CTAs, `page_viewed`, `form_completed`); eventos cliente pendientes de observación en producción.
- Migración de privacidad `20260712030000` aplicada en Supabase remoto (2 eventos históricos de mentorías saneados); archivo pendiente de commit Git en esta rama.
- **`main` sigue en `996d3fc`** antes de integrar `chore/close-tracking-phase-3`.
- **Fase inmediata:** Warhome MVP (Fase 4).

---

## Estado del proyecto

| Área | Estado |
|------|--------|
| AeroComms en `/aerocomms/app` | Operativa (Fase 0) |
| Captación pública (4 flujos) | Operativa (Fase 2) |
| Tracking web básica | Implementado en `main` (Fase 3 — completada; eventos cliente sin observar) |
| Warhome MVP | Pendiente (Fase 4 — actual) |

**`main`:** `996d3fc` — *Implement page views and form completion tracking*

---

## Fase 3 — commits principales en `main`

| Commit | Descripción |
|--------|-------------|
| `055ebe6` | Update final roadmap and tracking phase |
| `9be6338` | Implement tracking infrastructure and newsletter pilot |
| `e7009de` | Ignore Supabase CLI temp files |
| `6feba66` | Implement Career Planner and Pre-PPL tracking |
| `15fc734` | Implement mentorship tracking |
| `ec02abc` | Implement comparator and high-value CTA tracking |
| `996d3fc` | Implement page views and form completion tracking |

### Tracking entregado

- **Flujos:** Home Newsletter, Career Planner, Pre-PPL, Mentorías.
- **Superficies:** comparador de escuelas, CTAs públicos de alto valor.
- **Eventos:** `page_viewed` (5 páginas principales), `form_completed` (formularios instrumentados), más `form_started`, `popup_opened`, `cta_clicked` y conversiones server-side.
- **Infraestructura:** `anonymous_id`, `session_id`, `landing_page`, referrer saneado, UTMs, consentimiento analítico, idempotencia, validación de privacidad, límites de body.

### Supabase

- `20260712020000_add_user_events_idempotency.sql` — aplicada.
- `20260712030000_sanitize_mentorship_event_metadata.sql` — aplicada en remoto; 2 eventos `mentorship_support_requested` saneados.
- `20260712030000` aplicada en Supabase; archivo de migración pendiente de commit Git en `chore/close-tracking-phase-3`. Git y remoto no están completamente alineados hasta el merge de esta rama.

### Exclusiones conscientes (Fase 3)

`form_abandoned`, blog, páginas individuales de escuelas, navegación global, AeroComms in-app.

---

## Rama actual de trabajo

`chore/close-tracking-phase-3` — cierre documental de Fase 3.

**Pendiente de commit en esta rama:**

- Actualización de `ROADMAP.md`, `CURRENT_PHASE.md`, `ACTIVE_TASK.md`, `LAST_SESSION.md`, `README.md`.
- `supabase/migrations/20260712030000_sanitize_mentorship_event_metadata.sql` (archivo de migración ya aplicada en remoto).

---

## Próximo trabajo

Ver `ACTIVE_TASK.md`: **Warhome MVP** (Fase 4).

### Roadmap — fases siguientes

| Fase | Nombre |
|------|--------|
| 4 | Warhome MVP |
| 5 | Emails operativos |
| 6 | Login y cuentas FlyPath |
| 7 | Persistencia de AeroComms |
| 8 | Revisión final de AeroComms |
| 9 | Pagos y monetización |
| 10 | CRM y automatizaciones |
| 11 | Warhome / Warboard completo |

Detalle en `ROADMAP.md`. AeroComms **no** tiene fase futura de migración; persistencia (7), calidad de producto (8) y pagos Pro (9) son fases distintas.

---

## Referencia histórica — Backend Core Phase 1

Previamente (2026-07-11): esquema Supabase diseñado, auditado y fusionado en `main` (`61a0df6`). Migraciones `007d7d0` → `61a0df6`.
