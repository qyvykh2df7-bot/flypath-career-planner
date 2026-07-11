# Tarea activa — Connect First Real Lead Source

## Objetivo

Conectar **una primera entrada real de FlyPath** al Backend Core de Supabase de forma **segura y trazable**.

Un solo formulario bien integrado antes de escalar a más superficies, Warhome completo o email automation.

---

## Alcance

- Auditar formularios actuales y **elegir uno** (recomendado: newsletter de home).
- Diseñar e implementar flujo servidor:

  ```
  formulario → lead → product_interest → email_subscription/consent → user_event
  ```

- Cliente Supabase con `service_role` **solo en servidor**.
- Normalización de email (coherente con `leads`: lower + trim).
- Evitar duplicados por email (upsert o get-or-create).
- Validación de entrada y respuestas HTTP claras.
- Prueba local end-to-end documentada.

---

## Fuera de alcance

- Warhome completo (solo preparación conceptual; MVP viene después).
- Worker de email, proveedor SMTP/API, cron.
- Gestión de secuencias, jobs o deliveries.
- Conectar todos los formularios de la plataforma.
- Automatizaciones de email en UI o copy de marketing.
- Seeds de secuencias o contenido.
- Exponer `service_role` al navegador.
- Modificar migraciones ya aplicadas.

---

## Archivos a inspeccionar primero

### Formularios candidatos

| Archivo | Notas |
|---------|-------|
| `components/home/HomeNewsletterForm.tsx` | **Recomendado** — simple, placeholder, un campo email |
| `app/career-planner/page.tsx` | Formularios con email; más complejo |
| `components/opiniones/OpinionesInteractiveContent.tsx` | Email en flujo de opiniones |
| `app/page.tsx` | Dónde se monta el newsletter home |

### Backend / infra (crear o localizar)

| Área | Buscar / crear |
|------|----------------|
| Cliente Supabase servidor | `lib/supabase/server.ts` o equivalente (no existe aún) |
| Variables de entorno | `.env.local`, `.env.example` — `SUPABASE_SERVICE_ROLE_KEY`, URL |
| Rutas API | `app/api/leads/` o `app/api/capture/` (nuevo) |
| Tipos / validación | Esquema Zod o similar para payload del formulario |
| Productos | Seed en `products` — identificar `product_id` / slug para newsletter |

### Esquema de referencia

| Migración | Tablas relevantes |
|-----------|-------------------|
| `20260711200000_create_leads.sql` | `leads`, `lead_product_interests` |
| `20260711210000_create_email_subscriptions.sql` | `email_subscriptions` |
| `20260711260000_create_user_events.sql` | `user_events` |
| `20260711180000_create_products.sql` | `products` |

---

## Pasos

### 1. Auditoría de formularios

- [ ] Listar formularios con captura de email en el repo.
- [ ] Elegir el más simple (objetivo: `HomeNewsletterForm`).
- [ ] Documentar campos disponibles, consent copy y producto/lista asociados.

### 2. Arquitectura servidor

- [ ] Crear helper Supabase servidor con `service_role`.
- [ ] Verificar que la key no entra en bundle cliente (`server-only` / route handlers only).
- [ ] Definir variables de entorno requeridas.

### 3. Diseño del flujo de datos

- [ ] `source` / `list_key` / `event_name` / `event_category` acordados.
- [ ] Mapeo a filas: `leads`, `lead_product_interests`, `email_subscriptions`, `user_events`.
- [ ] Estrategia duplicados: upsert lead por email; subscription `(lead_id, list_key)`.
- [ ] `consented_at` y `consent_text` cuando `status = subscribed`.

### 4. Ruta API

- [ ] `POST` con validación (email requerido, formato).
- [ ] Transacción o secuencia idempotente en servidor.
- [ ] Respuestas: `200/201` éxito, `400` validación, `500` error interno (sin filtrar secrets).

### 5. Conectar formulario

- [ ] Sustituir placeholder en formulario elegido por `fetch` a ruta API.
- [ ] Estados UI: loading, éxito, error.
- [ ] No cambiar copy prometiendo automatizaciones de email.

### 6. Prueba local

- [ ] Envío con email nuevo → filas creadas en Supabase.
- [ ] Reenvío mismo email → sin duplicar lead; subscription/evento coherente.
- [ ] Verificar normalización (mayúsculas/espacios).
- [ ] Documentar pasos en nota de sesión o README operativo.

---

## Definición de terminado

- [ ] Un formulario real de FlyPath persiste datos en las 4 tablas del flujo: leads, lead_product_interests, email_subscriptions y user_events.
- [ ] `service_role` usado exclusivamente en servidor.
- [ ] Email normalizado; sin leads duplicados por variaciones de casing/espacios.
- [ ] Al menos un `user_event` registrado por envío exitoso.
- [ ] Errores de validación y fallos de servidor manejados en UI.
- [ ] Prueba local reproducible documentada.
- [ ] Sin worker, sin Warhome UI, sin proveedor email.
- [ ] Sin copy que implique secuencias o envíos automáticos activos.

---

## Reporte esperado al cerrar la tarea

1. Formulario elegido y por qué.
2. Rutas/archivos creados o modificados.
3. Mapeo campo → tabla/columna.
4. Resultado de pruebas locales (capturas o IDs de ejemplo).
5. Variables de entorno necesarias.
6. Riesgos o deuda para Warhome MVP (siguiente paso).
7. Confirmación explícita: email automation **no** operativa.

---

## Referencias

- `CURRENT_PHASE.md` — fase actual y definition of done global.
- `ROADMAP.md` — Fase 2 Backend Integration.
- `LAST_SESSION.md` — handoff Backend Core Phase 1 (2026-07-11).
