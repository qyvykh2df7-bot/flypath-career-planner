"use client";

import type { WeeklyPlanAlert } from "@/lib/study-planner/weekly-alerts";

type PulseLineProps = {
  parts: Array<{ label: string; onClick?: () => void }>;
  alert?: WeeklyPlanAlert | null;
};

export function PulseLine({ parts, alert }: PulseLineProps) {
  const visible = parts.filter((p) => p.label.length > 0);
  if (visible.length === 0 && !alert) return null;

  return (
    <div className="space-y-1">
      {visible.length > 0 ? (
        <p className="text-[11px] text-slate-500">
          {visible.map((part, i) => (
            <span key={`${part.label}-${i}`}>
              {i > 0 ? <span className="mx-1.5 text-slate-300">·</span> : null}
              {part.onClick ? (
                <button
                  type="button"
                  onClick={part.onClick}
                  className="font-medium text-slate-600 underline-offset-2 transition hover:text-[#0f1a33] hover:underline"
                >
                  {part.label}
                </button>
              ) : (
                <span>{part.label}</span>
              )}
            </span>
          ))}
        </p>
      ) : null}
      {alert ? (
        <p
          className={`text-[11px] leading-snug ${
            alert.severity === "risk" ? "text-red-700/90" : "text-amber-800/90"
          }`}
        >
          {alert.message}
        </p>
      ) : null}
    </div>
  );
}
