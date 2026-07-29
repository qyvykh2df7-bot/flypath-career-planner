# Continuidad — Fase 10.5: Production Launch & Hardening

## Estado actual

Fase 10 está **COMPLETADA**. Stripe Live está preparado con los productos y Price IDs de AeroComms Pro, Career Planner Premium y Cómo ser Piloto; Checkout, webhooks, Customer Portal, entitlements y separación Test/Live están validados. Fase 10.5 es la fase activa de preparación del lanzamiento público.

## Cierre técnico reciente — SEO e indexación

- Canonicals absolutos, Open Graph y Twitter definidos desde el origen canónico en todas las rutas públicas relevantes.
- Fichas públicas de escuelas con metadata dinámica; sitemap limitado a páginas públicas y fichas válidas.
- `/dashboard` y `/premium-report-thumb` se cierran con `404` en producción; `/aerocomms/app/*` conserva funcionalidad con `noindex, nofollow`.
- Validación local: 778 tests, TypeScript, lint focalizado, build Webpack, `git diff --check` y `npm audit --omit=dev` correctos.
- QA Production completado: redirección `308` apex → `www`, sitemap público de 63 URLs únicas y rutas internas conforme a la política.
- Documento de continuidad: `docs/ai/seo/flypath-canonical-metadata-and-indexing.md`.

## Tareas activas antes del lanzamiento

1. Revisar el diseño público de opiniones de escuelas: layout, responsive, estados sin opiniones y estrellas.
2. Auditar la consistencia de datos públicos del comparador: escuelas, precios, costes, extras, riesgos y fuentes.
3. Configurar dominio definitivo, DNS, SSL y variables Production; validar rutas, emails, Stripe, Supabase y webhooks antes de retirar Hostinger.
4. Completar QA final móvil y escritorio de superficies públicas, Career Planner, AeroComms Free/Pro y Customer Portal.
5. Activar/contrastar Vercel Speed Insights y PageSpeed sobre el dominio definitivo; repetir medidas de producto con sesión real.

## Cierre técnico reciente — Rendimiento pre-lanzamiento

- Auditoría Lighthouse/build/bundle completada en rutas públicas y de producto representativas; informe: `docs/ai/performance/flypath-production-performance-audit.md`.
- Home: las miniaturas de recursos dejan de descargar PNG originales; transferencia móvil local **6,21 MiB → 676 KiB** (-89 %) y escritorio **7,54 MiB → 820 KiB**, sin cambios visibles.
- Modal Pre-PPL diferido hasta interacción e imágenes de blog migradas a `next/image` con `sizes` responsivos.
- Validación: 771 tests, TypeScript, lint focalizado, build Webpack, `git diff --check` y `npm audit --omit=dev` correctos. Despliegue Production y QA remota completados: la home baja de 6,24 MiB a 709 KiB (-89 %), sin errores de consola ni desbordamiento móvil. Pendiente no bloqueante: métricas de campo con Vercel Speed Insights y PageSpeed sobre el dominio definitivo.

## Hardening web local pendiente de despliegue

- `FLYPATH_CANONICAL_ORIGIN` está configurada localmente y como variable sensible de Vercel en Production/Preview. Centraliza enlaces absolutos y evita confiar en hosts enviados por clientes.
- CSP sin `unsafe-eval` en producción, HSTS, `nosniff`, anti-embedding, referrer policy, permissions policy y resource policy ya están definidos.
- Webhooks Stripe, Cal.com y Resend rechazan tipo inesperado y tamaños declarados/reales por encima de 1 MiB, 256 KiB y 256 KiB respectivamente, antes de firma o persistencia.
- Herramientas `/review/*`, previews y QA son solo de desarrollo/test y añaden `noindex`.
- Dependencias corregidas: `next`/`eslint-config-next` `16.2.12`, `vitest` `3.2.6`, `vite` `7.3.5`, `esbuild` `0.28.1`, y actualizaciones compatibles de `postcss`, `sharp` y `js-yaml`. `npm audit --omit=dev` queda a cero; el audit completo conserva avisos limitados al tooling local (`brace-expansion` y `esbuild`).

La auditoría legal inicial, los informes reales del Career Planner, los enlaces Amazon de logbooks y la revisión de restos visibles no tienen bloqueos confirmados. Las rutas preview/mock son herramientas internas de diseño.

## Cierre técnico reciente — APIs de voz AeroComms

- Hardening completado y desplegado: migración `20260712310000_add_aerocomms_voice_rate_limits.sql`, RLS cerrada, RPC atómica exclusiva de `service_role`, autorización server-side y cuotas separadas para anónimo, Free y Pro.
- `AEROCOMMS_VOICE_RATE_LIMIT_SALT` está presente como variable sensible en Production y Preview; no se versiona.
- QA Production: TTS/STT válidos, validaciones `400`/`413` y límite STT anónimo `429` verificados. La comprobación real con cuentas Free y Pro queda pendiente de QA manual.
- Seguimiento no bloqueante: multipart en streaming, purga de filas de cuota inactivas y prueba de concurrencia contra Supabase.

## Cierre técnico reciente — Formularios públicos y marketing

- Hardening completado: `20260712320000_harden_public_forms_and_marketing_opt_in.sql` aplica rate limiting distribuido privado para newsletter, Career Planner, Pre-PPL, mentorías y opiniones. Las cuotas combinan IP de Vercel e identidad HMAC; los fallos de salt/RPC/Supabase devuelven `503` antes de cualquier efecto secundario.
- `PUBLIC_FORM_RATE_LIMIT_SALT` está presente como secreto sensible en local, Production y Preview. El navegador no recibe IPs, emails ni salts almacenados.
- Newsletter Home y consentimiento explícito del Career Planner usan doble opt-in: el POST inicial solo crea una confirmación opaca y el consentimiento se activa después de confirmar. Pre-PPL, mentorías y opiniones siguen sin marketing automático.
- Pendiente no bloqueante: programar `purge_public_form_security_data`, evaluar multipart streaming y ejecutar una prueba de concurrencia real de la cuota.

## Estado de la plataforma

- Fases 4, 5 y 6: completadas e integradas en `main`.
- Fase 10: **COMPLETADA**. La infraestructura de pagos, monetización, entitlements, mentorías y el gating Free/Pro de AeroComms están cerrados.
- Fase 7: CLOSED / COMPLETED / DEPLOYED. Migración remota aplicada, QA funcional aprobado y deployment completado.
- Validación técnica de continuidad: 698 tests correctos, TypeScript y lint focalizado correctos.

## Cierre de Fase 8

Fase 8 está **CLOSED / COMPLETED / DEPLOYED**:

- Commit `73758c1 feat(warhome): add AeroComms user operations`, publicado en `main`.
- Migración `20260712120000_create_warhome_user_directory.sql` aplicada en Supabase remoto.
- 398 pruebas correctas, TypeScript correcto, lint focalizado y `git diff --check` correctos.
- QA manual aprobado y deployment de Vercel confirmado manualmente.
- Todas las cuentas FlyPath/AeroComms son visibles en Warhome, tengan o no lead; no se crean leads automáticamente por el uso normal de AeroComms.

## Cierre de Fase 9

- 9A endureció el catálogo público y retiró campos editoriales/internos del navegador. Migración `20260712130000_harden_public_school_catalog_access.sql` aplicada.
- 9B–9C crearon y conectaron el backend privado de opiniones, verificación por email y formulario real. Migración `20260712140000_create_school_reviews_backend.sql` aplicada.
- 9D muestra datos públicos reales solo cuando la reseña está `approved`; fichas y comparador usan agregados seguros sin N+1 ni mezcla con `school_scores`.
- Career Planner reutiliza el mismo agregado público por lote: convierte la media real `1–10` a estrellas `0–5`, conserva fracciones y muestra “Sin opiniones” sin fallback editorial.
- 9E añadió moderación protegida en `/warhome/reviews` y detalle privado con acciones cerradas e historial.
- La migración `20260712150000_make_school_review_moderation_atomic.sql` deja las transiciones de moderación y su evento append-only en una única RPC transaccional, con `EXECUTE` exclusivo de `service_role`.
- Fase 9 está **CLOSED / COMPLETED / DEPLOY READY**. El QA manual end-to-end confirmó envío, verificación, moderación, publicación, agregados, comparador, fichas y estrellas del Career Planner.
- La validación actual deja 512 pruebas, TypeScript, lint focalizado y `git diff --check` correctos.
- Mejora futura acotada: iterar el layout visual de las opiniones públicas. No bloquea la funcionalidad ni el cierre de fase.

## Cierre — 10D

10D está **CLOSED / COMPLETED / TESTED** tras la validación sandbox end-to-end del webhook firmado y la entrega segura de Career Planner Premium.

- `20260712170000_create_commerce_foundation.sql` está aplicada y validada en remoto: precios, pedidos, pagos, suscripciones, eventos Stripe minimizados, compradores invitados, reclamaciones seguras, bundles y concesiones de acceso idempotentes están disponibles, sin filas de catálogo comercial ni cobros creados.
- Los contratos puros y pruebas viven en `lib/commerce/`; el acceso efectivo se resuelve en servidor y RLS permanece cerrada.
- 10C está **CLOSED / COMPLETED / TESTED**: Stripe sandbox, catálogo cerrado de Career Planner Premium (5,95 EUR, pago único), CTA, Checkout alojado, compra invitada o autenticada, intenciones idempotentes y superficies success/cancel. La prueba sandbox completó Checkout sin crear `payments`, grants, descargas ni entitlements internos. La cookie de intención no se reutiliza entre cuentas y un Product sandbox duplicado permanece archivado e inactivo, sin vínculo interno.
- `20260712190000_add_career_planner_payment_delivery.sql` y `20260712200000_fix_career_planner_payment_failed_state.sql` están aplicadas en remoto. Crean el token de entrega opaco, limitado a cinco usos y hasheado, además de las RPCs atómicas de settlement. `checkout.session.completed` valida referencias, catálogo, `595` EUR, modo y estado antes de crear `payment`, marcar el pedido como pagado y habilitar solo la línea entregable. No crea `entitlement_grants`.
- `/api/webhooks/stripe` usa body crudo y `STRIPE_WEBHOOK_SECRET`; los payloads completos no se guardan. `payment_intent.succeeded` queda auditado como redundante; `payment_intent.payment_failed` deja el intento en `failed` y el pedido pendiente en `payment_failed`; `checkout.session.expired` no habilita descarga.
- La success URL abre un popup que consulta únicamente `verifying`, `confirmed`, `failed` o `expired`. La descarga se genera en servidor después de consumir el token `HttpOnly`; no acepta importes, IDs comerciales ni rutas de PDF desde el navegador. El token se emite o rota siempre contra el `checkout_attempt` actual, por lo que una cookie de una compra previa no puede bloquear la confirmación.
- QA manual sandbox completado con Stripe CLI: Checkout de prueba, webhook firmado, pedido pagado, `payment` interno, popup confirmado y descarga del PDF. La repetición controlada del hotfix confirmó `access` 200, estado `confirmed` y descarga PDF 200. Stripe live, entitlements, suscripciones y otros productos siguen fuera de alcance.
- Hotfix de compatibilidad PDF cerrado: `PREMIUM_PDF_PAGE_IMAGES` usa PNG/JPEG reales para el informe premium, conserva los WebP de las previews web y elimina los avisos `Not valid image extension`. El PDF real de 11 páginas se validó visualmente; no cambió Stripe, pagos, webhook ni lógica comercial.
- Validación local: 583 pruebas correctas, TypeScript y `git diff --check` correctos; lint focalizado sin errores nuevos.
- Validación de cierre 10C: 554 pruebas correctas, TypeScript y `git diff --check` correctos; lint focalizado sin errores.
- Las decisiones de canal son: Career Planner y guías digitales con Stripe como invitado; AeroComms Pro requiere cuenta FlyPath para compra y uso, con acceso exclusivo por entitlement; Mentorías mediante Cal.com; guía física mediante Amazon; Pre-PPL sigue en waitlist.

## Cierre — 10E

10E está **CLOSED / COMPLETED / TESTED** en Stripe sandbox para la guía digital **Cómo ser Piloto**.

## Cierre — 10G: AeroComms Pro Subscription Billing

- **Estado:** CLOSED / COMPLETED.
- **Commit:** `1c84833 feat(aerocomms): complete pro subscription billing flow`, publicado en `main`.
- Catálogo recurrente cerrado: `aerocomms_pro`, **5,99 EUR/mes**, sin trial y con compra exclusiva para cuenta FlyPath autenticada. El Price anterior de 7,37 EUR queda archivado en el catálogo FlyPath solo para suscripciones históricas.
- Stripe Checkout server-side, webhook firmado y entitlement `aerocomms_pro` validan la activación real; el retorno post-checkout usa un modal temporal de verificación.
- QA sandbox completado: activación Pro, cancelación al final del periodo, `invoice.payment_failed` con gracia exacta de 48 horas, refund con revocación inmediata y webhook `200`.
- Las migraciones Production están aplicadas hasta `20260712280000`, incluidos los fixes de RPC `product_price_id`, gracia y backfill de grants.
- El cierre incluye Stripe Customer Portal sandbox: `POST /api/stripe/customer-portal` verifica cuenta, suscripción `aerocomms_pro` y cliente Stripe vinculado; Perfil Pro permite cancelar al final de periodo, actualizar método de pago y ver facturas sin exponer referencias Stripe al navegador. Commit: `6e079cb`.

## Seguimiento externo — 10F: Cal.com Mentorship Booking Sync

- La implementación 10F está cerrada: migración `20260712220000_create_calcom_mentorship_booking_sync.sql` aplicada, webhook `/api/webhooks/calcom` desplegado en Production, HMAC, idempotencia y Ping firmados validados.
- Los CTAs de mentorías de página, pricing, escuelas, shop, blog y free report apuntan al evento Cal.com mediante `FLYPATH_MENTORIA_CALCOM_URL`; el tracking existente se conserva. Commit: `0cd06b9`.
- Cal.com mantiene agenda, reserva, Meet, emails operativos y pago Stripe; FlyPath conserva sólo la proyección operativa privada y no usa Commerce propio para mentorías.
- **Bloqueo externo:** el checkout de Cal.com crea correctamente el PaymentIntent de 44,95 EUR, pero ejecuta `stripe.confirmPayment()` sin un Payment Element montado y no permite completar una reserva real.
- Próxima acción cuando Cal.com corrija ese checkout: crear una reserva de QA y validar `BOOKING_CREATED`, `BOOKING_PAID`, `BOOKING_CANCELLED`, `BOOKING_RESCHEDULED`, idempotencia y eventos tardíos.

## Siguiente bloque — Fase 10.5: Production Launch & Hardening

Antes de la Fase 11, completar:

- revisión de páginas públicas, CTAs, enlaces y placeholders;
- términos, privacidad, cookies, aviso legal y contacto;
- diseño responsive de opiniones de escuelas y estados sin opiniones;
- auditoría de rendimiento, dominio, DNS, SSL y variables Production;
- QA final de login, perfil, Warhome, formularios, emails, Career Planner, guía, AeroComms Free/Pro, Customer Portal, Cal.com y móvil;
- lanzamiento público.
- Mantener fuera de alcance: Stripe live, Commerce de mentorías, productos/precios/pedidos/pagos FlyPath, entitlements, emails FlyPath, tracking de marketing, Warhome UI y asociación automática por email con cuentas o leads.
- Gating ya cerrado: 30% inicial aproximado de cada bloque Cadet y primera misión Free; resto bloqueado hasta resolver el entitlement `aerocomms_pro`. Las rutas directas y recomendaciones respetan el mismo contrato y `localStorage` no autoriza Pro.
- Validación del gating: 698 tests, TypeScript y lint focalizado correctos; QA visual de escritorio y móvil completada.

- `20260712210000_add_como_ser_piloto_guide_checkout_delivery.sql` está aplicada en remoto. Añade RPCs service-role-only para preparar, confirmar, expirar, fallar, comprobar y consumir la entrega de la guía sin mezclarla con Career Planner.
- El producto interno existente `como_ser_piloto_guide` usa el precio cerrado `como_ser_piloto_guide_eur`: **14,95 EUR**, `one_time`, activo. El script de sincronización reutiliza o crea un único Product/Price de Stripe sandbox y vincula ese precio interno de forma idempotente.
- La página `/guia-como-ser-piloto` usa el endpoint de Checkout existente; el navegador solo puede enviar `product_key`. El precio, la moneda, el Price de Stripe y las URLs de retorno se resuelven y validan en servidor.
- El webhook firmado sigue siendo la única fuente de confirmación. Tras el pago, la guía recibe una cookie de entrega propia con token opaco, `HttpOnly`, hasheado, con caducidad de 30 días y máximo de cinco descargas. No puede descargar el PDF de Career Planner, ni este puede descargar la guía.
- El PDF definitivo se trasladó de `public/` a `private-assets/commerce/como-ser-piloto-guide.pdf`; se comprobó como PDF A4 válido de 95 páginas y solo se sirve después de la validación protegida.
- QA sandbox: Checkout muestra el producto y 14,95 EUR; el webhook creó el pago y marcó el pedido confirmado; el popup pasó a `confirmed` y la entrega consumió un uso correctamente. No se crearon entitlements.
- Auditoría independiente: **APROBADA**, sin hallazgos Critical ni Major. La única observación menor es endurecer la verificación de metadata al reutilizar un Price existente en una futura mejora; el catálogo sandbox actual ya es correcto.
- Validación local: 605 pruebas correctas, TypeScript, lint focalizado y `git diff --check` correctos.

## Implementado en Fase 7

### Modelo y seguridad

- Migración local `20260712110000_create_aerocomms_progress_persistence.sql` para progreso, ejercicios, misiones, estadísticas, sesiones y recibos de sincronización.
- Todas las tablas dependen de `auth.users`, tienen RLS y no referencian leads, productos, suscripciones, Warhome ni Stripe.
- RPC transaccional e idempotente; repetir el mismo `operation_id` con un payload distinto se rechaza. Navegador sin permisos directos de escritura y `service_role` aislado en servidor.

### Sincronización local-first

- Los usuarios anónimos continúan en `localStorage` con `aerocomms.v2` sin login obligatorio.
- La ruta `/api/aerocomms/progress/sync` usa `auth.getUser()` y valida el catálogo, rangos, zona horaria, versiones y body antes de llamar a Supabase.
- `rfr` se normaliza a `ready-for-radio`; IDs desconocidos o datos corruptos se descartan/rechazan sin inventar métricas.
- Un error de red deja el estado local intacto y conserva el mismo `operation_id` para reintentar sin duplicar sesiones, intentos o estadísticas.
- Un blob local existente sin propietario requiere confirmación explícita antes de importarse; Perfil permite importarlo o empezar desde cero.
- Un reset autenticado se persiste remotamente y evita que sesiones anteriores al corte restauren progreso desde otro dispositivo.
- El propietario de sincronización mantiene un fallback en memoria cuando el almacenamiento del navegador está restringido; los fallos transitorios se reintentan.

### Compatibilidad

- Se preservan métricas agregadas legítimas de `aerocomms.v2` durante la primera importación; el historial local acotado no se usa para fabricar totales.
- Audio, transcripciones, blobs, descriptores ATC, nombre, ajustes, UI state y `subscription` local no cruzan el límite de persistencia.
- El snapshot remoto solo actualiza progreso durable; mantiene ajustes y acceso local sin cambios.
- El nombre de onboarding permanece local para anónimos. Con sesión, `profiles.full_name` prevalece y cualquier cambio desde AeroComms requiere una confirmación explícita.

## Cierre de Fase 7

- Migración remota aplicada.
- QA funcional aprobado para importación, recuperación entre navegadores, aislamiento entre cuentas y nombre de perfil.
- Deployment completado correctamente.
- El build local quedó bloqueado únicamente por `ENOTFOUND fonts.googleapis.com` al descargar Geist y Geist Mono; no hay errores de Fase 7.

## Validación local realizada

- `npm test`: 359 tests correctos.
- `npx tsc --noEmit --pretty false`: correcto.
- `npm run build -- --webpack`: bloqueado únicamente por el acceso a Google Fonts; no hay errores de compilación propios de Fase 7.
- ESLint focalizado y `git diff --check`: correctos.

- Commit: `aaa5f4e feat(aerocomms): close phase 7 persistence`.
- Push realizado a `main`.

## Restricciones de alcance

- Stripe, compras, entitlements y AeroComms Pro.
- Guardado real de Career Planner.
- Google/Apple login, contraseñas, cambio de email y eliminación de cuenta.
- Cambios de ejercicios, scoring, contenido, Free/Pro o configuración de pagos.
- Captación automática de leads, intereses comerciales o suscripciones por uso normal de AeroComms.
