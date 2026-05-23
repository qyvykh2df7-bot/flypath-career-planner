"use client";

import { useEffect, useId, useState } from "react";
import { Ellipsis, Settings2, X } from "lucide-react";
import { getCareerPlannerNavItem, type CareerPlannerTab } from "./career-planner-nav";

const MOBILE_PRIMARY_TAB_IDS: CareerPlannerTab[] = ["route", "cost", "schools", "report"];

type CareerPlannerBottomNavProps = {
  activeTab: CareerPlannerTab;
  onNavigate: (tab: CareerPlannerTab) => void;
  onEditData: () => void;
};

export function CareerPlannerBottomNav({ activeTab, onNavigate, onEditData }: CareerPlannerBottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const sheetTitleId = useId();

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  const handleEditData = () => {
    onEditData();
    setMoreOpen(false);
  };

  return (
    <>
      {moreOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-[#0f1a33]/30 backdrop-blur-[2px] transition-opacity duration-200 md:hidden"
            aria-label="Cerrar menú Más"
            onClick={() => setMoreOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={sheetTitleId}
            className="fixed inset-x-0 bottom-0 z-[70] rounded-t-2xl border border-slate-200/90 bg-white shadow-[0_-12px_40px_-16px_rgba(15,26,51,0.25)] transition-transform duration-200 ease-out md:hidden"
            style={{
              paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p id={sheetTitleId} className="text-[15px] font-semibold text-[#0f1a33]">
                Más
              </p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-full p-2 text-slate-500 transition-[background-color,color] duration-200 hover:bg-slate-100 hover:text-[#0f1a33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ea8]/30"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <nav className="px-2 py-2" aria-label="Más opciones del Career Planner">
              <button
                type="button"
                onClick={handleEditData}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[14px] font-medium text-slate-600 transition-[background-color,color] duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3b6ea8]/25"
              >
                <Settings2 className="h-5 w-5 shrink-0 text-slate-400" strokeWidth={1.65} aria-hidden />
                <span>Editar datos</span>
              </button>
            </nav>
          </div>
        </>
      ) : null}

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/95 backdrop-blur-md shadow-[0_-4px_24px_-12px_rgba(15,26,51,0.12)] md:hidden"
        style={{
          paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))",
        }}
        aria-label="Navegación principal del Career Planner"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-0.5 px-1 pt-1.5">
          {MOBILE_PRIMARY_TAB_IDS.map((id) => {
            const item = getCareerPlannerNavItem(id);
            if (!item) return null;
            const Icon = item.icon;
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 transition-[color,background-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ea8]/35 active:scale-[0.97] ${
                  isActive ? "text-[#0f1a33]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-[background-color,box-shadow] duration-200 ${
                    isActive ? "bg-slate-100 shadow-[inset_0_-2px_0_0_#c9a454]" : "bg-transparent"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.65} aria-hidden />
                </span>
                <span className="max-w-full truncate px-0.5 text-[12px] font-medium leading-tight">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label="Más opciones"
            aria-expanded={moreOpen}
            className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 transition-[color,background-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ea8]/35 active:scale-[0.97] ${
              moreOpen ? "text-[#0f1a33]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-[background-color,box-shadow] duration-200 ${
                moreOpen ? "bg-slate-100 shadow-[inset_0_-2px_0_0_#c9a454]" : "bg-transparent"
              }`}
            >
              <Ellipsis className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <span className="text-[12px] font-medium leading-tight">Más</span>
          </button>
        </div>
      </nav>
    </>
  );
}
