/**
 * @deprecated Export premium desactivado — usar `lib/premiumCareerReportPdf.tsx` (@react-pdf).
 * Se conserva temporalmente por referencia; el botón premium ya no importa este módulo.
 */
"use client";

import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";
import {
  REPORT_PDF_PAGE_HEIGHT_MM,
  REPORT_PDF_PAGE_HEIGHT_PX,
  REPORT_PDF_PAGE_WIDTH_MM,
  REPORT_PDF_PAGE_WIDTH_PX,
} from "@/components/report-preview/report-preview-export-dimensions";
import { prepareExportCloneForHtml2Canvas } from "@/lib/report-preview-pdf-sanitize";

/** Ancho A4 landscape a 96 DPI (297×210 mm). */
export const CAREER_REPORT_PDF_PAGE_WIDTH_PX = REPORT_PDF_PAGE_WIDTH_PX;
export const CAREER_REPORT_PDF_PAGE_HEIGHT_PX = REPORT_PDF_PAGE_HEIGHT_PX;
const CANVAS_SCALE = 2;
const JPEG_QUALITY = 0.9;
const IMAGE_LOAD_TIMEOUT_MS = 12_000;
const EXPORT_HOST_ATTR = "data-flypath-pdf-export-host";

export const PREMIUM_PDF_ERROR_MESSAGE =
  "No se pudo generar el PDF premium. Inténtalo de nuevo o usa Chrome.";

export function buildCareerReportPdfFilename(snapshot: ReportSnapshotV1): string {
  const raw = snapshot.profile.nombre.trim();
  const slug = raw
    ? raw
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48)
    : "informe";
  const date = new Date().toISOString().slice(0, 10);
  return `flypath-career-report-${slug}-${date}.pdf`;
}

function resolveAbsoluteHref(href: string, origin: string): string | null {
  if (!href || href.startsWith("#")) return null;
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.startsWith("/")) return `${origin.replace(/\/$/, "")}${href}`;
  return href;
}

/** Elimina hosts de export huérfanos (p. ej. tras error o recarga parcial). */
export function removeStalePremiumPdfExportHosts(): void {
  if (typeof document === "undefined") return;
  document.querySelectorAll(`[${EXPORT_HOST_ATTR}]`).forEach((node) => node.remove());
}

function createPremiumPdfExportHost(): HTMLDivElement {
  removeStalePremiumPdfExportHosts();

  const host = document.createElement("div");
  host.setAttribute(EXPORT_HOST_ATTR, "true");
  host.setAttribute("aria-hidden", "true");
  host.setAttribute("role", "presentation");

  Object.assign(host.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: `${CAREER_REPORT_PDF_PAGE_WIDTH_PX}px`,
    maxHeight: "100vh",
    overflow: "hidden",
    margin: "0",
    padding: "0",
    border: "0",
    pointerEvents: "none",
    opacity: "0",
    zIndex: "1",
    contain: "layout style paint",
    clipPath: "inset(100%)",
    clip: "rect(0, 0, 0, 0)",
    transform: "translateX(-200vw)",
    background: "transparent",
  } as CSSStyleDeclaration);

  const mount = document.createElement("div");
  mount.setAttribute("data-flypath-pdf-export-mount", "true");
  Object.assign(mount.style, {
    position: "relative",
    width: `${CAREER_REPORT_PDF_PAGE_WIDTH_PX}px`,
    pointerEvents: "none",
    backgroundColor: "#faf8f4",
  } as CSSStyleDeclaration);

  host.appendChild(mount);
  document.body.appendChild(host);

  return mount;
}

function disposeHtmlCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = 0;
  canvas.height = 0;
  canvas.remove();
}

async function waitForExportReady(root: HTMLElement): Promise<void> {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
          window.setTimeout(done, IMAGE_LOAD_TIMEOUT_MS);
        }),
    ),
  );

  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
}

function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });
}

function addPageLinkAnnotations(
  pdf: import("jspdf").jsPDF,
  pageEl: HTMLElement,
  pageWmm: number,
  pageHmm: number,
  origin: string,
): void {
  const pageRect = pageEl.getBoundingClientRect();
  if (pageRect.width < 1 || pageRect.height < 1) return;

  pageEl.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((anchor) => {
    const href = anchor.getAttribute("href");
    if (!href) return;
    const url = resolveAbsoluteHref(href, origin);
    if (!url) return;

    const r = anchor.getBoundingClientRect();
    const x = ((r.left - pageRect.left) / pageRect.width) * pageWmm;
    const y = ((r.top - pageRect.top) / pageRect.height) * pageHmm;
    const w = (r.width / pageRect.width) * pageWmm;
    const h = (r.height / pageRect.height) * pageHmm;
    if (w < 0.8 || h < 0.8) return;

    pdf.link(x, y, w, h, { url });
  });
}

function cleanupPremiumPdfExport(
  reactRoot: { unmount: () => void } | null,
  mount: HTMLElement | null,
): void {
  try {
    reactRoot?.unmount();
  } catch {
    /* ignore */
  }

  const host = mount?.closest(`[${EXPORT_HOST_ATTR}]`) ?? null;
  if (host?.parentNode) {
    host.parentNode.removeChild(host);
  } else if (mount?.parentNode) {
    mount.parentNode.removeChild(mount);
  }

  removeStalePremiumPdfExportHosts();

  document.querySelectorAll("canvas[data-flypath-pdf-temp]").forEach((node) => {
    disposeHtmlCanvas(node as HTMLCanvasElement);
  });
}

export async function downloadCareerReportPdf(snapshot: ReportSnapshotV1): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("FlyPath PDF: la descarga solo está disponible en el navegador.");
  }

  removeStalePremiumPdfExportHosts();

  const [{ default: html2canvas }, { jsPDF }, { createRoot }, { ReportPreviewExportDocument }] =
    await Promise.all([
      import("html2canvas"),
      import("jspdf"),
      import("react-dom/client"),
      import("@/components/report-preview/ReportPreviewExportDocument"),
    ]);

  const React = await import("react");

  const mount = createPremiumPdfExportHost();
  const root = createRoot(mount);
  root.render(React.createElement(ReportPreviewExportDocument, { snapshot }));

  const tempCanvases: HTMLCanvasElement[] = [];

  try {
    await waitForExportReady(mount);

    const pages = Array.from(mount.querySelectorAll<HTMLElement>(".report-preview-page"));
    if (!pages.length) {
      throw new Error("FlyPath PDF: no se encontraron páginas del informe.");
    }

    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWmm = REPORT_PDF_PAGE_WIDTH_MM;
    const pageHmm = REPORT_PDF_PAGE_HEIGHT_MM;
    const origin = window.location.origin;

    for (let i = 0; i < pages.length; i++) {
      const pageEl = pages[i]!;
      if (i > 0) {
        pdf.addPage("a4", "landscape");
      }

      await yieldToMainThread();

      const captureWidth = REPORT_PDF_PAGE_WIDTH_PX;
      const captureHeight = REPORT_PDF_PAGE_HEIGHT_PX;

      const canvas = await html2canvas(pageEl, {
        scale: CANVAS_SCALE,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#faf8f4",
        width: captureWidth,
        height: captureHeight,
        logging: false,
        windowWidth: captureWidth,
        windowHeight: captureHeight,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        removeContainer: true,
        onclone: (clonedDoc, clonedElement) => {
          prepareExportCloneForHtml2Canvas(clonedDoc, clonedElement);
          clonedElement.style.width = `${captureWidth}px`;
          clonedElement.style.height = `${captureHeight}px`;
          clonedElement.style.overflow = "hidden";
        },
      });

      canvas.setAttribute("data-flypath-pdf-temp", "true");
      tempCanvases.push(canvas);

      const imgData = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      pdf.addImage(imgData, "JPEG", 0, 0, pageWmm, pageHmm, undefined, "FAST");
      addPageLinkAnnotations(pdf, pageEl, pageWmm, pageHmm, origin);

      disposeHtmlCanvas(canvas);
      tempCanvases.pop();
    }

    pdf.save(buildCareerReportPdfFilename(snapshot));
  } finally {
    for (const canvas of tempCanvases) {
      disposeHtmlCanvas(canvas);
    }
    cleanupPremiumPdfExport(root, mount);
  }
}
