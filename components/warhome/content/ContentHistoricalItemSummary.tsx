import { ExternalLink } from "lucide-react";
import type { ContentOsItem } from "@/lib/warhome/content-os-contract";
import {
  CONTENT_OS_LIBRARY_PLATFORM_LABELS,
  CONTENT_OS_OBJECTIVE_LABELS,
  CONTENT_OS_STRATEGY_PILLAR_LABELS,
  CONTENT_OS_STRATEGY_PRODUCT_LABELS,
} from "./ContentOsLabels";
import {
  CONTENT_OS_STRATEGY_PILLARS,
  CONTENT_OS_STRATEGY_PRODUCTS,
} from "@/lib/warhome/content-os-strategy-contract";

function knownValue<T extends readonly string[]>(
  values: T,
  value: string | null,
): value is T[number] {
  return value !== null && values.includes(value);
}

export function ContentHistoricalItemSummary({
  item,
}: {
  item: ContentOsItem;
}) {
  const details = [
    ["Plataforma", CONTENT_OS_LIBRARY_PLATFORM_LABELS[item.platform]],
    [
      "Objetivo",
      item.objective ? CONTENT_OS_OBJECTIVE_LABELS[item.objective] : "Sin definir",
    ],
    [
      "Pilar",
      knownValue(CONTENT_OS_STRATEGY_PILLARS, item.contentPillar)
        ? CONTENT_OS_STRATEGY_PILLAR_LABELS[item.contentPillar]
        : item.contentPillar ?? "Sin definir",
    ],
    [
      "Producto",
      knownValue(CONTENT_OS_STRATEGY_PRODUCTS, item.relatedProductKey)
        ? CONTENT_OS_STRATEGY_PRODUCT_LABELS[item.relatedProductKey]
        : "Ninguno",
    ],
  ] as const;

  return (
    <section className="rounded-lg border border-white/[0.08] bg-[#0d192a] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-[#d6ae4f]">
            Contenido histórico
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">
            Publicado
          </h2>
        </div>
        {item.sourceUrl ? (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.1] px-3 text-sm font-medium text-slate-300 transition hover:border-[#d6ae4f]/35 hover:text-white"
          >
            Abrir publicación
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        ) : null}
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        {details.map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-white/[0.07] bg-[#091524] px-4 py-3"
          >
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-slate-200">{value}</dd>
          </div>
        ))}
      </dl>

      {item.summary || item.hook || item.cta ? (
        <div className="mt-5 space-y-4 border-t border-white/[0.07] pt-5">
          {item.summary ? (
            <div>
              <h3 className="text-xs font-medium text-slate-500">Descripción</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                {item.summary}
              </p>
            </div>
          ) : null}
          {item.hook ? (
            <div>
              <h3 className="text-xs font-medium text-slate-500">Hook</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                {item.hook}
              </p>
            </div>
          ) : null}
          {item.cta ? (
            <div>
              <h3 className="text-xs font-medium text-slate-500">CTA</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                {item.cta}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
