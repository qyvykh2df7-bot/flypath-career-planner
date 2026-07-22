# Tarea activa — Fase 10: Pagos, monetización y entitlements

## Estado de la plataforma

- Fases 4, 5 y 6: completadas e integradas en `main`.
- Fase actual: **Fase 10 — Pagos, monetización y entitlements**.
- Fase 7: CLOSED / COMPLETED / DEPLOYED. Migración remota aplicada, QA funcional aprobado y deployment completado.

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
- Las decisiones de canal son: Career Planner y guías digitales con Stripe como invitado; AeroComms Pro reclamable si se compró sin cuenta; Mentorías mediante Cal.com; guía física mediante Amazon; Pre-PPL sigue en waitlist.

## Cierre — 10E

10E está **CLOSED / COMPLETED / TESTED** en Stripe sandbox para la guía digital **Cómo ser Piloto**.

- `20260712210000_add_como_ser_piloto_guide_checkout_delivery.sql` está aplicada en remoto. Añade RPCs service-role-only para preparar, confirmar, expirar, fallar, comprobar y consumir la entrega de la guía sin mezclarla con Career Planner.
- El producto interno existente `como_ser_piloto_guide` usa el precio cerrado `como_ser_piloto_guide_eur`: **14,95 EUR**, `one_time`, activo. El script de sincronización reutiliza o crea un único Product/Price de Stripe sandbox y vincula ese precio interno de forma idempotente.
- La página `/guia-como-ser-piloto` usa el endpoint de Checkout existente; el navegador solo puede enviar `product_key`. El precio, la moneda, el Price de Stripe y las URLs de retorno se resuelven y validan en servidor.
- El webhook firmado sigue siendo la única fuente de confirmación. Tras el pago, la guía recibe una cookie de entrega propia con token opaco, `HttpOnly`, hasheado, con caducidad de 30 días y máximo de cinco descargas. No puede descargar el PDF de Career Planner, ni este puede descargar la guía.
- El PDF definitivo se trasladó de `public/` a `private-assets/commerce/como-ser-piloto-guide.pdf`; se comprobó como PDF A4 válido de 95 páginas y solo se sirve después de la validación protegida.
- QA sandbox: Checkout muestra el producto y 14,95 EUR; el webhook creó el pago y marcó el pedido confirmado; el popup pasó a `confirmed` y la entrega consumió un uso correctamente. No se crearon entitlements.
- Auditoría independiente: **APROBADA**, sin hallazgos Critical ni Major. La única observación menor es endurecer la verificación de metadata al reutilizar un Price existente en una futura mejora; el catálogo sandbox actual ya es correcto.
- Validación local: 605 pruebas correctas, TypeScript, lint focalizado y `git diff --check` correctos.

## Tarea activa — 10F: sincronización operativa de mentorías Cal.com

- La migración local `20260712220000_create_calcom_mentorship_booking_sync.sql` y la ruta server-only `/api/webhooks/calcom` están implementadas, sin aplicar todavía en Supabase remoto.
- Cal.com es la fuente de verdad para disponibilidad, reserva, calendario, Google Meet, emails operativos y el pago Stripe conectado a Cal.com. FlyPath recibe solo una proyección operativa idempotente de reservas y eventos.
- La siguiente tarea es auditar la migración y el contrato del webhook antes de aplicarlos, después configurar el webhook en Cal.com con `CALCOM_WEBHOOK_SECRET` y hacer QA real de creación, pago, cancelación, reprogramación y evento tardío.
- Validación local actual: 623 pruebas correctas, TypeScript, lint focalizado y `git diff --check` correctos.
- Mantener fuera de alcance: Stripe live, Commerce de mentorías, productos/precios/pedidos/pagos FlyPath, entitlements, emails FlyPath, tracking de marketing, Warhome UI y asociación automática de reservas por email con cuentas o leads.

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
