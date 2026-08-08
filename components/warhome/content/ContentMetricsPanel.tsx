"use client";

import { useActionState } from "react";
import { BarChart3 } from "lucide-react";
import {
  upsertContentOsMetricAction,
} from "@/app/warhome/(protected)/content/actions";
import { CONTENT_OS_INITIAL_ACTION_STATE } from "@/lib/warhome/content-os-action-state";
import {
  CONTENT_OS_LIMITS,
  type ContentOsItemDetail,
} from "@/lib/warhome/content-os-contract";
import { ContentOsSubmitButton } from "./ContentOsSubmitButton";

const inputClass =
  "min-h-10 w-full rounded-lg border border-white/[0.09] bg-[#091524] px-3 text-sm text-slate-100 outline-none focus:border-[#d6ae4f]/50 focus:ring-2 focus:ring-[#d6ae4f]/15";

function todayInMadrid(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const fields = [
  ["views", "Visualizaciones"],
  ["likes", "Likes"],
  ["comments", "Comentarios"],
  ["shares", "Compartidos"],
  ["saves", "Guardados"],
  ["followersGained", "Seguidores ganados"],
  ["leadsGenerated", "Leads generados"],
  ["salesAttributed", "Ventas asociadas"],
] as const;

export function ContentMetricsPanel({ detail }: { detail: ContentOsItemDetail }) {
  const actionWithId = upsertContentOsMetricAction.bind(null, detail.item.id);
  const [state, action] = useActionState(actionWithId, CONTENT_OS_INITIAL_ACTION_STATE);

  return (
    <section className="rounded-lg border border-white/[0.08] bg-[#0d192a]">
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-[#d6ae4f]" aria-hidden />
          <div>
            <h2 className="font-semibold text-white">Métricas manuales</h2>
            <p className="text-xs text-slate-500">Snapshots por fecha</p>
          </div>
        </div>
        <span className="text-xs tabular-nums text-slate-500">{detail.metrics.length}</span>
      </div>

      <form action={action} className="grid gap-4 p-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Fecha</span>
          <input
            type="date"
            name="recordedOn"
            defaultValue={todayInMadrid()}
            required
            className={inputClass}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map(([name, label]) => (
            <label key={name} className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>
              <input
                type="number"
                name={name}
                min={0}
                max={CONTENT_OS_LIMITS.metricValue}
                defaultValue={0}
                required
                className={inputClass}
              />
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            aria-live="polite"
            className={`text-sm ${
              state.status === "error" ? "text-rose-300" : "text-emerald-300"
            }`}
          >
            {state.message}
          </p>
          <ContentOsSubmitButton label="Guardar métricas" />
        </div>
      </form>

      {detail.metrics.length ? (
        <div className="overflow-x-auto border-t border-white/[0.07]">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                {fields.map(([, label]) => (
                  <th key={label} className="px-3 py-3 text-right font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {detail.metrics.map((metric) => (
                <tr key={metric.id} className="text-slate-300">
                  <td className="px-4 py-3 font-medium">{metric.recordedOn}</td>
                  {fields.map(([name]) => (
                    <td key={name} className="px-3 py-3 text-right tabular-nums">
                      {metric[name] === null
                        ? "Sin dato"
                        : metric[name].toLocaleString("es-ES")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
