# Fase 10E — Guía digital Cómo ser Piloto

## Estado

**CLOSED / COMPLETED / TESTED** exclusivamente en Stripe sandbox. La migración
`20260712210000_add_como_ser_piloto_guide_checkout_delivery.sql` está aplicada
en Supabase remoto. Stripe live, entitlements, suscripciones y otros productos
permanecen fuera de alcance.

La auditoría independiente está **APROBADA**, sin hallazgos Critical ni Major.
La única mejora futura no bloqueante es comprobar también la metadata al
reutilizar un Price Stripe existente; el Product/Price sandbox actual está
correctamente vinculado.

## Catálogo cerrado

- Producto interno: `como_ser_piloto_guide`.
- Precio interno: `como_ser_piloto_guide_eur`.
- Importe: `1495` céntimos, `EUR`, `one_time`.
- Stripe sandbox: Product y Price vinculados al precio interno mediante un
  script idempotente y la metadata cerrada `flypath_product_key`.

El cliente de `/guia-como-ser-piloto` solo manda la clave de producto. El
servidor resuelve catálogo, importe, moneda, Price de Stripe, identidad
opcional y rutas internas de retorno. No acepta precios, IDs de Stripe,
usuarios, entitlements ni URLs desde el navegador.

## Confirmación y entrega

`checkout.session.completed`, validado por el webhook firmado, es la única
fuente comercial de verdad. Tras validar el producto, el precio de 14,95 EUR,
el modo y las referencias internas, la RPC transaccional deja el intento
`completed`, el pedido `paid` y crea o actualiza un único `payment=succeeded`.
No crea un `entitlement_grant`.

La guía usa entrega propia, separada de Career Planner:

- cookie y token opaco específicos de guía;
- hash SHA-256 persistido, nunca el token en claro;
- caducidad de 30 días y máximo de cinco descargas;
- comprobación del producto en las RPC y en la ruta protegida;
- una entrega de guía no puede descargar un informe Career Planner y viceversa.

El archivo final se conserva en
`private-assets/commerce/como-ser-piloto-guide.pdf`. El asset dejó de estar en
`public/` y solo se incluye en el bundle de la ruta de descarga protegida. Se
validó como PDF A4 de 95 páginas sin JavaScript ni cifrado.

## QA sandbox

La prueba real comprobó CTA, Checkout alojado, producto, importe de 14,95 EUR,
webhook firmado, payment interno, popup `confirmed` y consumo correcto de la
entrega protegida. Stripe live no se activó y no se crearon entitlements.
