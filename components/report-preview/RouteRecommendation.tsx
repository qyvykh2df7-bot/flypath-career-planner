import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";
import { SectionTitle } from "./report-preview-layouts";
import { FlyPathInsight } from "./FlyPathInsight";
import { formatPriorityAction, routeInsightMessage } from "./report-preview-utils";

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
  const priority = route.warnings.find(isPriorityWarning);
  const showInsight =
    route.principalBlock !== "Ningún bloqueo crítico" && route.principalBlock.length > 0;

  return (
    <div>
      <SectionTitle>{route.recommended}</SectionTitle>
      <p className="mb-7 max-w-md text-sm leading-relaxed text-slate-600 line-clamp-2">{route.reason}</p>

      {priority ? (
        <div className="mb-8 bg-[#0f1a33]/[0.04] py-5 pl-5 pr-4 border-l-4 border-[#c9a454]">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8a6520]">
            Prioridad · Acción ahora
          </p>
          <p className="mt-3 font-serif text-[1.35rem] leading-snug text-[#0f1a33]">
            {formatPriorityAction(priority)}
          </p>
        </div>
      ) : null}

      <div className="space-y-6">
        {ROUTE_KEYS.map(({ key, scoreKey }) => {
          const score = route.scores[scoreKey];
          const isRecommended = route.recommended === key;
          const widthPct = Math.round((score / maxScore) * 100);

          return (
            <div key={key}>
              <div className="mb-2">
                <span
                  className={`text-xs tracking-wide ${isRecommended ? "font-semibold text-[#0f1a33]" : "text-slate-500"}`}
                >
                  {key}
                  {isRecommended ? (
                    <span className="ml-2 text-[10px] uppercase text-[#c9a454]">· Recomendada</span>
                  ) : null}
                </span>
              </div>
              <div className="relative h-2 bg-[#0f1a33]/6">
                <div
                  className={`absolute inset-y-0 left-0 ${isRecommended ? "bg-[#c9a454]" : "bg-slate-300/80"}`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-7 text-xs text-slate-500">
        Bloqueo principal ·{" "}
        <span className="font-medium text-[#0f1a33]">{route.principalBlock}</span>
      </p>

      {showInsight ? (
        <FlyPathInsight className="mt-6">
          {routeInsightMessage(route.recommended, route.principalBlock)}
        </FlyPathInsight>
      ) : null}
    </div>
  );
}
