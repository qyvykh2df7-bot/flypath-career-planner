# Última sesión — 2026-07-11

Handoff tras el cierre de **Backend Core Phase 1**.

---

## Resumen

Se diseñó, revisó, aplicó y fusionó el esquema completo del Backend Core de FlyPath en Supabase. La rama `backend-core-phase-1` se integró en `main` y se subió al remoto. Working tree limpio.

---

## Migraciones creadas y aplicadas

| Migración | Contenido |
|-----------|-----------|
| `20260711180000_create_products.sql` | Catálogo + seed de productos |
| `20260711190000_create_profiles.sql` | Perfiles 1:1 con `auth.users` |
| `20260711200000_create_leads.sql` | Leads + `lead_product_interests` |
| `20260711210000_create_email_subscriptions.sql` | Suscripciones por lista |
| `20260711220000_create_email_sequences.sql` | Secuencias + pasos |
| `20260711230000_create_email_enrollments.sql` | Inscripciones en secuencias |
| `20260711240000_create_email_jobs.sql` | Cola de jobs |
| `20260711250000_create_email_deliveries.sql` | Historial de entregas |
| `20260711260000_create_user_events.sql` | Eventos append-only |
| `20260711270000_create_content_items.sql` | Catálogo de contenidos |
| `20260711280000_create_admin_notes.sql` | Notas internas Warhome |
| `20260712000000_harden_products_permissions.sql` | REVOKE explícito en `products` |

Aplicación **manual** en Supabase tras revisión de cada migración.

---

## Auditoría

- Revisión de dependencias entre migraciones (orden correcto).
- Coherencia RLS/REVOKE con patrón del Backend Core.
- `profiles` como excepción con policies por propietario.
- `products` carecía de `REVOKE` explícito → migración correctiva.
- Sin problemas críticos bloqueantes.

---

## Commits principales (rama `backend-core-phase-1`)

```
007d7d0 Create FlyPath products catalog
ac71312 Create FlyPath user profiles
181991b Create leads and product interests
5457914 Create email subscriptions
f583e35 Create email sequences and steps
047e351 Create email enrollments
281fe5f Create email jobs
5dfcf8c Create email deliveries
374c841 Create user events
e8199b2 Create content items
c42e442 Create admin notes
268b2b0 Harden products permissions
61a0df6 Merge Backend Core Phase 1
```

---

## Decisiones técnicas importantes

1. **Tablas internas privadas** — RLS + `REVOKE ALL` para `anon`/`authenticated`; operación vía `service_role`.
2. **`profiles`** — Única tabla con policies de usuario; grants column-level en columnas editables.
3. **`leads.email`** — `citext` + trigger de normalización (lower + trim).
4. **`email_enrollments`** — Sin `UNIQUE (lead_id, sequence_id)` global; índice único parcial para inscripciones abiertas.
5. **`email_sequences` / pasos** — `ON DELETE RESTRICT` en secuencias con inscripciones; pasos `draft` pueden estar incompletos.
6. **`email_jobs` / `email_deliveries`** — Cola e historial separados; unicidad por `(enrollment_id, step)` y `(job_id, attempt_number)`.
7. **`user_events`** — Append-only, sin `updated_at`.
8. **`content_items`** — Slug único parcial; `visibility = public` sin acceso Supabase directo aún.
9. **`admin_notes`** — Entidades asociadas todas opcionales; notas generales permitidas.
10. **`products`** — Endurecimiento post-aplicación sin reescribir migración original.

---

## Qué NO está implementado

- Formularios conectados al Backend Core.
- Cliente Supabase servidor / helpers.
- Warhome (UI admin).
- Worker de email, proveedor SMTP/API, cron.
- Rutas API de captación, gestión o analytics.
- Vista pública de productos.
- Automatizaciones de email en producción.
- Seeds operativos de secuencias o contenido.

---

## Estado Git actual

- Rama: `main`
- Sincronizada con `origin/main`
- Working tree: limpio

---

## Siguiente trabajo recomendado

Ver `ACTIVE_TASK.md`: **Connect First Real Lead Source**.

Orden sugerido:

1. Auditoría de formularios existentes; empezar por newsletter home (`HomeNewsletterForm`).
2. Capa servidor segura (`service_role`, env, validación).
3. Ruta API: lead → product interest → subscription → `user_event`.
4. Warhome MVP mínimo (listado/detalle leads).

No iniciar worker de email ni Warhome completo antes del primer flujo de captación verificado localmente.
