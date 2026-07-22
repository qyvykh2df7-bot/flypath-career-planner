# Fase 10F — Proyección operativa de mentorías Cal.com

## Estado

**Implementado localmente; migración pendiente de auditoría, aplicación remota y
QA con un webhook real de Cal.com.** No crea productos, precios, pedidos,
Checkout de FlyPath, pagos internos, entitlements, emails ni tracking de
marketing. Stripe live sigue fuera de alcance.

## Fuente de verdad y límite de dominio

Cal.com es la fuente de verdad para disponibilidad, reserva, calendario,
Google Meet, comunicaciones operativas y el pago Stripe conectado a Cal.com.
FlyPath recibe una proyección operativa mínima mediante webhooks firmados.

No se intenta reconciliar por email una cuenta FlyPath ni un lead existente:
`user_id` y `lead_id` se mantienen nulos hasta que exista una vinculación
explícita, autenticada y aprobada para ese dominio. Una reserva no crea leads,
suscripciones, cuentas, pedidos ni pagos propios.

## Persistencia

`mentorship_bookings` conserva únicamente los datos necesarios para operar una
sesión: referencias Cal.com, tipo de evento, asistente, fechas, zona horaria y
estados cerrados de reserva/pago. El email se normaliza y se acompaña de un hash
SHA-256 para búsquedas server-only; no se publica ni se usa como prueba de
identidad.

`cal_webhook_events` es un ledger mínimo: hash SHA-256 del body, tipo de evento,
UID de reserva, fecha del proveedor, recepción, estado y código de error
cerrado. Nunca guarda el body, enlaces de Meet, notas, respuestas del
cuestionario ni datos de pago del proveedor.

Ambas tablas tienen RLS activa, sin acceso de `PUBLIC`, `anon` ni
`authenticated`; solo `service_role` puede leer o escribir. La única RPC de
aplicación es `apply_calcom_mentorship_webhook_event`, `SECURITY DEFINER`, con
`search_path = public, pg_temp` y ejecución exclusiva de `service_role`.

## Webhook

`POST /api/webhooks/calcom` lee el cuerpo crudo y valida
`x-cal-signature-256` con HMAC SHA-256 y `CALCOM_WEBHOOK_SECRET`. Admite
únicamente:

- `BOOKING_CREATED`
- `BOOKING_PAID`
- `BOOKING_CANCELLED`
- `BOOKING_RESCHEDULED`

El hash de cada body es único. Las repeticiones reciben éxito idempotente. La
RPC bloquea por UID de reserva, registra el evento y actualiza la proyección en
la misma transacción. Un evento con fecha del proveedor anterior a la última
procesada queda como `ignored/stale_event` y no puede restaurar una fecha,
cancelación o pago antiguo.

El endpoint solo devuelve respuestas genéricas: firmas o payloads inválidos
reciben `400`; configuración o persistencia temporalmente no disponibles
reciben `503` para que Cal.com pueda reintentar. Los logs no incluyen PII,
secretos ni payloads.

## Configuración

Todas las variables son server-only:

```env
CALCOM_WEBHOOK_SECRET=
CALCOM_API_KEY=
CALCOM_API_VERSION=
CALCOM_MENTORSHIP_EVENT_TYPE_ID=
```

La API key, versión e ID de tipo de evento quedan documentados para una futura
conciliación operativa; este bloque no llama a la API de Cal.com. En Cal.com se
debe crear el webhook apuntando a `/api/webhooks/calcom`, configurando el mismo
secreto y solo los cuatro eventos soportados.

## Límites y siguiente QA

- La reprogramación actualiza la reserva y el ledger conserva el evento mínimo;
  un historial de slots más detallado requeriría un bloque posterior.
- Reembolsos, no-shows, cambios manuales y conciliación por API se tratarán
  después de validar los eventos reales disponibles en el plan de Cal.com.
- Antes de producción hay que aplicar la migración, comprobar ACL/RLS y probar
  una reserva, pago, cancelación y reprogramación en el entorno de Cal.com.
