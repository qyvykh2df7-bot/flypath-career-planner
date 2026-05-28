import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";
import { flypathProductHref } from "./flypath-product-links";
import { FlyPathProductCta, FlyPathProductTextLink } from "./FlyPathProductCta";
import { SectionTitle } from "./report-preview-layouts";
import { flypathSecondaryProductLabel, paymentDecisionHeadline } from "./report-preview-utils";

type FinalRecommendationProps = {
  snapshot: ReportSnapshotV1;
};

export function FinalRecommendation({ snapshot }: FinalRecommendationProps) {
  const { flypathNextStep, readiness } = snapshot;
  const primaryHref = flypathProductHref(flypathNextStep.primaryId);

  return (
    <div className="flex flex-col justify-center gap-8">
      <div>
        <SectionTitle>Siguiente paso recomendado</SectionTitle>

        <div className="bg-[#0f1a33] px-6 py-7 text-[#faf8f4] sm:px-7">
          <h3 className="font-serif text-2xl leading-tight">{flypathNextStep.primary.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-white/80 line-clamp-3">
            {flypathNextStep.primary.body}
          </p>
          <div className="mt-6">
            <FlyPathProductCta href={primaryHref}>{flypathNextStep.primary.cta}</FlyPathProductCta>
          </div>
        </div>

        {flypathNextStep.secondaryIds.length > 0 ? (
          <div className="mt-5">
            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
              También útil
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {flypathNextStep.secondaryIds.map((id) => (
                <FlyPathProductTextLink key={id} href={flypathProductHref(id)}>
                  {flypathSecondaryProductLabel(id)}
                </FlyPathProductTextLink>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-[#0f1a33]/10 pt-6">
        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Decisión de pago</p>
        <p className="mt-1 font-serif text-xl text-[#0f1a33]">
          {paymentDecisionHeadline(readiness.decision)}
        </p>
        <p className="mt-4 text-[10px] leading-relaxed text-slate-500 line-clamp-3">
          {snapshot.disclaimer}
        </p>
      </div>
    </div>
  );
}
