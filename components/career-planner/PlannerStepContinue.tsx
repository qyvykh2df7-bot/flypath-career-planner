import type { ReactNode } from "react";

type PlannerStepContinueProps = {
  children: ReactNode;
};

/** CTA de paso dentro del panel principal (evita barra fija que tapa QA). */
export function PlannerStepContinue({ children }: PlannerStepContinueProps) {
  return (
    <div className="mt-6 flex justify-end border-t border-white/10 pt-5 sm:mt-7">
      <div className="w-full sm:w-auto">{children}</div>
    </div>
  );
}
