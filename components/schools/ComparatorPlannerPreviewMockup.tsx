"use client";

const PREVIEW_ROWS = [
  { label: "Ruta recomendada", accent: "from-[#c9a454]/35 to-[#c9a454]/10" },
  { label: "Coste realista", accent: "from-white/20 to-white/5" },
  { label: "Riesgos detectados", accent: "from-amber-300/25 to-amber-300/5" },
  { label: "Informe premium", accent: "from-emerald-300/25 to-emerald-300/5" },
] as const;

export function ComparatorPlannerPreviewMockup() {
  return (
    <div
      className="w-full max-w-[300px] justify-self-center overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] shadow-[0_14px_36px_-12px_rgba(0,0,0,0.45)] ring-1 ring-[#c9a454]/20 lg:max-w-none lg:justify-self-end"
      aria-hidden
    >
      <div className="border-b border-white/10 bg-[#0a1228]/60 px-3.5 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f2ddaa]">
          Career Planner
        </p>
        <p className="mt-0.5 text-[13px] font-semibold text-white">Tu plan FlyPath</p>
      </div>
      <div className="space-y-2 p-3.5">
        {PREVIEW_ROWS.map((row, index) => (
          <div
            key={row.label}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#f2ddaa]/90">
                {row.label}
              </p>
              <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#c9a454]/20 text-[9px] font-bold text-[#f2ddaa]">
                {index + 1}
              </span>
            </div>
            <div
              className={`mt-2 h-1.5 rounded-full bg-gradient-to-r ${row.accent}`}
              style={{ width: `${68 + index * 6}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
