/** Opciones de programa en ficha individual (sin cambios en BD). */
export type SchoolProgramOption = {
  id: string;
  label: string;
};

const PROGRAM_OPTIONS_BY_SLUG: Record<string, SchoolProgramOption[]> = {
  "adventia-usal": [
    { id: "integrated", label: "Integrado" },
    { id: "university", label: "Universidad + Licencia" },
  ],
  "european-flyers": [
    { id: "integrated", label: "Integrado" },
    { id: "modular", label: "Modular" },
  ],
  "one-air": [
    { id: "integrated", label: "Integrado" },
    { id: "modular", label: "Modular" },
    { id: "airline_pilot", label: "Airline Pilot" },
    { id: "university_programme", label: "University ATPL" },
  ],
  "eas-barcelona": [
    { id: "integrated", label: "Integrado" },
    { id: "modular", label: "Modular" },
  ],
  "fte-jerez": [
    { id: "integrated", label: "Integrado" },
    { id: "modular", label: "Modular" },
  ],
  "barcelona-flight-school": [
    { id: "integrated", label: "Integrado" },
    { id: "modular", label: "Modular" },
  ],
  "aerodynamics-academy": [
    { id: "integrated", label: "Integrado Classic" },
    { id: "integrated_platinum", label: "Integrado Platinum" },
    { id: "modular", label: "Modular" },
  ],
  "baa-training-spain": [
    { id: "integrated", label: "Integrado" },
    { id: "modular", label: "Modular" },
  ],
  "panamedia-escuela-de-pilotos": [
    { id: "integrated", label: "Integrado" },
    { id: "modular", label: "Modular" },
  ],
  "flyschool-air-academy": [
    { id: "professional_250", label: "Profesional 250 h" },
    { id: "advance_275", label: "Advance 275 h" },
    { id: "cadet_500", label: "Cadet 500 h" },
  ],
  "airpull-aviation-academy": [
    { id: "atpl_basic", label: "ATPL Basic" },
    { id: "atpl_advanced", label: "ATPL Advanced" },
    { id: "atpl_premium", label: "ATPL Premium" },
  ],
  "flyby-aviation-academy": [
    { id: "integrated", label: "Integrado" },
    { id: "university", label: "Grado + ATPL" },
    { id: "cadet_500", label: "Cadet + FI" },
  ],
  "aeroflota-del-noroeste-afn": [
    { id: "integrated", label: "Integrado" },
    { id: "modular", label: "Modular" },
  ],
  "canavia-flight-school": [
    { id: "integrated", label: "Integrado Standard" },
    { id: "canavia_advanced", label: "Integrado Advanced" },
    { id: "canavia_first_officer", label: "First Officer" },
    { id: "modular", label: "Modular" },
  ],
  "corflight-school": [
    { id: "integrated", label: "Integrado" },
    { id: "modular", label: "Modular" },
  ],
  "leading-edge-aviation-leap-alhama": [
    { id: "single_licence", label: "fATPL EASA" },
    { id: "dual_licence", label: "Licencia dual EASA + UK" },
  ],
};

export function getSchoolProgramOptions(slug: string): SchoolProgramOption[] | null {
  const options = PROGRAM_OPTIONS_BY_SLUG[slug];
  return options && options.length > 0 ? options : null;
}

export function defaultSchoolProgramId(slug: string): string {
  const options = getSchoolProgramOptions(slug);
  return options?.[0]?.id ?? "integrated";
}
