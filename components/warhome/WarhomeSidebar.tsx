"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { logoutWarhome } from "@/lib/warhome/actions";
import type { WarhomeAdminRole } from "@/lib/warhome/auth";
import {
  getActiveWarhomeNavigationId,
  WARHOME_NAVIGATION,
} from "@/lib/warhome/navigation";
import { WarhomeNavItem } from "./WarhomeNavItem";

type WarhomeSidebarProps = {
  role: WarhomeAdminRole;
};

export function WarhomeSidebar({ role }: WarhomeSidebarProps) {
  const pathname = usePathname();
  const activeId = getActiveWarhomeNavigationId(pathname);
  const mvpItems = WARHOME_NAVIGATION.filter((item) => item.group === "mvp");
  const futureItems = WARHOME_NAVIGATION.filter((item) => item.group === "future");

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col border-r border-white/[0.07] bg-[#07111f] md:flex lg:w-64">
      <div className="flex h-20 shrink-0 items-center border-b border-white/[0.07] px-4 lg:px-5">
        <div className="hidden min-w-0 items-center gap-3 lg:flex">
          <Image
            src="/flypath-logo-white.webp"
            alt="FlyPath"
            width={540}
            height={162}
            className="h-auto w-[118px] object-contain object-left"
            sizes="118px"
            priority
          />
          <span className="h-7 w-px bg-white/12" aria-hidden />
          <span className="text-xs font-semibold text-[#e3bc62]">WARHOME</span>
        </div>
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-[#d6ae4f]/25 bg-[#d6ae4f]/10 lg:hidden">
          <ShieldCheck className="h-5 w-5 text-[#e3bc62]" aria-hidden />
        </div>
      </div>

      <nav aria-label="Navegación de Warhome" className="min-h-0 flex-1 overflow-y-auto px-3 py-5 lg:px-4">
        <p className="mb-2 hidden px-3 text-[11px] font-semibold uppercase text-slate-500 lg:block">
          Operación
        </p>
        <div className="space-y-1">
          {mvpItems.map((item) => (
            <WarhomeNavItem key={item.id} item={item} active={activeId === item.id} />
          ))}
        </div>

        <div className="my-5 border-t border-white/[0.07]" />
        <p className="mb-2 hidden px-3 text-[11px] font-semibold uppercase text-slate-500 lg:block">
          Expansión
        </p>
        <div className="space-y-1">
          {futureItems.map((item) => (
            <WarhomeNavItem key={item.id} item={item} active={false} />
          ))}
        </div>
      </nav>

      <div className="shrink-0 border-t border-white/[0.07] p-3 lg:p-4">
        <div className="mb-3 hidden items-center gap-3 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 lg:flex">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#d6ae4f]/10 text-[#e3bc62]">
            <ShieldCheck className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Acceso interno</p>
            <p className="truncate text-sm font-semibold capitalize text-slate-200">{role}</p>
          </div>
        </div>
        <form action={logoutWarhome}>
          <button
            type="submit"
            title="Cerrar sesión"
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] px-3 text-sm font-medium text-slate-300 transition hover:border-[#d6ae4f]/30 hover:bg-white/[0.035] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ae4f]/40 lg:justify-start"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden />
            <span className="hidden lg:inline">Cerrar sesión</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
