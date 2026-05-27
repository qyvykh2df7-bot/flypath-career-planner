/** Shared Tailwind class strings for ATPL Planner UI consistency */

/** Tipografía base del planner (legibilidad móvil + jerarquía). */
export const plannerType = {
  /** Eyebrow / label uppercase */
  eyebrow: "text-[11px] font-semibold uppercase tracking-wide text-slate-500",
  /** Metadata, hints, timestamps */
  meta: "text-[12px] leading-snug text-slate-500",
  /** Secondary body */
  bodySecondary: "text-[13px] leading-relaxed text-slate-600",
  /** Card / list titles */
  cardTitle: "text-[14px] font-semibold leading-snug text-[#0f1a33]",
  /** Page section title */
  sectionTitle: "text-[15px] font-semibold tracking-tight text-[#0f1a33] sm:text-[16px]",
  /** Badge / chip compact */
  badge:
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-none ring-1",
  /** Metric label under numbers */
  metricLabel: "text-[12px] font-medium leading-snug text-slate-500",
} as const;

export const plannerPageBg = "min-h-screen bg-[#f6f7f9] text-[#0f1a33]";

/** Título principal de pestaña (Calendario, Asignaturas, Evaluación, etc.). */
export const plannerPageTitle =
  "text-[19px] font-semibold tracking-tight text-[#0f1a33] sm:text-[21px]";

export const plannerBtnHero =
  "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-[#ddb75c] bg-[#c9a454] px-6 py-3.5 text-[16px] font-semibold tracking-tight text-[#0f1a33] shadow-[0_12px_36px_rgba(201,164,84,0.42)] transition-all duration-200 hover:bg-[#ddb75c] hover:shadow-[0_14px_40px_rgba(201,164,84,0.5)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1a33]";

export const plannerFormCard =
  "rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm ring-1 ring-slate-100/80 sm:p-4";

export const plannerFieldClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[14px] text-[#0f1a33] shadow-sm focus:border-[#c9a454]/50 focus:outline-none focus:ring-2 focus:ring-[#c9a454]/25";

export const plannerFieldLabel = "text-[13px] font-semibold text-slate-600";

export const plannerBtnPrimary =
  "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-5 py-2.5 text-[14px] font-semibold text-[#0f1a33] shadow-[0_6px_20px_rgba(201,164,84,0.28)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:w-auto w-full";

export const plannerBtnGhost =
  "rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/30";

export const plannerBtnDanger =
  "rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200";

export const plannerEmptyState =
  "rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-[14px] font-medium text-slate-600";

export const plannerPanelTitle = plannerPageTitle;

export const plannerPanelSubtitle = "mt-1 text-[14px] leading-relaxed text-slate-600";

export const plannerSectionHeading = "text-[15px] font-semibold text-[#0f1a33] sm:text-[16px]";

export const plannerMetricCard =
  "rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-sm ring-1 ring-slate-100/80";

export const plannerListCard =
  "rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm ring-1 ring-slate-100/80";
