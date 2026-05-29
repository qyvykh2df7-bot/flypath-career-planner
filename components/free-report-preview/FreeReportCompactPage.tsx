import type { ReactNode } from "react";

type FreeReportCompactPageProps = {
  sectionLabel: string;
  children: ReactNode;
};

/** Página densa alineada arriba — menos vacío vertical que CompactDataPage del premium. */
export function FreeReportCompactPage({ sectionLabel, children }: FreeReportCompactPageProps) {
  return (
    <article className="report-preview-page relative mx-auto w-full max-w-[min(100%,72rem)] overflow-hidden bg-[#faf8f4] text-[#0f1a33] shadow-[0_28px_90px_rgba(0,0,0,0.55)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-[#c9a454]/90 to-transparent"
        aria-hidden
      />
      <div className="flex flex-col justify-start px-7 py-8 sm:px-9 sm:py-9">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#c9a454]">
          {sectionLabel}
        </p>
        {children}
      </div>
    </article>
  );
}
