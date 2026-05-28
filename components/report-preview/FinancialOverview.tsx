import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";
import { SectionTitle } from "./report-preview-layouts";
import { FlyPathInsight } from "./FlyPathInsight";
import { financialInsightMessage, formatEuro } from "./report-preview-utils";

type FinancialOverviewProps = {
  snapshot: ReportSnapshotV1;
};

export function FinancialOverview({ snapshot }: FinancialOverviewProps) {
  const { summary } = snapshot.costs;

  return (
    <div>
      <SectionTitle>Panorama de inversión</SectionTitle>

      <p className="font-serif text-4xl tabular-nums leading-none text-[#0f1a33] sm:text-[2.75rem]">
        {formatEuro(summary.totalRealista)}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        Escenario realista
      </p>

      <div className="mt-7 border-l-4 border-[#0f1a33] py-1 pl-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Brecha financiera
        </p>
        <p className="mt-1 font-serif text-3xl tabular-nums text-[#0f1a33]">
          {formatEuro(summary.brechaFinanciacion)}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Cobertura {summary.coveragePct}%
          {summary.mesesCerrarBrecha > 0 ? ` · ~${summary.mesesCerrarBrecha} meses` : ""}
        </p>
      </div>

      <div className="mt-7 grid grid-cols-3 gap-3 border-y border-[#0f1a33]/10 py-5">
        {[
          { label: "Optimista", value: summary.totalOptimista },
          { label: "Conservador", value: summary.totalConservador },
          { label: "Margen seguridad", value: summary.buffer },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{s.label}</p>
            <p className="mt-1 text-sm font-medium tabular-nums text-[#0f1a33]">
              {formatEuro(s.value)}
            </p>
          </div>
        ))}
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <dt className="text-[10px] uppercase text-slate-500">Formación</dt>
          <dd className="tabular-nums font-medium">{formatEuro(summary.subtotalFormacion)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-slate-500">Extras</dt>
          <dd className="tabular-nums font-medium">{formatEuro(summary.subtotalExtras)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-slate-500">Vida</dt>
          <dd className="tabular-nums font-medium">{formatEuro(summary.subtotalVida)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-slate-500">Riesgo</dt>
          <dd className="font-medium">{summary.riesgoFinanciero}</dd>
        </div>
      </dl>

      <FlyPathInsight className="mt-8 border-[#c9a454] bg-[#c9a454]/[0.06] py-4 pl-5 pr-2">
        {financialInsightMessage(summary.brechaFinanciacion, summary.coveragePct)}
      </FlyPathInsight>
    </div>
  );
}
