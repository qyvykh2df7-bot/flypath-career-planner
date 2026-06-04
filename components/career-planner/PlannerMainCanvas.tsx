"use client";

import type { ReactNode } from "react";
import { plannerCanvas, plannerFooterDivider } from "./planner-surface";

type PlannerMainCanvasProps = {
  children: ReactNode;
  footer?: ReactNode;
};

/** Card principal navy premium sobre fondo claro del planner. */
export function PlannerMainCanvas({ children, footer }: PlannerMainCanvasProps) {
  return (
    <div className={plannerCanvas}>
      <div className="p-4 sm:p-6 lg:p-7">
        {children}
        {footer ? (
          <div className={plannerFooterDivider}>
            <div className="w-full sm:w-auto">{footer}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
