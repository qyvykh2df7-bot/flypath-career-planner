import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";
import { flypathSecondaryProductLabel, paymentDecisionHeadline } from "./report-preview-utils";

type FinalRecommendationProps = {
  snapshot: ReportSnapshotV1;
};

export function FinalRecommendation({ snapshot }: FinalRecommendationProps) {
  const { flypathNextStep, readiness } = snapshot;

  return (
    <div className="flex min-h-[20rem] flex-col justify-between">
      <div>
        <h2 className="font-serif text-3xl font-medium tracking-tight text-[#0f1a33] sm:text-[2rem]">
          Siguiente paso recomendado
        </h2>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-600">
          Orientación para tu siguiente movimiento según el perfil y la documentación revisada. No
          sustituye la validación final antes de cualquier pago.
        </p>

        <div className="mt-10 bg-[#0f1a33] px-8 py-9 text-[#faf8f4] sm:px-10 sm:py-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c9a454]">
            Enfoque principal
          </p>
          <h3 className="mt-4 font-serif text-2xl leading-tight sm:text-[1.75rem]">
            {flypathNextStep.primary.title}
          </h3>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80">
            {flypathNextStep.primary.body}
          </p>
          <span className="mt-6 inline-flex items-center justify-center bg-[#c9a454] px-5 py-2.5 text-sm font-semibold text-[#0f1a33]">
            {flypathNextStep.primary.cta}
          </span>
        </div>

        {flypathNextStep.reasons.length > 0 ? (
          <ul className="mt-8 space-y-3 text-sm text-slate-600">
            {flypathNextStep.reasons.map((reason) => (
              <li key={reason} className="flex gap-3 leading-relaxed">
                <span className="shrink-0 text-[#c9a454]" aria-hidden>
                  —
                </span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {flypathNextStep.secondaryIds.length > 0 ? (
          <div className="mt-10 border-t border-[#0f1a33]/10 pt-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Apoyos complementarios
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {flypathNextStep.secondaryIds.map((id) => (
                <span key={id} className="text-xs text-slate-600">
                  {flypathSecondaryProductLabel(id)}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-14 border-t border-[#0f1a33]/10 pt-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Decisión de pago
        </p>
        <p className="mt-2 font-serif text-xl text-[#0f1a33]">
          {paymentDecisionHeadline(readiness.decision)}
        </p>
        <p className="mt-1 text-sm text-slate-600">{readiness.decision}</p>
        <p className="mt-6 text-xs leading-relaxed text-slate-500">{snapshot.disclaimer}</p>
      </div>
    </div>
  );
}
