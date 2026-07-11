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

- Migraciones 20260711180000 → 20260712000000 aplicadas en Supabase.
- RLS y permisos homogéneos en tablas internas.
- `profiles` con acceso por propietario.
- Merge `backend-core-phase-1` → `main`.

### Preparado (esquema, sin integración)

| Dominio | Tablas | Integración app |
|---------|--------|-----------------|
| Catálogo | `products` | Pendiente (vista pública futura) |
| Usuarios | `profiles` | Pendiente (alta manual / auth flow) |
| Captación | `leads`, `lead_product_interests` | Pendiente |
| Email lists | `email_subscriptions` | Pendiente |
| Automatización email | `email_sequences`, `email_sequence_steps`, `email_enrollments`, `email_jobs`, `email_deliveries` | Pendiente |
| Analytics | `user_events` | Pendiente |
| Contenido | `content_items` | Pendiente |
| Admin | `admin_notes` | Pendiente |

---

## Fase 2 — Backend Integration & Lead Capture

**Estado: Siguiente**

Conectar el esquema a la aplicación FlyPath con capa servidor segura.

### Objetivos

1. Arquitectura servidor: `service_role`, env vars, helpers, validación.
2. Primer formulario real → lead + interés + suscripción + evento.
3. Idempotencia por email; normalización; errores definidos.
4. Pruebas locales del flujo.

### Pendiente

- Rutas API de captación.
- Cliente Supabase servidor.
- Conexión de formularios existentes (newsletter home, career planner, etc.).
- Vista pública de productos.

---

## Fase 3 — Warhome MVP

**Estado: Pendiente**

Panel interno mínimo para operar el Backend Core.

### Objetivos

- Autenticación/admin privado.
- Leads: listado y detalle.
- Intereses de producto y suscripciones por lead.
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
- `user_events` — registro append-only.

### Pendiente

- Pipeline de ingesta de eventos desde web y servidor.
- Dashboards y agregaciones.
- Publicación de contenido vía Next.js (no acceso directo Supabase).
- Agentes AI sobre datos operativos.
- Materialized views, retención, particionado.

---

## Fase posterior — Ampliación de productos y automatizaciones

**Estado: Pendiente**

- Más productos en `products` y flujos de captación por producto.
- Secuencias por producto/lista (`on_subscription`, `on_product_interest`, etc.).
- Integración AeroComms ↔ leads/eventos (progreso, paywall, onboarding).
- Mentoring, career planner, escuelas, informes premium.
- Warhome como Command Center completo.
- Automatizaciones cross-producto.

---

## Resumen visual

```
Fase 0  AeroComms en FlyPath     ████████████  Completado
Fase 1  Backend Core (Supabase)  ████████████  Completado (esquema)
Fase 2  Lead Capture + Server    ░░░░░░░░░░░░  Siguiente
Fase 3  Warhome MVP              ░░░░░░░░░░░░  Pendiente
Fase 4  Email Automation         ░░░░░░░░░░░░  Pendiente (tablas listas)
Fase 5  Content / Analytics / AI ░░░░░░░░░░░░  Pendiente (tablas parciales)
```
