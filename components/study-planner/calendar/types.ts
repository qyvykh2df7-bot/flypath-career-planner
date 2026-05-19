export type CalendarViewMode = "day" | "week" | "month";

/** Vista por defecto al abrir el calendario. */
export const DEFAULT_CALENDAR_VIEW: CalendarViewMode = "week";

export const CALENDAR_VIEW_STORAGE_KEY = "atpl-planner-calendar-view";

/** Atributos data-* para futuro drag & drop de sesiones planificadas. */
export const CALENDAR_SESSION_ATTR = "data-planned-session-id";
export const CALENDAR_DAY_ATTR = "data-calendar-day";
