"use client";

import { useState, type ReactNode } from "react";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { PlannerSidebar } from "./PlannerSidebar";
import { PlannerMobileDrawer } from "./PlannerMobileDrawer";
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleNavigate = (id: PlannerNavId) => {
    onNavigate(id);
    setMobileNavOpen(false);
  };

  const widthClass = narrowWorkspace
    ? "max-w-2xl"
    : wideWorkspace
      ? "max-w-6xl"
      : "max-w-4xl";

  const mainPadding = wideWorkspace
    ? "px-3 py-4 sm:px-5 sm:py-5"
    : narrowWorkspace
      ? "px-4 py-2 sm:px-6 sm:py-3"
      : "px-4 py-5 sm:px-8 sm:py-6";

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f6f7f9]">
      <FlyPathPlatformHeader pageTitle="ATPL Planner" currentModuleId="atpl" />
      <PlannerMobileDrawer
        open={mobileNavOpen}
        activeId={activeNavId}
        onClose={() => setMobileNavOpen(false)}
        onNavigate={handleNavigate}
      />
      <div className="flex min-h-0 flex-1">
        <PlannerSidebar activeId={activeNavId} onNavigate={handleNavigate} />
        <div className="flex min-w-0 flex-1 flex-col">
          <PlannerTopbar
            activeNavId={activeNavId}
            onOpenPlannerNav={() => setMobileNavOpen(true)}
            onOpenSettings={onOpenSettings}
          />
          <main className={`flex-1 overflow-y-auto ${mainPadding}`}>
            <div className={`mx-auto w-full ${widthClass}`}>{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
