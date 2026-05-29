import type { FreeReportData } from "@/lib/free-report-data";
import { SectionTitle } from "@/components/report-preview/report-preview-layouts";

type FreeReportPageOneProps = {
  data: FreeReportData;
};

function KpiCell({ label, value, serif }: { label: string; value: string; serif?: boolean }) {
  return (
    <div className="min-w-0 pr-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p
        className={
          serif
            ? "mt-1 font-serif text-2xl text-[#0f1a33]"
            : "mt-1 text-sm font-semibold text-[#0f1a33]"
        }
      >
        {value}
        {serif ? <span className="font-sans text-xs font-normal text-slate-400"> /100</span> : null}
      </p>
    </div>
  );
}

export function FreeReportPageOne({ data }: FreeReportPageOneProps) {
  return (
    <div>
      <SectionTitle>Resumen de situación</SectionTitle>

      <div className="mb-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:max-w-md">
        <KpiCell label="Ruta recomendada" value={data.routeRecommended} />
        <KpiCell label="Preparación" value={String(data.decisionScore)} serif />
        <KpiCell label="Riesgo principal" value={data.principalRiskLabel} />
        <KpiCell label="Decisión de pago" value={data.paymentDecision} />
      </div>

      <div className="border-l-4 border-[#c9a454] bg-[#f7f4ee] py-5 pl-5 pr-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8a6520]">
          Recomendación FlyPath
        </p>
        <p className="mt-3 max-w-lg font-serif text-[1.15rem] leading-snug text-[#0f1a33]">
          {data.recommendation}
        </p>
      </div>
    </div>
  );
}
