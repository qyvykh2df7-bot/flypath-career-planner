import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";
import { EditorialImage } from "./EditorialImage";
import { FlyPathWordmark } from "./FlyPathWordmark";
import { REPORT_PREVIEW_IMAGES } from "./report-preview-assets";
import { objetivoLabel, paymentDecisionHeadline } from "./report-preview-utils";

type ReportCoverProps = {
  snapshot: ReportSnapshotV1;
};

export function ReportCover({ snapshot }: ReportCoverProps) {
  const displayName = snapshot.profile.nombre.trim() || "Aspirante a piloto";

  return (
    <div className="flex flex-col">
      <div className="relative -mx-9 -mt-12 mb-12 sm:-mx-14 sm:-mt-16 md:-mx-16 md:-mt-[4.5rem]">
        <EditorialImage
          src={REPORT_PREVIEW_IMAGES.coverHero}
          alt="Aeronave en briefing de aviación"
          heightClass="h-[min(42vh,22rem)] sm:h-72"
          overlay="dark"
          priority
        />
        <div className="absolute inset-0 flex flex-col justify-between p-8 sm:p-10">
          <FlyPathWordmark variant="on-dark" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#c9a454]">
              Career Report
            </p>
            <h1 className="mt-2 max-w-lg font-serif text-3xl font-medium leading-tight tracking-tight text-[#faf8f4] sm:text-4xl">
              Briefing de decisión
            </h1>
          </div>
        </div>
      </div>

      <p className="max-w-md text-sm leading-relaxed text-slate-600">
        Informe generado a partir de tus respuestas en el Career Planner
      </p>

      <div className="mt-10 grid gap-6 border-y border-[#0f1a33]/10 py-8 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Ruta recomendada
          </p>
          <p className="mt-2 font-serif text-xl text-[#0f1a33]">
            {snapshot.routeRecommendation.recommended}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Readiness
          </p>
          <p className="mt-2 font-serif text-xl text-[#0f1a33]">
            {snapshot.readiness.score}/100
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Riesgo principal
          </p>
          <p className="mt-2 font-serif text-xl text-[#0f1a33]">{snapshot.risks.highestLevel}</p>
        </div>
      </div>

      <div className="mt-12">
        <div className="h-px w-20 bg-gradient-to-r from-[#c9a454] to-transparent" />
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-slate-600">
          Briefing de decisión antes de comprometer pagos o elegir escuela
        </p>
      </div>

      <div className="mt-14 border-t border-[#0f1a33]/8 pt-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Preparado para
        </p>
        <p className="mt-3 font-serif text-3xl text-[#0f1a33]">{displayName}</p>
        <dl className="mt-10 grid gap-8 sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Objetivo
            </dt>
            <dd className="mt-2 text-base text-[#0f1a33]">{objetivoLabel(snapshot.profile.objetivo)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Decisión de pago
            </dt>
            <dd className="mt-2 text-base font-medium text-[#0f1a33]">
              {paymentDecisionHeadline(snapshot.readiness.decision)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Fecha del informe
            </dt>
            <dd className="mt-2 text-base text-[#0f1a33]">{snapshot.generatedAt}</dd>
          </div>
        </dl>
      </div>

      <p className="mt-12 text-[11px] leading-relaxed text-slate-500">{snapshot.disclaimer}</p>
    </div>
  );
}
