import type { ReactNode } from "react";
import type { FreeReportData } from "@/lib/free-report-data";
import { SectionTitle } from "@/components/report-preview/report-preview-layouts";
import { FreeReportValidationBlock } from "./FreeReportValidationBlock";

type FreeReportPageTwoProps = {
  data: FreeReportData;
};

function StepRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 border-b border-[#e7e2d8] py-3 sm:grid-cols-[11rem_1fr] sm:gap-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <div className="min-w-0 text-sm leading-relaxed text-slate-700">{children}</div>
    </div>
  );
}

export function FreeReportPageTwo({ data }: FreeReportPageTwoProps) {
  const schoolLine = data.leadingSchool ?? "Añade escuelas al comparador para obtener una referencia";

  return (
    <div className="flex flex-col">
      <SectionTitle>Tu siguiente paso recomendado</SectionTitle>

      <div className="mb-5">
        <StepRow label="Riesgo principal detectado">
          <p className="font-serif text-base font-medium text-[#0f1a33]">
            {data.principalRiskLabel}
            <span className="font-sans text-sm font-semibold text-slate-500"> · {data.principalRiskLevel}</span>
          </p>
        </StepRow>
        <StepRow label="Brecha financiera">
          <p>
            <span className="font-semibold text-[#0f1a33]">{data.financialGap}</span>
            {data.financialGapDetail ? (
              <span className="text-slate-600"> · {data.financialGapDetail}</span>
            ) : null}
          </p>
        </StepRow>
        <StepRow label="Escuela líder">
          <p className="font-serif text-base font-medium text-[#0f1a33]">{schoolLine}</p>
          {data.leadingSchoolHint ? (
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{data.leadingSchoolHint}</p>
          ) : null}
        </StepRow>
        <StepRow label="Próxima acción">
          <p>{data.nextAction}</p>
        </StepRow>
      </div>

      <FreeReportValidationBlock />
    </div>
  );
}
