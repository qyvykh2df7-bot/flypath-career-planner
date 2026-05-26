export type AtplBankArea = {
  code: string;
  title: string;
};

/**
 * Áreas reales de banco ATPL por `subjectId` del catálogo (`lib/study-planner/subjects.ts`).
 * Fuentes: estructura ATPL (AviationExam / ATPLQ / AVEX).
 */
export const ATPL_BANK_AREAS: Record<string, AtplBankArea[]> = {
  "atpl-air-law": [
    {
      code: "010-01",
      title: "International Law: Conventions, Agreements and Organisations",
    },
    {
      code: "010-02",
      title: "Airworthiness of Aircraft, Aircraft Nationality and Registration Marks",
    },
    { code: "010-04", title: "Personnel Licensing" },
    {
      code: "010-05",
      title: "Rules of the Air According to ICAO Annex 2 and SERA",
    },
    { code: "010-06", title: "Aircraft Operations" },
    {
      code: "010-07",
      title: "Air Traffic Services (ATS) and Air Traffic Management (ATM)",
    },
    { code: "010-08", title: "Aeronautical Information Service (AIS)" },
    { code: "010-09", title: "Aerodromes" },
    { code: "010-10", title: "Facilitation (ICAO Annex 9)" },
    { code: "010-11", title: "Search and Rescue (SAR)" },
    {
      code: "010-12",
      title:
        "SECURITY - Safeguarding International Civil Aviation against Acts of Unlawful Interference (ICAO Annex 17)",
    },
    {
      code: "010-13",
      title: "Aircraft Accident and Incident Investigation",
    },
  ],
  "atpl-aircraft-general-knowledge": [
    { code: "021-01", title: "System Design, Loads, Stresses, Maintenance" },
    { code: "021-02", title: "Airframe" },
    { code: "021-03", title: "Hydraulics" },
    { code: "021-04", title: "Landing Gear, Wheels, Tyres, Brakes" },
    { code: "021-05", title: "Flight Controls" },
    {
      code: "021-06",
      title: "Pneumatics - Pressurisation and Air Conditioning Systems",
    },
    { code: "021-07", title: "Anti-icing and De-icing Systems" },
    { code: "021-08", title: "Fuel System" },
    { code: "021-09", title: "Electrics" },
    { code: "021-10", title: "Piston Engines" },
    { code: "021-11", title: "Turbine Engines" },
    { code: "021-12", title: "Protection and Detection Systems" },
    { code: "021-14", title: "Helicopter: Miscellaneous Systems" },
    { code: "021-15", title: "Helicopter: Rotor Heads" },
    { code: "021-16", title: "Helicopter: Transmission" },
    { code: "021-17", title: "Helicopter: Blades" },
  ],
  "atpl-instrumentation": [
    { code: "022-01", title: "Sensors and Instruments" },
    { code: "022-02", title: "Measurement of Air Data Parameters" },
    { code: "022-03", title: "Magnetism - Direct Reading Compass and Flux Valve" },
    { code: "022-04", title: "Gyroscopic Instruments" },
    { code: "022-05", title: "Inertial Navigation" },
    { code: "022-07", title: "Helicopter: Automatic Flight Control Systems" },
    {
      code: "022-11",
      title: "Flight Management System (FMS)/Flight Management and Guidance System (FMGS)",
    },
    { code: "022-12", title: "Alerting Systems, Proximity Systems" },
    { code: "022-13", title: "Integrated Instruments - Electronic Displays" },
    { code: "022-14", title: "Maintenance, Monitoring and Recording Systems" },
    { code: "022-15", title: "Digital Circuits and Computers" },
  ],
  "atpl-mass-balance": [
    { code: "031-01", title: "Purpose of Mass and Balance Considerations" },
    { code: "031-02", title: "Loading" },
    { code: "031-04", title: "Mass and Balance Details of Aircraft" },
    { code: "031-05", title: "Determination of CG Position" },
    { code: "031-06", title: "Cargo Handling" },
  ],
  "atpl-performance": [
    { code: "034-01", title: "General" },
    {
      code: "034-02",
      title: "Performance Class 3 - Single-engine Helicopters",
    },
    { code: "034-03", title: "Performance Class 2" },
    {
      code: "034-04",
      title: "Performance Class 1 - Helicopters Certified According to CS-29 Only",
    },
  ],
  "atpl-human-performance": [
    { code: "040-01", title: "Human Factors: Basic Concepts" },
    {
      code: "040-02",
      title: "Basics of Aviation Physiology and Health Maintenance",
    },
    { code: "040-03", title: "Basic Aviation Psychology" },
  ],
  "atpl-meteorology": [
    { code: "050-01", title: "The Atmosphere" },
    { code: "050-02", title: "Wind" },
    { code: "050-03", title: "Thermodynamics" },
    { code: "050-04", title: "Clouds and Fog" },
    { code: "050-05", title: "Precipitation" },
    { code: "050-06", title: "Air Masses and Fronts" },
    { code: "050-07", title: "Pressure Systems" },
    { code: "050-08", title: "Climatology" },
    { code: "050-09", title: "Flight Hazards" },
    { code: "050-10", title: "Meteorological Information" },
  ],
  "atpl-general-navigation": [
    { code: "061-01", title: "Basics of Navigation" },
    { code: "061-02", title: "Visual Flight Rule (VFR) Navigation" },
    { code: "061-03", title: "Great Circles and Rhumb Lines" },
    { code: "061-04", title: "Charts" },
    { code: "061-05", title: "Time" },
  ],
  "atpl-radio-navigation": [
    { code: "062-01", title: "Basic Radio Propagation Theory" },
    { code: "062-02", title: "Radio Aids" },
    { code: "062-03", title: "Radar" },
    { code: "062-06", title: "Global Navigation Satellite Systems (GNSSs)" },
    { code: "062-07", title: "Performance Based Navigation (PBN)" },
  ],
  "atpl-operational-procedures": [
    { code: "071-01", title: "General Requirements" },
    {
      code: "071-02",
      title: "Special Operational Procedures and Hazards (General Aspects)",
    },
    { code: "071-03", title: "Emergency Procedures (helicopter)" },
    { code: "071-04", title: "Specialised Operations" },
  ],
  "atpl-principles-of-flight": [
    { code: "082-01", title: "Subsonic Aerodynamics" },
    { code: "082-02", title: "Transonic Aerodynamics and Compressibility Effects" },
    { code: "082-03", title: "Rotorcraft Types" },
    { code: "082-04", title: "Main Rotor Aerodynamics" },
    { code: "082-05", title: "Main Rotor Mechanics" },
    { code: "082-06", title: "Tail Rotors" },
    { code: "082-07", title: "Equilibrium, Stability and Control" },
    { code: "082-08", title: "Helicopter Flight Mechanics" },
  ],
  "atpl-communications": [
    { code: "090-01", title: "Concepts" },
    { code: "090-02", title: "General Operating Procedures" },
    { code: "090-03", title: "Relevant Weather Information" },
    { code: "090-04", title: "Voice Communication Failure" },
    { code: "090-05", title: "Distress and Urgency Procedures" },
    { code: "090-06", title: "VHF Propagation and Allocation of Frequencies" },
    { code: "090-07", title: "Other Communications" },
  ],
};

export function getBankAreasForSubject(subjectId: string): AtplBankArea[] {
  return ATPL_BANK_AREAS[subjectId] ?? [];
}

export function formatBankAreaLabel(area: AtplBankArea): string {
  return `${area.code} · ${area.title}`;
}

export function findBankAreaByCode(
  subjectId: string,
  code: string,
): AtplBankArea | undefined {
  return getBankAreasForSubject(subjectId).find((a) => a.code === code);
}

export function parseBankArea(raw: unknown): AtplBankArea | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const b = raw as Record<string, unknown>;
  if (typeof b.code !== "string" || typeof b.title !== "string") return undefined;
  const code = b.code.trim();
  const title = b.title.trim();
  if (!code || !title) return undefined;
  return { code, title };
}
