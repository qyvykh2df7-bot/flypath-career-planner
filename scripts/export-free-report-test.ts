/**
 * Genera un PDF de prueba del resumen ejecutivo gratuito.
 * Uso: npx tsx scripts/export-free-report-test.ts
 */
import { existsSync, writeFileSync } from "fs";
import path from "path";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { REPORT_PAGE_IMAGES } from "@/components/report-preview/report-preview-assets";
import { FreeReportDocument } from "@/lib/freeCareerReportPdf";
import { mapSnapshotToFreeReportData } from "@/lib/free-report-data";
import { createDemoReportSnapshot } from "@/lib/reporting/mocks/demo-report-snapshot";

async function main() {
  const snapshot = createDemoReportSnapshot();
  const data = mapSnapshotToFreeReportData(snapshot);
  const coverPath = path.join(process.cwd(), "public", REPORT_PAGE_IMAGES.cover.replace(/^\//, ""));
  const assets = {
    origin: "https://flypath.es",
    heroUrl: existsSync(coverPath) ? coverPath : null,
  };

  const pdfBuffer = await renderToBuffer(
    React.createElement(FreeReportDocument, { data, assets }),
  );

  const outPdf = path.join(process.cwd(), "public", ".free-report-export-test.pdf");
  writeFileSync(outPdf, pdfBuffer);
  console.log(`Saved ${outPdf} (${pdfBuffer.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
