import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";
import { ReportPreviewPages } from "./ReportPreviewPages";

type ReportPreviewDocumentProps = {
  snapshot: ReportSnapshotV1;
};

/** Informe editorial — composición split, una imagen única por página. */
export function ReportPreviewDocument({ snapshot }: ReportPreviewDocumentProps) {
  return (
    <div className="report-preview-root min-h-screen bg-[#04070e] px-3 py-10 sm:px-5 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-[72rem] space-y-10 sm:space-y-12">
        <header className="mb-4 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#c9a454]/90">
            Vista previa · No exportable
          </p>
          <p className="mt-2 text-xs text-white/35">FlyPath Career Report · {snapshot.version}</p>
        </header>

        <ReportPreviewPages snapshot={snapshot} />
      </div>
    </div>
  );
}
