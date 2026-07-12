-- =============================================================================
-- FlyPath Tracking Phase 3: saneamiento de privacidad en eventos históricos
-- =============================================================================
-- Elimina PII y texto libre históricos de metadata sin borrar eventos ni tocar
-- ninguna otra columna. El código de captación actual ya evita estas claves.

BEGIN;

UPDATE public.user_events
SET metadata = metadata - ARRAY[
  'contact_consent_text',
  'full_name',
  'help_text',
  'phone',
  'situation'
]::text[]
WHERE event_name = 'mentorship_support_requested'
  AND metadata ?| ARRAY[
    'contact_consent_text',
    'full_name',
    'help_text',
    'phone',
    'situation'
  ]::text[];

COMMIT;
