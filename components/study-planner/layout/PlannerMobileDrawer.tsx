"use client";

import { useEffect } from "react";
import { PlannerNavList } from "./PlannerNavList";
import type { PlannerNavId } from "./planner-nav";

type PlannerMobileDrawerProps = {
  open: boolean;
  activeId: PlannerNavId;
  onClose: () => void;
  onNavigate: (id: PlannerNavId) => void;
};

export function PlannerMobileDrawer({
  open,
  activeId,
  onClose,
  onNavigate,
}: PlannerMobileDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-x-0 bottom-0 top-[var(--flypath-header-h,4.5rem)] z-40 bg-[#0f1a33]/25 backdrop-blur-[1px] md:hidden"
        aria-label="Cerrar menú"
        onClick={onClose}
      />
      <aside
        className="fixed bottom-0 left-0 top-[var(--flypath-header-h,4.5rem)] z-50 flex w-[min(280px,88vw)] flex-col border-r border-[#e8e4dc]/90 bg-[#f5f3ee] shadow-xl md:hidden"
        aria-label="Navegación del planner"
      >
        <div className="border-b border-[#e5e1d8]/80 px-4 pb-4 pt-4">
          <p className="text-[12px] font-medium text-slate-500">Tu semana de estudio</p>
          <div className="mt-3 h-px w-10 bg-gradient-to-r from-[#c9a454] to-transparent" aria-hidden />
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3">
          <PlannerNavList
            activeId={activeId}
            onNavigate={(id) => {
              onNavigate(id);
              onClose();
            }}
          />
        </nav>
      </aside>
    </>
  );
}
