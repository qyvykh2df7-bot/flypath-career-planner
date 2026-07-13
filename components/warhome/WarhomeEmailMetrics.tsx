import { CheckCircle2, CircleAlert, Clock3, Mail } from "lucide-react";

import type { WarhomeEmailMetrics as WarhomeEmailMetricsData } from "@/lib/warhome/emails";

type WarhomeEmailMetricsProps = {
  metrics: WarhomeEmailMetricsData;
};

export function WarhomeEmailMetrics({ metrics }: WarhomeEmailMetricsProps) {
  const cards = [
    { label: "Total de jobs", value: metrics.totalJobs, detail: "Registro global", icon: Mail },
    { label: "Enviados", value: metrics.sentJobs, detail: "Jobs confirmados", icon: CheckCircle2 },
    { label: "Pendientes", value: metrics.pendingJobs, detail: "Esperando procesamiento", icon: Clock3 },
    { label: "Fallidos", value: metrics.failedJobs, detail: "Requieren revisión", icon: CircleAlert },
  ];

  return (
    <section aria-label="Resumen global de emails operativos">
      <p className="mb-3 text-xs font-semibold uppercase text-slate-500">
        Resumen global de emails operativos
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="rounded-lg border border-white/[0.08] bg-[#0d192a] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.11)]">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-slate-400">{card.label}</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#d6ae4f]/20 bg-[#d6ae4f]/10">
                  <Icon className="h-4 w-4 text-[#e3bc62]" aria-hidden />
                </span>
              </div>
              <p className="mt-4 text-2xl font-semibold text-white">{card.value}</p>
              <p className="mt-1 text-xs text-slate-500">{card.detail}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
