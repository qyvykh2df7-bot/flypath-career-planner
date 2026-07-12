# Tarea activa — Warhome MVP (Fase 4)

## Objetivo

Implementar el **panel interno mínimo (Warhome MVP)** para operar leads, solicitudes de acompañamiento, suscripciones, eventos y notas internas, con acceso administrativo seguro.

---

## Alcance mínimo

- Acceso administrativo seguro.
- Listado de leads.
- Búsqueda y filtros.
- Detalle de lead.
- Intereses.
- Suscripciones.
- Eventos y recorrido.
- Solicitudes de acompañamiento.
- Notas internas (`admin_notes`).
- Estado operativo básico.

---

## Fuera de alcance (esta tarea — Fase 4)

- CRM avanzado, campañas o IA (Fase 10).
- Warboard completo (Fase 11).
- Emails operativos (Fase 5).
- Login y cuentas públicas (Fase 6).
- Persistencia AeroComms (Fase 7).
- Revisión final AeroComms (Fase 8).
- Pagos (Fase 9).
- Nuevos flujos de captación (Fase 2 — completada).
- Ampliación de tracking web (Fase 3 — completada).

---

## Referencia de esquema

| Migración / tabla | Uso en Warhome MVP |
|-------------------|-------------------|
| `leads`, `lead_interests`, `email_subscriptions` | Listado y detalle de leads |
| `user_events` | Recorrido y eventos por lead |
| `admin_notes` | Notas internas por lead |
| `products` | Contexto de producto en intereses |

---

## Pasos sugeridos

1. Definir autenticación y autorización de acceso admin.
2. Crear shell de Warhome (rutas protegidas, layout mínimo).
3. Implementar listado de leads con búsqueda y filtros básicos.
4. Implementar detalle: intereses, suscripciones, eventos y solicitudes de acompañamiento.
5. Integrar notas internas (`admin_notes`) en detalle de lead.
6. Validar en local con datos reales de Supabase (sin exponer `service_role` al cliente).

---

## Definición de terminado

- [ ] Solo usuarios autorizados acceden a Warhome.
- [ ] Listado, búsqueda, filtros y detalle de leads operativos.
- [ ] Intereses, suscripciones, eventos y solicitudes visibles en detalle.
- [ ] Notas internas editables desde la UI admin.
- [ ] Sin CRM avanzado ni Warboard completo.

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

### Fase 3 — Tracking y analítica básica

Infraestructura en `lib/tracking/`; eventos en flujos de captación, comparador, CTAs, `page_viewed` y `form_completed`. Migración `20260712020000` (idempotencia) aplicada; `20260712030000` (saneamiento mentorías) aplicada en remoto con archivo pendiente de commit e integración en esta rama. `main` en `996d3fc`.

---

## Referencias

- `CURRENT_PHASE.md` — fase actual y estado real.
- `ROADMAP.md` — fases 4–11.
- `LAST_SESSION.md` — handoff operativo.
