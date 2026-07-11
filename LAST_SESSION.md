# Última sesión — handoff operativo

## Resumen

La **captación pública de leads** está completada: cuatro superficies conectadas al Backend Core de Supabase, validadas en local y en producción, fusionadas en `main`. Working tree limpio.

---

## Captación pública completada

| Superficie | Commit principal en `main` |
|------------|------------------------------|
| Career Planner | `7b95c04` Connect Career Planner lead capture |
| Newsletter home | `2a1e261` Connect home newsletter lead capture |
| Pre-PPL (lista de espera) | `44ae869` Add Pre-PPL waitlist lead capture |
| Acompañamiento | `23a40bb` Add mentorship support lead capture |

### Flujos

| Superficie | API | `product_key` | Suscripción | Persiste |
|------------|-----|---------------|-------------|----------|
| Career Planner | `/api/leads/career-planner-report` | `career_planner` | `career_planner` | lead, interés, suscripción, evento |
| Newsletter home | `/api/leads/home-newsletter` | — | `home_newsletter` | lead, suscripción, evento |
| Pre-PPL | `/api/leads/preppl-waitlist` | `preppl_guide` | `preppl` | lead, interés (`waitlist`), suscripción, evento |
| Acompañamiento | `/api/leads/mentorship-support` | `flypath_accompaniment` | — | lead, interés (`interested`), evento |

### Infraestructura

- `lib/supabase/admin.ts` — cliente `service_role`, solo servidor.
- `lib/leads/capture-shared.ts` — upsert lead, suscripción, interés, eventos.
- `lib/leads/normalize-email.ts`
- Rutas: `app/api/leads/career-planner-report`, `home-newsletter`, `preppl-waitlist`, `mentorship-support`
- Migración adicional aplicada: `20260712010000_add_home_newsletter_sources.sql`
- Variables: `.env.example` (`SUPABASE_SERVICE_ROLE_KEY`, URL pública Supabase)

### Acompañamiento — decisiones actuales

- `leads.source` = `mentoring`; `user_events.source` = `mentorship`.
- `interest_intent` = `inquiry` en `user_events.metadata`.
- Teléfono y campos del formulario en `user_events.metadata`.
- Sin `email_subscriptions`; no modifica `marketing_consent`.

---

## Estado Git

- Rama: `main`
- Sincronizada con `origin/main`
- Working tree: limpio

---

## Próximo trabajo

Ver `ACTIVE_TASK.md`: **Warhome MVP — listado y detalle de leads**.

No iniciar worker de email ni automatizaciones antes de tener operación básica de leads en Warhome.

---

## Referencia histórica — Backend Core Phase 1

Previamente (2026-07-11): diseño, auditoría, aplicación manual en Supabase y merge del esquema completo del Backend Core (`61a0df6`). Doce migraciones base + endurecimiento de `products`. Detalle de tablas, RLS y decisiones técnicas en commits `007d7d0` → `61a0df6` de la rama `backend-core-phase-1`.
