import Link from "next/link";
import { ChevronLeft, ChevronRight, RadioTower } from "lucide-react";
import {
  getWarhomeLeadActivityUrl,
  type WarhomeLeadActivity,
} from "@/lib/warhome/lead-detail";

type WarhomeLeadActivityProps = {
  leadId: string;
  returnTo: string;
  activity: WarhomeLeadActivity[];
  activityPage: number;
  activityTotal: number;
  activityTotalPages: number;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function WarhomeLeadActivity({
  leadId,
  returnTo,
  activity,
  activityPage,
  activityTotal,
  activityTotalPages,
}: WarhomeLeadActivityProps) {
  if (!activity.length) {
    return (
      <div className="flex min-h-44 flex-col items-center justify-center px-6 py-10 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#d6ae4f]/20 bg-[#d6ae4f]/10">
          <RadioTower className="h-5 w-5 text-[#e3bc62]" aria-hidden />
        </span>
        <h3 className="mt-4 text-base font-semibold text-white">Sin actividad registrada</h3>
        <p className="mt-1 max-w-md text-sm leading-6 text-slate-400">
          Solo se muestran eventos vinculados directamente a este lead.
        </p>
      </div>
    );
  }

  return (
    <>
      <ol className="divide-y divide-white/[0.07]">
        {activity.map((event, index) => {
          const metadataEntries = Object.entries(event.metadata);
          return (
            <li key={`${event.eventName}-${event.occurredAt}-${index}`} className="px-5 py-5 sm:px-6">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold text-[#e3bc62]">{event.eventName}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {event.eventCategory}
                    {event.source ? ` · ${event.source}` : ""}
                  </p>
                </div>
                <time className="shrink-0 text-xs text-slate-500">{formatDate(event.occurredAt)}</time>
              </div>
              {(event.pagePath || event.referrer) && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  {event.pagePath ? <span>Página: {event.pagePath}</span> : null}
                  {event.referrer ? <span>Referrer: {event.referrer}</span> : null}
                </div>
              )}
              {metadataEntries.length ? (
                <dl className="mt-3 flex flex-wrap gap-2">
                  {metadataEntries.map(([key, value]) => (
                    <div key={key} className="rounded border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-xs text-slate-400">
                      <dt className="inline text-slate-500">{key}: </dt>
                      <dd className="inline text-slate-300">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </li>
          );
        })}
      </ol>
      <footer className="flex flex-col gap-3 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-slate-500">
          {activityTotal} {activityTotal === 1 ? "evento" : "eventos"} · Página {activityPage} de {activityTotalPages}
        </p>
        <nav aria-label="Paginación de actividad" className="flex items-center gap-2">
          {activityPage > 1 ? (
            <Link
              href={getWarhomeLeadActivityUrl(leadId, returnTo, activityPage - 1)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/[0.09] px-3 text-sm font-medium text-slate-300 transition hover:border-[#d6ae4f]/35 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ae4f]/35"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Anterior
            </Link>
          ) : null}
          {activityPage < activityTotalPages ? (
            <Link
              href={getWarhomeLeadActivityUrl(leadId, returnTo, activityPage + 1)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/[0.09] px-3 text-sm font-medium text-slate-300 transition hover:border-[#d6ae4f]/35 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ae4f]/35"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : null}
        </nav>
      </footer>
    </>
  );
}
