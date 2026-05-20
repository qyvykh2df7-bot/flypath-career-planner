"use client";

import type { EvaluationPriorityGroups } from "@/lib/study-planner/evaluation-presentation";

type EvaluationPriorityPanelProps = {
  groups: EvaluationPriorityGroups;
};

function PriorityColumn({
  title,
  tone,
  items,
  emptyLabel,
}: {
  title: string;
  tone: "urgent" | "mid" | "good";
  items: { title: string; detail: string }[];
  emptyLabel: string;
}) {
  const headClass =
    tone === "urgent"
      ? "text-amber-900"
      : tone === "good"
        ? "text-emerald-800"
        : "text-[#1e4a7a]";

  return (
    <div className="min-w-0 flex-1 rounded-lg bg-white/70 px-2.5 py-2 ring-1 ring-slate-200/30">
      <p className={`text-[10px] font-semibold uppercase tracking-wide ${headClass}`}>{title}</p>
      {items.length === 0 ? (
        <p className="mt-1.5 text-[11px] text-slate-400">{emptyLabel}</p>
      ) : (
        <ul className="mt-1.5 space-y-1.5">
          {items.map((item) => (
            <li key={`${title}-${item.title}`}>
              <p className="text-[12px] font-semibold text-[#0f1a33]">{item.title}</p>
              <p className="text-[10px] leading-snug text-slate-500">{item.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EvaluationPriorityPanel({ groups }: EvaluationPriorityPanelProps) {
  const hasAny =
    groups.immediate.length > 0 ||
    groups.improving.length > 0 ||
    groups.performing.length > 0;

  if (!hasAny) return null;

  return (
    <section className="space-y-2">
      <h3 className="text-[12px] font-semibold text-[#0f1a33]">Riesgos y prioridades</h3>
      <div className="flex flex-col gap-2 sm:flex-row">
        <PriorityColumn
          title="Atención inmediata"
          tone="urgent"
          items={groups.immediate}
          emptyLabel="Nada urgente ahora"
        />
        <PriorityColumn
          title="Mejorando"
          tone="mid"
          items={groups.improving}
          emptyLabel="Sin focos en mejora"
        />
        <PriorityColumn
          title="Buen rendimiento"
          tone="good"
          items={groups.performing}
          emptyLabel="Aún sin asignaturas fuertes"
        />
      </div>
    </section>
  );
}
