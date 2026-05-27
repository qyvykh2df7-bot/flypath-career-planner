import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";
import { FlyPathInsight } from "./FlyPathInsight";
import {
  formatPriorityAction,
  routeInsightMessage,
} from "./report-preview-utils";

type RouteRecommendationProps = {
  snapshot: ReportSnapshotV1;
};

const ROUTE_KEYS = [
  { key: "Integrada", scoreKey: "integrated" as const },
  { key: "Modular", scoreKey: "modular" as const },
  { key: "Preparación", scoreKey: "prep" as const },
];

function isPriorityWarning(warning: string): boolean {
  return /^Prioridad:/i.test(warning);
}

export function RouteRecommendation({ snapshot }: RouteRecommendationProps) {
  const { routeRecommendation: route } = snapshot;
  const maxScore = Math.max(route.scores.integrated, route.scores.modular, route.scores.prep, 1);
  const priorityWarnings = route.warnings.filter(isPriorityWarning);
  const otherWarnings = route.warnings.filter((w) => !isPriorityWarning(w));

  return (
    <div>
      <h2 className="font-serif text-3xl font-medium tracking-tight text-[#0f1a33] sm:text-[2rem]">
        Ruta recomendada
      </h2>
      <p className="mt-4 text-sm uppercase tracking-[0.22em] text-[#c9a454]">{route.recommended}</p>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600">{route.reason}</p>

      <FlyPathInsight className="mt-10">
        {routeInsightMessage(route.recommended, route.principalBlock)}
      </FlyPathInsight>

      <div className="mt-14 space-y-8">
        {ROUTE_KEYS.map(({ key, scoreKey }) => {
          const score = route.scores[scoreKey];
          const isRecommended = route.recommended === key;
          const widthPct = Math.round((score / maxScore) * 100);

          return (
            <div key={key}>
              <div className="mb-2.5 flex items-baseline justify-between gap-4">
                <span
                  className={`text-sm font-medium ${isRecommended ? "text-[#0f1a33]" : "text-slate-500"}`}
                >
                  {key}
                  {isRecommended ? (
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c9a454]">
                      Recomendada
                    </span>
                  ) : null}
                </span>
                <span className="tabular-nums text-sm text-slate-600">{score}</span>
              </div>
              <div className="h-1.5 overflow-hidden bg-[#0f1a33]/6">
                <div
                  className={`h-full ${isRecommended ? "bg-gradient-to-r from-[#c9a454] to-[#e8c97a]" : "bg-slate-300/80"}`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-14 border-t border-[#0f1a33]/10 pt-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Bloqueo principal
        </p>
        <p className="mt-3 font-serif text-2xl text-[#0f1a33]">{route.principalBlock}</p>
      </div>

      {priorityWarnings.length > 0 ? (
        <div className="mt-10 space-y-6">
          {priorityWarnings.map((warning) => (
            <div
              key={warning}
              className="relative border-l-4 border-[#c9a454] bg-gradient-to-r from-[#c9a454]/10 to-transparent py-7 pl-7 pr-4 sm:py-8 sm:pl-9"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8a6520]">
                Prioridad · Acción ahora
              </p>
              <p className="mt-4 font-serif text-2xl leading-snug text-[#0f1a33] sm:text-[1.65rem]">
                {formatPriorityAction(warning)}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {otherWarnings.length > 0 ? (
        <ul className="mt-10 space-y-4 border-t border-[#0f1a33]/8 pt-8">
          {otherWarnings.map((warning) => (
            <li key={warning} className="text-sm leading-relaxed text-slate-700">
              <span className="mr-2 text-[#c9a454]" aria-hidden>
                —
              </span>
              {warning}
            </li>
          ))}
        </ul>
      ) : null}

      {route.conflicts.length > 0 ? (
        <div className="mt-12 border-t border-[#0f1a33]/10 pt-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Conflictos detectados
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {route.conflicts.map((conflict) => (
              <li key={conflict}>{conflict}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
