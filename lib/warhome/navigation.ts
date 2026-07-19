export type WarhomeNavigationIcon =
  | "summary"
  | "leads"
  | "users"
  | "emails"
  | "reviews"
  | "notes"
  | "settings"
  | "analytics"
  | "products"
  | "content"
  | "campaigns"
  | "agents"
  | "tasks";

export type WarhomeNavigationItem = {
  id: WarhomeNavigationIcon;
  label: string;
  href: string | null;
  availability: "available" | "coming_soon" | "future";
  group: "mvp" | "future";
  icon: WarhomeNavigationIcon;
};

export const WARHOME_NAVIGATION: readonly WarhomeNavigationItem[] = [
  {
    id: "summary",
    label: "Resumen",
    href: "/warhome",
    availability: "available",
    group: "mvp",
    icon: "summary",
  },
  {
    id: "leads",
    label: "Leads",
    href: "/warhome/leads",
    availability: "available",
    group: "mvp",
    icon: "leads",
  },
  {
    id: "users",
    label: "Usuarios",
    href: "/warhome/users",
    availability: "available",
    group: "mvp",
    icon: "users",
  },
  {
    id: "emails",
    label: "Emails",
    href: "/warhome/emails",
    availability: "available",
    group: "mvp",
    icon: "emails",
  },
  {
    id: "reviews",
    label: "Opiniones",
    href: "/warhome/reviews",
    availability: "available",
    group: "mvp",
    icon: "reviews",
  },
  {
    id: "notes",
    label: "Notas",
    href: null,
    availability: "coming_soon",
    group: "mvp",
    icon: "notes",
  },
  {
    id: "settings",
    label: "Ajustes",
    href: null,
    availability: "coming_soon",
    group: "mvp",
    icon: "settings",
  },
  {
    id: "analytics",
    label: "Analytics",
    href: null,
    availability: "future",
    group: "future",
    icon: "analytics",
  },
  {
    id: "products",
    label: "Productos",
    href: null,
    availability: "future",
    group: "future",
    icon: "products",
  },
  {
    id: "content",
    label: "Contenido",
    href: null,
    availability: "future",
    group: "future",
    icon: "content",
  },
  {
    id: "campaigns",
    label: "Campañas",
    href: null,
    availability: "future",
    group: "future",
    icon: "campaigns",
  },
  {
    id: "agents",
    label: "Agentes",
    href: null,
    availability: "future",
    group: "future",
    icon: "agents",
  },
  {
    id: "tasks",
    label: "Tareas",
    href: null,
    availability: "future",
    group: "future",
    icon: "tasks",
  },
] as const;

export type WarhomePageDetails = {
  title: string;
  subtitle: string;
};

const WARHOME_PAGE_DETAILS: Record<string, WarhomePageDetails> = {
  "/warhome": {
    title: "Resumen",
    subtitle: "Centro de operación interno de FlyPath.",
  },
  "/warhome/leads": {
    title: "Leads",
    subtitle: "Captación, seguimiento y contexto comercial.",
  },
  "/warhome/users": {
    title: "Usuarios",
    subtitle: "Cuentas FlyPath y actividad de AeroComms.",
  },
  "/warhome/emails": {
    title: "Emails",
    subtitle: "Envíos operativos y estado de entrega.",
  },
  "/warhome/reviews": {
    title: "Opiniones",
    subtitle: "Moderación privada de opiniones verificadas de escuelas.",
  },
};

export function getActiveWarhomeNavigationId(pathname: string): WarhomeNavigationIcon | null {
  const activeItem = WARHOME_NAVIGATION.find((item) => {
    if (!item.href) return false;
    if (item.href === "/warhome") return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  });

  return activeItem?.id ?? null;
}

export function getWarhomePageDetails(pathname: string): WarhomePageDetails {
  if (WARHOME_PAGE_DETAILS[pathname]) return WARHOME_PAGE_DETAILS[pathname];

  const parentPath = Object.keys(WARHOME_PAGE_DETAILS).find(
    (path) => path !== "/warhome" && pathname.startsWith(`${path}/`),
  );

  return parentPath ? WARHOME_PAGE_DETAILS[parentPath] : WARHOME_PAGE_DETAILS["/warhome"];
}
