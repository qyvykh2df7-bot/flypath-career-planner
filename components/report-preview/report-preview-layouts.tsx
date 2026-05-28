"use client";

import type { ReactNode } from "react";
import type { PlaceholderVariant } from "./report-preview-assets";
import { EditorialPanelImage } from "./EditorialPanelImage";
import { useReportPreviewExport } from "./report-preview-export-context";
import {
  REPORT_PDF_PAGE_HEIGHT_PX,
  REPORT_PDF_PAGE_WIDTH_PX,
} from "./report-preview-export-dimensions";

type LayoutBaseProps = {
  children: ReactNode;
  sectionLabel?: string;
  className?: string;
};

type SplitProps = LayoutBaseProps & {
  imageSrc: string;
  imageAlt: string;
  imageCaption?: string;
  imagePriority?: boolean;
  imageRatio?: 40 | 50;
  imageTreatment?: "default" | "soft";
  placeholderVariant?: PlaceholderVariant;
};

function PageShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { enabled: exportMode } = useReportPreviewExport();

  return (
    <article
      className={
        exportMode
          ? `report-preview-page relative flex flex-col overflow-hidden bg-[#faf8f4] text-[#0f1a33] ${className}`
          : `report-preview-page relative mx-auto w-full max-w-[min(100%,72rem)] overflow-hidden bg-[#faf8f4] text-[#0f1a33] shadow-[0_28px_90px_rgba(0,0,0,0.55)] ${className}`
      }
      style={
        exportMode
          ? {
              width: REPORT_PDF_PAGE_WIDTH_PX,
              height: REPORT_PDF_PAGE_HEIGHT_PX,
              minHeight: REPORT_PDF_PAGE_HEIGHT_PX,
              maxHeight: REPORT_PDF_PAGE_HEIGHT_PX,
              boxSizing: "border-box",
            }
          : undefined
      }
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-[#c9a454]/90 to-transparent"
        aria-hidden
      />
      {exportMode ? (
        <div className="relative min-h-0 w-full flex-1">{children}</div>
      ) : (
        children
      )}
    </article>
  );
}

function ContentColumn({
  children,
  sectionLabel,
  compact = false,
}: {
  children: ReactNode;
  sectionLabel?: string;
  compact?: boolean;
}) {
  const { enabled: exportMode } = useReportPreviewExport();

  return (
    <div
      className={
        exportMode
          ? `flex min-h-full flex-col justify-center ${compact ? "px-9 py-10" : "px-11 py-12"}`
          : `flex min-h-[min(36rem,85vh)] flex-col justify-center ${
              compact ? "px-7 py-8 sm:px-9 sm:py-10" : "px-8 py-10 sm:px-11 sm:py-12"
            }`
      }
    >
      {sectionLabel ? (
        <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#c9a454]">
          {sectionLabel}
        </p>
      ) : null}
      {children}
    </div>
  );
}

/** Imagen izquierda (~40%) + contenido derecha (~60%). */
export function VisualSplitPage({
  children,
  sectionLabel,
  imageSrc,
  imageAlt,
  imageCaption,
  imagePriority,
  imageRatio = 40,
  imageTreatment = "default",
  placeholderVariant = "navy",
  className = "",
}: SplitProps) {
  const { enabled: exportMode } = useReportPreviewExport();
  const imageCols = exportMode
    ? imageRatio === 50
      ? "grid-cols-2"
      : "grid-cols-[2fr_3fr]"
    : imageRatio === 50
      ? "lg:grid-cols-2"
      : "lg:grid-cols-[2fr_3fr]";
  const gridSize = exportMode ? "" : "min-h-[min(38rem,82vh)]";
  const imageCell = exportMode ? "relative h-full min-h-0" : "relative min-h-[12rem] lg:min-h-full";

  return (
    <PageShell className={className}>
      <div className={`grid h-full min-h-0 ${gridSize} ${imageCols}`}>
        <div className={imageCell}>
          <EditorialPanelImage
            src={imageSrc}
            alt={imageAlt}
            caption={imageCaption}
            priority={imagePriority}
            treatment={imageTreatment}
            placeholderVariant={placeholderVariant}
          />
        </div>
        <ContentColumn sectionLabel={sectionLabel}>{children}</ContentColumn>
      </div>
    </PageShell>
  );
}

/** Contenido izquierda + imagen derecha. */
export function VisualSplitPageReverse({
  children,
  sectionLabel,
  imageSrc,
  imageAlt,
  imageCaption,
  imagePriority,
  imageRatio = 40,
  imageTreatment = "default",
  placeholderVariant = "navy",
  className = "",
}: SplitProps) {
  const { enabled: exportMode } = useReportPreviewExport();
  const imageCols = exportMode
    ? imageRatio === 50
      ? "grid-cols-2"
      : "grid-cols-[3fr_2fr]"
    : imageRatio === 50
      ? "lg:grid-cols-2"
      : "lg:grid-cols-[3fr_2fr]";
  const gridSize = exportMode ? "" : "min-h-[min(38rem,82vh)]";
  const imageCell = exportMode
    ? "relative h-full min-h-0"
    : "relative order-first min-h-[12rem] lg:order-none lg:min-h-full";

  return (
    <PageShell className={className}>
      <div className={`grid h-full min-h-0 ${gridSize} ${imageCols}`}>
        <ContentColumn sectionLabel={sectionLabel}>{children}</ContentColumn>
        <div className={imageCell}>
          <EditorialPanelImage
            src={imageSrc}
            alt={imageAlt}
            caption={imageCaption}
            priority={imagePriority}
            treatment={imageTreatment}
            placeholderVariant={placeholderVariant}
          />
        </div>
      </div>
    </PageShell>
  );
}

type FullBleedCoverProps = {
  imageSrc: string;
  imageAlt: string;
  children: ReactNode;
  imagePriority?: boolean;
  placeholderVariant?: PlaceholderVariant;
};

/** Portada: panel visual + datos compactos (sin página vacía). */
export function FullBleedCover({
  imageSrc,
  imageAlt,
  children,
  imagePriority = true,
  placeholderVariant = "horizon",
}: FullBleedCoverProps) {
  const { enabled: exportMode } = useReportPreviewExport();
  const gridClass = exportMode
    ? "grid h-full min-h-0 grid-cols-2"
    : "grid min-h-[min(38rem,85vh)] lg:grid-cols-2";
  const imageCell = exportMode ? "relative h-full min-h-0" : "relative min-h-[14rem] lg:min-h-full";

  return (
    <PageShell>
      <div className={`${gridClass} h-full min-h-0`}>
        <div className={imageCell}>
          <EditorialPanelImage
            src={imageSrc}
            alt={imageAlt}
            priority={imagePriority}
            placeholderVariant={placeholderVariant}
          />
        </div>
        <div
          className={
            exportMode
              ? "flex flex-col justify-center gap-8 px-11 py-10"
              : "flex flex-col justify-center gap-8 px-8 py-9 sm:px-11 sm:py-10"
          }
        >
          {children}
        </div>
      </div>
    </PageShell>
  );
}

/** Página densa de datos (riesgos) — sin imagen lateral. */
export function CompactDataPage({ children, sectionLabel, className = "" }: LayoutBaseProps) {
  const { enabled: exportMode } = useReportPreviewExport();

  return (
    <PageShell className={className}>
      <div className={exportMode ? "h-full min-h-0 overflow-hidden" : undefined}>
        <ContentColumn sectionLabel={sectionLabel} compact>
          {children}
        </ContentColumn>
      </div>
    </PageShell>
  );
}

/** Título principal de sección (el eyebrow va en sectionLabel del layout). */
export function SectionTitle({ children }: { children: string }) {
  return (
    <header className="mb-6">
      <h2 className="font-serif text-[1.65rem] font-medium leading-tight tracking-tight text-[#0f1a33] sm:text-[1.85rem]">
        {children}
      </h2>
    </header>
  );
}

/** Stat editorial — número grande sin card. */
export function EditorialStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="border-t border-[#0f1a33]/10 py-4 first:border-t-0 first:pt-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-1 font-serif text-2xl text-[#0f1a33]">{value}</p>
      {detail ? <p className="mt-1 text-xs leading-snug text-slate-600 line-clamp-2">{detail}</p> : null}
    </div>
  );
}
