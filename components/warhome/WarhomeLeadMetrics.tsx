import {
  Database,
  Layers3,
  RadioTower,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import {
  WARHOME_LEAD_FUNNEL_STAGES,
  WARHOME_LEAD_STAGE_LABELS,
  type WarhomeLeadMetrics,
} from "@/lib/warhome/leads";

type WarhomeLeadMetricsProps = {
  metrics: WarhomeLeadMetrics;
};

type MetricCard = {
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
};

export function WarhomeLeadMetrics({ metrics }: WarhomeLeadMetricsProps) {
  const activeStages = WARHOME_LEAD_FUNNEL_STAGES.filter(
    (stage) => metrics.leadsByStage[stage] > 0,
  );
  const stageDetail = activeStages.length
    ? activeStages
        .map((stage) => `${WARHOME_LEAD_STAGE_LABELS[stage]}: ${metrics.leadsByStage[stage]}`)
        .join(" · ")
    : "Sin etapas registradas";
  const cards: MetricCard[] = [
    {
      label: "Total de leads",
      value: metrics.totalLeads,
      detail: "Base actual",
      icon: UsersRound,
    },
    {
      label: "Leads activos",
      value: metrics.activeLeads,
      detail: "Estado operativo activo",
      icon: RadioTower,
    },
    {
      label: "Etapas activas",
      value: activeStages.length,
      detail: stageDetail,
      icon: Layers3,
    },
    {
      label: "Fuentes distintas",
      value: metrics.distinctSources,
      detail: "Orígenes registrados",
      icon: Database,
    },
  ];

  return (
    <div>
      <p className="mb-3 text-xs text-slate-500">Resumen global de la base de leads</p>
      <section aria-label="Resumen de leads" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article key={card.label} className="min-h-32 rounded-lg border border-white/[0.08] bg-[#0d192a] p-4 shadow-[0_10px_28px_rgba(0,0,0,0.1)]">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-slate-400">{card.label}</p>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#d6ae4f]/20 bg-[#d6ae4f]/10">
                <Icon className="h-4 w-4 text-[#d6ae4f]" aria-hidden />
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-white">{card.value}</p>
            <p className="mt-1 truncate text-xs text-slate-500" title={card.detail}>
              {card.detail}
            </p>
          </article>
        );
      })}
      </section>
    </div>
  );
}
