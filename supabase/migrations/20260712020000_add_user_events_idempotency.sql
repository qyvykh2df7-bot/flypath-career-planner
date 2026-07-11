-- =============================================================================
-- FlyPath Tracking Phase 3: idempotencia de eventos de conversión y tracking
-- =============================================================================

BEGIN;

ALTER TABLE public.user_events
  ADD COLUMN IF NOT EXISTS idempotency_key uuid;

CREATE UNIQUE INDEX IF NOT EXISTS user_events_idempotency_key_unique_idx
  ON public.user_events (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

COMMENT ON COLUMN public.user_events.idempotency_key IS
  'UUID opcional generado por cliente para deduplicar un único intento de evento.';

COMMIT;
