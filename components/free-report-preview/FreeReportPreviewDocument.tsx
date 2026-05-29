import { REPORT_PAGE_IMAGES, PAGE_PLACEHOLDER_VARIANT } from "@/components/report-preview/report-preview-assets";
import { VisualSplitPageReverse } from "@/components/report-preview/report-preview-layouts";
import type { FreeReportData } from "@/lib/free-report-data";
import { FreeReportCompactPage } from "./FreeReportCompactPage";
import { FreeReportPageOne } from "./FreeReportPageOne";
import { FreeReportPageTwo } from "./FreeReportPageTwo";

type FreeReportPreviewDocumentProps = {
  data: FreeReportData;
};

/** Vista previa visual del informe gratuito V2 (2 páginas). */
export function FreeReportPreviewDocument({ data }: FreeReportPreviewDocumentProps) {
  const ph = PAGE_PLACEHOLDER_VARIANT;

  return (
    <div className="min-h-screen bg-[#04070e] px-3 py-10 sm:px-5 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-[72rem] space-y-10 sm:space-y-12">
        <header className="mb-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#c9a454]/90">
            Vista previa · Informe gratuito V2
          </p>
          <p className="mt-2 text-xs text-white/35">
            Resumen ejecutivo · 2 páginas · Misma fuente de datos que el PDF
          </p>
        </header>

        <VisualSplitPageReverse
          sectionLabel="Informe ejecutivo"
          imageSrc={REPORT_PAGE_IMAGES.cover}
          imageAlt="Horizonte de vuelo y ala"
          imageCaption="Resumen"
          imageRatio={50}
          imagePriority
          placeholderVariant={ph.cover}
        >
          <FreeReportPageOne data={data} />
        </VisualSplitPageReverse>

        <FreeReportCompactPage sectionLabel="Siguiente paso">
          <FreeReportPageTwo data={data} />
        </FreeReportCompactPage>
      </div>
    </div>
  );
}
