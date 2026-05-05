import { getPriceGap, summarizeComparison } from "@/lib/schools/utils";
import type { SchoolEntry } from "@/types/schools";

type Props = {
  schools: SchoolEntry[];
};

function flag(value: string) {
  return value === "yes" ? "Sí" : value === "no" ? "No" : value === "partial" ? "Parcial" : value === "optional" ? "Opcional" : "No claro";
}

function euro(value: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

export function ComparisonResults({ schools }: Props) {
  const summary = summarizeComparison(schools);
  if (!summary) return null;

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[#0f1a33]">Comparativa visual</h2>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Más claridad de coste: <span className="font-semibold text-[#0f1a33]">{summary.bestCostClarity.name}</span></div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Menor brecha estimada: <span className="font-semibold text-[#0f1a33]">{summary.lowestGap.name}</span></div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Mayor transparencia documental: <span className="font-semibold text-[#0f1a33]">{summary.bestTransparency.name}</span></div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Más datos pendientes: <span className="font-semibold text-[#0f1a33]">{summary.mostPending.name}</span></div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {schools.map((school) => (
          <article key={school.id} className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4">
            <p className="text-sm font-semibold text-[#0f1a33]">{school.name}</p>
            <div className="mt-2 space-y-1 text-xs text-slate-700">
              <p>Coste anunciado: <span className="font-semibold">{euro(school.advertisedPriceEUR)}</span></p>
              <p>Coste real estimado: <span className="font-semibold">{euro(school.flypathEstimatedRealCostEUR)}</span></p>
              <p>Brecha estimada: <span className="font-semibold">{euro(getPriceGap(school))}</span></p>
              <p>Contrato antes de pagar: <span className="font-semibold">{flag(school.contractAvailableBeforePayment)}</span></p>
              <p>Reembolso: <span className="font-semibold">{school.refundPolicySummary}</span></p>
              <p>Pagos: <span className="font-semibold">{school.paymentScheduleSummary}</span></p>
              <p>MCC/JOC: <span className="font-semibold">{flag(school.mccJocIncluded)}</span></p>
              <p>Advanced UPRT: <span className="font-semibold">{flag(school.advancedUprtIncluded)}</span></p>
              <p>Tasas: <span className="font-semibold">{flag(school.examFeesIncluded)}</span></p>
              <p>Skill tests: <span className="font-semibold">{flag(school.skillTestsIncluded)}</span></p>
              <p>Flota/disponibilidad: <span className="font-semibold">{school.fleetSummary} · {school.aircraftAvailability}</span></p>
              <p>Confianza del dato: <span className="font-semibold">{school.dataConfidence} ({school.scores.dataConfidenceScore}/100)</span></p>
            </div>

            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-900">Red flags</p>
              <ul className="mt-1 space-y-1 text-xs text-amber-900">
                {(school.redFlags.length ? school.redFlags : ["Sin alertas críticas detectadas en esta versión."]).map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
            <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">Preguntas clave</p>
              <ul className="mt-1 space-y-1 text-xs text-slate-700">
                {school.keyQuestions.slice(0, 3).map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

