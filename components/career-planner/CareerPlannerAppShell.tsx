"use client";

import type { ReactNode } from "react";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { plannerShellBg } from "./planner-surface";

type CareerPlannerAppShellProps = {
  children: ReactNode;
  stepNav: ReactNode;
  bottomNav?: ReactNode;
};

export function CareerPlannerAppShell({ children, stepNav, bottomNav }: CareerPlannerAppShellProps) {
  return (
    <div className={`relative flex min-h-[100dvh] flex-col ${plannerShellBg} text-[#0f1a33]`}>
      <FlyPathPlatformHeader
        pageTitle="Career Planner"
        currentModuleId="planner"
        integratedShell
      />
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="hidden md:block">{stepNav}</div>
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto w-full min-w-0 max-w-[1120px] px-3 py-4 pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-5 md:pb-12">
            {children}
          </div>
        </main>
        {bottomNav}
      </div>
    </div>
  );
}
