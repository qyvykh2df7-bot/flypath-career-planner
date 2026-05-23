"use client";

import type { ReactNode } from "react";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { PlannerBottomNav } from "./PlannerBottomNav";
import { PlannerRail } from "./PlannerRail";
import { PlannerTopbar } from "./PlannerTopbar";
import type { PlannerNavId } from "./planner-nav";

type PlannerShellProps = {
  activeNavId: PlannerNavId;
  onNavigate: (id: PlannerNavId) => void;
  onOpenSettings: () => void;
  narrowWorkspace?: boolean;
  wideWorkspace?: boolean;
  children: ReactNode;
};

export function PlannerShell({
  activeNavId,
  onNavigate,
  onOpenSettings,
  narrowWorkspace = false,
  wideWorkspace = false,
  children,
}: PlannerShellProps) {
  const widthClass = narrowWorkspace
    ? "max-w-2xl"
    : wideWorkspace
      ? "max-w-7xl"
      : "max-w-5xl";

  const mainPadding = wideWorkspace
    ? "px-3 py-4 pb-24 sm:px-5 sm:py-5 md:pb-5"
    : narrowWorkspace
      ? "px-4 py-3 pb-24 sm:px-6 sm:py-4 md:pb-4"
      : "px-4 py-5 pb-24 sm:px-8 sm:py-6 md:pb-6";

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f6f7f9]">
      <FlyPathPlatformHeader pageTitle="ATPL Planner" currentModuleId="atpl" />
      <div className="flex min-h-0 flex-1">
        <PlannerRail activeId={activeNavId} onNavigate={onNavigate} />
        <div className="flex min-w-0 flex-1 flex-col">
          <PlannerTopbar activeNavId={activeNavId} onOpenSettings={onOpenSettings} />
          <main
            className={`flex-1 overflow-y-auto text-[14px] leading-relaxed text-[#0f1a33] antialiased ${mainPadding}`}
          >
            <div className={`mx-auto w-full ${widthClass}`}>{children}</div>
          </main>
        </div>
      </div>
      <PlannerBottomNav activeId={activeNavId} onNavigate={onNavigate} />
    </div>
  );
}
