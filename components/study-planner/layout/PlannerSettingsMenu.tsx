"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, LifeBuoy, Settings2, Target } from "lucide-react";

type PlannerSettingsMenuProps = {
  modeLabel: string;
  onOpenSettings: () => void;
  onOpenRecovery: () => void;
  variant?: "sidebar" | "inline";
};

export function PlannerSettingsMenu({
  modeLabel,
  onOpenSettings,
  onOpenRecovery,
  variant = "sidebar",
}: PlannerSettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const triggerClass =
    variant === "sidebar"
      ? "flex w-full items-start gap-2.5 rounded-lg border-l-2 border-transparent px-2.5 py-2.5 text-left transition hover:border-[#c9a454]/40 hover:bg-[#eeebe4]/90"
      : "inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-slate-500 transition hover:bg-slate-200/60 hover:text-[#0f1a33]";

  return (
    <div ref={rootRef} className={variant === "sidebar" ? "relative px-2" : "relative"}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerClass}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Ajustes del planner"
      >
        <Settings2
          className={`shrink-0 ${variant === "sidebar" ? "mt-0.5 h-[16px] w-[16px] text-[#a5802a]" : "h-[15px] w-[15px] text-slate-400"}`}
          aria-hidden
        />
        {variant === "sidebar" ? (
          <>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-[#0f1a33]">Ajustes del planner</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
                Objetivo · horas · asignaturas
              </span>
            </span>
            <ChevronDown
              className={`mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
              aria-hidden
            />
          </>
        ) : (
          <span>Ajustes</span>
        )}
      </button>
      {open ? (
        <div
          role="menu"
          className={`absolute z-50 overflow-hidden rounded-xl border border-slate-200/90 bg-white py-1 shadow-lg ring-1 ring-black/5 ${
            variant === "sidebar"
              ? "bottom-full left-2 right-2 mb-1.5"
              : "right-0 top-full mt-1.5 w-52"
          }`}
        >
          <div className="border-b border-slate-100 px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
              Modo
            </p>
            <p className="mt-0.5 text-[13px] font-medium text-[#0f1a33]">{modeLabel}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onOpenSettings();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-slate-700 transition hover:bg-[#fff8e8]/80 hover:text-[#7a5a16]"
          >
            <Settings2 className="h-3.5 w-3.5" aria-hidden />
            Configuración
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onOpenSettings();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-slate-700 transition hover:bg-[#fff8e8]/80 hover:text-[#7a5a16]"
          >
            <Target className="h-3.5 w-3.5" aria-hidden />
            Objetivo y horas
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onOpenRecovery();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-slate-700 transition hover:bg-[#fff8e8]/80 hover:text-[#7a5a16]"
          >
            <LifeBuoy className="h-3.5 w-3.5" aria-hidden />
            Recovery
          </button>
          <button
            type="button"
            role="menuitem"
            disabled
            className="flex w-full cursor-not-allowed items-center gap-2 px-3 py-2 text-left text-[13px] text-slate-400"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            Exportar plan
            <span className="ml-auto text-[10px]">Pronto</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
