/**
 * Fuente única de navegación modular de FlyPath Platform.
 * Preparado para agrupar herramientas actuales y futuras (p. ej. IA).
 */

export type PlatformModuleStatus = "available" | "soon";

export type PlatformNavItem = {
  id: string;
  label: string;
  href: string;
  status: PlatformModuleStatus;
  /** Texto del badge en menú (p. ej. "Vista previa" en dashboard). */
  menuBadge?: string;
};

export type PlatformNavSection = {
  id: string;
  label: string;
  /** Ruta del hub de la sección (si existe). */
  hubHref?: string;
  status: PlatformModuleStatus;
  /** Sub-herramientas dentro de la sección. Vacío = sección con enlace directo vía hubHref. */
  items: PlatformNavItem[];
};

/** Sección superior: Inicio (fuera de grupos modulares). */
export const PLATFORM_HOME: PlatformNavItem = {
  id: "inicio",
  label: "Inicio",
  href: "/",
  status: "available",
};

/** Zona personal del usuario (sin auth por ahora). */
export const PLATFORM_DASHBOARD: PlatformNavItem = {
  id: "dashboard",
  label: "Mi dashboard",
  href: "/dashboard",
  status: "available",
  menuBadge: "Vista previa",
};

/**
 * Secciones principales del menú (agrupadas).
 * Orden: Planifica → Escuelas → AeroComms → Mentorías → Recursos
 */
export const PLATFORM_NAV_SECTIONS: PlatformNavSection[] = [
  {
    id: "planifica",
    label: "Planifica tu ruta",
    hubHref: "/planifica-tu-ruta",
    status: "available",
    items: [
      { id: "planner", label: "Career Planner", href: "/career-planner", status: "available" },
      {
        id: "guia",
        label: "Guía Cómo ser piloto",
        href: "/guia-como-ser-piloto",
        status: "available",
      },
    ],
  },
  {
    id: "escuelas",
    label: "Escuelas",
    hubHref: "/escuelas",
    status: "available",
    items: [
      { id: "schools", label: "Comparador de escuelas", href: "/schools", status: "available" },
      {
        id: "opiniones",
        label: "Opiniones de escuelas",
        href: "/opiniones-escuelas",
        status: "available",
      },
    ],
  },
  {
    id: "aerocomms",
    label: "AeroComms",
    hubHref: "/aerocomms",
    status: "available",
    items: [],
  },
  {
    id: "mentorias",
    label: "Mentorías",
    hubHref: "/mentorias",
    status: "available",
    items: [],
  },
  {
    id: "recursos",
    label: "Recursos",
    hubHref: "/recursos",
    status: "available",
    items: [
      { id: "shop", label: "Shop", href: "/shop", status: "available" },
      { id: "blog", label: "Blog", href: "/blog", status: "available" },
    ],
  },
];

/** Marca ítem o sección activa según el id que pasa cada página. */
export function isPlatformNavCurrent(currentModuleId: string, targetId: string): boolean {
  return currentModuleId === targetId;
}

export function getPlatformSectionById(sectionId: string): PlatformNavSection | undefined {
  return PLATFORM_NAV_SECTIONS.find((s) => s.id === sectionId);
}

/** Lista plana legacy (p. ej. transición en landing). Preferir menú agrupado. */
export function getLegacyFlatPlatformModules(): PlatformNavItem[] {
  const flat: PlatformNavItem[] = [PLATFORM_HOME];
  for (const section of PLATFORM_NAV_SECTIONS) {
    if (section.items.length === 0 && section.hubHref) {
      flat.push({
        id: section.id,
        label: section.label,
        href: section.hubHref,
        status: section.status,
      });
    } else {
      if (section.hubHref) {
        flat.push({
          id: `${section.id}-hub`,
          label: section.label,
          href: section.hubHref,
          status: section.status,
        });
      }
      flat.push(...section.items);
    }
  }
  return flat;
}
