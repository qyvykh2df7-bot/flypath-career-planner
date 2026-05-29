import type { ParentsReportMock } from "./parents-report-mock";
import { SectionTitle } from "@/components/report-preview/report-preview-layouts";

type ParentsReportPageOneProps = {
  data: ParentsReportMock;
};

function StatCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="min-w-0 border-b border-[#e7e2d8] pb-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p
        className={
          highlight
            ? "mt-1 font-serif text-2xl text-[#8a6520]"
            : "mt-1 text-sm font-semibold leading-snug text-[#0f1a33]"
        }
      >
        {value}
      </p>
    </div>
  );
}

export function ParentsReportPageOne({ data }: ParentsReportPageOneProps) {
  return (
    <div>
      <SectionTitle>Guía para tomar una decisión segura</SectionTitle>
      <p className="-mt-4 mb-6 max-w-md text-sm leading-relaxed text-slate-600">
        Resumen claro para entender coste, riesgos y el momento adecuado de decisión antes de comprometer dinero con
        una escuela.
      </p>

      <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:max-w-lg">
        <StatCell label="Objetivo del alumno" value={data.objetivo} />
        <StatCell label="Ruta recomendada" value={data.routeRecommended} />
        <StatCell label="Coste estimado (realista)" value={data.totalRealista} highlight />
        <StatCell label="Brecha financiera" value={data.brecha} />
      </div>

      <div className="mt-6 border-l-4 border-[#c9a454] bg-[#f7f4ee] py-4 pl-5 pr-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a6520]">Decisión actual</p>
        <p className="mt-2 font-serif text-lg text-[#0f1a33]">{data.decision}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{data.decisionHint}</p>
        {data.brechaDetail ? (
          <p className="mt-2 text-xs text-slate-500">Brecha · {data.brechaDetail}</p>
        ) : null}
      </div>
    </div>
  );
}
