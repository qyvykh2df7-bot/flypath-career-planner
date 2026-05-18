"use client";

import Link from "next/link";
import { Compass } from "lucide-react";

type PlannerAppBarProps = {
  onGoToRecovery?: () => void;
};

const linkClass =
  "inline-flex min-h-[36px] items-center justify-center rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[12px] font-semibold text-white transition hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/45 sm:px-3 sm:text-[13px]";

export function PlannerAppBar({ onGoToRecovery }: PlannerAppBarProps) {
  return (
    <header className="border-b border-[#0f1a33]/20 bg-[#0f1a33]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold leading-tight text-white sm:text-[15px]">
            ATPL Planner
          </p>
          <p className="mt-0.5 hidden truncate text-[11px] text-slate-400 sm:block">
            PPL / ATPL Study Tool
          </p>
        </div>

        <nav
          className="flex shrink-0 items-center gap-1.5 sm:gap-2"
          aria-label="Accesos del ATPL Planner"
        >
          <Link href="/" className={linkClass}>
            Inicio
          </Link>
          <Link href="/clases-ppl-atpl" className={linkClass}>
            <span className="sm:hidden">Clases</span>
            <span className="hidden sm:inline">Clases PPL/ATPL</span>
          </Link>
          {onGoToRecovery ? (
            <button
              type="button"
              onClick={onGoToRecovery}
              className={`${linkClass} hidden md:inline-flex gap-1.5`}
            >
              <Compass className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              Estoy perdido
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
