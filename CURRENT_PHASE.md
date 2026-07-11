# FlyPath — Fase actual

## Proyecto

**FlyPath** — plataforma de carrera y productos para aspirantes a piloto. **AeroComms** es uno de sus productos (entrenamiento de radiotelefonía), no el proyecto completo.

## Fase completada

**Backend Core Phase 1** — completada, auditada, aplicada en Supabase y fusionada en `main` (2026-07-11).

## Fase actual siguiente

**Backend Integration / Warhome Foundation**

### Objetivo inmediato

Conectar el esquema existente en Supabase a una **primera entrada real de leads** y establecer una **capa servidor segura** (`service_role` solo en servidor, sin exposición al navegador).

---

## Completado (Backend Core Phase 1)

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

### Seguridad

- Tablas internas con **RLS activado**.
- **`anon` y `authenticated` revocados** en tablas internas.
- **`profiles`**: acceso limitado al propietario (`auth.uid() = user_id`).
- **Sin policies públicas accidentales** en tablas internas.
- Operaciones internas futuras vía **`service_role`** en rutas servidor.
- **`products` endurecida** con migración correctiva de permisos.

### Git

- Desarrollo en rama `backend-core-phase-1`.
- Auditoría sin problemas críticos.
- Merge en `main` (`61a0df6`).
- `main` sincronizada con remoto; working tree limpio.

---

## Realidad actual (importante)

Lo siguiente **existe como esquema**, no como producto operativo:

| Área | Estado |
|------|--------|
| Formularios FlyPath → Backend Core | **No conectados** |
| Warhome | **No existe** |
| Worker de email | **No existe** |
| Proveedor SMTP/API | **No conectado** |
| Cron / jobs automáticos | **No existe** |
| Rutas internas de gestión | **No completas** |
| Automatizaciones de email | **Solo tablas** — no presentar como funcionales |

Ejemplo concreto: `components/home/HomeNewsletterForm.tsx` es un placeholder local; no persiste en Supabase.

---

## Siguiente orden de trabajo

1. **Arquitectura segura de servidor**
   - Cliente Supabase `service_role` solo en servidor.
   - Variables de entorno documentadas.
   - Helpers internos reutilizables.
   - Separación estricta browser/server.
   - Validación de entradas en rutas API.

2. **Primera fuente real de leads**
   - Elegir un formulario sencillo (recomendado: newsletter home).
   - Flujo: formulario → lead → product interest → subscription/consent → `user_event`.
   - Normalizar email; evitar duplicados.

3. **Warhome MVP mínimo**
   - Acceso privado (admin).
   - Listado y detalle de leads.
   - Intereses, suscripciones y notas internas.

4. **Después**
   - Más formularios.
   - Gestión de secuencias.
   - Worker + proveedor de email.
   - Contenido y analytics.
   - Ampliar Warhome hacia Command Center.

---

## Limitaciones conocidas

- El esquema no sustituye integración de aplicación.
- `email_*` prepara automatización futura; sin worker ni proveedor no envía nada.
- `content_items` y `admin_notes` son editables solo vía `service_role` hasta Warhome.
- `user_events` es append-only; sin pipeline de ingesta aún.
- Vista pública de `products` (sin `internal_notes`) sigue pendiente.

---

## Definition of done — Backend Integration / Warhome Foundation

La fase actual se considerará completada cuando:

- [ ] Exista cliente Supabase servidor con `service_role` aislado del bundle cliente.
- [ ] Al menos **un formulario real** persista: lead, interés, suscripción y evento.
- [ ] Emails normalizados; duplicados gestionados por email (upsert/idempotencia).
- [ ] Respuestas API claras (éxito, validación, error interno).
- [ ] Prueba local documentada del flujo end-to-end.
- [ ] Warhome MVP con listado/detalle de leads y datos relacionados básicos.
- [ ] Sin exponer `service_role` al navegador.
- [ ] Sin afirmar en UI que las automatizaciones de email están activas.

---

## Nota sobre AeroComms

AeroComms sigue siendo un **producto de FlyPath** (app en `/aerocomms/app`, integrada en `main`). Esta fase **no** es desarrollo de contenido Cadet ni expansión del curriculum AeroComms; es la capa operativa compartida del Backend Core.
