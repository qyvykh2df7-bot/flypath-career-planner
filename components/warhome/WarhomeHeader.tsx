"use client";

import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import type { WarhomeAdminRole } from "@/lib/warhome/auth";
import { getWarhomePageDetails } from "@/lib/warhome/navigation";

type WarhomeHeaderProps = {
  role: WarhomeAdminRole;
};

export function WarhomeHeader({ role }: WarhomeHeaderProps) {
  const pathname = usePathname();
  const details = getWarhomePageDetails(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#0a1525]/95 backdrop-blur-sm">
      <div className="flex min-h-20 items-center justify-between gap-5 px-5 sm:px-7 lg:px-9 xl:px-11">
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-semibold uppercase text-[#d6ae4f] md:hidden">
            FlyPath Warhome
          </p>
          <h1 className="truncate text-xl font-semibold text-white sm:text-2xl">{details.title}</h1>
          <p className="mt-1 hidden truncate text-sm text-slate-400 sm:block">{details.subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2">
          <ShieldCheck className="h-4 w-4 text-[#d6ae4f]" aria-hidden />
          <span className="text-xs text-slate-400">Rol</span>
          <span className="text-sm font-semibold capitalize text-slate-200">{role}</span>
        </div>
      </div>
    </header>
  );
}
