# FlyPath — Fase actual

## Proyecto

**FlyPath** — plataforma de carrera y productos para aspirantes a piloto. **AeroComms** es uno de sus productos (entrenamiento de radiotelefonía), no el proyecto completo.

## Fases completadas

### Backend Core Phase 1

Completada, auditada, aplicada en Supabase y fusionada en `main` (2026-07-11, merge `61a0df6`).

### Fase 2 — Captación pública de leads

Completada en su alcance: cuatro superficies conectadas al Backend Core, validadas en local y en producción, fusionadas en `main`.

---

## Fase actual

**Warhome MVP**

### Objetivo inmediato

Panel interno mínimo para **listar y operar leads** capturados: detalle, intereses, suscripciones, eventos recientes y notas internas básicas.

---

## Captación pública — flujos operativos

| Superficie | API | `product_key` | `email_subscriptions` | Persiste |
|------------|-----|---------------|----------------------|----------|
| Career Planner | `/api/leads/career-planner-report` | `career_planner` | `career_planner` | lead, interés, suscripción, evento |
| Newsletter home | `/api/leads/home-newsletter` | — | `home_newsletter` | lead, suscripción, evento |
| Pre-PPL (lista de espera) | `/api/leads/preppl-waitlist` | `preppl_guide` | `preppl` | lead, interés (`waitlist`), suscripción, evento |
| Acompañamiento | `/api/leads/mentorship-support` | `flypath_accompaniment` | — | lead, interés (`interested`), evento |

### Decisiones actuales — acompañamiento

- `leads.source` = `mentoring` (valor permitido en CHECK del esquema).
- `user_events.source` = `mentorship`.
- `lead_product_interests.status` = `interested`; intención comercial `inquiry` en `user_events.metadata.interest_intent`.
- Teléfono, situación y texto de ayuda en `user_events.metadata`.
- Consentimiento de **contacto** en metadata; **no** suscripción a marketing ni modificación de `marketing_consent` en leads existentes.

---

## Infraestructura de captación (existente)

| Componente | Ubicación |
|------------|-----------|
| Cliente Supabase admin (`service_role`) | `lib/supabase/admin.ts` (`import "server-only"`) |
| Helpers compartidos | `lib/leads/capture-shared.ts` |
| Normalización de email | `lib/leads/normalize-email.ts` |
| Rutas API | `app/api/leads/*` |
| Variables de entorno | `.env.example` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |

`SUPABASE_SERVICE_ROLE_KEY` solo en servidor; nunca expuesta al navegador.

---

## Completado (Backend Core Phase 1 — esquema)

### Tablas en Supabase

| Tabla | Rol |
|-------|-----|
| `products` | Catálogo de productos FlyPath |
| `profiles` | Perfil 1:1 con `auth.users` |
| `leads` | Captación centralizada por email |
| `lead_product_interests` | Interés de un lead en un producto |
| `email_subscriptions` | Suscripción por lead y lista |
| `email_sequences` | Definición de automatizaciones |
| `email_sequence_steps` | Pasos de cada secuencia |
| `email_enrollments` | Lead inscrito en secuencia |
| `email_jobs` | Cola interna de envíos |
| `email_deliveries` | Historial de intentos de entrega |
| `user_events` | Eventos de producto/marketing (append-only) |
| `content_items` | Catálogo de contenidos (Warhome) |
| `admin_notes` | Notas internas de administración |

### Migraciones aplicadas

1. `20260711180000_create_products.sql`
2. `20260711190000_create_profiles.sql`
3. `20260711200000_create_leads.sql` (+ `lead_product_interests`)
4. `20260711210000_create_email_subscriptions.sql`
5. `20260711220000_create_email_sequences.sql` (+ `email_sequence_steps`)
6. `20260711230000_create_email_enrollments.sql`
7. `20260711240000_create_email_jobs.sql`
8. `20260711250000_create_email_deliveries.sql`
9. `20260711260000_create_user_events.sql`
10. `20260711270000_create_content_items.sql`
11. `20260711280000_create_admin_notes.sql`
12. `20260712000000_harden_products_permissions.sql`
13. `20260712010000_add_home_newsletter_sources.sql`

### Seguridad (esquema)

- Tablas internas con **RLS activado**.
- **`anon` y `authenticated` revocados** en tablas internas.
- **`profiles`**: acceso limitado al propietario (`auth.uid() = user_id`).
- Captación vía **`service_role`** en rutas servidor.
- **`products` endurecida** con migración correctiva de permisos.

---

## Realidad actual

| Área | Estado |
|------|--------|
| Captación pública FlyPath → Backend Core | **Operativa** (4 flujos) |
| Warhome (UI admin) | **No existe** |
| Worker de email | **No existe** |
| Proveedor SMTP/API | **No conectado** |
| Cron / jobs automáticos | **No existe** |
| Automatizaciones de email | **Solo tablas** — no presentar como funcionales |
| Vista pública de `products` | **Pendiente** |

---

## Siguiente orden de trabajo

1. **Warhome MVP** — listado y detalle de leads; intereses, suscripciones, eventos y notas.
2. **Después** — worker + proveedor de email; gestión de secuencias; analytics; Command Center.

---

## Limitaciones conocidas

- `email_*` prepara automatización futura; sin worker ni proveedor no envía nada.
- `content_items` y `admin_notes` son editables solo vía `service_role` hasta Warhome.
- `user_events` es append-only; ingesta desde captación pública activa; sin dashboards aún.
- Teléfono de leads comerciales vive en `user_events.metadata`, no en columna dedicada de `leads`.

---

## Definition of done — Fase 2 (captación pública)

- [x] Cliente Supabase servidor con `service_role` aislado del bundle cliente.
- [x] Formularios reales persisten lead, interés y/o suscripción y evento según flujo.
- [x] Emails normalizados; duplicados gestionados por email (upsert).
- [x] Respuestas API claras (éxito, validación, error interno).
- [x] Validación local y producción de los cuatro flujos.
- [x] Sin exponer `service_role` al navegador.
- [x] Sin copy que implique automatizaciones de email activas.

## Definition of done — Warhome MVP (fase actual)

- [ ] Acceso privado (admin).
- [ ] Listado y detalle de leads.
- [ ] Intereses de producto y suscripciones por lead.
- [ ] Eventos recientes asociados al lead.
- [ ] Notas internas básicas (`admin_notes`).

---

## Nota sobre AeroComms

AeroComms sigue siendo un **producto de FlyPath** (app en `/aerocomms/app`, integrada en `main`). Warhome MVP **no** es desarrollo de contenido Cadet ni expansión del curriculum AeroComms.
