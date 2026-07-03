"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Plane } from "lucide-react";
import { FlyPathPlatformModuleMenu } from "@/components/FlyPathPlatformModuleMenu";
type FlyPathPlatformHeaderProps = {
  pageTitle: string;
  currentModuleId: string;
  logoMode?: "default" | "landing";
  /** Career Planner: header más plano para continuidad con el rail azul. */
  integratedShell?: boolean;
  onSoonClick?: (message?: string) => void;
};

export function FlyPathPlatformHeader({
  pageTitle,
  currentModuleId,
  logoMode = "default",
  integratedShell = false,
  onSoonClick,
}: FlyPathPlatformHeaderProps) {
  const [logoFallback, setLogoFallback] = useState(false);
  const [landingLogoPhase, setLandingLogoPhase] = useState<"white" | "fallback">("white");

  return (
    <header
      className={`relative z-50 overflow-visible border-b border-white/10 bg-header-navy text-white ${
        integratedShell
          ? "shadow-[0_1px_0_rgba(255,255,255,0.06)]"
          : "shadow-[0_12px_40px_rgba(15,26,51,0.35)]"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 overflow-visible px-6 py-3 sm:gap-4 md:justify-normal md:gap-4 lg:px-10">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:flex-none md:min-w-0 md:flex-1 md:justify-start">
          <Link href="/" className="min-w-0 shrink">
            {logoMode === "landing" ? (
              landingLogoPhase !== "fallback" ? (
                <div className="relative flex h-12 max-h-[60px] w-[180px] shrink-0 items-center sm:h-[54px] sm:max-h-[58px] sm:w-[220px] md:max-h-[60px] md:w-[252px] lg:w-[268px]">
                  <Image
                    src="/flypath-logo-white.png"
                    alt="FlyPath"
                    width={540}
                    height={162}
                    className="h-auto max-h-12 w-auto max-w-full object-contain object-left sm:max-h-[54px] md:max-h-[58px] lg:max-h-[60px]"
                    sizes="(max-width: 640px) 180px, (max-width: 768px) 220px, (max-width: 1024px) 252px, 268px"
                    priority
                    onError={() => setLandingLogoPhase("fallback")}
                  />
                </div>
              ) : (
                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#c9a454]/15 ring-1 ring-[#c9a454]/35">
                    <Plane className="h-4 w-4 text-[#f2ddaa]" aria-hidden />
                  </div>
                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-sm font-semibold tracking-tight text-white sm:text-base">
                      FlyPath Career Planner
                    </p>
                    <p className="truncate text-sm text-white/60">Diagnóstico antes de elegir escuela</p>
                  </div>
                </div>
              )
            ) : !logoFallback ? (
              <div className="relative flex h-12 max-h-[60px] w-[180px] shrink-0 items-center sm:h-[54px] sm:max-h-[58px] sm:w-[220px] md:max-h-[60px] md:w-[252px] lg:w-[268px]">
                <Image
                  src="/flypath-logo-white.png"
                  alt="FlyPath — inicio"
                  width={540}
                  height={162}
                  className="h-auto max-h-12 w-auto max-w-full object-contain object-left sm:max-h-[54px] md:max-h-[58px] lg:max-h-[60px]"
                  sizes="(max-width: 640px) 180px, (max-width: 768px) 220px, (max-width: 1024px) 252px, 268px"
                  priority
                  onError={() => setLogoFallback(true)}
                />
              </div>
            ) : (
              <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#c9a454]/15 ring-1 ring-[#c9a454]/35">
                  <Plane className="h-4 w-4 text-[#f2ddaa]" aria-hidden />
                </div>
                <p className="truncate text-sm font-semibold tracking-tight text-white sm:text-base">FlyPath</p>
              </div>
            )}
          </Link>
        </div>
        <p
          className="pointer-events-none hidden min-w-0 select-none truncate text-center text-sm font-medium tracking-[0.14em] text-[#f2ddaa]/90 md:flex md:flex-1 md:items-center md:justify-center"
          aria-hidden
        >
          {pageTitle}
        </p>
        <div className="flex shrink-0 items-center md:min-w-0 md:flex-1 md:justify-end">
          <FlyPathPlatformModuleMenu
            currentModuleId={currentModuleId}
            onSoonClick={onSoonClick}
            menuAlignClassName="right-0 lg:right-0"
          />
        </div>
      </div>
    </header>
  );
}
