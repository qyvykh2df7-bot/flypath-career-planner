import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";
import { ReportCoverLogo } from "./ReportCoverLogo";
import { objetivoLabel, paymentDecisionHeadline } from "./report-preview-utils";

type ReportCoverProps = {
  snapshot: ReportSnapshotV1;
};

/** Portada: identidad + snapshot rápido (sin repetir lectura ejecutiva). */
export function ReportCover({ snapshot }: ReportCoverProps) {
  const displayName = snapshot.profile.nombre.trim() || "Aspirante a piloto";

  return (
    <>
      <div>
        <ReportCoverLogo />
        <h1 className="mt-6 font-serif text-[2rem] font-medium leading-[1.08] text-[#0f1a33] sm:text-[2.5rem]">
          Briefing de decisión
        </h1>
        <p className="mt-3 text-base text-slate-600">
          Antes de comprometer pagos o elegir escuela
        </p>
      </div>

      <div className="border-y border-[#0f1a33]/10 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Preparado para
        </p>
        <p className="mt-1.5 font-serif text-[1.75rem] leading-tight text-[#0f1a33]">{displayName}</p>
        <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3">
          <div>
            <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Ruta</dt>
            <dd className="mt-0.5 text-base font-semibold text-[#0f1a33]">
              {snapshot.routeRecommendation.recommended}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
              Índice de decisión
            </dt>
            <dd className="mt-0.5 font-serif text-2xl text-[#0f1a33]">
              {snapshot.readiness.score}
              <span className="text-base text-slate-400">/100</span>
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Riesgo</dt>
            <dd className="mt-0.5 text-base font-medium text-[#0f1a33]">{snapshot.risks.highestLevel}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Decisión</dt>
            <dd className="mt-0.5 text-base font-medium text-[#0f1a33]">
              {paymentDecisionHeadline(snapshot.readiness.decision)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-600">
        <p>
          <span className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Objetivo · </span>
          {objetivoLabel(snapshot.profile.objetivo)}
        </p>
        <p>
          <span className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Fecha · </span>
          {snapshot.generatedAt}
        </p>
      </div>
    </>
  );
}
