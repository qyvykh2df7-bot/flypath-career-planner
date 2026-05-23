"use client";

import { useEffect, useId, useState } from "react";
import { Ellipsis, X } from "lucide-react";
import {
  getPlannerNavItem,
  PLANNER_RAIL_MORE_NAV_IDS,
  PLANNER_RAIL_PRIMARY_NAV_IDS,
  type PlannerNavId,
} from "./planner-nav";

type PlannerRailProps = {
  activeId: PlannerNavId;
  onNavigate: (id: PlannerNavId) => void;
};

function RailNavButton({
  id,
  activeId,
  onNavigate,
}: {
  id: PlannerNavId;
  activeId: PlannerNavId;
  onNavigate: (id: PlannerNavId) => void;
}) {
  const item = getPlannerNavItem(id);
  if (!item) return null;
  const Icon = item.icon;
  const isActive = activeId === id;

  return (
    <button
      type="button"
      title={item.label}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      onClick={() => onNavigate(id)}
      className={`group relative flex h-10 w-full items-center justify-center rounded-xl transition-[background-color,color,box-shadow] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ea8]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
        isActive
          ? "bg-slate-50/90 text-[#0f1a33]"
          : "text-slate-500 hover:bg-slate-50/80 hover:text-[#0f1a33]"
      }`}
    >
      {isActive ? (
        <span
          className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-[#c9a454] shadow-[0_0_0_1px_rgba(201,164,84,0.2)]"
          aria-hidden
        />
      ) : null}
      <Icon
        className={`h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${
          isActive ? "text-[#0f1a33]" : "text-slate-400 group-hover:text-slate-600"
        }`}
        aria-hidden
      />
      <span className="sr-only">{item.label}</span>
    </button>
  );
}

export function PlannerRail({ activeId, onNavigate }: PlannerRailProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const popoverTitleId = useId();
  const moreActive = PLANNER_RAIL_MORE_NAV_IDS.includes(activeId);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  return (
    <aside
      className="relative hidden w-[4.25rem] shrink-0 flex-col border-r border-slate-200/40 bg-white/95 backdrop-blur-sm md:flex"
      aria-label="Navegación del planner"
    >
      <div
        className="pointer-events-none absolute inset-y-8 left-0 w-px bg-gradient-to-b from-transparent via-slate-200/80 to-transparent"
        aria-hidden
      />
      <nav className="flex flex-1 flex-col gap-0.5 px-1.5 py-3" role="navigation">
        {PLANNER_RAIL_PRIMARY_NAV_IDS.map((id) => (
          <RailNavButton key={id} id={id} activeId={activeId} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="relative border-t border-slate-100/80 px-1.5 py-2">
        <button
          type="button"
          title="Más"
          aria-label="Más opciones"
          aria-expanded={moreOpen}
          aria-current={moreActive ? "page" : undefined}
          onClick={() => setMoreOpen((o) => !o)}
          className={`group relative flex h-10 w-full items-center justify-center rounded-xl transition-[background-color,color] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ea8]/25 ${
            moreActive || moreOpen
              ? "bg-slate-50/90 text-[#0f1a33]"
              : "text-slate-500 hover:bg-slate-50/80 hover:text-[#0f1a33]"
          }`}
        >
          {moreActive ? (
            <span
              className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-[#c9a454] shadow-[0_0_0_1px_rgba(201,164,84,0.2)]"
              aria-hidden
            />
          ) : null}
          <Ellipsis className="h-[18px] w-[18px] shrink-0" aria-hidden />
          <span className="sr-only">Más</span>
        </button>

        {moreOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[55]"
              aria-label="Cerrar menú Más"
              onClick={() => setMoreOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={popoverTitleId}
              className="absolute bottom-full left-full z-[60] mb-1 ml-2 w-44 rounded-xl border border-slate-200/90 bg-white py-1 shadow-[0_8px_28px_-12px_rgba(15,26,51,0.2)]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                <p id={popoverTitleId} className="text-[13px] font-medium text-[#0f1a33]">
                  Más
                </p>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                  aria-label="Cerrar"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
              <nav className="px-1 py-1" aria-label="Opciones secundarias">
                {PLANNER_RAIL_MORE_NAV_IDS.map((id) => {
                  const item = getPlannerNavItem(id);
                  if (!item) return null;
                  const Icon = item.icon;
                  const isActive = activeId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        onNavigate(id);
                        setMoreOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors ${
                        isActive ? "bg-slate-50 text-[#0f1a33]" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </>
        ) : null}
      </div>
    </aside>
  );
}
