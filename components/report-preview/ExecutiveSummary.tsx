import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";
import {
  disponibilidadLabel,
  formatEuro,
  highestRiskLabel,
  paymentDecisionHeadline,
} from "./report-preview-utils";

type ExecutiveSummaryProps = {
  snapshot: ReportSnapshotV1;
};

export function ExecutiveSummary({ snapshot }: ExecutiveSummaryProps) {
  const { profile, readiness, routeRecommendation, costs, risks, flypathNextStep } = snapshot;

  const metrics = [
    {
      label: "Preparación para decidir",
      value: `${readiness.score}/100`,
      detail: readiness.explanation,
    },
    {
      label: "Ruta recomendada",
      value: routeRecommendation.recommended,
      detail: routeRecommendation.reason,
    },
    {
      label: "Riesgo principal",
      value: risks.highestLevel,
      detail: highestRiskLabel(risks.highestLevel),
    },
    {
      label: "Inversión (escenario realista)",
      value: formatEuro(costs.summary.totalRealista),
      detail: `Cobertura ${costs.summary.coveragePct}% · Brecha ${formatEuro(costs.summary.brechaFinanciacion)}`,
    },
    {
      label: "Horizonte de formación",
      value: disponibilidadLabel(profile.disponibilidad),
      detail: `${profile.horasSemana} h/semana · ${profile.necesitaTrabajar === "si" ? "Compatible con trabajo" : "Sin restricción laboral"}`,
    },
    {
      label: "Siguiente paso recomendado",
      value: flypathNextStep.primary.title,
      detail: flypathNextStep.primary.body,
      featured: true,
    },
  ];

  return (
    <div>
      <h2 className="font-serif text-3xl font-medium tracking-tight text-[#0f1a33] sm:text-[2rem]">
        Resumen ejecutivo
      </h2>
      <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600">{readiness.explanation}</p>

      <div className="mt-12 bg-[#0f1a33] px-8 py-9 text-[#faf8f4] sm:px-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#c9a454]">
          Decisión de pago
        </p>
        <p className="mt-4 font-serif text-3xl leading-tight sm:text-[2rem]">
          {paymentDecisionHeadline(readiness.decision)}
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75">{readiness.decision}</p>
        {readiness.showNoPaguesBadge ? (
          <p className="mt-4 inline-flex border border-[#c9a454]/35 px-3 py-1 text-xs text-[#f2ddaa]">
            No comprometer pagos en este escenario
          </p>
        ) : null}
      </div>

      <div className="mt-10 grid gap-0 sm:grid-cols-2">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className={`border-t border-[#0f1a33]/10 py-7 pr-0 sm:py-8 ${
              index % 2 === 0 ? "sm:border-r sm:border-[#0f1a33]/10 sm:pr-8" : "sm:pl-8"
            } ${"featured" in metric && metric.featured ? "bg-[#0f1a33]/[0.03] sm:col-span-2 sm:border-r-0 sm:pl-0" : ""}`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a454]">
              {metric.label}
            </p>
            <p
              className={`mt-3 font-serif leading-snug text-[#0f1a33] ${
                "featured" in metric && metric.featured ? "text-2xl" : "text-xl"
              }`}
            >
              {metric.value}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{metric.detail}</p>
          </div>
        ))}
      </div>

      {readiness.bloqueosCriticos.length > 0 ? (
        <div className="mt-12 border-t border-[#0f1a33]/10 pt-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Bloqueos críticos
          </p>
          <ul className="mt-4 space-y-2 text-sm text-[#0f1a33]">
            {readiness.bloqueosCriticos.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-[#c9a454]" aria-hidden>
                  —
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
