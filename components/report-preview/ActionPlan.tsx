import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";
import { SectionTitle } from "./report-preview-layouts";

type ActionPlanProps = {
  snapshot: ReportSnapshotV1;
};

const PHASES = [
  { key: "sevenDays", days: 7, hint: "Inmediato" },
  { key: "thirtyDays", days: 30, hint: "Consolidar" },
  { key: "ninetyDays", days: 90, hint: "Trimestre" },
] as const;

export function ActionPlan({ snapshot }: ActionPlanProps) {
  const { roadmap, readiness } = snapshot;
  const nextSteps = readiness.proximosPasos.slice(0, 3);

  return (
    <div>
      <SectionTitle>Hoja de ruta</SectionTitle>

      <div className="space-y-9">
        {PHASES.map(({ key, days, hint }) => {
          const items = roadmap[key].slice(0, 2);
          return (
            <div key={key}>
              <div className="flex items-baseline gap-3">
                <p className="flex shrink-0 items-baseline gap-1 whitespace-nowrap font-serif text-xl text-[#c9a454]">
                  <span className="tabular-nums">{days}</span>
                  <span>días</span>
                </p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{hint}</p>
              </div>
              <ul className="mt-3 space-y-2.5 border-l border-[#c9a454]/40 pl-5">
                {items.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-[#0f1a33]">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {nextSteps.length > 0 ? (
        <div className="mt-11 border-t border-[#0f1a33]/10 pt-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Próximos 3 pasos
          </p>
          <ol className="mt-5 space-y-4">
            {nextSteps.map((step, i) => (
              <li key={step} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0f1a33] text-xs font-semibold text-[#faf8f4]">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-sm leading-relaxed text-slate-700">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
