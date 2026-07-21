"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";
import { useAppState } from "@/lib/aerocomms/appState";
import { currentLevel } from "@/lib/aerocomms/content";

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/aerocomms/app/today", label: "Dashboard" },
  { href: "/aerocomms/app/train", label: "Train" },
  { href: "/aerocomms/app/atc-sim", label: "ATC Missions" },
];

const BellIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);

/**
 * Desktop/web top navigation — `lg` breakpoint and above only.
 * Mobile keeps `BottomNav`; this component renders nothing below `lg`.
 */
export default function DesktopNav() {
  const pathname = usePathname();
  const { state, access } = useAppState();

  const isPro = access.isPro;
  const completed = new Set(state.completedExercises);
  const level = currentLevel(completed, isPro);
  const initial = (state.name?.[0] ?? "P").toUpperCase();

  return (
    <header className="relative z-50 hidden shrink-0 border-b border-white/10 bg-[#0A1526]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0A1526]/80 lg:block">
      <div className="mx-auto flex h-16 max-w-[1360px] items-center gap-8 px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/flypath-logo-white.webp"
            alt="FlyPath"
            width={120}
            height={32}
            className="h-8 w-auto object-contain object-left"
            sizes="120px"
          />
          <span className="text-[15px] font-extrabold tracking-tight text-white">AeroComms</span>
        </Link>

        <nav className="flex flex-1 items-center gap-6">
          {NAV_ITEMS.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex h-16 items-center border-b-2 text-[12.5px] font-bold uppercase tracking-[0.08em] transition-colors ${
                  isActive
                    ? "border-[#FACC15] text-[#FACC15]"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10"
            aria-label="Notifications"
          >
            <BellIcon className="h-[17px] w-[17px]" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#FACC15] ring-2 ring-[#0A1526]" />
          </button>

          <Link
            href="/aerocomms/app/profile"
            className="flex items-center gap-2.5 rounded-xl border border-transparent px-1.5 py-1 transition-colors hover:border-white/10 hover:bg-white/5"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold text-[#FACC15]"
              style={{ background: "rgba(250,204,21,0.14)", boxShadow: "inset 0 0 0 1px rgba(250,204,21,0.3)" }}
            >
              {initial}
            </span>
            <span className="hidden text-left leading-tight xl:block">
              <span className="block text-[12.5px] font-semibold text-white">{state.name}</span>
              <span className="block text-[10.5px] text-slate-400">{level.name}</span>
            </span>
            <svg viewBox="0 0 24 24" className="hidden h-3.5 w-3.5 text-slate-500 xl:block" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </Link>

          {!isPro && (
            <Link
              href="/aerocomms/app/paywall"
              className="rounded-full bg-[#FACC15] px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-[#07111F] shadow-[0_10px_24px_-10px_rgba(250,204,21,0.7)] transition-colors hover:bg-[#EAB308]"
            >
              Upgrade Pro
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
