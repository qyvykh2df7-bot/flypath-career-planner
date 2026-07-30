import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { notFound } from "next/navigation";
import { ContentItemForm } from "@/components/warhome/content/ContentItemForm";
import { ContentHistoricalItemSummary } from "@/components/warhome/content/ContentHistoricalItemSummary";
import { ContentMetricsPanel } from "@/components/warhome/content/ContentMetricsPanel";
import { ContentOsLoadError } from "@/components/warhome/content/ContentOsLoadError";
import { ContentOsPageHeader } from "@/components/warhome/content/ContentOsPageHeader";
import { ContentOsTabs } from "@/components/warhome/content/ContentOsTabs";
import {
  ContentOsNotFoundError,
  getContentOsItemDetail,
} from "@/lib/warhome/content-os";
import type { ContentOsItemDetail } from "@/lib/warhome/content-os-contract";

type ContentOsItemPageProps = {
  params: Promise<{ contentId: string }>;
};

function formatCalendarDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(new Date(value));
}

export default async function ContentOsItemPage({ params }: ContentOsItemPageProps) {
  const { contentId } = await params;
  let detail: ContentOsItemDetail | null = null;
  let isMissing = false;

  try {
    detail = await getContentOsItemDetail(contentId);
  } catch (error) {
    isMissing = error instanceof ContentOsNotFoundError;
  }

  if (isMissing) notFound();
  if (!detail) {
    return (
      <div className="mx-auto max-w-[1440px]">
        <ContentOsPageHeader
          title="Contenido"
          description="Ficha operativa de Content OS."
        />
        <ContentOsTabs active="library" />
        <ContentOsLoadError />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px]">
      <ContentOsPageHeader
        title={detail.item.title}
        description="Ficha operativa, planificación y resultados de la pieza."
      />
      <ContentOsTabs active="library" />
      <Link
        href="/warhome/content/library"
        className="mt-7 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a biblioteca
      </Link>

      <div className="mt-3 grid gap-6 xl:grid-cols-[minmax(0,1fr)_28rem]">
        {detail.item.contentOrigin === "historical" ? (
          <ContentHistoricalItemSummary item={detail.item} />
        ) : (
          <section className="rounded-lg border border-white/[0.08] bg-[#0d192a] p-5 sm:p-6">
            <ContentItemForm item={detail.item} />
          </section>
        )}
        <div className="space-y-6">
          <ContentMetricsPanel detail={detail} />
          <section className="rounded-lg border border-white/[0.08] bg-[#0d192a]">
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-[#d6ae4f]" aria-hidden />
                <h2 className="font-semibold text-white">Calendario</h2>
              </div>
              <span className="text-xs tabular-nums text-slate-500">
                {detail.calendarEvents.length}
              </span>
            </div>
            {detail.calendarEvents.length ? (
              <div className="divide-y divide-white/[0.06]">
                {detail.calendarEvents.map((event) => (
                  <div key={event.id} className="px-5 py-4">
                    <p className="text-sm font-medium text-white">{event.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatCalendarDate(event.startsAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                Sin bloques programados
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
