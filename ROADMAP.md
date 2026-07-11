# FlyPath — Roadmap general

Roadmap del **proyecto FlyPath** (plataforma + productos). AeroComms es un producto dentro de este ecosistema, no el alcance total del roadmap.

**Leyenda de estado**

| Etiqueta | Significado |
|----------|-------------|
| **Completado** | Entregado y en `main` (o aplicado en Supabase cuando aplica). |
| **Preparado** | Esquema o base técnica lista; sin integración operativa. |
| **Pendiente** | No iniciado o sin wiring de aplicación. |

---

## Fase 0 — Migración e integración AeroComms en FlyPath

**Estado: Completado**

- AeroComms migrado desde repositorio alpha a `/aerocomms/app` dentro de FlyPath.
- Rutas, componentes, lib, hooks, assets y APIs de voz integrados.
- Landing AeroComms con CTA hacia la app.
- Build y validación TypeScript en verde.

---

## Fase 1 — Backend Core (esquema Supabase)

**Estado: Completado**

Base de datos compartida para captación, perfiles, email, eventos, contenido y notas internas.

### Completado

- Migraciones 20260711180000 → 20260712010000 aplicadas en Supabase.
- RLS y permisos homogéneos en tablas internas.
- `profiles` con acceso por propietario.
- Merge `backend-core-phase-1` → `main`.

### Preparado (esquema, sin integración app)

| Dominio | Tablas | Integración app |
|---------|--------|-----------------|
| Catálogo | `products` | Pendiente (vista pública futura) |
| Usuarios | `profiles` | Pendiente (alta manual / auth flow) |
| Automatización email | `email_sequences`, `email_sequence_steps`, `email_enrollments`, `email_jobs`, `email_deliveries` | Pendiente |
| Contenido | `content_items` | Pendiente |
| Admin | `admin_notes` | Pendiente (UI Warhome) |

---

## Fase 2 — Backend Integration & Lead Capture (captación pública)

**Estado: Completado**

Conexión del esquema a la aplicación FlyPath con capa servidor segura y cuatro flujos públicos validados en producción.

### Completado

- Cliente Supabase servidor (`lib/supabase/admin.ts`, `service_role` aislado).
- Helpers compartidos (`lib/leads/capture-shared.ts`, `normalize-email.ts`).
- Rutas API en `app/api/leads/*`.
- Cuatro superficies conectadas:

| Superficie | API | Integración |
|------------|-----|-------------|
| Career Planner | `/api/leads/career-planner-report` | Completado |
| Newsletter home | `/api/leads/home-newsletter` | Completado |
| Pre-PPL (lista de espera) | `/api/leads/preppl-waitlist` | Completado |
| Acompañamiento | `/api/leads/mentorship-support` | Completado |

### Integración app — captación

| Dominio | Tablas | Integración app |
|---------|--------|-----------------|
| Captación | `leads`, `lead_product_interests` | **Completado** (4 flujos) |
| Email lists | `email_subscriptions` | **Completado** (3 flujos con suscripción) |
| Analytics | `user_events` | **Completado** (ingesta desde captación) |

---

## Fase 3 — Warhome MVP

**Estado: Siguiente**

Panel interno mínimo para operar el Backend Core.

### Objetivos

- Autenticación/admin privado.
- Leads: listado y detalle.
- Intereses de producto y suscripciones por lead.
- Eventos recientes por lead.
- Notas internas (`admin_notes`).
- Sin Command Center completo aún.

### Preparado (esquema)

- `admin_notes`, `content_items`, tablas de leads y email ya existen.

### Pendiente

- UI Warhome.
- Rutas protegidas.
- Permisos de admin.

---

## Fase 4 — Email Automation Engine

**Estado: Pendiente** (esquema **preparado**)

### Preparado

- Definición de secuencias y pasos.
- Inscripciones, jobs y deliveries.

### Pendiente

- Worker que procese `email_jobs`.
- Proveedor SMTP/API (Resend, Postmark, etc.).
- Cron o scheduler.
- Webhooks de entrega/rebote.
- UI Warhome para secuencias.
- **No presentar como funcional hasta Fase 4.**

---

## Fase 5 — Content OS / Analytics / AI Agents

**Estado: Pendiente** (partes del esquema **preparadas**)

### Preparado

- `content_items` — catálogo editorial.
- `user_events` — registro append-only (ingesta activa desde captación).

### Pendiente

- Dashboards y agregaciones.
- Publicación de contenido vía Next.js (no acceso directo Supabase).
- Agentes AI sobre datos operativos.
- Materialized views, retención, particionado.

---

## Fase posterior — Ampliación de productos y automatizaciones

**Estado: Pendiente**

- Más productos en `products` y flujos de captación adicionales.
- Secuencias por producto/lista (`on_subscription`, `on_product_interest`, etc.).
- Integración AeroComms ↔ leads/eventos (progreso, paywall, onboarding).
- Escuelas, informes premium, más formularios.
- Warhome como Command Center completo.
- Automatizaciones cross-producto.

---

## Resumen visual

```
Fase 0  AeroComms en FlyPath     ████████████  Completado
Fase 1  Backend Core (Supabase)  ████████████  Completado (esquema)
Fase 2  Lead Capture (público)   ████████████  Completado
Fase 3  Warhome MVP              ░░░░░░░░░░░░  Siguiente
Fase 4  Email Automation         ░░░░░░░░░░░░  Pendiente (tablas listas)
Fase 5  Content / Analytics / AI ░░░░░░░░░░░░  Pendiente (tablas parciales)
```
