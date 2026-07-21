import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";
import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { REPORT_PAGE_IMAGES } from "@/components/report-preview/report-preview-assets";
import {
  PremiumReportDocument,
  type PremiumPdfAssets,
} from "@/lib/premiumCareerReportPdf";
import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";

function resolveServerPdfAssets(): PremiumPdfAssets {
  const publicDirectory = path.join(process.cwd(), "public");
  const images = {} as PremiumPdfAssets["images"];
  for (const [key, relativePath] of Object.entries(REPORT_PAGE_IMAGES) as [
    keyof typeof REPORT_PAGE_IMAGES,
    string,
  ][]) {
    const filePath = path.join(publicDirectory, relativePath.replace(/^\//, ""));
    images[key] = existsSync(filePath) ? filePath : null;
  }
  return { origin: "", images };
}

export async function renderCareerPlannerPremiumReport(snapshot: ReportSnapshotV1): Promise<Buffer> {
  const pdf = await renderToBuffer(
    React.createElement(PremiumReportDocument, {
      snapshot,
      assets: resolveServerPdfAssets(),
    }) as unknown as React.ReactElement<DocumentProps>,
  );
  if (!pdf.length) throw new Error("Career Planner PDF is empty");
  return pdf;
}
