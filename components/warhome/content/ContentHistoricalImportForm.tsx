"use client";

import { useActionState } from "react";
import { importContentOsHistoricalItemAction } from "@/app/warhome/(protected)/content/actions";
import { CONTENT_OS_INITIAL_ACTION_STATE } from "@/lib/warhome/content-os-action-state";
import {
  CONTENT_OS_LIMITS,
  CONTENT_OS_OBJECTIVES,
} from "@/lib/warhome/content-os-contract";
import { CONTENT_OS_LIBRARY_PLATFORMS } from "@/lib/warhome/content-os-history-contract";
import {
  CONTENT_OS_STRATEGY_PRODUCTS,
} from "@/lib/warhome/content-os-strategy-contract";
import {
  CONTENT_OS_LIBRARY_PLATFORM_LABELS,
  CONTENT_OS_OBJECTIVE_LABELS,
  CONTENT_OS_STRATEGY_PRODUCT_LABELS,
} from "./ContentOsLabels";
import { ContentOsSubmitButton } from "./ContentOsSubmitButton";

const inputClass =
  "min-h-10 w-full rounded-lg border border-white/[0.09] bg-[#091524] px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-[#d6ae4f]/50 focus:ring-2 focus:ring-[#d6ae4f]/15";
const textareaClass = `${inputClass} py-2.5`;

const metricFields = [
  ["views", "Visualizaciones"],
  ["likes", "Likes"],
  ["comments", "Comentarios"],
  ["shares", "Compartidos"],
  ["saves", "Guardados"],
  ["followersGained", "Seguidores ganados"],
  ["leadsGenerated", "Leads"],
  ["salesAttributed", "Ventas"],
] as const;

export function ContentHistoricalImportForm({
  contentPillars,
}: {
  contentPillars: string[];
}) {
  const [state, action] = useActionState(
    importContentOsHistoricalItemAction,
    CONTENT_OS_INITIAL_ACTION_STATE,
  );

  return (
    <form action={action} className="grid gap-6">
      <section className="rounded-lg border border-white/[0.08] bg-[#0d192a] p-5 sm:p-6">
        <h2 className="text-base font-semibold text-white">Publicación</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">
              Título
            </span>
            <input
              name="title"
              maxLength={CONTENT_OS_LIMITS.itemTitle}
              required
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">
              Plataforma
            </span>
            <select name="platform" required className={inputClass}>
              {CONTENT_OS_LIBRARY_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {CONTENT_OS_LIBRARY_PLATFORM_LABELS[platform]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">
              Fecha de publicación
            </span>
            <input
              type="date"
              name="publishedOn"
              required
              className={inputClass}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">
              URL del contenido
            </span>
            <input
              type="url"
              name="sourceUrl"
              maxLength={CONTENT_OS_LIMITS.itemSourceUrl}
              placeholder="https://"
              className={inputClass}
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-white/[0.08] bg-[#0d192a] p-5 sm:p-6">
        <h2 className="text-base font-semibold text-white">Contexto editorial</h2>
        <div className="mt-5 grid gap-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">
              Descripción
            </span>
            <textarea
              name="description"
              maxLength={CONTENT_OS_LIMITS.itemSummary}
              rows={4}
              className={textareaClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">
              Hook
            </span>
            <textarea
              name="hook"
              maxLength={CONTENT_OS_LIMITS.itemHook}
              rows={3}
              className={textareaClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">
              CTA
            </span>
            <textarea
              name="cta"
              maxLength={CONTENT_OS_LIMITS.itemCta}
              rows={3}
              className={textareaClass}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-400">
                Pilar
              </span>
              <select name="contentPillar" className={inputClass}>
                <option value="">Sin definir</option>
                {contentPillars.map((pillar) => (
                  <option key={pillar} value={pillar}>
                    {pillar}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-400">
                Objetivo
              </span>
              <select name="objective" className={inputClass}>
                <option value="">Sin definir</option>
                {CONTENT_OS_OBJECTIVES.map((objective) => (
                  <option key={objective} value={objective}>
                    {CONTENT_OS_OBJECTIVE_LABELS[objective]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-400">
                Producto relacionado
              </span>
              <select name="relatedProductKey" className={inputClass}>
                <option value="">Ninguno</option>
                {CONTENT_OS_STRATEGY_PRODUCTS.map((product) => (
                  <option key={product} value={product}>
                    {CONTENT_OS_STRATEGY_PRODUCT_LABELS[product]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-white/[0.08] bg-[#0d192a] p-5 sm:p-6">
        <h2 className="text-base font-semibold text-white">Métricas iniciales</h2>
        <p className="mt-1 text-xs text-slate-500">
          Déjalas vacías si todavía no quieres registrar resultados.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metricFields.map(([name, label]) => (
            <label key={name} className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-400">
                {label}
              </span>
              <input
                type="number"
                name={name}
                min={0}
                max={CONTENT_OS_LIMITS.metricValue}
                className={inputClass}
              />
            </label>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          aria-live="polite"
          className={`text-sm ${
            state.status === "error" ? "text-rose-300" : "text-emerald-300"
          }`}
        >
          {state.message}
        </p>
        <ContentOsSubmitButton label="Importar contenido publicado" />
      </div>
    </form>
  );
}
