# Tarea activa — Warhome MVP: listado y detalle de leads

## Objetivo

Construir un **panel interno mínimo (Warhome MVP)** para operar los leads ya capturados desde la web pública de FlyPath.

---

## Alcance mínimo

- Acceso privado (admin / autenticación por definir).
- **Listado de leads** — email, nombre, fuente, etapa, fechas.
- **Detalle de lead** — datos del lead y contexto de captación.
- **Intereses de producto** (`lead_product_interests`) por lead.
- **Suscripciones** (`email_subscriptions`) por lead.
- **Eventos recientes** (`user_events`) asociados al lead.
- **Notas internas** (`admin_notes`) si el esquema actual lo permite sin ampliar migraciones.

---

## Fuera de alcance

- Command Center completo.
- Worker de email, proveedor SMTP/API, cron.
- Gestión de secuencias, jobs o deliveries.
- Dashboards de analytics o agregaciones.
- Edición o borrado de `user_events` (append-only).
- Automatizaciones de email en UI o copy de marketing.
- Nuevos flujos de captación pública (ya completados).

---

## Referencia de esquema

| Migración | Tablas relevantes |
|-----------|-------------------|
| `20260711200000_create_leads.sql` | `leads`, `lead_product_interests` |
| `20260711210000_create_email_subscriptions.sql` | `email_subscriptions` |
| `20260711260000_create_user_events.sql` | `user_events` |
| `20260711280000_create_admin_notes.sql` | `admin_notes` |
| `20260711180000_create_products.sql` | `products` (join por `product_id`) |

Operaciones vía `service_role` en rutas servidor; sin acceso directo desde el navegador a tablas internas.

---

## Pasos sugeridos

1. Definir ruta y protección de acceso admin.
2. Listado de leads con paginación básica.
3. Vista detalle con pestañas o secciones: intereses, suscripciones, eventos, notas.
4. Crear nota interna desde detalle de lead (`admin_notes`).
5. Prueba local con leads reales de los cuatro flujos de captación.

---

## Definición de terminado

- [ ] Admin autenticado puede ver listado de leads.
- [ ] Admin puede abrir detalle de un lead con datos relacionados.
- [ ] Intereses, suscripciones y eventos visibles en detalle.
- [ ] Al menos una nota interna creable y visible por lead.
- [ ] Sin worker, sin proveedor email, sin secuencias operativas.
- [ ] `service_role` solo en servidor.

---

## Ya completado — captación pública de leads

Cuatro superficies validadas en local y producción, en `main`:

| Superficie | API | `product_key` | Suscripción | Persiste |
|------------|-----|---------------|-------------|----------|
| Career Planner | `/api/leads/career-planner-report` | `career_planner` | `career_planner` | lead, interés, suscripción, evento |
| Newsletter home | `/api/leads/home-newsletter` | — | `home_newsletter` | lead, suscripción, evento |
| Pre-PPL | `/api/leads/preppl-waitlist` | `preppl_guide` | `preppl` | lead, interés (`waitlist`), suscripción, evento |
| Acompañamiento | `/api/leads/mentorship-support` | `flypath_accompaniment` | — | lead, interés (`interested`), evento |

Infra compartida: `lib/supabase/admin.ts`, `lib/leads/capture-shared.ts`, `lib/leads/normalize-email.ts`, `app/api/leads/*`.

---

## Referencias

- `CURRENT_PHASE.md` — fase actual y flujos de captación.
- `ROADMAP.md` — Fase 3 Warhome MVP.
- `LAST_SESSION.md` — handoff tras cierre de captación pública.
