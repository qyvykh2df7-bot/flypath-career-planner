import type {
  ContentOsCategory,
  ContentOsEventType,
  ContentOsIdeaStatus,
  ContentOsItemStatus,
  ContentOsObjective,
  ContentOsPlatform,
} from "@/lib/warhome/content-os-contract";
import type {
  ContentOsAvailabilityType,
  ContentOsPlanningProposalStatus,
} from "@/lib/warhome/content-os-planning-contract";
import type {
  ContentOsStrategyFormat,
  ContentOsStrategyPillar,
  ContentOsStrategyPriority,
  ContentOsStrategyProduct,
} from "@/lib/warhome/content-os-strategy-contract";

export const CONTENT_OS_PLATFORM_LABELS: Record<ContentOsPlatform, string> = {
  tiktok_pilotfeliu: "TikTok PilotFeliu",
  instagram_pilotfeliu: "Instagram PilotFeliu",
  instagram_flypath: "Instagram FlyPath",
  youtube: "YouTube",
};

export const CONTENT_OS_LIBRARY_PLATFORM_LABELS: Record<
  ContentOsPlatform | "other",
  string
> = {
  ...CONTENT_OS_PLATFORM_LABELS,
  other: "Otra",
};

export const CONTENT_OS_OBJECTIVE_LABELS: Record<ContentOsObjective, string> = {
  growth: "Crecimiento",
  community: "Comunidad",
  authority: "Autoridad",
  conversion: "Conversión",
};

export const CONTENT_OS_CATEGORY_LABELS: Record<ContentOsCategory, string> = {
  aviation: "Aviación",
  personal_brand: "Marca personal",
  lifestyle: "Lifestyle",
  sport: "Deporte",
};

export const CONTENT_OS_IDEA_STATUS_LABELS: Record<ContentOsIdeaStatus, string> = {
  new: "Nueva",
  approved: "Aprobada",
  production: "Producción",
  published: "Publicada",
  discarded: "Descartada",
};

export const CONTENT_OS_ITEM_STATUS_LABELS: Record<ContentOsItemStatus, string> = {
  draft: "Borrador",
  review: "En revisión",
  production: "En producción",
  scheduled: "Programado",
  published: "Publicado",
  archived: "Archivado",
};

export const CONTENT_OS_EVENT_TYPE_LABELS: Record<ContentOsEventType, string> = {
  record: "Grabar",
  edit: "Editar",
  publish: "Publicar",
};

export const CONTENT_OS_AVAILABILITY_TYPE_LABELS: Record<
  ContentOsAvailabilityType,
  string
> = {
  work: "Trabajo",
  rest: "Descanso / día libre",
  travel: "Viaje",
  recording_available: "Disponible para grabación",
};

export const CONTENT_OS_PLANNING_STATUS_LABELS: Record<
  ContentOsPlanningProposalStatus,
  string
> = {
  proposed: "Pendiente de revisión",
  approved: "Aprobada",
  rejected: "Rechazada",
};

export const CONTENT_OS_STRATEGY_PILLAR_LABELS: Record<
  ContentOsStrategyPillar,
  string
> = {
  pilot_life: "Vida de piloto",
  aviation_career: "Carrera aeronáutica",
  training: "Formación",
  schools_and_decisions: "Escuelas y decisiones",
  common_mistakes: "Errores comunes",
  professional_advice: "Consejos profesionales",
  aviation_english: "Inglés aeronáutico",
  atc_phraseology: "ATC / fraseología",
  personal_stories: "Historias personales",
  community: "Comunidad",
  product_sales: "Venta de productos",
};

export const CONTENT_OS_STRATEGY_FORMAT_LABELS: Record<
  ContentOsStrategyFormat,
  string
> = {
  talking_head: "Talking head",
  story: "Historia",
  tutorial: "Tutorial",
  list: "Lista",
  opinion: "Opinión",
  comparison: "Comparación",
};

export const CONTENT_OS_STRATEGY_PRODUCT_LABELS: Record<
  ContentOsStrategyProduct,
  string
> = {
  guide: "Guía Cómo ser Piloto",
  career_planner: "Career Planner",
  aerocomms: "AeroComms",
  mentorships: "Mentorías",
};

export const CONTENT_OS_STRATEGY_PRIORITY_LABELS: Record<
  ContentOsStrategyPriority,
  string
> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};
