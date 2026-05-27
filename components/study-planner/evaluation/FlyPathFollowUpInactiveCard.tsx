"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { CLASSES_BOOKING_PATH } from "../calendar/calendar-session-types";
import { plannerMetricCard } from "@/lib/study-planner/planner-ui";

export function FlyPathFollowUpInactiveCard() {
  return (
    <section className={`${plannerMetricCard} space-y-2.5`}>
      <div className="flex items-start gap-2.5">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        <div className="min-w-0 space-y-1.5">
          <h3 className="text-[14px] font-semibold text-[#0f1a33]">
            Seguimiento FlyPath no activo
          </h3>
          <p className="text-[13px] leading-relaxed text-slate-600">
            Puedes usar el planner gratis. El seguimiento personalizado con comentarios, tareas y
            planificación del profesor está disponible en las clases con seguimiento FlyPath.
          </p>
        </div>
      </div>
      <Link
        href={CLASSES_BOOKING_PATH}
        className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#c9a454]/40 bg-[#fff8e8]/60 px-4 text-[13px] font-semibold text-[#7a5a16] transition hover:border-[#c9a454]/55 hover:bg-[#fffdf8] hover:text-[#0f1a33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
      >
        Ver clases con seguimiento
      </Link>
    </section>
  );
}
