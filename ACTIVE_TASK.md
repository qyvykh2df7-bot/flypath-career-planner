# Tarea activa — Emails operativos (Fase 5)

## Objetivo

Preparar e implementar **emails operativos** (Fase 5): envíos transaccionales, avisos internos y registro de entregas, sin automatizaciones avanzadas.

---

## Alcance previsto (Fase 5)

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

---

## Fuera de alcance (esta tarea — Fase 5)

- Secuencias, journeys y campañas (Fase 10).
- CRM avanzado.
- Cambios amplios en Warhome (salvo lo mínimo para operar envíos).
- Login y cuentas públicas (Fase 6).
- Persistencia AeroComms (Fase 7).
- Revisión final AeroComms (Fase 8).
- Pagos (Fase 9).

---

## Referencia de esquema

| Migración / tabla | Uso en Fase 5 |
|-------------------|---------------|
| `email_jobs` | Cola de envíos |
| `email_deliveries` | Registro de entregas y errores |
| `email_subscriptions` | Estado de suscripción y bajas |
| `leads` | Destinatarios y contexto de captación |

---

## Pasos sugeridos (sin decisiones técnicas cerradas aún)

1. Definir proveedor de email y dominio remitente.
2. Configurar autenticación de dominio (SPF, DKIM, DMARC).
3. Diseñar plantillas mínimas por flujo de captación.
4. Implementar envío transaccional server-side con `service_role`.
5. Registrar entregas, errores y reintentos en `email_deliveries`.
6. Conectar bajas y consentimientos con `email_subscriptions`.
7. Validar en entorno de prueba antes de producción.

---

## Definición de terminado

- [ ] Proveedor y dominio remitente operativos.
- [ ] SPF, DKIM y DMARC verificados.
- [ ] Confirmaciones Career Planner, Pre-PPL y acompañamiento enviadas.
- [ ] Avisos internos operativos.
- [ ] Registro de envíos, errores y reintentos.
- [ ] Bajas y consentimientos integrados.

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

Infraestructura en `lib/tracking/`; eventos en flujos de captación, comparador, CTAs, `page_viewed` y `form_completed`. Migraciones `20260712020000` y `20260712030000` aplicadas. `main` en `779887a`.

### Fase 4 — Warhome MVP

| Bloque | Estado |
|--------|--------|
| Autorización (`admin_users`, roles, proxy) | Completado |
| Login, logout y rutas protegidas | Completado |
| Shell, sidebar y navegación | Completado |
| Listado de leads (búsqueda, filtros, paginación, métricas) | Completado |
| Detalle de lead (intereses, suscripciones, actividad) | Completado |
| QA y cierre documental | Completado |

Rama `feature/warhome-mvp` (`494f335`); pendiente merge a `main`.

**Validaciones:** 116 tests; TypeScript, build y `git diff --check` correctos.

**Prerrequisitos operativos:** migración `20260712040000` aplicada; primer `owner` activo; login/logout probados manualmente.

**Pospuesto:** notas internas, edición de etapa/estado, recorrido anónimo completo, Overview redundante, refinamiento visual, diferenciación owner/admin.

---

## Referencias

- `CURRENT_PHASE.md` — fase actual y estado real.
- `ROADMAP.md` — fases 5–11.
- `BACKLOG.md` — mejoras Warhome pospuestas.
- `LAST_SESSION.md` — handoff operativo.
