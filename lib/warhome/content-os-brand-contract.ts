import {
  CONTENT_OS_OBJECTIVES,
  type ContentOsObjective,
} from "@/lib/warhome/content-os-contract";

export const CONTENT_OS_BRAND_PRODUCTS = [
  "guide",
  "career_planner",
  "aerocomms",
  "mentorships",
] as const;

export const CONTENT_OS_BRAND_LIMITS = {
  name: 120,
  description: 2_000,
  listItem: 200,
  listItems: 30,
  productDescription: 1_000,
  toneField: 2_000,
} as const;

export type ContentOsBrandProduct =
  (typeof CONTENT_OS_BRAND_PRODUCTS)[number];

export type ContentOsBrandProducts = Record<ContentOsBrandProduct, string>;

export type ContentOsBrandProfile = {
  workspaceKey: "pilotfeliu";
  brandName: string;
  brandDescription: string;
  audiences: string[];
  products: ContentOsBrandProducts;
  contentPillars: string[];
  objectives: ContentOsObjective[];
  toneStyle: string;
  tonePersonality: string;
  toneCommunication: string;
  toneAvoid: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ContentOsBrandProfileInput = Omit<
  ContentOsBrandProfile,
  "workspaceKey" | "createdAt" | "updatedAt"
>;

export const DEFAULT_CONTENT_OS_BRAND_PROFILE: ContentOsBrandProfile = {
  workspaceKey: "pilotfeliu",
  brandName: "PilotFeliu",
  brandDescription:
    "Piloto comercial que crea contenido sobre aviación, carrera profesional y ayuda a futuros pilotos.",
  audiences: [
    "Futuros pilotos",
    "Estudiantes",
    "Pilotos jóvenes",
    "Personas interesadas en la carrera aeronáutica",
  ],
  products: {
    guide: "Cómo ser Piloto y recursos educativos",
    career_planner: "Planificación de carrera",
    aerocomms: "Inglés aeronáutico y fraseología",
    mentorships: "Asesoramiento personalizado",
  },
  contentPillars: [
    "Vida de piloto",
    "Formación",
    "Escuelas",
    "Carrera aeronáutica",
    "Entrevistas",
    "Errores comunes",
    "Inglés aeronáutico",
    "ATC y fraseología",
    "Historias personales",
    "Productos",
  ],
  objectives: ["growth", "authority", "community", "conversion"],
  toneStyle: "Claro, directo y útil.",
  tonePersonality: "Cercano, ambicioso, resiliente y profesional.",
  toneCommunication:
    "Hablar desde la experiencia, explicar con sencillez y mantener una voz humana.",
  toneAvoid:
    "Política, familia, patrimonio personal, conflictos con la compañía e información profesional sensible.",
  createdAt: null,
  updatedAt: null,
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function bounded(value: string, max: number): string | null {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  return normalized && normalized.length <= max ? normalized : null;
}

function lines(value: string): string[] | null {
  const entries = value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (
    !entries.length ||
    entries.length > CONTENT_OS_BRAND_LIMITS.listItems ||
    entries.some(
      (entry) => entry.length > CONTENT_OS_BRAND_LIMITS.listItem,
    )
  ) {
    return null;
  }
  return [...new Set(entries)];
}

export function parseContentOsBrandProfileForm(
  formData: FormData,
): ContentOsBrandProfileInput | null {
  const brandName = bounded(
    formString(formData, "brandName"),
    CONTENT_OS_BRAND_LIMITS.name,
  );
  const brandDescription = bounded(
    formString(formData, "brandDescription"),
    CONTENT_OS_BRAND_LIMITS.description,
  );
  const audiences = lines(formString(formData, "audiences"));
  const contentPillars = lines(formString(formData, "contentPillars"));
  const objectives = CONTENT_OS_OBJECTIVES.filter(
    (objective) => formData.getAll("objectives").includes(objective),
  );
  const products = Object.fromEntries(
    CONTENT_OS_BRAND_PRODUCTS.map((product) => [
      product,
      bounded(
        formString(formData, `product_${product}`),
        CONTENT_OS_BRAND_LIMITS.productDescription,
      ),
    ]),
  ) as Record<ContentOsBrandProduct, string | null>;
  const toneStyle = bounded(
    formString(formData, "toneStyle"),
    CONTENT_OS_BRAND_LIMITS.toneField,
  );
  const tonePersonality = bounded(
    formString(formData, "tonePersonality"),
    CONTENT_OS_BRAND_LIMITS.toneField,
  );
  const toneCommunication = bounded(
    formString(formData, "toneCommunication"),
    CONTENT_OS_BRAND_LIMITS.toneField,
  );
  const toneAvoid = bounded(
    formString(formData, "toneAvoid"),
    CONTENT_OS_BRAND_LIMITS.toneField,
  );

  if (
    !brandName ||
    !brandDescription ||
    !audiences ||
    !contentPillars ||
    objectives.length < 1 ||
    Object.values(products).some((value) => value === null) ||
    !toneStyle ||
    !tonePersonality ||
    !toneCommunication ||
    !toneAvoid
  ) {
    return null;
  }

  return {
    brandName,
    brandDescription,
    audiences,
    products: products as ContentOsBrandProducts,
    contentPillars,
    objectives,
    toneStyle,
    tonePersonality,
    toneCommunication,
    toneAvoid,
  };
}
