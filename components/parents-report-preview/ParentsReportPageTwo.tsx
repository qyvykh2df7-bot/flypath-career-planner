import type { ParentsReportMock } from "./parents-report-mock";
import { SectionTitle } from "@/components/report-preview/report-preview-layouts";
import { ParentsChecklistItem } from "./ParentsGoldCheck";

type ParentsReportPageTwoProps = {
  data: ParentsReportMock;
};

export function ParentsReportPageTwo({ data }: ParentsReportPageTwoProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
      <div>
        <SectionTitle>Qué debería validar una familia antes de pagar</SectionTitle>
        <ul className="mt-2 space-y-4" role="list">
          {data.familyChecklist.map((item) => (
            <ParentsChecklistItem key={item} label={item} />
          ))}
        </ul>
      </div>

      <div className="border-l-4 border-[#c9a454] bg-[#0f1a33] px-6 py-7 text-[#faf8f4] lg:self-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c9a454]">
          Riesgo principal detectado
        </p>
        <p className="mt-4 font-serif text-xl leading-snug">{data.principalRiskTitle}</p>
        <p className="mt-4 text-sm leading-relaxed text-[#faf8f4]/80">{data.principalRiskExplanation}</p>
      </div>
    </div>
  );
}
