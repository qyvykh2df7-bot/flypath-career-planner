"use client";

import type { WeeklyPlanAlert } from "@/lib/study-planner/weekly-alerts";

type DashboardAlertsProps = {
  alerts: WeeklyPlanAlert[];
};

export function DashboardAlerts({ alerts }: DashboardAlertsProps) {
  const important = alerts.filter((a) => a.severity !== "info").slice(0, 2);
  if (important.length === 0) return null;

  return (
    <ul className="flex flex-col gap-1.5">
      {important.map((alert) => (
        <li
          key={alert.id}
          className={`rounded-lg px-3 py-2 text-[12px] font-medium leading-snug ${
            alert.severity === "risk"
              ? "bg-red-50/90 text-red-900 ring-1 ring-red-200/60"
              : "bg-amber-50/90 text-amber-950 ring-1 ring-amber-200/60"
          }`}
        >
          {alert.message}
        </li>
      ))}
    </ul>
  );
}
