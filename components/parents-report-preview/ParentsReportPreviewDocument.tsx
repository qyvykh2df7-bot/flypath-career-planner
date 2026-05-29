import { REPORT_PAGE_IMAGES, PAGE_PLACEHOLDER_VARIANT } from "@/components/report-preview/report-preview-assets";
import { VisualSplitPage, VisualSplitPageReverse } from "@/components/report-preview/report-preview-layouts";
import type { ParentsReportMock } from "./parents-report-mock";
import { PARENTS_REPORT_MOCK } from "./parents-report-mock";
import { ParentsReportPageOne } from "./ParentsReportPageOne";
import { ParentsReportPageShell } from "./ParentsReportPageShell";
import { ParentsReportPageThree } from "./ParentsReportPageThree";
import { ParentsReportPageTwo } from "./ParentsReportPageTwo";

type ParentsReportPreviewDocumentProps = {
  data?: ParentsReportMock;
};

/** Vista previa — informe para padres (3 páginas, mock). */
export function ParentsReportPreviewDocument({ data = PARENTS_REPORT_MOCK }: ParentsReportPreviewDocumentProps) {
  const ph = PAGE_PLACEHOLDER_VARIANT;

  return (
    <div className="min-h-screen bg-[#04070e] px-3 py-10 sm:px-5 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-[72rem] space-y-10 sm:space-y-12">
        <header className="mb-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#c9a454]/90">
            Vista previa · Informe para padres
          </p>
          <p className="mt-2 text-xs text-white/35">
            {data.studentName} · {data.generatedAt} · Solo diseño (datos mock)
          </p>
        </header>

        <VisualSplitPageReverse
          sectionLabel="Para familias"
          imageSrc={REPORT_PAGE_IMAGES.close}
          imageAlt="Acompañamiento y mentoría de carrera"
          imageCaption="Familias"
          imageRatio={50}
          imagePriority
          placeholderVariant={ph.close}
        >
          <ParentsReportPageOne data={data} />
        </VisualSplitPageReverse>

        <ParentsReportPageShell sectionLabel="Validación familiar">
          <ParentsReportPageTwo data={data} />
        </ParentsReportPageShell>

        <VisualSplitPage
          sectionLabel="Recomendación"
          imageSrc={REPORT_PAGE_IMAGES.executive}
          imageAlt="Briefing y lectura ejecutiva"
          imageCaption="Orientación"
          imageRatio={40}
          placeholderVariant={ph.executive}
          contentCompact
          contentAlign="start"
        >
          <ParentsReportPageThree data={data} />
        </VisualSplitPage>
      </div>
    </div>
  );
}
