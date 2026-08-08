# Pre-PPL — guía digital protegida

## Estado

Pre-PPL está preparado como producto digital de FlyPath. La migración
`20260808180000_launch_preppl_digital_guide.sql` activa el producto existente
`preppl_guide`, crea su único precio activo `preppl_guide_eur` y registra su
binding Stripe Live. La compra puede realizarse como invitado o con cuenta.

## Catálogo cerrado

- Producto interno: `preppl_guide`.
- Precio interno: `preppl_guide_eur`.
- Importe: `2395` céntimos, `EUR`, pago único.
- Stripe Live: Product `prod_V2HDiunAEOVO9p`; Price
  `price_1U2Cf6KuujVRKb0PVULrzLEY`.
- Test y Live no se mezclan. Mientras no haya binding Test específico,
  Pre-PPL falla cerrado en ese modo.

El navegador solo envía `productKey: "preppl_guide"` a
`POST /api/commerce/checkout`. El servidor resuelve precio, moneda, usuario
opcional, retorno y Price de Stripe desde el catálogo privado. No acepta
importe, moneda, Price ID, usuario ni URLs de retorno proporcionados por el
cliente.

## Confirmación y entrega

El webhook Stripe firmado sigue siendo la única fuente comercial de verdad.
`checkout.session.completed` valida producto, precio, modo, importe, moneda y
referencias internas antes de crear o actualizar el único `payment`, marcar el
pedido como pagado y habilitar la entrega. No crea un entitlement.

La entrega es independiente de Career Planner y de Cómo ser Piloto:

- token opaco en cookie `HttpOnly`, almacenado únicamente como SHA-256;
- caducidad de 30 días y máximo de cinco descargas;
- estado y consumo comprobados en RPC privadas por producto y precio;
- el PDF `private-assets/commerce/pre-ppl-guide.pdf` no está en `public` y se
  empaqueta solo en `/api/commerce/pre-ppl/download`.

### Hardening posterior a auditoría

La descarga primero comprueba el estado de la entrega y que el PDF privado se
puede leer y validar. Solo entonces invoca el RPC atómico de consumo, que
bloquea la fila, vuelve a validar pago, caducidad y límite, y finalmente
incrementa el contador. Por tanto, un token inválido, caducado o agotado, un
asset ausente o inválido y cualquier error de lectura no consumen una descarga.

La migración `20260808190000_add_preppl_purchase_confirmation_email.sql` añade
el email operativo posterior a una compra confirmada. El webhook firmado
registra de forma idempotente el email normalizado únicamente en el pedido
Pre-PPL ya liquidado y crea un único job `preppl_purchase_confirmation` ligado
al pedido. No crea un lead ni modifica consentimiento de marketing. El correo
usa el enlace seguro `https://www.flypath.es/pre-ppl/checkout/success`, nunca
incluye tokens de entrega y los reintentos del webhook reutilizan el mismo job.
Un fallo temporal de Resend no revierte el pago: conserva el job pendiente y
devuelve un fallo reintentable al webhook.

La antigua waitlist queda cerrada con `410`; sus leads, origen e historial no
se eliminan.

## Formato físico

La versión física se muestra a 43 EUR y se venderá mediante Amazon. La URL se
configura exclusivamente en `lib/pre-ppl.ts` como
`PRE_PPL_PHYSICAL_AMAZON_URL`. Hasta contar con una URL verificada, el botón
permanece desactivado y no se crea checkout FlyPath ni se inventa un enlace.

## QA

Las migraciones se validaron en remoto con una transacción sintética revertida:
pedido, payment, token y consumo terminaron en estado correcto sin dejar
registros. El cierre de hardening verificó en remoto el catálogo público, la
inaccesibilidad directa del PDF, los rechazos seguros de descarga y el nuevo
RPC de correo sin crear órdenes ni emails. RLS queda cerrada a `anon` y
`authenticated`; las tablas y RPCs operativas son exclusivas de `service_role`.
