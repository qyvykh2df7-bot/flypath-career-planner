# FlyPath — Roadmap general

Roadmap del **proyecto FlyPath** (plataforma + productos). AeroComms es un producto dentro de este ecosistema, no el alcance total del roadmap.

**Leyenda de estado**

| Etiqueta | Significado |
|----------|-------------|
| **Completado** | Entregado y en `main` (o aplicado en Supabase cuando aplica). |
| **Preparado** | Esquema o base técnica lista; sin integración operativa. |
| **Pendiente** | No iniciado o sin wiring de aplicación. |
| **Siguiente** | Fase actual de trabajo. |

**Elementos transversales** (aplican en todas las fases): seguridad, privacidad, RLS y permisos, logs y errores, backups, entornos dev/preview/production, pruebas, accesibilidad, rendimiento, documentación y migraciones.

---

## Fase 0 — AeroComms en FlyPath

**Estado: Completado**

AeroComms ya vive **dentro de FlyPath** (`/aerocomms/app`). No hay fase futura de migración, repositorio separado ni elección de dominio pendiente.

### Completado

- App en `/aerocomms/app` dentro del monorepo FlyPath.
- Rutas, componentes, lib, hooks, assets y APIs de voz integrados.
- Landing AeroComms con CTA hacia la app.
- Producto **prácticamente terminado** en alcance funcional actual.

### Pendiente de AeroComms (fases posteriores, no migración)

- Persistencia de usuario y progreso en Supabase (Fase 7).
- Revisión general, voces, transcripción, evaluación y QA (Fase 8).
- Límites Free / Pro y desbloqueo tras pago (Fases 7 y 9).

---

## Fase 1 — Backend Core (esquema Supabase)

**Estado: Completado**

Base de datos compartida para captación, perfiles, email, eventos, contenido y notas internas.

### Completado

- Migraciones 20260711180000 → 20260712010000 aplicadas en Supabase.
- RLS y permisos homogéneos en tablas internas.
- `profiles` con acceso por propietario.
- Merge `backend-core-phase-1` → `main`.

### Preparado (esquema, integración app en fases posteriores)

| Dominio | Tablas | Fase prevista |
|---------|--------|---------------|
| Catálogo | `products` | Fase 9 (pagos) |
| Usuarios | `profiles` | Fase 6 (login) |
| Eventos / analítica | `user_events` | Fase 3 (completada) |
| Automatización email | `email_sequences`, `email_sequence_steps`, `email_enrollments`, `email_jobs`, `email_deliveries` | Fase 10 (CRM) |
| Contenido | `content_items` | Fase 11 (Warboard) |
| Admin | `admin_notes` | Esquema listo; UI en backlog (Warhome / Warboard) |

---

## Fase 2 — Captación pública de leads

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

---

## Fase 3 — Tracking y analítica básica

**Estado: Completado**

Medición de comportamiento en web pública vía `user_events`, sin dashboards avanzados.

### Completado

**Infraestructura** (`lib/tracking/`):

- `anonymous_id` y `session_id`.
- `landing_page`, `referrer` saneado y `page_path` en contexto.
- UTMs (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`).
- Consentimiento analítico explícito antes de eventos cliente.
- Idempotencia de conversiones server-side (`idempotency_key` + migración `20260712020000`).
- Validación de privacidad en servidor (metadata cerrada, sin PII).
- Límites de body en rutas de leads y `/api/tracking/events`.
- API cliente `/api/tracking/events` y helpers `lib/tracking/client.ts`.

**Instrumentación por bloques:**

| Bloque | Eventos / superficies |
|--------|------------------------|
| Newsletter home | `form_started`, `form_completed`; conversión `home_newsletter_subscribed` |
| Career Planner | `form_started`, `form_completed`; conversión `career_planner_report_download_requested` |
| Pre-PPL | `popup_opened`, `form_started`, `form_completed`; conversión `preppl_waitlist_joined` |
| Mentorías | `popup_opened`, `form_started`, `form_completed`; conversión `mentorship_support_requested` |
| Comparador de escuelas | `cta_clicked` (selección, Career Planner, mentorías) |
| CTAs públicos de alto valor | `cta_clicked` (home, recursos, AeroComms hero) |
| Páginas principales | `page_viewed` (`home`, `schools`, `mentorship`, `career_planner`, `aerocomms`) |
| Formularios instrumentados | `form_completed` tras captación confirmada (cliente, best-effort) |

**Implementado en `main` vs observado en producción:**

- **Implementado en `main`:** infraestructura, instrumentación y rutas de ingesta descritas arriba.
- **Observado en producción:** conversiones server-side históricas de captación (Fase 2); eventos cliente (`page_viewed`, `form_completed`, `cta_clicked`, `form_started`, `popup_opened`) **sin registros observados** en Supabase remoto aún.
- La observación de eventos cliente no es requisito para cerrar esta fase.

**Supabase:**

- Migración `20260712020000_add_user_events_idempotency.sql` aplicada.
- Migración `20260712030000_sanitize_mentorship_event_metadata.sql` aplicada en remoto; 2 eventos históricos `mentorship_support_requested` saneados (PII eliminada de `metadata`).
- Cierre documental en `main` (`779887a`).

### Exclusiones conscientes (fuera de alcance Fase 3)

- `form_abandoned`.
- Blog y artículos.
- Páginas individuales de escuelas (`/schools/[slug]`).
- Navegación global (shell, menús transversales).
- AeroComms in-app (`/aerocomms/app/*`).

### Fuera de alcance en esta fase (sin cambio)

- Dashboards avanzados.
- Warhome / Warboard.
- CRM, campañas o IA.

---

## Fase 4 — Warhome MVP

**Estado: Completado**

Panel interno mínimo para operar leads y solicitudes. Rama `feature/warhome-mvp` (`494f335`); pendiente de merge a `main`.

### Completado

**Acceso y seguridad**

- Supabase Auth para administradores.
- Tabla `admin_users` (migración `20260712040000`, aplicada en Supabase).
- Roles `owner` y `admin` (mismos permisos en el MVP).
- Login (`/warhome/login`), logout y rutas protegidas (`/warhome/*`).
- Proxy/middleware con validación de sesión SSR y autorización admin.
- `service_role` solo en servidor; sin secretos en bundle cliente.

**Shell y navegación**

- Layout protegido, sidebar, header y navegación por módulos.
- Resumen mínimo en `/warhome` (sin Overview redundante con Leads).
- Rutas futuras deshabilitadas en nav (Notas, Ajustes, Analytics, etc.).

**Operación de leads**

- Listado real (`/warhome/leads`) con selects cerrados.
- Búsqueda, filtros y paginación (20 por página).
- Métricas globales básicas (no filtradas por listado).
- Detalle ampliado (`/warhome/leads/[leadId]`).
- Intereses (`lead_product_interests` + producto).
- Suscripciones (`email_subscriptions`).
- Actividad vinculada por `lead_id` (paginación 20, metadata whitelisted, referrer saneado).

**Solicitudes de acompañamiento**

- Cubiertas sin vista separada: leads con fuente `mentoring`, interés `flypath_accompaniment` y evento `mentorship_support_requested`.

**Estado operativo básico**

- Lectura de `status`, `funnel_stage` y estado de suscripción en listado y ficha (sin edición en UI).

**Calidad**

- 116 tests; TypeScript y build correctos.
- Prerrequisitos operativos verificados: migración `admin_users`, primer owner activo, login/logout y acceso protegido probados manualmente.

### Pospuesto conscientemente (fuera del MVP)

- Notas internas (`admin_notes`) en UI.
- Edición de etapa/estado de lead.
- Recorrido anónimo completo (hasta eventos cliente en producción y consentimiento operativo).
- Refinamiento visual avanzado.
- Diferenciación funcional `owner` vs `admin`.
- Vista dedicada de solicitudes de acompañamiento (operable vía filtros y detalle).

### Fuera de alcance en esta fase

- CRM avanzado.
- Campañas.
- IA.
- Warboard completo.
- Emails operativos (Fase 5).

---

## Fase 5 — Emails operativos

**Estado: Siguiente**

Envíos transaccionales y avisos internos; no automatizaciones avanzadas.

### Objetivos

- Proveedor de email.
- Dominio remitente.
- SPF, DKIM y DMARC.
- Plantillas.
- Confirmación Career Planner.
- Confirmación Pre-PPL.
- Confirmación acompañamiento.
- Aviso interno.
- Registro de envíos, errores y reintentos.
- Bajas y consentimientos.

### Preparado (esquema)

- Tablas `email_jobs`, `email_deliveries` y suscripciones existen; sin proveedor operativo aún.

---

## Fase 6 — Login y cuentas FlyPath

**Estado: Pendiente**

Identidad común para FlyPath y AeroComms.

### Objetivos

- Supabase Auth.
- Registro.
- Login.
- Recuperación de contraseña.
- Perfiles.
- Sesiones.
- Permisos.
- Relación lead–usuario.
- Prevención de duplicados.
- Cuenta común FlyPath y AeroComms.

### Preparado (esquema)

- Tabla `profiles` vinculada a `auth.users`.
- `leads.user_id` opcional en esquema.

---

## Fase 7 — Persistencia de AeroComms

**Estado: Pendiente**

Progreso de usuario en backend; AeroComms ya está en FlyPath (Fase 0).

### Objetivos

- Progreso por usuario en Supabase.
- Ejercicios completados.
- Misiones.
- Niveles.
- Estadísticas.
- Sincronización entre dispositivos.
- Sustitución o migración de `localStorage`.
- Preparación de límites Free y Pro.

### Nota

No implica mover AeroComms a otro repo ni dominio. Solo **persistencia y sincronización** del producto ya integrado.

---

## Fase 8 — Revisión final de AeroComms

**Estado: Pendiente**

Calidad de producto, voz y evaluación. Puede solaparse parcialmente con Fases 6 y 7.

### Objetivos

- Auditoría completa.
- Voces naturales.
- Voces de radio y ATIS cuando corresponda.
- Transcripción.
- Micrófono.
- Evaluación robusta de speaking.
- Respuestas aceptadas y tolerancia.
- Scoring real.
- Estrellas y porcentajes.
- QA móvil y escritorio.
- Responsive.
- Rendimiento.

---

## Fase 9 — Pagos y monetización

**Estado: Pendiente**

Monetización vía Stripe.

### Objetivos

- Stripe.
- Compras únicas.
- Suscripciones.
- Checkout.
- Productos y precios.
- Webhooks.
- Facturación.
- Cancelaciones y reembolsos.
- Desbloqueo de acceso.
- Mentorías.
- Pre-PPL.
- AeroComms Pro.

---

## Fase 10 — CRM y automatizaciones

**Estado: Pendiente** (esquema de email **preparado**)

### Objetivos

- Estados comerciales.
- Responsables.
- Próximas acciones.
- Seguimiento.
- Segmentaciones.
- Recordatorios.
- Secuencias.
- Journeys.
- Campañas.
- Automatizaciones.
- Control de consentimiento y frecuencia.

### Preparado (esquema)

- `email_sequences`, `email_sequence_steps`, `email_enrollments`, `email_jobs`, `email_deliveries`.

---

## Fase 11 — Warhome / Warboard completo

**Estado: Pendiente**

Centro operativo completo de FlyPath.

### Objetivos

- Leads.
- Usuarios.
- Productos.
- Ventas.
- Suscripciones.
- Analítica y funnels.
- Contenido.
- Redes sociales.
- Campañas y anuncios.
- Tareas.
- Soporte.
- FlyPath.
- AeroComms.
- PilotFeliu.
- Agentes de IA.
- Costes y actividad de agentes.

---

## Resumen visual

```
Fase 0   AeroComms en FlyPath           ████████████  Completado (producto integrado)
Fase 1   Backend Core (Supabase)        ████████████  Completado (esquema)
Fase 2   Captación pública de leads     ████████████  Completado
Fase 3   Tracking y analítica básica    ████████████  Completado
Fase 4   Warhome MVP                    ████████████  Completado (pendiente merge)
Fase 5   Emails operativos              ░░░░░░░░░░░░  Siguiente
Fase 6   Login y cuentas FlyPath        ░░░░░░░░░░░░  Pendiente
Fase 7   Persistencia de AeroComms      ░░░░░░░░░░░░  Pendiente
Fase 8   Revisión final de AeroComms    ░░░░░░░░░░░░  Pendiente
Fase 9   Pagos y monetización           ░░░░░░░░░░░░  Pendiente
Fase 10  CRM y automatizaciones         ░░░░░░░░░░░░  Pendiente (tablas listas)
Fase 11  Warhome / Warboard completo    ░░░░░░░░░░░░  Pendiente
```
