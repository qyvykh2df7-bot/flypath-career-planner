# Fase 10D — Webhook firmado y entrega de Career Planner Premium

## Estado

**CLOSED / COMPLETED / TESTED** exclusivamente para Stripe sandbox. Las
migraciones `20260712190000_add_career_planner_payment_delivery.sql` y
`20260712200000_fix_career_planner_payment_failed_state.sql` están aplicadas
en Supabase remoto. Stripe live, entitlements, suscripciones y otros productos
siguen fuera de alcance.

## Fuente de verdad

`POST /api/webhooks/stripe` recibe el body crudo y valida su firma mediante
`STRIPE_WEBHOOK_SECRET`. El retorno del navegador no confirma una compra.

- `checkout.session.completed` es la única fuente comercial de confirmación.
  Recupera la sesión de Stripe y exige modo `payment`, `paid`, 595 EUR, el
  precio Stripe enlazado al catálogo interno y referencias UUID coherentes.
- `payment_intent.succeeded` se registra como evento redundante: evita crear
  un segundo pago y no sustituye a Checkout.
- `payment_intent.payment_failed` registra un pago fallido vinculado y deja el
  intento en `failed` y el pedido pendiente en `payment_failed`.
- `checkout.session.expired` expira el intento y cancela solo un pedido aún
  pendiente.

Todos los eventos se deduplican por `stripe_event_id`. El ledger guarda un
hash SHA-256 del payload, nunca el payload completo.

## Settlement y entrega

La RPC `process_career_planner_checkout_completed` bloquea el intento, pedido
y línea; en una única transacción crea o actualiza el pago, marca el pedido
como `paid`, el intento como `completed` y la línea como `available`. No crea
ningún `entitlement_grant`.

La página success abre un modal que consulta solo los estados `verifying`,
`confirmed`, `failed` y `expired`. Antes de consultar, el servidor exige el
ID de sesión de Stripe junto con la cookie de intención de Checkout que creó
FlyPath. Solo entonces emite una cookie `HttpOnly` con un token opaco.

`checkout_delivery_tokens` conserva únicamente el hash del token, caducidad y
un máximo de cinco descargas. `POST /api/commerce/checkout/download` consume
un uso tras confirmar el pago y genera el PDF en servidor a partir del snapshot
local de Career Planner; ni el PDF ni el snapshot se persisten en Commerce.

Cerrar una pestaña no cancela el token de recuperación de 30 días. La
recuperación por email queda preparada como trabajo posterior: no se vincula
una compra invitada a una cuenta por coincidencia de email.

## QA sandbox completada

La prueba local real se completó con Stripe CLI y una tarjeta oficial de sandbox:

1. Se inició un listener hacia `/api/webhooks/stripe` con un secreto temporal
   guardado exclusivamente en `.env.local`.
2. Se completó una Checkout Session de prueba.
3. El webhook firmado marcó un `payment` como `succeeded`, el pedido como
   `paid` y el intento como `completed`.
4. La pantalla de retorno mostró la confirmación interna y descargó el PDF.

El secreto no se incluyó en commits, logs ni documentación y se retiró del
entorno local al finalizar la prueba.

## Pendiente no bloqueante

Normalizar los assets usados por `@react-pdf/renderer`: hay imágenes `.webp` y
un archivo con extensión `.jpg` cuyo contenido es PNG. La entrega funcionó en
la QA sandbox, pero esa normalización eliminará los avisos de extensiones de
imagen y reducirá el riesgo visual entre entornos.
