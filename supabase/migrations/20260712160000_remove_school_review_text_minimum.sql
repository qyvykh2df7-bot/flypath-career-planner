-- FlyPath Phase 9: align persisted school-review text with the approved product contract.
-- Experience fields remain required, trimmed/non-blank and capped at 3,000 characters.

BEGIN;

ALTER TABLE public.school_reviews
  DROP CONSTRAINT IF EXISTS school_reviews_text_length_check;

ALTER TABLE public.school_reviews
  ADD CONSTRAINT school_reviews_text_length_check CHECK (
    length(btrim(best_part)) BETWEEN 1 AND 3000
    AND length(btrim(improvements)) BETWEEN 1 AND 3000
    AND length(btrim(advice)) BETWEEN 1 AND 3000
  );

COMMENT ON CONSTRAINT school_reviews_text_length_check ON public.school_reviews IS
  'Required non-blank review text fields, without an artificial minimum length and capped at 3,000 characters.';

COMMIT;
