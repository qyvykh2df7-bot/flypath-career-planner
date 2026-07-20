# Fase 10B — Fundación comercial de FlyPath

## Estado

Aplicada y validada en Supabase remoto mediante `20260712170000_create_commerce_foundation.sql`. La comprobación remota confirmó RLS y ACL cerradas, claves foráneas, checks, índices de idempotencia y una prueba sintética revertida sin filas residuales. Stripe SDK, Checkout, webhooks HTTP, CTAs y cobros siguen sin instalar ni activar.

## Propósito

Esta especificación crea el contrato de datos para pagos, compras y acceso. No instala Stripe, no crea sesiones de Checkout, no recibe webhooks HTTP y no activa cobros. `public.products` sigue siendo el catálogo; el historial comercial vive en tablas independientes.

## Entidades

| Área | Tablas | Decisión |
| --- | --- | --- |
| Catálogo comercial | `product_prices` | Precio cerrado por producto, moneda EUR inicial, pago único o recurrente y futuro `stripe_price_id`. |
| Cliente y pedido | `stripe_customers`, `orders`, `checkout_attempts`, `order_items` | Una compra puede no tener `user_id`. El email de invitado se normaliza y se guarda con hash solo para entrega y recuperación; no autentica ni vincula cuentas. |
| Cobro | `payments`, `subscriptions`, `stripe_webhook_events` | Ledger normalizado de estado y cantidades. Los eventos se deduplican por `stripe_event_id` y solo guardan hash de payload, no el payload completo. |
| Acceso | `entitlements`, `product_entitlements`, `entitlement_grants` | Un producto puede conceder varios accesos. Los grants pueden ser perpetuos, por periodo de suscripción o temporales. |
| Reclamación | `order_claim_tokens` | Token opaco, hasheado, de un solo uso y caducable para reclamar acceso o recuperar una descarga sin crear cuenta por email. El email asociado permanece únicamente en el pedido. |

## Compradores invitados

`orders.user_id` y `checkout_attempts.user_id` admiten `NULL`. El pedido no se enlaza automáticamente si alguien crea una cuenta con el mismo email. Tras un pago válido, un producto que requiera cuenta crea grants `pending_claim`; una fase posterior emitirá un token seguro o comprobará una dirección de email verificada antes de rellenar `beneficiary_user_id`.

Una guía digital o Career Planner Premium puede usar el mismo email únicamente para enviar o recuperar la entrega. Ese email nunca se muestra públicamente ni concede por sí mismo un entitlement.

## Entitlement efectivo

El acceso solo se resuelve en servidor. Un grant es efectivo si tiene `status = active`, un beneficiario autenticado, comenzó ya, no está revocado y no ha caducado. `pending_claim`, `revoked` y `expired` nunca conceden acceso. Las claves de idempotencia y los índices por ítem/suscripción impiden que un mismo pago o webhook cree el mismo acceso dos veces.

## Reglas futuras de webhook

El webhook verificará firma antes de insertar/actualizar el ledger. La fuente de verdad será el evento Stripe validado, no una URL de éxito ni un callback de navegador. El pago único podrá conceder un grant por `order_item`; una renovación actualizará el grant de la suscripción. Reembolso total revoca/invalida; reembolso parcial queda en revisión manual hasta cerrar política.

## Seguridad y RLS

Todas las tablas tienen RLS activada y revocan todo acceso de `PUBLIC`, `anon` y `authenticated`. En 10B solo `service_role` puede leer o escribir. Las pantallas de cuenta y Warhome recibirán DTOs cerrados en bloques posteriores; nunca metadata Auth, secretos Stripe, tokens en claro, payloads completos ni PII no necesaria.

## Fuera de alcance de 10B

- SDK o secretos de Stripe.
- Checkout Sessions, Customer Portal, rutas HTTP webhook y cobros.
- CTAs, precios de producción o semillas de catálogo comercial.
- Entrega real de PDFs/guías, reclamación de invitado y lectura de compras desde `/account`.
- Cal.com y Amazon: conservan sus flujos externos.
