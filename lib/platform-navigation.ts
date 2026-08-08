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

/**
 * Secciones principales del menú (agrupadas).
 * Orden: Career Planner → Guía → Escuelas → AeroComms → Mentorías → Recursos
 */
export const PLATFORM_NAV_SECTIONS: PlatformNavSection[] = [
  {
    id: "planner",
    label: "Career Planner",
    hubHref: "/career-planner",
    status: "available",
    items: [],
  },
  {
    id: "guia",
    label: "Guía Cómo ser piloto",
    hubHref: "/guia-como-ser-piloto",
    status: "available",
    items: [],
  },
  {
    id: "pre-ppl",
    label: "Pre-PPL",
    hubHref: "/pre-ppl",
    status: "available",
    items: [],
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
