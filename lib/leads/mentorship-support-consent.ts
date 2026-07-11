export const MENTORSHIP_SUPPORT_CONTACT_CONSENT_TEXT =
  "Al enviar la solicitud, aceptas que FlyPath contacte contigo en relación con el servicio solicitado.";

export const MENTORSHIP_SUPPORT_SITUATIONS = [
  { value: "not_started", label: "Aún no he empezado" },
  { value: "comparing_schools", label: "Comparando escuelas" },
  { value: "in_training", label: "Ya estoy en formación" },
  { value: "job_seeking", label: "Buscando trabajo como piloto" },
  { value: "other", label: "Otra" },
] as const;

export type MentorshipSupportSituation =
  (typeof MENTORSHIP_SUPPORT_SITUATIONS)[number]["value"];

export function isMentorshipSupportSituation(
  value: string,
): value is MentorshipSupportSituation {
  return MENTORSHIP_SUPPORT_SITUATIONS.some((situation) => situation.value === value);
}
