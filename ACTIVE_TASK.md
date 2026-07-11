# Tarea activa — Tracking y analítica básica (Fase 3)

## Objetivo

Implementar **tracking y analítica básica** en FlyPath: registrar comportamiento en web y productos vía `user_events`, sin dashboards avanzados.

---

## Alcance mínimo

- Páginas visitadas.
- Clics en CTA.
- Comparador → Career Planner.
- Apertura y envío de popups.
- Formularios: iniciado, completado, abandonado.
- UTMs, referer y fuente.
- Conversiones.
- Sesiones anónimas.
- Consentimiento de cookies y analítica cuando corresponda.
- No guardar datos sensibles en eventos.

---

## Fuera de alcance (esta tarea — Fase 3)

- Dashboards avanzados o Warboard (Fase 11).
- Warhome MVP (Fase 4).
- Emails operativos (Fase 5).
- Login y cuentas (Fase 6).
- Persistencia AeroComms (Fase 7).
- Revisión final AeroComms (Fase 8).
- Pagos (Fase 9).
- CRM y automatizaciones (Fase 10).
- Nuevos flujos de captación de leads (Fase 2 — completada).

---

## Referencia de esquema

| Migración | Tablas relevantes |
|-----------|-------------------|
| `20260711260000_create_user_events.sql` | `user_events` |

Ingesta ampliada vía rutas servidor (`service_role`); coherente con eventos de captación ya existentes (Fase 2).

---

## Pasos sugeridos

1. Definir convención de `event_name`, `event_category`, `source` y `metadata` para tracking web.
2. Instrumentar páginas clave, CTAs y popups (Pre-PPL, acompañamiento, newsletter).
3. Capturar UTMs, referer y sesión anónima.
4. Respetar consentimiento de cookies/analítica.
5. Validar en local que eventos llegan a Supabase sin PII.

---

## Definición de terminado

- [ ] Eventos de página, CTA y popup registrados.
- [ ] Estados de formulario (iniciado / completado / abandonado) en flujos clave.
- [ ] UTMs y referer en metadata cuando aplique.
- [ ] Sin datos sensibles en eventos.
- [ ] Sin dashboards; solo ingesta en `user_events`.

---

## Ya completado

### Fase 0 — AeroComms en FlyPath

App en `/aerocomms/app`; producto prácticamente terminado. Sin migración pendiente.

### Fase 1 — Backend Core

Esquema Supabase (13 migraciones base + `20260712010000`).

### Fase 2 — Captación pública de leads

| Superficie | API | `product_key` | Suscripción | Persiste |
|------------|-----|---------------|-------------|----------|
| Career Planner | `/api/leads/career-planner-report` | `career_planner` | `career_planner` | lead, interés, suscripción, evento |
| Newsletter home | `/api/leads/home-newsletter` | — | `home_newsletter` | lead, suscripción, evento |
| Pre-PPL | `/api/leads/preppl-waitlist` | `preppl_guide` | `preppl` | lead, interés (`waitlist`), suscripción, evento |
| Acompañamiento | `/api/leads/mentorship-support` | `flypath_accompaniment` | — | lead, interés (`interested`), evento |

Infra: `lib/supabase/admin.ts`, `lib/leads/capture-shared.ts`, `app/api/leads/*`.

---

## Referencias

- `CURRENT_PHASE.md` — fase actual y estado real.
- `ROADMAP.md` — fases 3–11.
- `LAST_SESSION.md` — handoff operativo.
