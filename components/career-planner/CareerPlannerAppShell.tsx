"use client";

import type { ReactNode } from "react";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { plannerShellBg } from "./planner-surface";

type CareerPlannerAppShellProps = {
  children: ReactNode;
  /** Omitir (undefined) oculta la barra de 4 pasos: solo necesaria en onboarding/reviewMode. */
  stepNav?: ReactNode;
  bottomNav?: ReactNode;
  /** Contenedor del <main>: permite un ancho de app amplio en el dashboard normal. */
  contentClassName?: string;
  /**
   * "light" (por defecto): fondo claro del planner, usado en onboarding y reviewMode.
   * "navy": el dashboard normal post-onboarding vive directamente sobre fondo navy a
   * pantalla completa (sin card contenedora); el max-width solo limita el contenido.
   */
  surface?: "light" | "navy";
};

const defaultContentClassName =
  "mx-auto w-full min-w-0 max-w-[1120px] px-3 py-4 pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-5 md:pb-12";

export function CareerPlannerAppShell({
  children,
  stepNav,
  bottomNav,
  contentClassName,
  surface = "light",
}: CareerPlannerAppShellProps) {
  const isNavy = surface === "navy";
  return (
    <div
      className={`relative flex min-h-[100dvh] flex-col ${
        isNavy ? "bg-[#080F1F] text-slate-200" : `${plannerShellBg} text-[#0f1a33]`
      }`}
    >
      <FlyPathPlatformHeader
        pageTitle="Career Planner"
        currentModuleId="planner"
        integratedShell
      />
      <div className="relative flex min-h-0 flex-1 flex-col">
        {stepNav ? <div className="hidden md:block">{stepNav}</div> : null}
        <main
          className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden ${
            isNavy ? "bg-gradient-to-b from-[#0B1428] via-[#091120] to-[#080F1F]" : ""
          }`}
        >
          <div className={contentClassName ?? defaultContentClassName}>{children}</div>
        </main>
        {bottomNav}
      </div>
    </div>
  );
}
