# FlyPath — Fase actual

## Proyecto

**FlyPath** — plataforma de carrera y productos para aspirantes a piloto. **AeroComms** es uno de sus productos y ya está integrado en `/aerocomms/app`.

## Fase actual

**Fase 10 — Pagos, monetización y entitlements: CLOSED / COMPLETED.**

**10B — catálogo comercial, pedidos, pagos y entitlements** está aplicado y validado en Supabase remoto mediante `20260712170000_create_commerce_foundation.sql`, con contratos puros en `lib/commerce/` y documentación técnica. La validación confirmó RLS y ACL cerradas, índices de idempotencia, compatibilidad con `products` y una prueba sintética revertida sin datos residuales. Esta base no activa Stripe: define el modelo transaccional, los compradores invitados, la reclamación segura y el acceso efectivo resuelto en servidor.

**10C — Checkout seguro para pagos únicos** está **CLOSED / COMPLETED / TESTED** solo en Stripe sandbox. `20260712180000_add_career_planner_test_checkout.sql` prepara pedidos e intentos idempotentes para Career Planner Premium: 5,95 EUR, pago único, tanto invitado como autenticado. El CTA abre Stripe Checkout sin que el cliente pueda decidir valores comerciales. La pantalla de éxito no confirma pagos, no descarga el PDF y no concede acceso. El catálogo sandbox se sincroniza de forma idempotente; un duplicado histórico está archivado e inactivo, sin vínculo con el catálogo FlyPath.

**10D — webhook Stripe, ledger y entrega segura** está **CLOSED / COMPLETED / TESTED** en Stripe sandbox. Las migraciones `20260712190000_add_career_planner_payment_delivery.sql` y `20260712200000_fix_career_planner_payment_failed_state.sql` están aplicadas en remoto. `checkout.session.completed` es la única fuente comercial de confirmación; `payment_intent.succeeded` se conserva como auditoría redundante, mientras `payment_intent.payment_failed` deja el intento en `failed` y el pedido pendiente en `payment_failed`, sin conceder acceso. La success URL abre un popup de verificación y solo muestra la descarga tras confirmación interna mediante token opaco `HttpOnly`, hasheado, limitado a cinco usos y con caducidad. El hotfix posterior rota siempre el token contra el `checkout_attempt` actual: una cookie de entrega anterior ya no puede mantener el popup en `verifying`. La QA sandbox confirmó de nuevo popup `confirmed` y PDF descargable. No se crea ningún entitlement y Stripe live permanece desactivado.

**10E — Guía digital "Cómo ser Piloto"** está **CLOSED / COMPLETED / TESTED** en Stripe sandbox y su auditoría independiente quedó **APROBADA**, sin hallazgos Critical ni Major. Reutiliza el checkout, webhook firmado, ledger y entrega protegida de 10C–10D con el producto cerrado `como_ser_piloto_guide`, precio único de **14,95 EUR** y compra invitada o autenticada. La migración `20260712210000_add_como_ser_piloto_guide_checkout_delivery.sql` está aplicada en remoto; el Product y Price sandbox se sincronizan idempotentemente contra `product_prices`. El navegador solo envía la clave cerrada del producto. El webhook confirma el pago y emite una entrega independiente `como_ser_piloto_guide_delivery`: su token opaco `HttpOnly`, hasheado, limitado a cinco usos y con caducidad no puede descargar el informe Career Planner ni a la inversa. El PDF final de 95 páginas ya no está en `public`; se sirve solo desde el asset privado tras validar el pago. La QA sandbox completó Checkout a 14,95 EUR, webhook firmado, pago interno, popup `confirmed` y consumo correcto de la entrega. No hay entitlement y Stripe live permanece desactivado.

**10G — AeroComms Pro Subscription Billing** está **CLOSED / COMPLETED**. El commit `1c84833 feat(aerocomms): complete pro subscription billing flow` está publicado en `main` y las migraciones Production están aplicadas hasta `20260712280000`. AeroComms Pro exige una cuenta FlyPath y su precio cerrado es **7,37 EUR/mes**. Stripe Checkout se inicia solo en servidor; el webhook es la única fuente de verdad para crear y actualizar el entitlement `aerocomms_pro`. La activación real llega tras webhook y el retorno post-checkout muestra un modal de verificación. QA sandbox validó Checkout, activación, cancelación al final de periodo, fallo de pago con Test Clock, refund y webhook `200`. `invoice.payment_failed` deja la suscripción en `past_due` y mantiene el grant activo exactamente 48 horas desde el evento; refund y dispute lo revocan de inmediato. Los hotfixes cubren la ambigüedad `product_price_id`, el cálculo de gracia y el backfill histórico de grants.

**10F — sincronización operativa de mentorías con Cal.com** está **CLOSED con bloqueo externo documentado**. La migración `20260712220000_create_calcom_mentorship_booking_sync.sql` está aplicada en remoto; `mentorship_bookings` y `cal_webhook_events` mantienen RLS y acceso exclusivo de `service_role`. `/api/webhooks/calcom` está desplegado en Production, valida sobre body crudo la firma HMAC SHA-256 con `CALCOM_WEBHOOK_SECRET` y solo procesa `BOOKING_CREATED`, `BOOKING_PAID`, `BOOKING_CANCELLED` y `BOOKING_RESCHEDULED`. La RPC atómica deduplica por hash y descarta eventos del proveedor fuera de orden. Cal.com sigue siendo la fuente de verdad de agenda, Meet, emails y Stripe conectado a Cal.com; FlyPath no crea productos, precios, pedidos, Checkout, pagos internos, entitlements ni emails propios para mentorías, ni vincula reservas a `auth.users` o `leads` por coincidencia de email.

La ruta Production y el Ping firmado están validados. La QA de una reserva real está bloqueada externamente: el frontend de checkout de Cal.com ejecuta `stripe.confirmPayment()` sin un Payment Element montado, aunque crea correctamente el PaymentIntent y presenta métodos elegibles. Cuando Cal.com lo corrija, debe completarse una reserva real y validarse creación, pago, cancelación, reprogramación, duplicados y eventos fuera de orden.

Hotfix de compatibilidad PDF: los assets exclusivos del informe premium se normalizaron a PNG/JPEG reales mediante `PREMIUM_PDF_PAGE_IMAGES`, sin cambiar las previews web que mantienen sus WebP. Se revisó visualmente un PDF real completo de 11 páginas y desaparecieron los avisos `Not valid image extension`. No hubo cambios en Stripe, pagos, webhook ni lógica comercial.

Validación local de 10E: 605 pruebas correctas, TypeScript y `git diff --check` correctos; lint focalizado sin errores.

### Decisiones de producto cerradas

- No hay cuenta FlyPath obligatoria para pagar. Career Planner Premium y las guías digitales podrán comprarse como invitado; la confirmación real siempre llegará por webhook y la entrega tendrá recuperación segura.
- AeroComms Pro requiere una cuenta FlyPath tanto para la compra como para el uso. El entitlement server-side sustituye el indicador Pro editable de `localStorage`.
- Pre-PPL conserva waitlist hasta terminarse. Mentorías pasan por Cal.com: FlyPath ya recibe su proyección operativa por webhook firmado; la única QA pendiente depende de que Cal.com corrija su checkout. La guía física abre Amazon y no crea un checkout FlyPath.
- EUR es la moneda inicial. Reembolso digital total: revocación de acceso/entrega; parcial: revisión manual inicial.

## Cierre técnico de Fase 9

- **Estado:** **CLOSED / COMPLETED / DEPLOY READY**. Los bloques 9A–9F, la QA manual end-to-end, la moderación y la publicación pública están completados; Fase 10 puede comenzar.
- **Catálogo público:** `20260712130000_harden_public_school_catalog_access.sql` aplicada. El navegador consume un DTO cerrado; no recibe notas internas, snapshots ni metadata editorial.
- **Backend de opiniones:** `20260712140000_create_school_reviews_backend.sql` aplicada. No requiere cuenta, pero toda opinión verifica email; email, hashes, tokens, `user_id`, notas internas e historial nunca cruzan al DTO público.
- **Lectura pública:** `/opiniones-escuelas`, `/schools/[slug]` y el comparador leen únicamente reseñas `approved`; `school_scores` editoriales no se mezclan con opiniones de alumnos.
- **Career Planner:** las estrellas de las escuelas de la base FlyPath usan el mismo resumen público aprobado por lote, convertido de `1–10` a `0–5`; no hay fallback a `school_scores` y cero opiniones muestra “Sin opiniones”.
- **Moderación atómica:** `20260712150000_make_school_review_moderation_atomic.sql` aplicada. `/warhome/reviews` y `/warhome/reviews/[reviewId]` usan una RPC `SECURITY DEFINER`, con bloqueo de fila, transiciones cerradas, motivo cerrado y evento append-only en la misma transacción. Solo `service_role` puede ejecutarla.
- **Separación de dominio:** una opinión no crea leads, suscripciones, cuentas ni compras. La cuenta vinculada es opcional y no se publica.
- **Validación técnica:** 512 pruebas correctas, TypeScript correcto, lint focalizado y `git diff --check` correctos. La exportación inválida `TypeGlyph` de AeroComms se dejó como helper local de página, sin cambio funcional.
- **Mejora futura:** el layout visual de las opiniones públicas necesita una iteración de diseño para recuperar y mejorar la presentación prevista inicialmente. La funcionalidad de opiniones está completa.

## Cierre de Fase 8

- **Estado:** CLOSED / COMPLETED / DEPLOYED.
- **Commit:** `73758c1 feat(warhome): add AeroComms user operations`, publicado en `main`.
- **Migración remota:** `20260712120000_create_warhome_user_directory.sql` aplicada en Supabase.
- **Validación:** 398 pruebas correctas, TypeScript correcto, lint focalizado y `git diff --check` correctos; QA manual aprobado y deployment de Vercel confirmado manualmente.
- Warhome dispone de `/warhome/users` y `/warhome/users/[userId]` para todas las cuentas FlyPath/AeroComms, tengan o no lead.
- Cuenta, perfil, progreso, actividad de producto, lead comercial y consentimiento de marketing siguen siendo conceptos separados. Usar AeroComms, completar onboarding, crear una cuenta, importar progreso o completar actividades no crea leads, intereses comerciales ni suscripciones.

### Estado de bloques

- **8A:** RPC paginada de directorio, agregados deduplicados y permisos exclusivos de `service_role`; aplicada y validada en remoto.
- **8B:** capa server-only de listado y detalle con autorización Warhome, filtros normalizados y DTOs cerrados.
- **8C:** directorio `/warhome/users` con búsqueda, filtros, orden, paginación y enlaces a ficha.
- **8D:** ficha `/warhome/users/[userId]` con identidad, perfil, resumen AeroComms, actividad reciente, lead opcional, marketing separado y placeholder de compras.
- **8E:** auditoría de privacidad, seguridad y rendimiento cubierta por pruebas de aislamiento, paginación, límites y ausencia de escrituras.
- **8F:** cierre, publicación y deployment confirmados.

La revisión final y lanzamiento de AeroComms queda explícitamente pospuesta como Fase 13, la última fase del roadmap actual.

## Fases completadas

### Fase 0 — AeroComms en FlyPath

Producto integrado en el monorepo; no queda una migración de repositorio pendiente.

### Fase 1 — Backend Core

Esquema Supabase aplicado y fusionado en `main`.

### Fase 2 — Captación pública de leads

Superficies públicas conectadas al Backend Core y validadas.

### Fase 3 — Tracking y analítica básica

Infraestructura de tracking y conversiones server-side integrada en `main`.

### Fase 4 — Warhome MVP

Completada e integrada en `main` mediante el merge `aa4f4fe`.

- Acceso administrativo seguro con Supabase Auth, `admin_users`, roles `owner`/`admin`, login, logout y proxy.
- Shell y navegación en `/warhome`.
- Listado real de leads, búsqueda, filtros, paginación y detalle con intereses, suscripciones y actividad por `lead_id`.
- Sin edición de leads ni UI de notas internas.

### Fase 5 — Emails operativos

Completada e integrada en `main` mediante el merge `aa4f4fe`.

- Jobs, deliveries y plantillas transaccionales para Career Planner, Pre-PPL y Acompañamiento.
- Aviso interno de mentoría.
- Webhook seguro de Resend con deduplicación e idempotencia.
- Warhome `/warhome/emails` con estados, filtros y engagement disponible.
- Separación transaccional/marketing, bajas seguras, historial append-only y propagación de supresiones.
- Tracking de aperturas y clics desactivado en Resend por decisión operativa; el esquema está preparado.

## Fase 7 — Persistencia AeroComms — CLOSED / COMPLETED / DEPLOYED

**CLOSED / COMPLETED / DEPLOYED.** Migración remota aplicada, QA funcional aprobado y deployment completado correctamente.

### Objetivo

- Mantener `aerocomms.v2` como fuente local para usuarios sin cuenta.
- Añadir persistencia autenticada, idempotente y multi-dispositivo para progreso real de AeroComms.
- No convertir el estado local `subscription` en acceso, plan o entitlement.

### Implementado en esta rama

- Especificación técnica: `docs/ai/aerocomms/aerocomms-phase-7-persistence-design.md`.
- Contrato compartido y validado: `lib/aerocomms/persistence-contract.ts`.
- Migración `20260712110000_create_aerocomms_progress_persistence.sql` aplicada con tablas de resumen, ejercicios, misiones, estadísticas, sesiones, recibos de idempotencia y reset remoto persistente.
- RLS de lectura por propietario; sin escrituras directas de `authenticated`; RPC transaccional accesible solo desde servidor mediante `service_role`.
- Rutas autenticadas `/api/aerocomms/progress/sync` y `/api/aerocomms/progress/reset`, validación de catálogo server-side, normalización `rfr` → `ready-for-radio`, límite de body y protección same-origin.
- Integración local-first en `lib/aerocomms/appState.tsx`: no borra `localStorage` tras sincronizar, reintenta fallos transitorios y descarta respuestas anteriores a un reset.
- Importación heredada: Perfil ofrece importar explícitamente un blob anónimo existente o empezar desde cero; evita contaminación entre cuentas en un navegador compartido.
- La primera importación conserva la base legacy legítima, incluido el streak. Después, los agregados se derivan únicamente de sesiones idempotentes aceptadas.
- El reset se persiste remotamente y crea un corte temporal: sesiones anteriores no pueden restaurar progreso eliminado desde otro dispositivo.
- El snapshot combina versiones de contenido históricas para que un cambio de `content_version` no oculte progreso previo.
- El nombre de AeroComms sigue local para anónimos; para una cuenta autenticada `profiles.full_name` es la fuente mostrada. Cualquier diferencia se resuelve explícitamente desde Perfil y no forma parte del progreso remoto.

### Validación local

- `npm test`: 359 tests correctos.
- `npx tsc --noEmit --pretty false`: correcto.
- `npm run build -- --webpack`: bloqueado localmente únicamente por `ENOTFOUND fonts.googleapis.com` al descargar Geist y Geist Mono mediante `next/font`; no hay errores de compilación propios de Fase 7. El deployment quedó completado correctamente.
- QA funcional: aprobado para importación anónima, recuperación en otro navegador, nombre de cuenta y aislamiento entre cuentas.
- La incidencia de red de Google Fonts queda limitada al entorno local y no bloquea el deployment validado.
- ESLint focalizado de Fase 7 y `git diff --check`: correctos.

### Fuera de alcance

- Stripe, compras, entitlements y AeroComms Pro real.
- Audio, grabaciones, transcripciones, prompts, estado efímero o UI state.
- Cambios de ejercicios, scoring, contenido, Free/Pro o desbloqueos.
- Sincronización de Career Planner, Warhome o perfiles adicionales.

### Cierre

- Commit: `aaa5f4e feat(aerocomms): close phase 7 persistence`.
- Push realizado a `main`.
- 359 tests correctos, TypeScript correcto y `git diff --check` correcto.

## Fase 6 — Login, cuentas y perfiles

**Completada e integrada en `main`.**

### Decisiones cerradas

- Una única cuenta general FlyPath para toda la plataforma; no es un producto ni un plan gratuito.
- Login mediante email y código OTP, sin contraseña inicialmente.
- Sesión persistente y Supabase Auth como identidad única.
- Warhome mantiene autorización separada mediante `admin_users`.
- AeroComms puede utilizarse sin cuenta, con acceso gratuito aproximado al 30 % de Cadet y una misión gratuita; el progreso se guarda localmente y la cuenta no desbloquea contenido.
- La cuenta servirá para guardar y sincronizar progreso más adelante; AeroComms Pro requerirá cuenta y Stripe en una fase posterior.
- Career Planner gratuito seguirá sin exigir login; no se implementará guardado de planes en esta fase.
- Stripe, compras y entitlements quedan fuera de Fase 6.

### Implementación de Fase 6

**6A — Fundamentos de identidad y coexistencia con Warhome**

#### 6A — Completado

Integrado en `main`. Auditoría independiente de 6A.3: **APROBADO** — sin hallazgos Critical, Major ni Minor.

- **6A.1 — Arranque documental:** `687f579` (`Start login and accounts phase`).
- **6A.2 — Coexistencia FlyPath / Warhome:** `7d68608` (`Preserve FlyPath sessions outside Warhome`). Usuario autenticado sin rol admin → `/` sin perder sesión; anónimo en ruta protegida → `/warhome/login`; admin activo → acceso. Solo `logoutWarhome()` cierra sesión explícitamente.
- **6A.3 — Helpers generales de sesión FlyPath:** `ce3d8b7` (`fix(auth): preserve unavailable state and prevent initial session races`). Contrato server-side con `getFlyPathSessionState()` (`authenticated` / `anonymous` / `unavailable`); client-side con `initializeFlyPathAuthState()` y `signOutFlyPath()`. Sin `admin_users`, sin `service_role`, sin cierre automático.

#### 6B–6F — Completadas e integradas en `main`

**6B — Login OTP**

- `/login` solicita OTP y `/login/verify` lo valida con `requestFlyPathLoginOtp()` y `verifyFlyPathLoginOtp()`.
- El email se conserva por pestaña en `sessionStorage`, con fallback en memoria cuando el storage está restringido; nunca se incluye en la URL.
- `next` tiene allowlist de rutas internas, elimina query strings y rechaza destinos externos, malformados o Warhome.
- `signOutFlyPath()` sigue siendo el único logout general explícito.

**6C — Perfil y vínculo con leads**

- `lib/account/bootstrap.ts` asegura `profiles` de forma idempotente y tolerante a carreras.
- Solo vincula leads existentes sin `user_id` mediante email autenticado y confirmado; nunca crea ni reasigna leads.
- Si el perfil se crea pero el vínculo falla, el resultado es parcial y recuperable en el siguiente acceso.
- La lógica es `server-only`; el cliente no recibe `service_role`.

**6D — Account y header**

- `/account` se protege en servidor y redirige anónimo a `/login?next=/account`.
- El nombre se valida y se guarda en `profiles`; el email autenticado se muestra solo lectura.
- El header usa `initializeFlyPathAuthState()` y muestra estado neutro durante hidratación, “Iniciar sesión” para anónimo y “Mi cuenta” para autenticado.
- No se consulta `admin_users` ni se modifica la separación de Warhome.

**6E — Preparación AeroComms**

- `lib/aerocomms/sync-progress.ts` define el contrato local v1, tipado y puro para futura sincronización.
- Lee el blob histórico `aerocomms.v2` sin escribirlo, sin Supabase y sin cambiar Free/Pro.
- Conserva ejercicios, misiones, puntuaciones y sesiones realmente puntuadas; excluye audio, transcripciones, blobs, permisos, ajustes y UI efímera.

**6F — QA y cierre**

- 309 tests correctos; TypeScript, build y `git diff --check` correctos.
- El lint focalizado de Fase 6 es correcto. `npm run lint` global sigue bloqueado por 57 errores y 77 warnings preexistentes fuera del alcance, principalmente JSX dentro de `try/catch` en Warhome.
- La Fase 6 queda cerrada con la implementación integrada en `main`.

### Fuera de alcance

Stripe, compras, entitlements, AeroComms Pro real, persistencia remota de progreso, guardado real de Career Planner, Google/Apple login, contraseñas, cambio de email, eliminación automática de cuenta, dashboard avanzado y notificaciones.

## Preparado en el esquema

- `profiles` vinculado a `auth.users`.
- `leads.user_id` opcional para vincular una cuenta existente.
- `admin_users` separado para autorización de Warhome.

## Reglas de coexistencia

- El usuario general y el administrador de Warhome comparten identidad en Supabase Auth, pero no permisos.
- La autorización de Warhome siempre se comprueba server-side mediante `admin_users`.
- No se crea un lead automáticamente al crear una cuenta.
- La vinculación de leads está implementada solo con email verificado y de forma idempotente.

## Referencias técnicas

| Área | Ubicación |
|------|-----------|
| Supabase SSR | `lib/supabase/server.ts`, `lib/supabase/browser.ts` |
| Admin Supabase | `lib/supabase/admin.ts` |
| Warhome auth | `lib/warhome/auth.ts`, `lib/warhome/access.ts`, `proxy.ts` |
| Perfiles | `supabase/migrations/20260711190000_create_profiles.sql` |
| Lead opcionalmente vinculado | `supabase/migrations/20260711200000_create_leads.sql` |
| Progreso local y persistencia AeroComms | `lib/aerocomms/appState.tsx`, `lib/aerocomms/sync-progress.ts`, `lib/aerocomms/persistence-contract.ts` |

## Limitaciones conocidas

- La migración de persistencia AeroComms está aplicada en Supabase remoto.
- La importación de un progreso anónimo existente usa la confirmación explícita ya disponible en Perfil; nunca se asigna silenciosamente a otra cuenta.
- No existen todavía compras, entitlements ni acceso Pro remoto.
- Los roles `owner` y `admin` tienen permisos equivalentes en el MVP de Warhome.
- La sincronización AeroComms está disponible con la migración remota aplicada y QA funcional aprobado; la cuenta no desbloquea contenido.
- El lint global permanece bloqueado por errores previos no modificados en esta fase.
