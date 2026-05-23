"use client";

import type { ReactNode } from "react";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { CareerPlannerBottomNav } from "./CareerPlannerBottomNav";
import { CareerPlannerRail } from "./CareerPlannerRail";
import type { CareerPlannerTab } from "./career-planner-nav";

type CareerPlannerDashboardShellProps = {
  activeTab: CareerPlannerTab;
  onNavigate: (tab: CareerPlannerTab) => void;
  onEditData: () => void;
  children: ReactNode;
};

export function CareerPlannerDashboardShell({
  activeTab,
  onNavigate,
  onEditData,
  children,
}: CareerPlannerDashboardShellProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f6f7f9] text-[#0f1a33]">
      <FlyPathPlatformHeader
        pageTitle="Planifica tu Ruta"
        currentModuleId="planner"
        integratedShell
      />
      <div className="relative flex min-h-0 flex-1 items-stretch overflow-hidden">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-[4.25rem] border-r border-white/10 bg-[#0f1a33] md:block"
          aria-hidden
        />
        <CareerPlannerRail activeTab={activeTab} onNavigate={onNavigate} onEditData={onEditData} />
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f6f7f9]">
          <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4 sm:px-6 sm:pt-5 md:pb-7 md:pt-5 md:pl-5 lg:pl-6">
            <div className="mx-auto w-full min-w-0 max-w-[1120px]">{children}</div>
          </main>
        </div>
      </div>
      <CareerPlannerBottomNav activeTab={activeTab} onNavigate={onNavigate} onEditData={onEditData} />
    </div>
  );
}
