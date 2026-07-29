import type {
  ContentOsCategory,
  ContentOsEventType,
  ContentOsIdeaStatus,
  ContentOsItemStatus,
  ContentOsObjective,
  ContentOsPlatform,
} from "@/lib/warhome/content-os-contract";

export const CONTENT_OS_PLATFORM_LABELS: Record<ContentOsPlatform, string> = {
  tiktok_pilotfeliu: "TikTok PilotFeliu",
  instagram_pilotfeliu: "Instagram PilotFeliu",
  instagram_flypath: "Instagram FlyPath",
  youtube: "YouTube",
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
