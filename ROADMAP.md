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
| Eventos / analítica | `user_events` | Fase 3 (tracking ampliado) |
| Automatización email | `email_sequences`, `email_sequence_steps`, `email_enrollments`, `email_jobs`, `email_deliveries` | Fase 10 (CRM) |
| Contenido | `content_items` | Fase 11 (Warboard) |
| Admin | `admin_notes` | Fase 4 (Warhome MVP) |

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

**Estado: Siguiente**

Medición de comportamiento en web y productos sin dashboards avanzados.

### Objetivos

- Páginas visitadas.
- Clics en CTA.
- Comparador → Career Planner.
- Apertura y envío de popups.
- Formularios iniciados, completados y abandonados.
- UTMs, referer y fuente.
- Conversiones.
- Sesiones anónimas.
- Consentimiento de cookies y analítica cuando corresponda.
- No guardar datos sensibles en eventos.

### Fuera de alcance en esta fase

- Dashboards avanzados.
- Warhome / Warboard.
- CRM, campañas o IA.

### Preparado (esquema)

- Tabla `user_events` (append-only); ingesta activa desde captación de leads (Fase 2).

---

## Fase 4 — Warhome MVP

**Estado: Pendiente**

Panel interno mínimo para operar leads y solicitudes.

### Objetivos

- Acceso administrativo seguro.
- Listado de leads.
- Búsqueda y filtros.
- Detalle de lead.
- Intereses.
- Suscripciones.
- Eventos y recorrido.
- Solicitudes de acompañamiento.
- Notas internas.
- Estado operativo básico.

### Fuera de alcance en esta fase

- CRM avanzado.
- Campañas.
- IA.
- Warboard completo.

### Preparado (esquema)

- `admin_notes`, tablas de leads, email y eventos ya existen.

---

## Fase 5 — Emails operativos

**Estado: Pendiente**

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
Fase 3   Tracking y analítica básica    ░░░░░░░░░░░░  Siguiente
Fase 4   Warhome MVP                    ░░░░░░░░░░░░  Pendiente
Fase 5   Emails operativos              ░░░░░░░░░░░░  Pendiente
Fase 6   Login y cuentas FlyPath        ░░░░░░░░░░░░  Pendiente
Fase 7   Persistencia de AeroComms      ░░░░░░░░░░░░  Pendiente
Fase 8   Revisión final de AeroComms    ░░░░░░░░░░░░  Pendiente
Fase 9   Pagos y monetización           ░░░░░░░░░░░░  Pendiente
Fase 10  CRM y automatizaciones         ░░░░░░░░░░░░  Pendiente (tablas listas)
Fase 11  Warhome / Warboard completo    ░░░░░░░░░░░░  Pendiente
```
