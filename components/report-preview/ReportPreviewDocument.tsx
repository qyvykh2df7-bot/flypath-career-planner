import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";
import { ActionPlan } from "./ActionPlan";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { FinalRecommendation } from "./FinalRecommendation";
import { FinancialOverview } from "./FinancialOverview";
import { ReportCover } from "./ReportCover";
import { ReportPage } from "./ReportPage";
import { RiskOverview } from "./RiskOverview";
import { RouteRecommendation } from "./RouteRecommendation";
import { SchoolsOverview } from "./SchoolsOverview";

type ReportPreviewDocumentProps = {
  snapshot: ReportSnapshotV1;
};

/** Documento completo del informe premium — solo renderiza datos del snapshot. */
export function ReportPreviewDocument({ snapshot }: ReportPreviewDocumentProps) {
  return (
    <div className="report-preview-root min-h-screen bg-[#050810] px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
      <div className="mx-auto max-w-[52rem] space-y-14 sm:space-y-20">
        <header className="mb-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#c9a454]/90">
            Vista previa · No exportable
          </p>
          <p className="mt-2 text-xs text-white/40">FlyPath Career Report · {snapshot.version}</p>
        </header>

        <ReportPage>
          <ReportCover snapshot={snapshot} />
        </ReportPage>

        <ReportPage sectionLabel="I · Resumen">
          <ExecutiveSummary snapshot={snapshot} />
        </ReportPage>

        <ReportPage sectionLabel="II · Ruta">
          <RouteRecommendation snapshot={snapshot} />
        </ReportPage>

        <ReportPage sectionLabel="III · Riesgos">
          <RiskOverview snapshot={snapshot} />
        </ReportPage>

        <ReportPage sectionLabel="IV · Finanzas">
          <FinancialOverview snapshot={snapshot} />
        </ReportPage>

        <ReportPage sectionLabel="V · Plan de acción">
          <ActionPlan snapshot={snapshot} />
        </ReportPage>

        <ReportPage sectionLabel="VI · Escuelas">
          <SchoolsOverview snapshot={snapshot} />
        </ReportPage>

        <ReportPage sectionLabel="VII · Cierre">
          <FinalRecommendation snapshot={snapshot} />
        </ReportPage>
      </div>
    </div>
  );
}
