# Fase 10C — Stripe Checkout de prueba: Career Planner Premium

## Estado

**CLOSED / COMPLETED / TESTED** exclusivamente en Stripe sandbox. No hay modo live, webhook HTTP, confirmación interna de pago, entrega de PDF ni entitlement.

## Catálogo cerrado

- Producto interno: `products.product_key = career_planner` activo.
- Precio interno: `career_planner_premium_eur`, EUR, `595` minor units, `one_time`, activo.
- Producto Stripe sandbox: `Career Planner Premium` con metadata `flypath_product_key=career_planner_premium`.
- Precio Stripe sandbox: EUR, `595`, pago único y activo.

`scripts/sync-stripe-career-planner.mjs` solo acepta una clave `sk_test_`. Antes de buscar o crear objetos Stripe, reutiliza el vínculo existente en `product_prices`. Si no hay vínculo, localiza el producto activo por metadata estable y crea un precio compatible solo si no existe. No edita precios comerciales y falla ante ambigüedad o conflicto. Un Product sandbox duplicado de una ejecución anterior está archivado e inactivo; el único catálogo activo vinculado es el aprobado.

## Flujo

1. El navegador solicita solo `career_planner_premium` a `POST /api/commerce/checkout`.
2. La ruta limita el body, exige same-origin y usa una cookie httpOnly de idempotencia compartida por `/api` y el Career Planner. El servidor valida el propietario de cada intento y rota la intención tras logout, cambio de cuenta o una sesión Stripe completada/expirada.
3. La RPC `prepare_career_planner_premium_checkout` prepara atómicamente un pedido pendiente, su línea y un intento de Checkout. Su catálogo, cantidad, moneda, importe y usuario opcional se resuelven en servidor.
4. El servidor crea una Checkout Session hosted en Stripe test usando exclusivamente el `stripe_price_id` interno y persiste la sesión en el intento.
5. `success` solo muestra “Estamos verificando tu pago”; `cancel` confirma que no se realizó el pago. Ninguna de las dos superficies concede acceso.

## Límites de seguridad

- El navegador no puede enviar importe, moneda, `stripe_price_id`, URLs de retorno, `user_id`, grants ni estado de pago.
- `STRIPE_SECRET_KEY` es server-only y se rechaza cualquier clave que no sea `sk_test_`.
- La RPC usa `SECURITY DEFINER`, `search_path = public, pg_temp` y `EXECUTE` solo para `service_role`.
- La compra invitada deja `user_id` en `NULL`; no existe vínculo automático por email.
- La URL del navegador no confirma pagos. Stripe webhooks firmados serán la única fuente de verdad en 10D.

## QA de sandbox

Se creó/reutilizó el catálogo de prueba y se comprobó que una misma cookie devuelve la misma Checkout Session: un intento, un pedido y una sesión. Una tarjeta oficial de prueba completó la sesión y regresó a la página de éxito. Al no existir webhook, FlyPath mantiene el intento en `session_created` y no inserta `payments`, `entitlement_grants`, descargas ni accesos. El cierre técnico deja 554 pruebas correctas, TypeScript y `git diff --check` correctos, además de lint focalizado sin errores.

## Siguiente bloque

10D implementará el webhook firmado, deduplicación de eventos Stripe, el ledger de pagos y la entrega/reclamación segura. Otros productos, Stripe live, suscripciones y entitlements efectivos permanecen fuera de 10C.
