import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";
import { FlyPathInsight } from "./FlyPathInsight";
import { financialInsightMessage, formatEuro } from "./report-preview-utils";

type FinancialOverviewProps = {
  snapshot: ReportSnapshotV1;
};

export function FinancialOverview({ snapshot }: FinancialOverviewProps) {
  const { summary } = snapshot.costs;
  const scenarios: Array<{
    label: string;
    value: number;
    tone: string;
    highlight?: boolean;
  }> = [
    { label: "Optimista", value: summary.totalOptimista, tone: "text-emerald-800" },
    { label: "Realista", value: summary.totalRealista, tone: "text-[#0f1a33]", highlight: true },
    { label: "Conservador", value: summary.totalConservador, tone: "text-rose-900" },
  ];

  const maxScenario = Math.max(
    summary.totalOptimista,
    summary.totalRealista,
    summary.totalConservador,
    1,
  );

  return (
    <div>
      <h2 className="font-serif text-3xl font-medium tracking-tight text-[#0f1a33] sm:text-[2rem]">
        Panorama financiero
      </h2>
      <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600">
        Tres escenarios de inversión total. El escenario realista incluye margen de seguridad (
        {formatEuro(summary.buffer)}).
      </p>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-9">
          {scenarios.map((scenario) => {
            const widthPct = Math.round((scenario.value / maxScenario) * 100);
            return (
              <div key={scenario.label}>
                <div className="mb-2.5 flex items-baseline justify-between gap-4">
                  <span
                    className={`text-sm font-medium ${scenario.highlight ? "text-[#c9a454]" : "text-slate-600"}`}
                  >
                    {scenario.label}
                  </span>
                  <span className={`shrink-0 tabular-nums text-lg font-medium ${scenario.tone}`}>
                    {formatEuro(scenario.value)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden bg-[#0f1a33]/6">
                  <div
                    className={`h-full ${scenario.highlight ? "bg-gradient-to-r from-[#0f1a33] to-[#c9a454]" : "bg-slate-300/80"}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-8 border-t border-[#0f1a33]/10 pt-10 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <div className="bg-[#0f1a33] px-6 py-7 text-[#faf8f4]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a454]">
              Brecha financiera
            </p>
            <p className="mt-2 font-serif text-3xl tabular-nums">{formatEuro(summary.brechaFinanciacion)}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Cobertura {summary.coveragePct}%
              {summary.mesesCerrarBrecha > 0
                ? ` · ~${summary.mesesCerrarBrecha} meses al ritmo de ahorro declarado`
                : ""}
            </p>
          </div>
          <div className="border-t border-[#0f1a33]/10 pt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Riesgo financiero
            </p>
            <p className="mt-2 text-xl font-medium text-[#0f1a33]">{summary.riesgoFinanciero}</p>
          </div>
        </div>
      </div>

      <FlyPathInsight className="mt-12">
        {financialInsightMessage(summary.brechaFinanciacion, summary.coveragePct)}
      </FlyPathInsight>

      <dl className="mt-12 grid gap-8 border-t border-[#0f1a33]/10 pt-10 sm:grid-cols-3">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Formación
          </dt>
          <dd className="mt-2 tabular-nums text-lg text-[#0f1a33]">
            {formatEuro(summary.subtotalFormacion)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Extras
          </dt>
          <dd className="mt-2 tabular-nums text-lg text-[#0f1a33]">
            {formatEuro(summary.subtotalExtras)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Coste de vida
          </dt>
          <dd className="mt-2 tabular-nums text-lg text-[#0f1a33]">
            {formatEuro(summary.subtotalVida)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
