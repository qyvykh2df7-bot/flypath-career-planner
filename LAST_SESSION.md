# Última sesión — handoff operativo

## Resumen

- **Backend Core** (Fase 1) y **captación pública de leads** (Fase 2) completados y validados en producción.
- **AeroComms** integrada en FlyPath (Fase 0); producto prácticamente terminado.
- Documentación operativa alineada con roadmap definitivo (fases 3–11).
- **Fase inmediata:** Tracking y analítica básica (Fase 3).

---

## Estado del proyecto

| Área | Estado |
|------|--------|
| AeroComms en `/aerocomms/app` | Operativa (Fase 0) |
| Captación pública (4 flujos) | Operativa (Fase 2) |
| Tracking web ampliado | Pendiente (Fase 3 — actual) |
| Warhome MVP | Pendiente (Fase 4) |

---

## Captación pública (Fase 2 — referencia)

| Superficie | API |
|------------|-----|
| Career Planner | `/api/leads/career-planner-report` |
| Newsletter home | `/api/leads/home-newsletter` |
| Pre-PPL | `/api/leads/preppl-waitlist` |
| Acompañamiento | `/api/leads/mentorship-support` |

Infra: `lib/supabase/admin.ts`, `lib/leads/capture-shared.ts`, `app/api/leads/*`.

---

## Próximo trabajo

Ver `ACTIVE_TASK.md`: **Tracking y analítica básica** (Fase 3).

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
