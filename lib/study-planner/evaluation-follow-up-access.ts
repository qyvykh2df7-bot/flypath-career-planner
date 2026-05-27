/** Seguimiento FlyPath con profesor (clases premium). Futuro: login/Supabase. */
export const DEFAULT_HAS_PREMIUM_FOLLOW_UP = false;

export type EvaluationFollowUpAccess = {
  hasPremiumFollowUp: boolean;
};

export function getEvaluationFollowUpAccess(
  overrides?: Partial<EvaluationFollowUpAccess>,
): EvaluationFollowUpAccess {
  return {
    hasPremiumFollowUp:
      overrides?.hasPremiumFollowUp ?? DEFAULT_HAS_PREMIUM_FOLLOW_UP,
  };
}
