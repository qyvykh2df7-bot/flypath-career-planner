"use client";

import { formatAdvertisedPriceLabel } from "@/lib/schoolMapper";
import type { SchoolEntry } from "@/types/schools";

type Props = {
  schoolA: SchoolEntry;
  schoolB: SchoolEntry;
};

const ROUTE_TYPE_LABEL: Record<SchoolEntry["routeType"], string> = {
  integrated: "Escuela integrada",
  modular: "Ruta modular",
  university_plus_license: "Universidad / Grado + licencia",
};

const EUR_FORMATTER = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/**
 * Mapeo único para todos los enums tipo `yes | no | partial | optional | unknown` y los
 * `included | not_included | not_applicable` que llegan desde el mapper. Cualquier valor
 * desconocido cae a "Pendiente de validar" para no inventar.
 */
function statusLabel(value: string | null | undefined): string {
  const v = (value ?? "").trim().toLowerCase();
  switch (v) {
    case "yes":
    case "included":
      return "Sí";
    case "no":
    case "not_included":
      return "No";
    case "partial":
      return "Parcial / confirmar";
    case "optional":
      return "Opcional";
    case "not_applicable":
      return "No aplica";
    case "unknown":
    case "":
      return "Pendiente de validar";
    default:
      return value ?? "Pendiente de validar";
  }
}

/** Texto libre vacío → "Pendiente de validar". */
function freeTextOrPending(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  if (!v) return "Pendiente de validar";
  return v;
}

function formatBrecha(advertised: number, real: number): string {
  if (!(advertised > 0) || !(real > 0)) return "Pendiente de validar";
  const diff = real - advertised;
  if (diff > 0) return `+${EUR_FORMATTER.format(diff)}`;
  return "Sin brecha estimada";
}

function durationLabel(months: number): string {
  if (!months || months <= 0) return "Pendiente de validar";
  return months === 1 ? "1 mes" : `${months} meses`;
}

type Row = {
  label: string;
  a: string;
  b: string;
  /** Si es true, los valores se renderizan en tono dorado (números económicos). */
  emphasis?: boolean;
};

type Section = {
  title: string;
  rows: Row[];
};

function buildSections(a: SchoolEntry, b: SchoolEntry): Section[] {
  const advA = a.advertisedPriceEUR;
  const realA = a.flypathEstimatedRealCostEUR;
  const advB = b.advertisedPriceEUR;
  const realB = b.flypathEstimatedRealCostEUR;

  return [
    {
      title: "Identificación",
      rows: [
        { label: "Nombre", a: a.name, b: b.name },
        {
          label: "Ciudad",
          a: a.city || "Pendiente de validar",
          b: b.city || "Pendiente de validar",
        },
        {
          label: "Base",
          a: a.baseAirport || "Pendiente de validar",
          b: b.baseAirport || "Pendiente de validar",
        },
        {
          label: "Tipo de ruta",
          a: ROUTE_TYPE_LABEL[a.routeType],
          b: ROUTE_TYPE_LABEL[b.routeType],
        },
      ],
    },
    {
      title: "Coste",
      rows: [
        {
          label: "Precio publicado",
          a: formatAdvertisedPriceLabel(advA),
          b: formatAdvertisedPriceLabel(advB),
          emphasis: true,
        },
        {
          label: "Coste estimado FlyPath",
          a: formatAdvertisedPriceLabel(realA),
          b: formatAdvertisedPriceLabel(realB),
          emphasis: true,
        },
        {
          label: "Brecha FlyPath",
          a: formatBrecha(advA, realA),
          b: formatBrecha(advB, realB),
          emphasis: true,
        },
      ],
    },
    {
      title: "Programa",
      rows: [
        {
          label: "Duración",
          a: durationLabel(a.programDurationMonths),
          b: durationLabel(b.programDurationMonths),
        },
        {
          label: "Idioma",
          a: freeTextOrPending(a.languageOfInstruction),
          b: freeTextOrPending(b.languageOfInstruction),
        },
        {
          label: "Requisito Class 1",
          a: freeTextOrPending(a.class1Requirement),
          b: freeTextOrPending(b.class1Requirement),
        },
      ],
    },
    {
      title: "Contrato y pagos",
      rows: [
        {
          label: "Contrato antes de pagar",
          a: statusLabel(a.contractAvailableBeforePayment),
          b: statusLabel(b.contractAvailableBeforePayment),
        },
        {
          label: "Calendario de pagos",
          a: freeTextOrPending(a.paymentScheduleSummary),
          b: freeTextOrPending(b.paymentScheduleSummary),
        },
        {
          label: "Política de reembolso",
          a: freeTextOrPending(a.refundPolicySummary),
          b: freeTextOrPending(b.refundPolicySummary),
        },
        {
          label: "Financiación",
          a: statusLabel(a.financingAvailable),
          b: statusLabel(b.financingAvailable),
        },
      ],
    },
    {
      title: "Extras incluidos",
      rows: [
        {
          label: "Tasas de examen",
          a: statusLabel(a.examFeesIncluded),
          b: statusLabel(b.examFeesIncluded),
        },
        {
          label: "Skill tests",
          a: statusLabel(a.skillTestsIncluded),
          b: statusLabel(b.skillTestsIncluded),
        },
        {
          label: "Materiales",
          a: statusLabel(a.trainingMaterialsIncluded),
          b: statusLabel(b.trainingMaterialsIncluded),
        },
        {
          label: "Alojamiento",
          a: statusLabel(a.accommodationIncluded),
          b: statusLabel(b.accommodationIncluded),
        },
      ],
    },
    {
      title: "Señales FlyPath",
      rows: [
        {
          label: "Red flags",
          a: String(a.redFlags.length),
          b: String(b.redFlags.length),
        },
        {
          label: "Datos pendientes",
          a: String(a.pendingData.length),
          b: String(b.pendingData.length),
        },
        {
          label: "Preguntas clave",
          a: String(a.keyQuestions.length),
          b: String(b.keyQuestions.length),
        },
      ],
    },
  ];
}

export function SupabaseComparisonPanel({ schoolA, schoolB }: Props) {
  const sections = buildSections(schoolA, schoolB);

  return (
    <section className="mt-6 rounded-3xl border border-[#c9a454]/55 bg-gradient-to-br from-[#0a1228] via-[#0f1a33] to-[#152545] p-5 text-white shadow-[0_18px_50px_-18px_rgba(15,26,51,0.55)] ring-1 ring-[#c9a454]/15 sm:p-6">
      <div className="border-b border-white/10 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f2ddaa]">
          Comparación temporal · Supabase
        </p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight text-white sm:text-[1.6rem]">
          Comparación FlyPath
        </h2>
        <p className="mt-1.5 text-base leading-relaxed text-slate-300">
          Vista MVP basada en <code className="text-[#f2ddaa]">SchoolEntry</code> mapeado desde
          Supabase. La conclusión y el análisis premium siguen viviendo en el comparador real
          (<code>/schools</code>) sin cambios.
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
        <header className="grid grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 border-b border-white/10 bg-white/[0.06] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f2ddaa]">
          <span className="text-slate-300">Campo</span>
          <span className="truncate" title={schoolA.name}>
            {schoolA.name}
          </span>
          <span className="truncate" title={schoolB.name}>
            {schoolB.name}
          </span>
        </header>

        <dl>
          {sections.map((section) => (
            <div key={section.title} className="border-b border-white/5 last:border-b-0">
              <p className="px-4 pt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c9a454]">
                {section.title}
              </p>
              {section.rows.map((row) => (
                <div
                  key={`${section.title}-${row.label}`}
                  className="grid grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)] items-baseline gap-2 px-4 py-2 text-[13px]"
                >
                  <dt className="text-slate-400">{row.label}</dt>
                  <dd
                    className={`break-words ${
                      row.emphasis ? "font-semibold text-[#f2ddaa]" : "text-white"
                    }`}
                  >
                    {row.a}
                  </dd>
                  <dd
                    className={`break-words ${
                      row.emphasis ? "font-semibold text-[#f2ddaa]" : "text-white"
                    }`}
                  >
                    {row.b}
                  </dd>
                </div>
              ))}
            </div>
          ))}
        </dl>
      </div>

      <p className="mt-4 text-[12px] text-slate-400">
        Pendiente: análisis cualitativo, lectura FlyPath, badges premium y CTA Career Planner.
        Llegarán en próximas iteraciones de la integración Supabase.
      </p>
    </section>
  );
}
