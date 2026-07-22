# Última sesión — cierre de Fase 10 y bloqueo externo de Cal.com

**Fecha:** 2026-07-22
**Rama:** `main`
**Estado:** Fases 9 y 10 cerradas. 10B–10G están cerrados; los commits finales `bdf0ed3`, `ba98336`, `0cd06b9`, `a4ac5fa` y `6e079cb` están publicados en `main`. Las migraciones Supabase Production están aplicadas hasta `20260712280000`. AeroComms Pro está activo en sandbox mediante el entitlement `aerocomms_pro`, Checkout y Customer Portal; Stripe live sigue desactivado. 10F está desplegado, con migración remota, webhook HMAC, Ping Production y CTAs frontend validados; sólo queda bloqueada externamente la QA de reserva real de Cal.com.

## Cierre — 10G: AeroComms Pro Subscription Billing

- Catálogo recurrente `aerocomms_pro` a **7,37 EUR/mes**, sin trial y solo para usuarios FlyPath autenticados.
- Stripe Checkout server-side no activa Pro desde la redirección: el webhook firmado crea y sincroniza el entitlement `aerocomms_pro`.
- El modal de retorno post-checkout verifica el acceso y confirma la activación sin sustituir el paywall comercial.
- Estados QA: `active`, `past_due`, `cancel_at_period_end`, refund y dispute. La cancelación conserva acceso hasta el final del periodo; refund y dispute revocan de inmediato.
- `invoice.payment_failed` mantiene el grant activo 48 horas desde el evento. Se corrigieron la ambigüedad `product_price_id`, el cálculo de gracia y el backfill histórico de grants.
- QA sandbox completado: Checkout, activación, cancelación, Test Clock de fallo de pago, refund y webhook Stripe `200`.
- Customer Portal sandbox cerrado mediante `6e079cb`: `POST /api/stripe/customer-portal` solo abre una sesión temporal para el cliente Stripe perteneciente a la cuenta y su suscripción `aerocomms_pro`. El Perfil Pro permite cancelación al final de periodo, actualización del método de pago e historial de facturas; los webhooks siguen siendo la fuente de sincronización.

## Cierre — 10F: sincronización operativa de mentorías Cal.com

- `20260712220000_create_calcom_mentorship_booking_sync.sql` está aplicada en Supabase remoto. `mentorship_bookings` y `cal_webhook_events` son proyecciones privadas con RLS cerrada, permisos exclusivos de `service_role` e idempotencia por hash.
- `/api/webhooks/calcom` está desplegado en Production, usa body crudo, HMAC SHA-256 con `CALCOM_WEBHOOK_SECRET`, filtra el event type de mentorías y admite creación, pago, cancelación y reprogramación. El Ping firmado llega correctamente al endpoint.
- `0cd06b9 feat(mentorship): connect frontend CTAs to calcom` conecta los CTAs de mentorías de página, pricing, escuelas, shop, blog y free report al evento real mediante `FLYPATH_MENTORIA_CALCOM_URL`, sin perder el tracking existente.
- Cal.com conserva agenda, calendario, Meet, emails operativos y pago Stripe. FlyPath no crea Commerce de mentorías, productos, precios, pedidos, pagos internos, entitlements, emails ni asociaciones automáticas por email.
- **Bloqueo externo:** el checkout de Cal.com crea el PaymentIntent de 44,95 EUR y tiene métodos elegibles, pero su frontend ejecuta `stripe.confirmPayment()` sin un Payment Element montado. No es un fallo de FlyPath, Stripe backend ni webhook.
- Próxima acción cuando Cal.com publique la corrección: realizar una reserva real de QA y validar los cuatro eventos, idempotencia y protección frente a eventos fuera de orden.

## Validación final de Fase 10

- 690 tests correctos, TypeScript, lint focalizado y `git diff --check` correctos.
- Worktree limpio tras `6e079cb feat(aerocomms): add stripe customer portal management`.

## Decisiones de Fase 10

- Una cuenta FlyPath no es obligatoria para pagar. Career Planner Premium y guías digitales admitirán Stripe Checkout como invitado; un webhook validará el pago en servidor y la entrega deberá recuperarse con seguridad.
- AeroComms Pro requiere una cuenta FlyPath para comprar y utilizar el acceso. El entitlement server-side reemplaza el estado Pro local editable.
- Pre-PPL sigue como waitlist. Mentorías usan Cal.com para agenda y pago; la sincronización operativa se implementó en local mediante webhook firmado y no usa Commerce FlyPath. La guía física dirige a Amazon y FlyPath solo registra el clic externo.
- La moneda inicial es EUR. El reembolso digital total revoca acceso/entrega; el parcial se revisa manualmente al inicio.

## Cierre — 10B

- `20260712170000_create_commerce_foundation.sql` está aplicada en remoto. Crea `product_prices`, `stripe_customers`, `checkout_attempts`, `orders`, `order_items`, `payments`, `subscriptions`, `stripe_webhook_events`, `entitlements`, `product_entitlements`, `entitlement_grants` y `order_claim_tokens`; no siembra precios ni crea pagos.
- Los contratos, validación y resolución pura de acceso están en `lib/commerce/`; la referencia de diseño está en `docs/ai/payments/flypath-phase-10-commerce-foundation.md`.
- QA remota: 12 tablas creadas, RLS activa, `anon` y `authenticated` sin acceso, `service_role` operativo; FKs, checks e índices de idempotencia confirmados. La prueba sintética de pedido, pago, token y grant se revirtió y todas las tablas siguen sin filas.
- Validación local de 10B: 527 pruebas correctas, TypeScript, lint focalizado y `git diff --check` correctos. No instalar Stripe, crear Checkout, webhook HTTP, CTA ni cobro hasta los bloques posteriores.

## Cierre — 10C

- `20260712180000_add_career_planner_test_checkout.sql` está aplicada en remoto. Añade `stripe_product_id` al catálogo de precios, conserva la identidad comercial inmutable y expone `prepare_career_planner_premium_checkout` con `SECURITY DEFINER`, `search_path` fijo y ejecución exclusiva de `service_role`.
- `stripe` está instalado como SDK de servidor. `STRIPE_SECRET_KEY` exige prefijo `sk_test_`; una clave live se rechaza. `.env.local` está ignorado y `.env.example` solo documenta nombres de variables.
- `scripts/sync-stripe-career-planner.mjs` crea o reutiliza el Product/Price sandbox de 5,95 EUR y el precio interno correspondiente. El script comprueba la vinculación interna antes de tocar Stripe y no deja precios activos duplicados.
- Un Product sandbox duplicado de una ejecución anterior quedó archivado e inactivo; no está vinculado al catálogo interno ni se usa para Checkout.
- `/api/commerce/checkout` acepta solo `career_planner_premium`, limita el body, valida same-origin y conserva una clave de idempotencia en cookie httpOnly. El servidor determina producto, precio, usuario opcional y rutas de retorno; valida que el intento pertenezca a la misma identidad y rota la intención tras un cambio de cuenta o una sesión completada/expirada.
- QA manual sandbox: el CTA/endpoint abrió Stripe Checkout alojado; la tarjeta oficial de prueba completó la sesión y volvió a `/career-planner/checkout/success`. Stripe marcó la sesión como pagada, pero el intento interno permanece `session_created` y no se crearon `payments`, grants, PDF ni entitlement: es el comportamiento esperado antes de webhook.
- Cierre técnico: 554 pruebas correctas, TypeScript y `git diff --check` correctos; lint focalizado sin errores.

## Cierre — 10D

- `/api/webhooks/stripe` verifica `STRIPE_WEBHOOK_SECRET` sobre body crudo. El ledger `stripe_webhook_events` deduplica por `stripe_event_id` y solo almacena hash del payload, nunca el contenido.
- `checkout.session.completed` recupera la sesión de Stripe y valida metadata, referencias internas, precio Stripe, modo `payment`, estado `paid`, `595` EUR. La RPC transaccional bloquea intento/pedido/línea, crea o actualiza un único `payment`, marca el pedido `paid`, el intento `completed` y la línea `available`; no concede un entitlement.
- `payment_intent.succeeded` se registra como redundante porque el evento Checkout es la fuente comercial de verdad. `payment_intent.payment_failed` deja el intento en `failed` y un pedido pendiente en `payment_failed`; los fallos y expiraciones no conceden acceso.
- `/career-planner/checkout/success` muestra un modal accesible de verificación. El navegador recibe solo estados de presentación y una cookie `HttpOnly` con token opaco, limitado y hasheado. La descarga genera el PDF en servidor tras confirmar el pago y admite reintentos limitados. El hotfix posterior elimina el atajo que reutilizaba cualquier cookie estructuralmente válida: `access` siempre emite o rota el token ligado al intento de Checkout actual.
- La migración remota y los tests focalizados se verificaron. La QA manual de Stripe CLI quedó completada con un secreto temporal solo en `.env.local`: un Checkout sandbox de tarjeta oficial disparó el webhook firmado, creó el `payment`, marcó pedido/intento como pagados, confirmó el popup y descargó el PDF. El secreto y el listener temporal se retiraron al terminar.
- QA de hotfix: para una sesión ya `completed` / `paid` / `succeeded`, el nuevo `access` emitió cookie de entrega, `status` devolvió `confirmed` y la descarga respondió `200 application/pdf`. No se creó ningún pago nuevo.
- Hotfix de compatibilidad PDF cerrado: los cuatro assets incompatibles se convirtieron a PNG/JPEG reales dentro de `public/premium-report/`. `PREMIUM_PDF_PAGE_IMAGES` los reserva para el informe premium, mientras las previews web mantienen los WebP existentes. El PDF real de 11 páginas se revisó visualmente: páginas 4 y 9 no llevan imagen por diseño; el resto conserva sus imágenes previstas sin deformaciones ni espacios inesperados. La renderización no produjo avisos `Not valid image extension`.
- No se modificaron Stripe, pagos, Checkout, webhook, Supabase Commerce ni la lógica comercial.
- Validación local final: 583 pruebas correctas, TypeScript y `git diff --check` correctos. El lint focalizado no tiene errores nuevos y conserva cuatro warnings preexistentes en `lib/premiumCareerReportPdf.tsx`.

## Cierre — 10E

- Se reutilizó Commerce existente para el producto interno ya creado `como_ser_piloto_guide`; no se creó infraestructura paralela.
- `20260712210000_add_como_ser_piloto_guide_checkout_delivery.sql` está aplicada en remoto. Añade preparación y settlement de la guía, más acceso, estado y consumo de descarga; todas las RPCs son `SECURITY DEFINER`, usan `search_path` fijo y aceptan ejecución únicamente desde `service_role`.
- El precio interno es `como_ser_piloto_guide_eur`: 14,95 EUR, pago único. `scripts/sync-stripe-como-ser-piloto-guide.mjs` sincroniza de forma idempotente un Product/Price sandbox usando `flypath_product_key`, sin coincidencias por nombre ni precios activos duplicados.
- `/guia-como-ser-piloto` abre el checkout común con una clave de producto cerrada. El cliente no controla precio, moneda, Stripe Price, usuario, entitlement ni URLs de retorno.
- El webhook firmado es la única confirmación comercial. El pago sandbox dejó `checkout_attempt=completed`, `order=paid` y `payment=succeeded`; no creó ningún entitlement.
- La entrega de guía usa token y cookie propios (`como_ser_piloto_guide_delivery`), opacos, hasheados, `HttpOnly`, con 30 días de caducidad y cinco descargas. La comprobación del producto está tanto en RPC como en la ruta de descarga: una compra de la guía no accede a Career Planner y viceversa.
- `public/GUIA COMPLETA COMO SER PILOTO.PDF` dejó de existir. El PDF final válido de 95 páginas está en `private-assets/commerce/como-ser-piloto-guide.pdf`, se incluye solo para la ruta protegida de descarga y no es un asset público.
- QA sandbox real: CTA, Checkout de 14,95 EUR, webhook firmado, estado interno confirmado, popup `confirmed` y consumo de una descarga protegida correctos. El arnés del navegador usa un enlace Blob para descargar, por lo que no expone un evento nativo de archivo; el consumo remoto y la respuesta protegida se confirmaron.
- Auditoría independiente: **APROBADA**, sin hallazgos Critical ni Major. Se identificó solo una mejora futura no bloqueante para validar metadata al reutilizar un Price Stripe ya existente; el catálogo sandbox actual está correctamente vinculado.
- Validación local: 605 pruebas correctas, TypeScript, lint focalizado y `git diff --check` correctos.

## Historial — implementación 10F: sincronización operativa de mentorías Cal.com

- Migración: `20260712220000_create_calcom_mentorship_booking_sync.sql`, ya aplicada en Supabase remoto.
- `mentorship_bookings` es una proyección privada de Cal.com: referencias de reserva/evento, asistente, fechas, zona horaria y estados cerrados de reserva/pago. `user_id` y `lead_id` son opcionales, pero el webhook no intenta asociarlos por email.
- `cal_webhook_events` almacena solo el hash SHA-256 del body, tipo de evento, UID de reserva, tiempos y estado de proceso. No conserva body, enlaces Meet, notas, datos de pago o secretos.
- `/api/webhooks/calcom` usa body crudo y HMAC SHA-256 (`x-cal-signature-256` + `CALCOM_WEBHOOK_SECRET`), admite exclusivamente `BOOKING_CREATED`, `BOOKING_PAID`, `BOOKING_CANCELLED` y `BOOKING_RESCHEDULED`.
- La RPC `apply_calcom_mentorship_webhook_event` es `SECURITY DEFINER`, fija `search_path`, se ejecuta solo con `service_role`, deduplica por hash y descarta eventos con fecha de proveedor anterior a la última aplicada.
- Cal.com sigue siendo fuente de verdad de disponibilidad, reserva, calendario, Meet, emails y pago Stripe conectado a Cal.com. FlyPath no usa Commerce, no crea productos, precios, pedidos, Checkout, pagos internos, entitlements, emails ni marketing para mentorías.
- Referencia técnica: `docs/ai/payments/flypath-phase-10-calcom-mentorship-sync.md`.
- La implementación, despliegue Production y Ping firmado quedaron validados. La reserva real sigue pendiente sólo por el bloqueo externo del checkout de Cal.com.

## Cierre de Fase 9

- `20260712130000_harden_public_school_catalog_access.sql` está aplicada en remoto: la lectura anónima de catálogo pasa por un contrato público cerrado, sin `internal_notes`, `school_entry_snapshot`, `comparator_exclusion_note`, notas editoriales ni metadata de gestión.
- `20260712140000_create_school_reviews_backend.sql` está aplicada en remoto: crea opiniones privadas, hashes/tokens opacos, versiones y eventos de moderación. No crea leads, suscripciones, cuentas ni compras.
- `20260712150000_make_school_review_moderation_atomic.sql` está aplicada en remoto: `moderate_school_review_atomically` bloquea la opinión, valida la transición, actualiza el estado e inserta el evento append-only en una sola operación. La RPC usa `SECURITY DEFINER`, `search_path` fijo y `EXECUTE` exclusivo de `service_role`.
- `/opiniones-escuelas` elimina previews y muestra solo opiniones `approved`, con agregados dinámicos de media, categorías, distribución y volvería a elegir. El email y toda identidad de cuenta permanecen fuera del DTO público.
- `/schools/[slug]` muestra un resumen real y CTAs; el comparador y Career Planner consultan resúmenes aprobados por lote y mantienen las valoraciones editoriales `school_scores` separadas.
- Career Planner consume ahora ese mismo resumen público por lote: las estrellas convierten la media aprobada de `1–10` a `0–5`, incluyen fracciones visuales y nunca usan `school_scores` como fallback. Sin opiniones aprobadas muestra “Sin opiniones”.
- `/warhome/reviews` y `/warhome/reviews/[reviewId]` están detrás de autorización Warhome. El listado permite filtro y búsqueda privada; el detalle conserva email, textos e historial solo para admins. Aprobar, rechazar, ocultar, restaurar, eliminar y resolver solicitudes usan transiciones cerradas, motivos cerrados y un evento append-only. Las acciones de moderación de Warhome ya se ejecutan mediante la RPC atómica.
- Pruebas técnicas actuales: `npm test` 512 correctas; TypeScript, lint focalizado y `git diff --check` correctos. El aviso de prueba Pre-PPL sigue siendo esperado y no invalida la suite. La exportación inválida `TypeGlyph` de AeroComms se corrigió haciéndola local a su página, sin cambio funcional.
- Deployment de producción de `b5f8e34`: `Ready` en Vercel. La URL canónica sigue siendo `https://flypath-career-planner.vercel.app`.
- QA remota controlada: transición sintética `pending -> approved`, repetición idempotente, conflicto de estado y transición inválida verificados; la opinión sintética y su auditoría se eliminaron al terminar. No se crearon leads, suscripciones, cuentas ni compras.
- QA manual completado: envío de opinión, verificación, listado y detalle Warhome, moderación, publicación pública, ficha, comparador y estrellas del Career Planner. No se crearon leads, suscripciones, cuentas ni compras.
- Mejora futura no bloqueante: el layout visual de las opiniones públicas necesita una iteración de diseño para recuperar y mejorar la presentación prevista inicialmente.

## Próxima acción externa

- Esperar la corrección de Cal.com y ejecutar entonces una reserva real de QA; validar creación, pago, cancelación, reprogramación, duplicados y eventos fuera de orden.
- Mantener Stripe live, Commerce de mentorías, Warhome UI, emails FlyPath y tracking de marketing fuera de alcance.

## Cierre confirmado de Fase 8

- **8A:** `20260712120000_create_warhome_user_directory.sql` aplicada y validada en Supabase remoto. La RPC usa `SECURITY DEFINER`, `search_path` fijo y `EXECUTE` exclusivamente para `service_role`.
- **8B:** `lib/warhome/users.ts` y `lib/warhome/user-detail.ts` exponen contratos server-only, filtros normalizados, paginación exacta y detalle cerrado.
- **8C:** `/warhome/users` lista todas las cuentas FlyPath/AeroComms, con o sin lead, y permite búsqueda, cinco filtros, orden y paginación de 20.
- **8D:** `/warhome/users/[userId]` muestra identidad, perfil, progreso AeroComms, últimas 20 sesiones, lead opcional, marketing separado y un placeholder de compras/entitlements.
- **8E:** las pruebas confirman que el listado usa una RPC agregada sin N+1; la ficha se acota a `user_id`, usa un número fijo de consultas y no expone metadata Auth, identidades, tokens, hashes, recibos ni IDs de sesión cliente.
- No se crean ni modifican leads, suscripciones, compras o eventos por consultar estas vistas.
- Cuenta, perfil, actividad AeroComms, lead comercial, marketing y cliente futuro siguen siendo entidades distintas.
- Commit `73758c1 feat(warhome): add AeroComms user operations`, publicado en `main`.
- `npm test`: 398 pruebas correctas; TypeScript, lint focalizado y `git diff --check` correctos.
- QA manual aprobado y deployment de Vercel confirmado manualmente.

## Siguiente tarea — Fase 9

- Auditar el sistema actual de escuelas, opiniones, fichas, comparador y Warhome antes de diseñar la migración y la moderación.
- Identificar datos y flujos existentes, dependencias de Supabase, posibles superficies de moderación y límites de seguridad.
- No crear migraciones ni implementar UI antes de cerrar esa auditoría.

## Siguiente fase

**Fase 9 — Backend de opiniones de escuelas.**

## Cierre histórico de Fase 7

- Fase 6 permanece completada e integrada en `main`.
- Se creó la referencia `docs/ai/aerocomms/aerocomms-phase-7-persistence-design.md`.
- Se añadió y aplicó la migración `20260712110000_create_aerocomms_progress_persistence.sql`.
- El modelo usa estado durable + historial mínimo idempotente: `aerocomms_progress`, progreso de ejercicios/misiones, estadísticas, sesiones y recibos de sincronización.
- `/api/aerocomms/progress/sync` y `/api/aerocomms/progress/reset` autentican con `auth.getUser()`, validan el límite y usan RPC solo desde `service_role`.
- `aerocomms.v2` continúa para anónimos y nunca se borra tras una sincronización. Perfil permite importar explícitamente un blob anónimo sin dueño o empezar desde cero.
- Los intentos y métricas posteriores a la importación se derivan únicamente de sesiones idempotentes; un `operation_id` reutilizado con hash distinto se rechaza.
- El reset autenticado persiste un corte remoto: sesiones anteriores no pueden restaurar progreso eliminado en otro dispositivo. El owner tiene fallback en memoria y la sincronización reintenta errores transitorios.
- `rfr` se persiste como `ready-for-radio`; audio, transcripciones, blobs, UI state y `subscription` local quedan excluidos.
- El nombre no entra en la persistencia de progreso: anónimos mantienen el onboarding local y cuentas autenticadas muestran `profiles.full_name`. Perfil pide una decisión explícita antes de promover un nombre local distinto.

## Cierre confirmado

- Commit: `aaa5f4e feat(aerocomms): close phase 7 persistence`.
- Push realizado a `main`.
- Deployment completado correctamente.
- `npm test`: 359 tests correctos.
- TypeScript correcto.
- `git diff --check`: correcto.
- QA funcional: importación anónima, recuperación en otro navegador, aislamiento entre cuentas y nombre de perfil consistente.
- El build local con Webpack solo quedó limitado por `ENOTFOUND fonts.googleapis.com` al descargar Geist y Geist Mono; no hubo errores propios de Fase 7.

## Archivos clave

- `lib/aerocomms/persistence-contract.ts`, `persistence-server.ts`, `persistence-client.ts`, `persistence-merge.ts`.
- `lib/aerocomms/appState.tsx`.
- `app/api/aerocomms/progress/sync/route.ts`, `app/api/aerocomms/progress/reset/route.ts`.
- `supabase/migrations/20260712110000_create_aerocomms_progress_persistence.sql`.

## Validación

- `npm test`: 359 tests correctos.
- `npx tsc --noEmit --pretty false`: correcto.
- `npm run build -- --webpack`: bloqueado únicamente por `ENOTFOUND fonts.googleapis.com` al descargar Geist y Geist Mono; validar en Vercel o en un entorno con red.
- ESLint focalizado y `git diff --check`: correctos.

## Handoff histórico hacia Fase 8

La auditoría inicial ya se completó y dio lugar al directorio y la ficha operativa de usuarios. Fase 8 quedó cerrada y desplegada; el siguiente paso vigente está documentado arriba.

## Decisión estratégica de roadmap

- Se descarta crear leads automáticamente por usar AeroComms, completar onboarding, crear una cuenta, importar progreso o completar actividades.
- Todos los usuarios con cuenta deben poder verse operativamente en Warhome, aunque no tengan lead.
- Cuenta/perfil, actividad de producto, lead comercial, consentimiento de marketing y cliente futuro son entidades separadas.
- La Fase 8 pasa a ser Usuarios y actividad de AeroComms.
- La revisión final de AeroComms se mantiene al final del roadmap como Fase 13.
- El backend de opiniones de escuelas se incorpora como Fase 9 propia.
- Pagos y entitlements pasan a Fase 10.
- CRM y automatizaciones avanzadas pasan a Fase 11.
- Warhome / Warboard completo pasa a Fase 12, ampliando el Warhome MVP ya completado.

## Restricciones de alcance

- No añadir Stripe, compras, entitlements, AeroComms Pro, audio, transcripciones, persistencia de Career Planner ni cambios de ejercicios.
- Mantener identidad FlyPath separada de autorización `admin_users` y no convertir uso normal de AeroComms en captación comercial.
- La migración de Fase 7 ya está aplicada; cualquier cambio posterior de Supabase requiere una verificación previa de migraciones pendientes.
- Mantener la separación entre identidad FlyPath y autorización Warhome.
