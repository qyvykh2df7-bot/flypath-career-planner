import "server-only";

import type {
  ContentOsStrategyPillar,
  ContentOsStrategyProduct,
} from "@/lib/warhome/content-os-strategy-contract";

export const PILOTFELIU_CONTENT_STRATEGY = {
  brand: {
    name: "PilotFeliu",
    positioning:
      "Fundador y piloto de medio radio que crea contenido sobre aviación, carrera profesional, evolución personal y FlyPath.",
    boundaries: [
      "No política",
      "No familia",
      "No patrimonio o dinero personal",
      "No conflictos con la compañía",
      "No información profesional, operacional o sensible restringida",
    ],
  },
  audiences: [
    "Futuros pilotos",
    "Estudiantes de aviación",
    "Pilotos jóvenes",
    "Personas interesadas en la carrera aeronáutica",
  ],
  products: {
    guide: {
      name: "Cómo ser Piloto y recursos de formación",
      purpose: "Captación, autoridad y primera conversión",
    },
    career_planner: {
      name: "Career Planner",
      purpose: "Planificación de carrera para usuarios con intención alta",
    },
    aerocomms: {
      name: "AeroComms",
      purpose: "Inglés aeronáutico, fraseología y preparación práctica",
    },
    mentorships: {
      name: "Mentorías FlyPath",
      purpose: "Servicio premium y conversión directa",
    },
  } satisfies Record<
    ContentOsStrategyProduct,
    { name: string; purpose: string }
  >,
  pillars: {
    pilot_life: "Vida de piloto",
    aviation_career: "Carrera aeronáutica",
    training: "Formación",
    schools_and_decisions: "Escuelas y decisiones",
    common_mistakes: "Errores comunes",
    professional_advice: "Consejos profesionales",
    aviation_english: "Inglés aeronáutico",
    atc_phraseology: "ATC y fraseología",
    personal_stories: "Historias personales",
    community: "Comunidad",
    product_sales: "Venta de productos",
  } satisfies Record<ContentOsStrategyPillar, string>,
} as const;
