"use client";

type PlannerAppBarProps = {
  onOpenSettings?: () => void;
};

export function PlannerAppBar({ onOpenSettings }: PlannerAppBarProps) {
  return (
    <div className="border-b border-[#0f1a33]/12 bg-[#0f1a33]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-white">ATPL Planner</p>
          <p className="text-[11px] text-slate-400">Tu semana de estudio</p>
        </div>
        {onOpenSettings ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="shrink-0 rounded-lg border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/10"
          >
            Ajustes
          </button>
        ) : null}
      </div>
    </div>
  );
}
