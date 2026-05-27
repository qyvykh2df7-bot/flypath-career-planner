type FlyPathInsightProps = {
  children: string;
  className?: string;
};

/** Callout editorial breve — estratégico, no comercial. */
export function FlyPathInsight({ children, className = "" }: FlyPathInsightProps) {
  return (
    <aside
      className={`border-l-2 border-[#c9a454] py-1 pl-5 ${className}`}
      aria-label="FlyPath Insight"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a6520]">
        FlyPath Insight
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-700">{children}</p>
    </aside>
  );
}
