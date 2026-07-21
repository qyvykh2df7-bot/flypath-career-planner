/**
 * Exporta una página del PDF premium real a PNG en /public.
 * Uso: npx tsx scripts/export-premium-page-preview.ts <página> <nombre-archivo>
 * Ejemplo (pág. 6 · Hoja de ruta): npx tsx scripts/export-premium-page-preview.ts 6 premium-report-action-preview.png
 */
import { existsSync, unlinkSync, writeFileSync } from "fs";
import path from "path";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { pdf } from "pdf-to-img";
import { PREMIUM_PDF_PAGE_IMAGES } from "@/components/report-preview/report-preview-assets";
import {
  PremiumReportDocument,
  type PremiumPdfAssets,
} from "@/lib/premiumCareerReportPdf";
import { createDemoReportSnapshot } from "@/lib/reporting/mocks/demo-report-snapshot";

function resolveLocalPremiumPdfAssets(): PremiumPdfAssets {
  const publicDir = path.join(process.cwd(), "public");
  const images = {} as PremiumPdfAssets["images"];
  for (const [key, relPath] of Object.entries(PREMIUM_PDF_PAGE_IMAGES) as [
    keyof typeof PREMIUM_PDF_PAGE_IMAGES,
    string,
  ][]) {
    const filePath = path.join(publicDir, relPath.replace(/^\//, ""));
    images[key] = existsSync(filePath) ? filePath : null;
  }
  return { origin: "", images };
}

async function main() {
  const pageNumber = Number.parseInt(process.argv[2] ?? "1", 10);
  const outFile = process.argv[3] ?? "premium-report-real-preview.png";
  if (!Number.isFinite(pageNumber) || pageNumber < 1) {
    throw new Error("Indica un número de página válido (1-based).");
  }

  const snapshot = createDemoReportSnapshot();
  const assets = resolveLocalPremiumPdfAssets();
  const pdfBuffer = await renderToBuffer(
    React.createElement(PremiumReportDocument, { snapshot, assets }),
  );

  const outPng = path.join(process.cwd(), "public", outFile);
  const tempPdf = path.join(process.cwd(), "public", `.premium-export-temp-${pageNumber}.pdf`);
  writeFileSync(tempPdf, pdfBuffer);

  const document = await pdf(tempPdf, { scale: 2 });
  let current = 0;
  let saved = false;
  for await (const page of document) {
    current += 1;
    if (current === pageNumber) {
      writeFileSync(outPng, page);
      saved = true;
      break;
    }
  }

  unlinkSync(tempPdf);
  if (!saved) {
    throw new Error(`La página ${pageNumber} no existe en el PDF premium generado (${current} páginas).`);
  }
  console.log(`Saved page ${pageNumber} → ${outPng}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
