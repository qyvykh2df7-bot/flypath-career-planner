"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GripVertical,
  Sparkles,
} from "lucide-react";
import { moveContentOsCalendarEventAction } from "@/app/warhome/(protected)/content/actions";
import {
  contentOsMadridLocalDateTimeToIso,
  getContentOsAdjacentDate,
  type ContentOsCalendarEvent,
  type ContentOsCalendarParameters,
  type ContentOsItem,
} from "@/lib/warhome/content-os-contract";
import { ContentCalendarEventForm, DeleteContentCalendarEventButton } from "./ContentCalendarEventForm";
import { CONTENT_OS_EVENT_TYPE_LABELS } from "./ContentOsLabels";

const eventStyles = {
  record: "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100",
  edit: "border-violet-300/20 bg-violet-300/[0.08] text-violet-100",
  publish: "border-[#d6ae4f]/25 bg-[#d6ae4f]/10 text-[#f0ca70]",
} as const;

function madridDate(value: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function madridTime(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

function dateHeading(value: string, compact = false): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "UTC",
    weekday: compact ? undefined : "short",
    day: "numeric",
    month: compact ? undefined : "short",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function calendarTitle(parameters: ContentOsCalendarParameters): string {
  const first = new Date(`${parameters.days[0]}T00:00:00.000Z`);
  const last = new Date(`${parameters.days.at(-1)}T00:00:00.000Z`);
  if (parameters.view === "month") {
    return new Intl.DateTimeFormat("es-ES", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${parameters.anchorDate}T00:00:00.000Z`));
  }
  const formatter = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${formatter.format(first)} – ${formatter.format(last)}`;
}

function moveEventToDate(
  event: ContentOsCalendarEvent,
  targetDate: string,
): { startsAt: string; endsAt: string } | null {
  const startTime = madridTime(event.startsAt);
  const nextStart = contentOsMadridLocalDateTimeToIso(`${targetDate}T${startTime}`);
  if (!nextStart) return null;
  const duration = new Date(event.endsAt).getTime() - new Date(event.startsAt).getTime();
  return {
    startsAt: nextStart,
    endsAt: new Date(new Date(nextStart).getTime() + duration).toISOString(),
  };
}

function CalendarEventCard({
  event,
}: {
  event: ContentOsCalendarEvent;
}) {
  return (
    <div
      draggable
      onDragStart={(dragEvent) => {
        dragEvent.dataTransfer.setData("text/content-os-event-id", event.id);
        dragEvent.dataTransfer.effectAllowed = "move";
      }}
      className={`group rounded-lg border p-2.5 text-xs ${eventStyles[event.eventType]}`}
    >
      <div className="flex items-start gap-1.5">
        <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-45" aria-hidden />
        <div className="min-w-0">
          <p className="truncate font-semibold">{event.title}</p>
          <p className="mt-1 flex items-center gap-1 opacity-70">
            <Clock3 className="h-3 w-3" aria-hidden />
            {madridTime(event.startsAt)}
          </p>
          {event.contentTitle ? <p className="mt-1 truncate opacity-70">{event.contentTitle}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function ContentCalendar({
  events,
  items,
  parameters,
}: {
  events: ContentOsCalendarEvent[];
  items: ContentOsItem[];
  parameters: ContentOsCalendarParameters;
}) {
  const router = useRouter();
  const [optimisticEvents, updateOptimisticEvent] = useOptimistic(
    events,
    (
      current,
      update: { eventId: string; startsAt: string; endsAt: string },
    ) =>
      current.map((event) =>
        event.id === update.eventId
          ? { ...event, startsAt: update.startsAt, endsAt: update.endsAt }
          : event,
      ),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isMoving, startMoving] = useTransition();
  const byDay = useMemo(() => {
    const result = new Map<string, ContentOsCalendarEvent[]>();
    for (const event of optimisticEvents) {
      const date = madridDate(event.startsAt);
      result.set(date, [...(result.get(date) ?? []), event]);
    }
    return result;
  }, [optimisticEvents]);
  const eventById = useMemo(
    () => new Map(optimisticEvents.map((event) => [event.id, event])),
    [optimisticEvents],
  );
  const previousDate = getContentOsAdjacentDate(parameters, "previous");
  const nextDate = getContentOsAdjacentDate(parameters, "next");
  const viewHref = (view: "week" | "month", date = parameters.anchorDate) =>
    `/warhome/content?view=${view}&date=${date}`;

  function handleDrop(eventId: string, targetDate: string): void {
    const event = eventById.get(eventId);
    if (!event || madridDate(event.startsAt) === targetDate) return;
    const moved = moveEventToDate(event, targetDate);
    if (!moved) {
      setMessage("No se ha podido mover el bloque.");
      return;
    }
    setMessage(null);
    startMoving(async () => {
      updateOptimisticEvent({ eventId, ...moved });
      const result = await moveContentOsCalendarEventAction(
        eventId,
        moved.startsAt,
        moved.endsAt,
      );
      if (result.status === "error") {
        setMessage(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-8 grid gap-7 2xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="min-w-0">
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Link
              href={viewHref(parameters.view, previousDate)}
              aria-label="Periodo anterior"
              title="Periodo anterior"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.09] text-slate-300 hover:border-white/[0.16] hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href={viewHref(parameters.view, nextDate)}
              aria-label="Periodo siguiente"
              title="Periodo siguiente"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.09] text-slate-300 hover:border-white/[0.16] hover:text-white"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
            <h2 className="ml-2 text-lg font-semibold capitalize text-white">
              {calendarTitle(parameters)}
            </h2>
          </div>
          <div className="inline-flex w-fit rounded-lg border border-white/[0.09] bg-[#091524] p-1">
            <Link
              href={viewHref("week")}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                parameters.view === "week"
                  ? "bg-white/[0.09] text-white"
                  : "text-slate-500 hover:text-slate-200"
              }`}
            >
              Semana
            </Link>
            <Link
              href={viewHref("month")}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                parameters.view === "month"
                  ? "bg-white/[0.09] text-white"
                  : "text-slate-500 hover:text-slate-200"
              }`}
            >
              Mes
            </Link>
          </div>
        </div>

        <p aria-live="polite" className="mt-3 min-h-5 text-sm text-rose-300">
          {message ?? (isMoving ? "Actualizando calendario..." : "")}
        </p>

        <div className="mt-2 overflow-x-auto">
          <div
            className={`grid min-w-[880px] gap-px overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.08] ${
              parameters.view === "week" ? "grid-cols-7" : "grid-cols-7"
            }`}
          >
            {parameters.days.map((day) => {
              const dayEvents = byDay.get(day) ?? [];
              const outsideMonth =
                parameters.view === "month" &&
                day.slice(0, 7) !== parameters.anchorDate.slice(0, 7);
              return (
                <div
                  key={day}
                  onDragOver={(dragEvent) => {
                    dragEvent.preventDefault();
                    dragEvent.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(dragEvent) => {
                    dragEvent.preventDefault();
                    handleDrop(
                      dragEvent.dataTransfer.getData("text/content-os-event-id"),
                      day,
                    );
                  }}
                  className={`min-h-44 bg-[#0d192a] p-2.5 ${
                    outsideMonth ? "opacity-45" : ""
                  }`}
                >
                  <p className="mb-2 text-xs font-semibold capitalize text-slate-500">
                    {dateHeading(day, parameters.view === "month")}
                  </p>
                  <div className="grid gap-2">
                    {dayEvents.map((event) => (
                      <CalendarEventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">Bloques programados</h2>
            <span className="text-sm tabular-nums text-slate-500">{events.length}</span>
          </div>
          {events.length ? (
            <div className="mt-4 grid gap-3">
              {events.map((event) => (
                <details
                  key={event.id}
                  className="relative rounded-lg border border-white/[0.08] bg-[#0d192a]"
                >
                  <summary className="cursor-pointer list-none px-4 py-3 pr-16">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{event.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {CONTENT_OS_EVENT_TYPE_LABELS[event.eventType]} · {dateHeading(madridDate(event.startsAt))} · {madridTime(event.startsAt)}
                      </p>
                    </div>
                  </summary>
                  <div className="absolute right-2 top-1.5">
                    <DeleteContentCalendarEventButton eventId={event.id} />
                  </div>
                  <div className="border-t border-white/[0.07] p-4">
                    <ContentCalendarEventForm
                      event={event}
                      items={items}
                      defaultDate={madridDate(event.startsAt)}
                    />
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.1] bg-[#0d192a]/60 px-6 text-center">
              <CalendarDays className="h-7 w-7 text-slate-600" aria-hidden />
              <p className="mt-3 text-sm font-medium text-white">Calendario vacío</p>
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-lg border border-white/[0.08] bg-[#0d192a] p-5">
          <h2 className="font-semibold text-white">Nuevo bloque</h2>
          <div className="mt-5">
            <ContentCalendarEventForm
              items={items}
              defaultDate={parameters.anchorDate}
            />
          </div>
        </section>
        <section className="flex items-center justify-between gap-4 border-t border-white/[0.08] px-1 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Sparkles className="h-4 w-4 text-[#d6ae4f]" aria-hidden />
            Propuestas IA
          </div>
          <span className="text-xs tabular-nums text-slate-600">0 pendientes</span>
        </section>
      </aside>
    </div>
  );
}
