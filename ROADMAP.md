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

- Usuarios y actividad de AeroComms en Warhome, sin captación automática (Fase 8).
- Revisión final de producto, voz, evaluación y QA (Fase 13).
- Límites Free / Pro y desbloqueo tras pago (Fase 10).

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
| Catálogo | `products` | Fase 10 (pagos) |
| Usuarios | `profiles` | Fase 6 (login) |
| Eventos / analítica | `user_events` | Fase 3 (completada) |
| Automatización email | `email_sequences`, `email_sequence_steps`, `email_enrollments`, `email_jobs`, `email_deliveries` | Fase 11 (CRM) |
| Contenido | `content_items` | Fase 12 (Warboard) |
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

Panel interno mínimo para operar leads y solicitudes. Completado e integrado en `main` mediante el merge `aa4f4fe`.

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

**Estado: Completado**

Bloques 5A–5D implementados, validados e integrados en `main` mediante el merge `aa4f4fe`.

### Completado

**Proveedor y entrega**

- Resend configurado; dominio remitente con SPF, DKIM y DMARC.
- Cola `email_jobs` y registro `email_deliveries` con idempotencia por conversión.
- Plantillas transaccionales: Career Planner, Pre-PPL, Acompañamiento.
- Alerta interna `mentorship_internal_alert` → `INTERNAL_ALERT_EMAIL`.

**Webhooks y estados**

- Webhook seguro `/api/webhooks/resend` con verificación Svix.
- Deduplicación por `provider_event_id` en `email_webhook_events`.
- Estados de entrega: `delivered`, `bounced`, `failed`.
- Propagación de `bounced`, `complained` y `suppressed` a suscripciones existentes (`20260712100000`).

**Warhome**

- Vista `/warhome/emails` con filtros, entregas y engagement.
- Vista separada de Leads; historial de email individual por lead previsto en fases posteriores.

**Consentimiento y bajas**

- Separación transaccional / marketing: transaccionales no dependen de `subscribed`.
- `unsubscribed` no bloquea transaccionales; `bounced` / `complained` / `blocked` sí.
- `email_subscriptions` gobierna marketing por lista.
- Baja segura por lista: token opaco, hash SHA-256, GET confirmación + POST ejecución.
- Historial append-only en `email_subscription_events` (`20260712090000`).

**Migraciones Supabase (remoto, hasta `20260712100000`)**

- `20260712050000` — jobs transaccionales.
- `20260712060000` — template Pre-PPL.
- `20260712070000` — templates mentoría.
- `20260712080000` — webhooks Resend.
- `20260712090000` — historial y tokens de baja.
- `20260712100000` — propagación de supresiones.

**Operativa**

- Webhook Resend productivo funcionando.
- Tracking de aperturas y clics **desactivado** en Resend (reputación del dominio); esquema y Warhome preparados.

**Calidad**

- 218 tests; TypeScript y build correctos.

### Trabajo diferido (fuera de Fase 5)

| Tema | Fase prevista |
|------|---------------|
| Reintentos automáticos de email | Post-volumen / Fase 11 |
| Campañas y envíos masivos | Fase 11 |
| Secuencias y journeys (`email_sequences`, `email_enrollments`) | Fase 11 |
| Centro de preferencias multi-lista | Fase 11 |
| Baja global (todas las listas) | Fase 11 |
| Reactivación manual de suscripciones en Warhome | Fase 11 / Fase 12 |
| Hardening de permisos de tablas de consentimiento | Post-auditoría |
| Reactivar tracking open/click en Resend | Cuando reputación del dominio lo permita |

---

## Fase 6 — Login, cuentas y perfiles

**Estado: Completada e integrada en `main`**

Identidad común para FlyPath y AeroComms, con autorización de Warhome separada mediante `admin_users`.

### Decisiones cerradas

- Una única cuenta general FlyPath; la cuenta no es un producto ni un plan gratuito.
- Login mediante email y código OTP, sin contraseña inicialmente, con sesión persistente.
- Supabase Auth es la identidad única de la plataforma.
- AeroComms puede utilizarse sin cuenta, con acceso gratuito aproximado al 30 % de Cadet y una misión gratuita; el progreso permanece local y crear una cuenta no desbloquea contenido.
- La cuenta permitirá guardar y sincronizar progreso más adelante; AeroComms Pro requerirá cuenta y Stripe en una fase posterior.
- Career Planner gratuito continúa sin exigir login; no se implementará guardado de planes en esta fase.
- Stripe, compras y entitlements quedan fuera de Fase 6.

### División de la fase

**6A — Fundamentos de identidad y coexistencia con Warhome**

**Estado: Completado** (integrado en `main`). Auditoría de 6A.3: **APROBADO**.

- **6A.1:** `687f579` — arranque documental.
- **6A.2:** `7d68608` — coexistencia FlyPath / Warhome; sesión general preservada fuera de Warhome.
- **6A.3:** `ce3d8b7` — helpers de sesión FlyPath (`getFlyPathSessionState`, `initializeFlyPathAuthState`, `signOutFlyPath`).

**6B — Login OTP**

**Estado: Completado e integrado en `main`.**

- `/login` solicita OTP y `/login/verify` lo valida.
- El email temporal queda aislado por pestaña; acceso directo sin estado solicita un nuevo código.
- `next` está cerrado a rutas internas permitidas y no admite open redirects.
- Sesión persistente y logout explícito mediante la capa general de Auth.

**6C — Perfil y vínculo con leads**

**Estado: Completado e integrado en `main`.**

- `profiles` se asegura de forma idempotente y segura ante concurrencia.
- Solo se vinculan leads existentes y libres por email autenticado confirmado.
- No se crean leads ni se reasignan leads ya vinculados; un fallo posterior del vínculo es recuperable.

**6D — Account y header**

**Estado: Completado e integrado en `main`.**

- `/account` protegida, nombre visible editable y validado, email solo lectura y logout.
- Header público reactivo a sesión general con “Iniciar sesión” / “Mi cuenta”, sin consultar ni modificar Warhome.

**6E — Preparación AeroComms**

**Estado: Completado e integrado en `main`.**

- Contrato local versionado v1 y funciones puras de lectura, normalización, validación y serialización.
- Mantiene compatibilidad con `aerocomms.v2`; incluye solo progreso real sincronizable y excluye audio, transcripciones y estado efímero.
- Sin Supabase, sincronización, límites Free/Pro ni desbloqueos nuevos.

**6F — QA, documentación y cierre**

**Estado: QA automatizada y documentación completadas; Fase 6 integrada en `main`.**

- 309 tests, TypeScript, build y `git diff --check` correctos.
- Lint focalizado correcto; el lint global conserva errores preexistentes fuera de Fase 6.

### Fuera de alcance

- Stripe, compras, entitlements y AeroComms Pro real.
- Persistencia remota de progreso y guardado real de Career Planner.
- Google/Apple login, contraseñas, cambio de email y eliminación automática de cuenta.
- Dashboard avanzado y notificaciones.

### Preparado (esquema)

- Tabla `profiles` vinculada a `auth.users`.
- `leads.user_id` opcional en esquema.

---

## Fase 7 — Persistencia de AeroComms

**Estado: CLOSED / COMPLETED / DEPLOYED.** Migración remota aplicada, QA funcional aprobado y deployment completado correctamente.

Progreso de usuario en backend; AeroComms ya está en FlyPath (Fase 0).

### Objetivos

- Progreso por usuario en Supabase con modelo híbrido de estado + historial mínimo.
- Ejercicios, misiones, estadísticas y sesiones reales idempotentes.
- Merge multi-dispositivo monotónico y normalización `rfr` → `ready-for-radio`.
- `localStorage` sigue funcionando para anónimos; la migración local → remoto no borra `aerocomms.v2` tras confirmar persistencia.
- Lecturas propias mediante RLS y escritura únicamente a través de límite server-side autenticado.

### Implementado y desplegado

- Diseño técnico versionado en `docs/ai/aerocomms/aerocomms-phase-7-persistence-design.md`.
- Migración `20260712110000_create_aerocomms_progress_persistence.sql` aplicada con tablas, RLS, índices, recibos de idempotencia y RPC transaccional.
- Rutas `/api/aerocomms/progress/sync` y `/api/aerocomms/progress/reset` y helpers cliente/servidor para validar, normalizar, reintentar y fusionar snapshots.
- Sincronización automática solo para estado vacío o previamente asociado a la misma cuenta. Perfil permite importar explícitamente el progreso anónimo existente o empezar desde cero, sin asociarlo silenciosamente en navegadores compartidos.
- Reset remoto idempotente con corte persistente contra sesiones antiguas; las métricas posteriores a la importación derivan de sesiones idempotentes y el snapshot mantiene el historial de versiones de contenido.
- El nombre de AeroComms no se sincroniza como progreso: se mantiene local para anónimos y `profiles.full_name` es la fuente de visualización para cuentas autenticadas, con resolución explícita de conflictos.
- 359 tests, TypeScript y `git diff --check` correctos. El build local con Webpack quedó bloqueado únicamente por `ENOTFOUND fonts.googleapis.com` al descargar Geist y Geist Mono; no hay errores de compilación propios de Fase 7. El deployment quedó completado correctamente.

### Cierre

- Commit: `aaa5f4e feat(aerocomms): close phase 7 persistence`.
- Push realizado a `main`.
- QA funcional aprobado para importación anónima, recuperación entre navegadores, aislamiento entre cuentas y nombre consistente mediante `profiles.full_name`.

### Nota

No implica mover AeroComms a otro repo ni dominio. No activa Free/Pro, Stripe, compras ni entitlements; esos límites pertenecen a Fase 10.

---

## Fase 8 — Usuarios y actividad de AeroComms

**Estado: CLOSED / COMPLETED / DEPLOYED.**

Dar visibilidad operativa en Warhome a todos los usuarios de AeroComms sin convertir el uso normal del producto en captación comercial.

### Principios cerrados

- `auth.users` + `profiles`: toda cuenta FlyPath.
- Persistencia AeroComms: progreso, sesiones y uso del producto.
- `user_events`: actividad relevante y consentida cuando corresponda.
- `leads`: solo intención comercial explícita futura.
- `email_subscriptions`: solo consentimiento explícito de marketing.
- Pagos y entitlements: clientes y acceso futuro, fuera de esta fase.

No se crea un lead por usar AeroComms, completar onboarding, crear una cuenta, importar progreso o completar actividades o sesiones.

### Objetivos

- Listado de usuarios FlyPath/AeroComms en Warhome.
- Detalle individual con nombre, email, fecha de creación de cuenta y relación con `profiles`.
- Progreso AeroComms real: nivel o etapa disponible, sesiones, actividades completadas y último uso disponible.
- Mostrar importación de progreso y actividad autenticada relevante cuando exista.
- Vínculo opcional con un lead ya existente, sin crear ni reasignar leads.
- Estado de suscripción de marketing separado del uso de producto.
- Preparar la lectura futura de compras y entitlements sin implementarlos.
- Mantener aislamiento entre cuentas y no duplicar datos ya presentes en las tablas de progreso.
- Auditar primero límites de lectura, privacidad, RLS, paginación y datos disponibles antes de crear la interfaz.

### Implementado en 8A–8E

- RPC paginada de directorio aplicada en Supabase remoto, con agregados deduplicados, total exacto y acceso exclusivo de `service_role`.
- Contratos server-only para listado y ficha individual; autorización Warhome obligatoria antes de cada lectura.
- `/warhome/users` con búsqueda por nombre/email, filtros cerrados, orden, paginación de 20, estados vacíos y error genérico.
- `/warhome/users/[userId]` con identidad, perfil, resumen AeroComms, últimas 20 sesiones, lead opcional, marketing separado y placeholder de compras.
- Auditoría de privacidad y rendimiento: sin N+1 en listado; detalle limitado por usuario; sin metadata Auth, providers, tokens, hashes, recibos ni sesiones cliente en los DTOs.
- Migración `20260712120000_create_warhome_user_directory.sql` aplicada en Supabase remoto.
- 398 pruebas, TypeScript, lint focalizado y `git diff --check` correctos.
- QA manual aprobado y deployment de Vercel confirmado manualmente.
- Commit `73758c1 feat(warhome): add AeroComms user operations`, publicado en `main`.

---

## Fase 9 — Backend de opiniones de escuelas

**Estado: CLOSED / COMPLETED / DEPLOY READY**

Backend completo para opiniones de escuelas vinculado a usuarios y escuelas.

Backend y QA manual end-to-end completados; preparado para el siguiente despliegue de cierre.

### Objetivos

- Modelo de opiniones vinculado a escuelas y usuarios.
- Puntuación general y por categorías.
- Comentario y estado de moderación.
- RLS, índices, constraints y validación.
- Prevención de duplicados, spam y abuso.
- Envío, edición y eliminación controlados.
- Aprobación, rechazo y ocultación desde Warhome.
- Medias, distribución y número de opiniones.
- Formulario y páginas de opiniones.
- Integración con fichas de escuela y comparador.
- Hardening del catálogo público aplicado mediante `20260712130000_harden_public_school_catalog_access.sql`.
- Backend privado aplicado mediante `20260712140000_create_school_reviews_backend.sql`.
- Moderación atómica aplicada mediante `20260712150000_make_school_review_moderation_atomic.sql`: transición y evento append-only se confirman o revierten juntos.
- Lectura pública limitada a `approved`, formulario con verificación por email y moderación en `/warhome/reviews`.
- Career Planner consume el mismo agregado público aprobado por lote para sus estrellas (`1–10` a `0–5`), sin fallback a valoración editorial. Sin opiniones aprobadas muestra “Sin opiniones”.
- Sin mezcla con `school_scores`, sin leads, marketing, cuentas ni compras implícitas.
- Pendiente de mejora futura: una iteración de diseño del layout público de opiniones para recuperar y mejorar la presentación visual prevista inicialmente. La funcionalidad está completa.

---

## Fase 10 — Pagos, monetización y entitlements

**Estado: COMPLETADA.** 10B–10G y el gating Free/Pro de AeroComms están cerrados. Stripe Live está preparado con productos y Price IDs para AeroComms Pro, Career Planner Premium y Cómo ser Piloto; la arquitectura Test/Live, Checkout, webhooks, Customer Portal y entitlements están validados. 10F (sincronización operativa de mentorías Cal.com) está desplegado, con migración remota, webhook firmado, Ping Production y flujo operativo de reserva y pago validados.

### Objetivos

- Stripe.
- Productos y precios.
- Checkout.
- Pagos únicos y suscripciones.
- Webhooks.
- Historial de pagos.
- Facturación.
- Cancelaciones y reembolsos.
- Cupones, descuentos y bundles.
- Entitlements y control server-side de acceso.
- AeroComms Pro.
- Career Planner premium.
- Pre-PPL.
- Cómo ser Piloto.
- Mentorías.

### Decisiones cerradas

- Pagar no exige una cuenta FlyPath global.
- **Career Planner Premium:** Stripe Checkout directo, compra invitada permitida y pago confirmado exclusivamente por webhook. El PDF se descarga en el navegador y tendrá recuperación segura si falla la descarga o se cierra la pestaña.
- **AeroComms Pro:** requiere una cuenta FlyPath y usa Stripe Checkout de suscripción. El acceso se resuelve solo con el entitlement server-side `aerocomms_pro`; `localStorage` no es una fuente de autorización.
- **Guías digitales:** compra invitada con Stripe Checkout, confirmación por webhook y enlace de descarga seguro. Pre-PPL seguirá como waitlist hasta estar terminado; después usará este mismo flujo.
- **Mentorías:** el CTA lleva a Cal.com; Cal.com gestiona agenda, reserva, Google Meet, emails operativos y pago mediante Stripe. FlyPath recibe una proyección operativa mediante webhook firmado de Cal.com, no crea Checkout, pedidos ni pagos propios y no vincula por email una reserva con una cuenta o lead.
- **Guía física:** CTA externo a Amazon; Amazon gestiona pago, envío, dirección, devoluciones y facturación. FlyPath solo registra el clic de salida.
- Moneda inicial: **EUR**. Un reembolso digital total revoca el acceso o invalida la entrega; los reembolsos parciales pasan inicialmente a revisión manual.

### 10B completado

- `20260712170000_create_commerce_foundation.sql` está aplicada en remoto. Añade el catálogo comercial, pedidos, pagos, suscripciones, eventos Stripe minimizados, compradores invitados, recuperación/reclamación segura y grants idempotentes.
- Las 12 tablas tienen RLS; `PUBLIC`, `anon` y `authenticated` no tienen acceso directo. Solo `service_role` opera sobre esta base.
- La migración no crea precios, pedidos, pagos, grants ni tokens. La QA sintética se ejecutó dentro de una transacción y se revirtió por completo.
- Stripe SDK, Checkout, rutas webhook, CTAs y cobros continúan fuera de 10B y no están activados.

### 10C cerrado y probado en Stripe sandbox

- `20260712180000_add_career_planner_test_checkout.sql` está aplicada en remoto. Añade el vínculo inmutable de catálogo Stripe y una RPC `SECURITY DEFINER` exclusiva de `service_role` que prepara de forma idempotente `order`, `order_item` y `checkout_attempt` para Career Planner Premium.
- Un script reproducible crea o reutiliza exclusivamente el Product y Price sandbox de Career Planner Premium (5,95 EUR, pago único) y registra sus IDs en `product_prices`. No usa modo live ni acepta IDs desde el navegador.
- El CTA del Career Planner llama a `/api/commerce/checkout`, que solo admite una clave de producto cerrada. Stripe Checkout recibe el precio resuelto en servidor; `success` y `cancel` son rutas internas fijas.
- La prueba sandbox completó un pago de tarjeta oficial y volvió a la pantalla de verificación. Sin webhook, FlyPath no registró `payments`, grants, descarga ni entitlement.
- La cookie de intención se valida contra el propietario server-side y rota de forma segura tras logout, cambio de cuenta o una sesión Stripe ya completada/expirada. Un Product sandbox duplicado de una ejecución previa está archivado e inactivo; no está vinculado al catálogo interno.
- 10D incorpora webhook HTTP firmado, confirmación interna, ledger de pagos y entrega de PDF para Career Planner Premium. `20260712190000_add_career_planner_payment_delivery.sql` y `20260712200000_fix_career_planner_payment_failed_state.sql` están aplicadas en remoto; el segundo mantiene coherentes el intento y pedido tras `payment_intent.payment_failed`. La prueba manual con Stripe CLI confirmó el pago sandbox, el webhook, el `payment` interno, el popup y la descarga. No activa Stripe live, entitlements, suscripciones ni otros productos. Pendiente no bloqueante: normalizar assets PDF incompatibles para eliminar avisos de `@react-pdf/renderer`.

### 10E cerrado y probado en Stripe sandbox — Guía digital Cómo ser Piloto

- `20260712210000_add_como_ser_piloto_guide_checkout_delivery.sql` está aplicada en remoto. Reutiliza el modelo de pedidos, pagos, webhook y entrega de 10C–10D, con RPCs exclusivas de `service_role` para la guía.
- El producto existente `como_ser_piloto_guide` se vincula al precio interno activo `como_ser_piloto_guide_eur`: 14,95 EUR, pago único. La sincronización sandbox es idempotente y usa metadata cerrada `flypath_product_key`, no nombres comerciales ambiguos.
- La CTA de `/guia-como-ser-piloto` solo manda la clave cerrada de producto al Checkout común. El precio, la moneda, el usuario opcional y las URL internas se resuelven en servidor.
- El pago confirmado por webhook habilita una entrega distinta `como_ser_piloto_guide_delivery`, con token opaco `HttpOnly`, hash, caducidad y máximo de cinco descargas. El control de producto evita el acceso cruzado con el informe Career Planner. No crea entitlements.
- El PDF final de la guía se retiró de `public/` y se sirve solo desde el asset privado tras comprobar el token y el pago. La QA sandbox confirmó Checkout a 14,95 EUR, ledger interno, popup y descarga protegida.
- La auditoría independiente de 10E quedó **APROBADA**, sin hallazgos Critical ni Major. Queda como mejora futura no bloqueante validar metadata también al reutilizar un Price Stripe existente; el vínculo sandbox actual es correcto.

### 10G cerrado — AeroComms Pro Subscription Billing

- Commit `1c84833 feat(aerocomms): complete pro subscription billing flow`, publicado en `main`.
- Catálogo recurrente cerrado para `aerocomms_pro`: **5,99 EUR/mes**, sin trial y con Checkout server-side solo para usuarios autenticados. El Price anterior de 7,37 EUR queda archivado para sostener la sincronización de suscripciones históricas, sin usarse en nuevas altas.
- Stripe webhook sincroniza suscripción y entitlement `aerocomms_pro`; el retorno post-checkout verifica el estado mediante modal, sin activar acceso desde la redirección.
- Estados validados: `active`, `past_due`, `cancel_at_period_end`, reembolso y disputa. La cancelación mantiene acceso hasta `current_period_end`; reembolso y disputa lo revocan de inmediato.
- `invoice.payment_failed` mantiene el grant activo exactamente 48 horas desde el evento. Las migraciones `20260712270000` y `20260712280000` corrigen el cálculo y el backfill histórico de grants sin modificar el periodo Stripe.
- Migraciones Supabase Production aplicadas hasta `20260712280000`; QA sandbox completado para Checkout, activación, cancelación, fallo de pago con Test Clock, refund y webhook `200`.
- `POST /api/stripe/customer-portal` crea una sesión Stripe Billing Portal solo para la cuenta autenticada con una suscripción `aerocomms_pro` vinculada. El portal sandbox permite cancelación al final de periodo, actualización de método de pago e historial de facturas; `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid` e `invoice.payment_failed` mantienen la proyección interna al día.
- El perfil Pro expone “Gestionar suscripción” con estados de carga y error. No acepta `customer_id` ni destinos de retorno desde el navegador.
- Commit final de gestión: `6e079cb feat(aerocomms): add stripe customer portal management`.

### 10F cerrado — sincronización operativa de mentorías Cal.com

- `20260712220000_create_calcom_mentorship_booking_sync.sql` está aplicada en Supabase remoto. Crea `mentorship_bookings` y `cal_webhook_events`, con RLS cerrada, permisos exclusivos de `service_role`, constraints de estado y ledger por hash de body.
- `/api/webhooks/calcom` verifica `x-cal-signature-256` sobre el body crudo con HMAC SHA-256 y `CALCOM_WEBHOOK_SECRET`. Solo permite `BOOKING_CREATED`, `BOOKING_PAID`, `BOOKING_CANCELLED` y `BOOKING_RESCHEDULED`.
- Una RPC `SECURITY DEFINER` con `search_path` fijo registra y proyecta cada evento en la misma transacción, deduplica por hash y evita que eventos antiguos del proveedor sobrescriban datos más recientes.
- La proyección conserva referencias Cal.com, asistente, fechas, zona horaria y estados operativos. No persiste payloads, enlaces Meet, notas, Commerce FlyPath, leads, suscripciones ni identificadores de pago propios.
- Production sirve la ruta y `CALCOM_WEBHOOK_SECRET` está configurado; el Ping firmado llega correctamente al endpoint.
- Los CTAs de mentorías de la página de mentorías, pricing, escuelas, shop, blog y free report usan `FLYPATH_MENTORIA_CALCOM_URL`, abren Cal.com de forma segura y conservan el tracking existente. Commit: `0cd06b9 feat(mentorship): connect frontend CTAs to calcom`.
- Cal.com gestiona agenda, reserva, Meet, emails operativos y pago; FlyPath conserva la proyección operativa privada sincronizada por webhook.
- Cierre final de Fase 10 validado con 698 tests, TypeScript, lint focalizado y `git diff --check` correctos.

### AeroComms Free / Pro gating completado

- El tramo inicial aproximado del 30% de cada bloque Cadet permanece Free; el resto de Cadet y todos los niveles posteriores requieren Pro.
- La primera misión ATC Sim permanece Free y las siguientes muestran candado y CTA de upgrade.
- El acceso se resuelve exclusivamente mediante el entitlement server-side `aerocomms_pro`; `localStorage` no autoriza contenido.
- Usuarios anónimos y registrados sin Pro comparten el acceso Free. Los usuarios Pro acceden al catálogo completo y las cancelaciones conservan acceso hasta `current_period_end`.
- Las rutas directas, recomendaciones y avances de sesión respetan el mismo contrato. El override interno es opt-in y solo funciona en development/test.

---

## Fase 10.5 — Production Launch & Hardening

**Estado: Completada.**

### SEO técnico e indexación completados

- `FLYPATH_CANONICAL_ORIGIN` es la única fuente server-side de `metadataBase`, URLs canónicas, Open Graph y Twitter; no se deriva metadata de `Host`, previews ni dominios de Vercel.
- Las rutas públicas relevantes, incluidas fichas comparables de escuelas, tienen canonical absoluto y metadata social con assets públicos existentes.
- El sitemap incluye solo superficies públicas reales, artículos y fichas comparables; se retiraron dashboard, rutas privadas, previews, QA y rutas de app interna.
- `/dashboard` y `/premium-report-thumb` son herramientas de desarrollo/test y responden `404` en producción. `/aerocomms/app/*` continúa disponible para producto, con `noindex, nofollow`.
- Validación local: 778 tests, TypeScript, lint focalizado, build Webpack, `git diff --check` y `npm audit --omit=dev` correctos.
- QA Production: redirección `308` del apex a `www`, metadata social/canonical correcta, imágenes OG `200` y sitemap de 63 URLs públicas únicas bajo el dominio final.
- Contrato y comprobaciones operativas: `docs/ai/seo/flypath-canonical-metadata-and-indexing.md`.

### Hardening de APIs de voz AeroComms completado

- Migración `20260712310000_add_aerocomms_voice_rate_limits.sql` aplicada en Supabase Production.
- TTS y STT usan identidad resuelta en servidor, entitlement real para Pro y cuota distribuida mediante RPC privada; no confían en `localStorage` ni flags cliente.
- Cuotas activas: anónimo TTS 8/10 min y STT 2/h; Free autenticado TTS 30/10 min y STT 8/h; Pro TTS 90/10 min y STT 100/h.
- `AEROCOMMS_VOICE_RATE_LIMIT_SALT` está configurado como variable sensible en Production y Preview. Fallos de configuración o infraestructura responden `503` antes de llamar a OpenAI.
- QA Production: TTS/STT válidos, validaciones de body/MIME y `429` de STT anónimo verificados. QA por cuenta Free/Pro pendiente.
- Mejoras posteriores no bloqueantes: parsing multipart en streaming, limpieza periódica de filas de cuota y prueba de concurrencia real contra Supabase.

### Hardening web previo al lanzamiento — completado y desplegado

- Origen único `FLYPATH_CANONICAL_ORIGIN` para Checkout, correo, callbacks, URLs absolutas y comprobación same-origin; no se acepta `Host` de cliente como fuente de URL pública. Production y Preview están configurados con el origen HTTPS aprobado.
- CSP, HSTS, anti-embedding, `nosniff`, referrer policy, permissions policy y resource policy definidos. Producción no permite `unsafe-eval`; la excepción `unsafe-inline` de Next.js se mantiene documentada.
- Stripe, Cal.com y Resend limitan body antes de firma o persistencia (1 MiB, 256 KiB y 256 KiB). Las herramientas `/review/*`, previews y QA se bloquean fuera de desarrollo/test y se marcan `noindex`.
- Validación local: 771 tests, TypeScript, lint focalizado, `git diff --check` y build Webpack correctos.
- Dependencias corregidas: `next`/`eslint-config-next` `16.2.12`, además de las actualizaciones compatibles de `postcss`, `sharp` y `js-yaml`. `npm audit --omit=dev` informa **0 vulnerabilidades**. El audit completo conserva un High de `brace-expansion` y un Low de `esbuild`, ambos transitivos de herramientas locales de lint/pruebas y no desplegados.

### Optimización de rendimiento pre-lanzamiento completada

- Auditoría con build Webpack, Lighthouse móvil/escritorio, análisis de bundles, recursos visuales, fuentes, renderizado y peticiones de rutas públicas y de producto representativas.
- La home ya no descarga los PNG originales de sus miniaturas: `next/image` y `sizes` reducen la transferencia móvil local de **6,21 MiB a 676 KiB** (-89 %) y la de escritorio de **7,54 MiB a 820 KiB**, conservando el diseño y los mockups. En Production, la home pasó de **6,24 MiB a 709 KiB** en móvil (-89 %), sin regresión de TBT o CLS.
- El formulario modal Pre-PPL se carga bajo demanda y las imágenes de portada/tarjetas del blog usan el pipeline optimizado de Next.
- Las rutas públicas siguen prerenderizadas cuando corresponde; datos privados, sesión, pagos, entitlements y progreso siguen dinámicos y no se cachean públicamente.
- Documento de medición y decisiones: `docs/ai/performance/flypath-production-performance-audit.md`. Vercel Analytics y Speed Insights están activos para la monitorización continua del dominio definitivo.

### Hardening de formularios públicos y marketing completado

- Migración `20260712320000_harden_public_forms_and_marketing_opt_in.sql` aplicada en Production. Newsletter, Career Planner, Pre-PPL, mentorías y opiniones usan rate limiting distribuido en Supabase con subjects HMAC, body limitado, same-origin, honeypot y tiempo mínimo de formulario.
- Las cuotas combinan IP de plataforma e identidad: newsletter 3/h + 2/día por email; Career Planner, Pre-PPL y mentorías 5/h + 3/día por email; opiniones 5/h + 5/día por escuela/email o usuario. Los límites responden `429` con `Retry-After`; salt, RPC o Supabase no disponibles responden `503` antes de crear datos o enviar email.
- `PUBLIC_FORM_RATE_LIMIT_SALT` se mantiene como secreto sensible en local, Vercel Production y Preview. No se persisten IPs ni emails en claro para las cuotas.
- Newsletter Home y el consentimiento explícito del Career Planner aplican doble opt-in con token opaco hasheado y caducidad de 48 h. Pre-PPL, mentorías y opiniones no crean consentimiento de marketing automático.
- Seguimiento no bloqueante: programar `purge_public_form_security_data`, evaluar multipart streaming y probar concurrencia real contra la RPC de cuota.

### Cierre de lanzamiento

- Producción opera en `https://www.flypath.es`; el apex redirige permanentemente a `www`.
- Hostinger mantiene dominio, correo y registros DNS de email. El hosting web se retiró tras validar Vercel.
- `FLYPATH_CANONICAL_ORIGIN`, Supabase Site URL y Redirect URLs, y los webhooks de Stripe, Cal.com y Resend usan el dominio definitivo.
- Seguridad pre-lanzamiento, rendimiento, Vercel Analytics, Speed Insights y SEO técnico quedaron desplegados y validados.
- Commits de cierre relevantes: `64f4808 fix(security): complete pre-launch web hardening`, `d1a5db0 perf(launch): optimize FlyPath production performance`, `e9e738f chore(analytics): enable Vercel Speed Insights`, `c405d26 chore(analytics): enable Vercel Web Analytics` y `2a1e2c5 fix(seo): finalize canonical metadata and indexing`.

---

## Fase 11 — CRM y automatizaciones

**Estado: Actual.**

Consolida la base CRM existente y prepara los datos operativos. La fase no se convierte en un proyecto CRM completo antes de avanzar parcialmente con Content OS PilotFeliu.

### Completado — Auditoría del sistema actual

- Auditorías CRM realizadas sobre leads, usuarios, emails, consentimiento, productos, compras, eventos, automatizaciones y Warhome.
- Warhome MVP existente como superficie interna para leads, usuarios, emails y moderación de opiniones.
- Base de leads, usuarios, emails, consentimientos y tracking base documentada y separada por fuente de verdad.
- Relaciones y duplicidades potenciales identificadas antes de crear tablas o migraciones.

### Pendiente — Consolidación CRM y automatizaciones

- Automatizaciones de email sobre consentimiento real.
- Secuencias y journeys.
- Analytics de negocio MVP: visitas, fuentes, eventos, leads, ventas y conversiones.
- Unificación operativa de orígenes y prevención de duplicados usando primero las tablas existentes.

El diseño funcional de Content OS PilotFeliu permanece documentado, pero su primer módulo de creación de contenido se adelanta parcialmente en 12A por prioridad de negocio.

### Objetivos

- Centralizar leads, usuarios, productos e intereses sin fusionar conceptos distintos.
- Unificar orígenes de captación y registrar el estado del funnel.
- Preparar automatizaciones de email sobre consentimiento real.
- Evitar duplicados entre formularios y fuentes existentes.
- Reutilizar la infraestructura actual antes de proponer nuevas tablas.

### Infraestructura existente

- Backend Core.
- Leads.
- Warhome MVP.
- Emails Operativos.
- Tablas de secuencias y automatizaciones.

---

## Fase 12 — Warhome / Warboard / Command Center

**Estado: Pendiente, con Warhome MVP y 12A Content OS completados**

Centro operativo completo de FlyPath.

### 12A — Content OS PilotFeliu (adelantado)

**Motivo:** herramienta interna necesaria para comenzar la creación y organización de contenido.

Content OS PilotFeliu es un módulo privado dentro de Warhome, que sigue siendo un Command Center interno de FlyPath. No es una aplicación separada, no tiene acceso público y no sustituye el desarrollo futuro completo del Command Center.

Alcance adelantado:

- Calendario editorial semanal y mensual.
- Gestión del roster personal.
- Planificación asistida por IA.
- Banco de ideas.
- Biblioteca de contenido.
- Fichas de vídeos.
- Objetivos de contenido: crecimiento, comunidad, autoridad y conversión.
- Métricas iniciales introducidas manualmente.
- Agentes IA semi-autónomos: la IA propone y PilotFeliu revisa y aprueba.

Estado del MVP 12A:

- Rutas y navegación privadas dentro de Warhome.
- Banco de ideas con estados y conversión atómica a pieza.
- Biblioteca y ficha operativa de contenido.
- Calendario semanal/mensual con bloques de grabación, edición y publicación.
- Métricas manuales por fecha.
- Contrato de propuestas IA preparado, sin agentes activos.
- Migración `20260729120000_create_content_os_pilotfeliu_mvp.sql` aplicada en Supabase remoto y QA sintético remoto completado; validación actual: 800 tests correctos, TypeScript, lint, build Webpack y `git diff --check` correctos.
- Roster y planificación IA quedan para el siguiente bloque; no forman parte del MVP manual aplicado.

La especificación funcional se mantiene en [Content OS PilotFeliu - AI Content Command Center](./docs/ai/content-os/pilotfeliu-content-os-command-center.md). El adelanto de 12A no activa implementación del Command Center completo, no crea una base separada y no modifica el alcance de AeroComms.

### Objetivos

- Negocio, usuarios, leads, ventas, ingresos, productos y funnels.
- Métricas de AeroComms, Career Planner, guías, mentorías, comparador y opiniones.
- Content OS PilotFeliu y su módulo adelantado 12A, a partir de su [especificación funcional](./docs/ai/content-os/pilotfeliu-content-os-command-center.md).
- Redes sociales.
- Ads & Promotions.
- Tareas y operaciones.
- Pantalla visual de agentes IA.
- Estado, tareas, outputs, frecuencia, costes y tokens.
- Aprobación humana para acciones sensibles.

---

## Fase 13 — Revisión final y lanzamiento de AeroComms

**Estado: Pospuesta. Última fase del roadmap actual.**

### Objetivos

- Auditoría integral.
- Onboarding y navegación.
- Revisión de contenido.
- Voz, micrófono, STT y TTS.
- Voces naturales, radio y ATIS.
- Evaluación robusta de speaking.
- Scoring, estrellas y porcentajes reales.
- Límites Free / Pro conectados a entitlements.
- QA móvil, escritorio e iPhone real.
- Responsive.
- Accesibilidad.
- Rendimiento.
- Errores de consola.
- Limpieza de código antiguo.
- QA final en producción.

---

## Resumen visual

```
Fase 0   AeroComms en FlyPath           ████████████  Completado (producto integrado)
Fase 1   Backend Core (Supabase)        ████████████  Completado (esquema)
Fase 2   Captación pública de leads     ████████████  Completado
Fase 3   Tracking y analítica básica    ████████████  Completado
Fase 4   Warhome MVP                    ████████████  Completado e integrado en main
Fase 5   Emails operativos              ████████████  Completado e integrado en main
Fase 6   Login, cuentas y perfiles      ████████████  Completada e integrada en main
Fase 7   Persistencia de AeroComms      ████████████  CLOSED / COMPLETED / DEPLOYED
Fase 8   Usuarios y actividad AeroComms ████████████  CLOSED / COMPLETED / DEPLOYED
Fase 9   Backend de opiniones           ████████████  CLOSED / COMPLETED / DEPLOY READY
Fase 10  Pagos y entitlements           ████████████  Completada
Fase 10.5 Production Launch & Hardening ████████████  Completada
Fase 11  CRM y automatizaciones         ░░░░░░░░░░░░  Actual / consolidación y automatizaciones
Fase 12  Warhome / Warboard / Command   ░░░░░░░░░░░░  12A MVP completado / resto pendiente
Fase 13  Revisión final AeroComms       ░░░░░░░░░░░░  Pospuesta / última fase
```
