import type { ReactNode } from "react";

type ReportPageProps = {
  children: ReactNode;
  sectionLabel?: string;
  className?: string;
};

/** Contenedor tipo página A4 — briefing editorial premium. */
export function ReportPage({ children, sectionLabel, className = "" }: ReportPageProps) {
  return (
    <article
      className={`report-preview-page relative mx-auto w-full max-w-[min(100%,52rem)] overflow-hidden bg-[#faf8f4] text-[#0f1a33] shadow-[0_32px_100px_rgba(0,0,0,0.5)] ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a454]/90 to-transparent"
        aria-hidden
      />
      <div className="min-h-[min(100vh,56rem)] px-9 py-12 sm:px-14 sm:py-16 md:min-h-[48rem] md:px-16 md:py-[4.5rem]">
        {sectionLabel ? (
          <p className="mb-10 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#c9a454]">
            {sectionLabel}
          </p>
        ) : null}
        {children}
      </div>
    </article>
  );
}
