import Link from "next/link";
import { ArrowRight, BarChart3, CalendarDays, Library } from "lucide-react";
import type { ContentOsItem } from "@/lib/warhome/content-os-contract";
import {
  CONTENT_OS_ITEM_STATUS_LABELS,
  CONTENT_OS_OBJECTIVE_LABELS,
  CONTENT_OS_PLATFORM_LABELS,
} from "./ContentOsLabels";

function compactNumber(value: number): string {
  return new Intl.NumberFormat("es-ES", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

function formatDate(value: string | null): string {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function ContentLibrary({ items }: { items: ContentOsItem[] }) {
  if (!items.length) {
    return (
      <div className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.1] bg-[#0d192a]/60 px-6 text-center">
        <Library className="h-9 w-9 text-slate-600" aria-hidden />
        <h2 className="mt-4 text-lg font-semibold text-white">Biblioteca vacía</h2>
        <p className="mt-2 text-sm text-slate-500">Crea una pieza o conviértela desde el banco de ideas.</p>
        <Link
          href="/warhome/content/library/new"
          className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-[#d6ae4f] px-4 text-sm font-semibold text-[#091524]"
        >
          Nueva pieza
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="flex min-h-64 flex-col rounded-lg border border-white/[0.08] bg-[#0d192a] p-5"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded border border-[#d6ae4f]/25 bg-[#d6ae4f]/10 px-2 py-1 font-medium text-[#e3bc62]">
              {CONTENT_OS_ITEM_STATUS_LABELS[item.status]}
            </span>
            <span className="text-slate-500">{CONTENT_OS_PLATFORM_LABELS[item.platform]}</span>
          </div>
          <h2 className="mt-4 text-lg font-semibold leading-6 text-white">{item.title}</h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{item.hook}</p>

          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-4 text-xs">
            <div>
              <dt className="text-slate-600">Objetivo</dt>
              <dd className="mt-1 font-medium text-slate-300">
                {CONTENT_OS_OBJECTIVE_LABELS[item.objective]}
              </dd>
            </div>
            <div>
              <dt className="text-slate-600">Publicación</dt>
              <dd className="mt-1 inline-flex items-center gap-1.5 font-medium text-slate-300">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                {formatDate(item.plannedPublishOn)}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <BarChart3 className="h-3.5 w-3.5" aria-hidden />
              {compactNumber(item.metricTotals.views)} visualizaciones
            </span>
            <Link
              href={`/warhome/content/library/${item.id}`}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-[#e3bc62] transition hover:bg-[#d6ae4f]/10"
            >
              Abrir
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
