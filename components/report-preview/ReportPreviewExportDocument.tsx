"use client";

import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";
import { ReportPreviewExportContext } from "./report-preview-export-context";
import { ReportPreviewPages } from "./ReportPreviewPages";
import { REPORT_PDF_PAGE_WIDTH_PX } from "./report-preview-export-dimensions";
import "./report-preview-export.css";

type ReportPreviewExportDocumentProps = {
  snapshot: ReportSnapshotV1;
};

/** Documento off-screen para captura PDF (mismo diseño que /report-preview). */
export function ReportPreviewExportDocument({ snapshot }: ReportPreviewExportDocumentProps) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <ReportPreviewExportContext.Provider value={{ enabled: true, origin }}>
      <div
        className="report-preview-export-root bg-[#faf8f4] text-[#0f1a33] antialiased"
        style={{ width: REPORT_PDF_PAGE_WIDTH_PX }}
        data-report-pdf-root
      >
        <div className="flex flex-col gap-0">
          <ReportPreviewPages snapshot={snapshot} />
        </div>
      </div>
    </ReportPreviewExportContext.Provider>
  );
}
