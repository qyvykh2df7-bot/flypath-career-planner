import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";
import { ActionPlan } from "./ActionPlan";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { FinalRecommendation } from "./FinalRecommendation";
import { FinancialOverview } from "./FinancialOverview";
import { ReportCover } from "./ReportCover";
import { RiskOverview } from "./RiskOverview";
import { RouteRecommendation } from "./RouteRecommendation";
import { SchoolsOverview } from "./SchoolsOverview";
import { PAGE_PLACEHOLDER_VARIANT, REPORT_PAGE_IMAGES } from "./report-preview-assets";
import {
  CompactDataPage,
  FullBleedCover,
  VisualSplitPage,
  VisualSplitPageReverse,
} from "./report-preview-layouts";

type ReportPreviewPagesProps = {
  snapshot: ReportSnapshotV1;
};

/** Páginas del Career Report (preview y export PDF). */
export function ReportPreviewPages({ snapshot }: ReportPreviewPagesProps) {
  const img = REPORT_PAGE_IMAGES;
  const ph = PAGE_PLACEHOLDER_VARIANT;

  return (
    <>
      <FullBleedCover
        imageSrc={img.cover}
        imageAlt="Horizonte de vuelo y ala"
        placeholderVariant={ph.cover}
      >
        <ReportCover snapshot={snapshot} />
      </FullBleedCover>

      <VisualSplitPage
        sectionLabel="I · Lectura ejecutiva"
        imageSrc={img.executive}
        imageAlt="Briefing de decisión y mentoría"
        imageCaption="Briefing"
        imagePriority
        placeholderVariant={ph.executive}
      >
        <ExecutiveSummary snapshot={snapshot} />
      </VisualSplitPage>

      <VisualSplitPageReverse
        sectionLabel="II · Ruta"
        imageSrc={img.route}
        imageAlt="Horizonte y pista al atardecer"
        imageCaption="Ruta"
        placeholderVariant={ph.route}
      >
        <RouteRecommendation snapshot={snapshot} />
      </VisualSplitPageReverse>

      <CompactDataPage sectionLabel="III · Riesgos">
        <RiskOverview snapshot={snapshot} />
      </CompactDataPage>

      <VisualSplitPage
        sectionLabel="IV · Finanzas"
        imageSrc={img.finances}
        imageAlt="Cartas y planificación de ruta"
        imageCaption="Planificación"
        imageTreatment="soft"
        placeholderVariant={ph.finances}
      >
        <FinancialOverview snapshot={snapshot} />
      </VisualSplitPage>

      <VisualSplitPageReverse
        sectionLabel="V · Plan de acción"
        imageSrc={img.action}
        imageAlt="Formación en cabina"
        imageCaption="Ejecución"
        placeholderVariant={ph.action}
      >
        <ActionPlan snapshot={snapshot} />
      </VisualSplitPageReverse>

      <VisualSplitPage
        sectionLabel="VI · Escuelas"
        imageSrc={img.schools}
        imageAlt="Avioneta de entrenamiento"
        imageCaption="Formación"
        imageRatio={50}
        placeholderVariant={ph.schools}
      >
        <SchoolsOverview snapshot={snapshot} />
      </VisualSplitPage>

      <VisualSplitPageReverse
        sectionLabel="VII · Cierre"
        imageSrc={img.close}
        imageAlt="Acompañamiento y mentoría de carrera"
        imageCaption="Mentoría"
        placeholderVariant={ph.close}
      >
        <FinalRecommendation snapshot={snapshot} />
      </VisualSplitPageReverse>
    </>
  );
}
