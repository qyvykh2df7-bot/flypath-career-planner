"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useMemo,
  useOptimistic,
  useState,
  useTransition,
  type CSSProperties,
  type DragEvent,
} from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Plus,
} from "lucide-react";
import { moveContentOsCalendarEventAction } from "@/app/warhome/(protected)/content/actions";
import {
  getContentOsAdjacentDate,
  type ContentOsCalendarEvent,
  type ContentOsCalendarParameters,
  type ContentOsItem,
} from "@/lib/warhome/content-os-contract";
import { ContentCalendarEventModal } from "./ContentCalendarEventModal";
import {
  CONTENT_OS_EVENT_TYPE_LABELS,
  CONTENT_OS_ITEM_STATUS_LABELS,
} from "./ContentOsLabels";
import {
  CONTENT_OS_CALENDAR_END_HOUR,
  CONTENT_OS_CALENDAR_SLOT_HEIGHT,
  CONTENT_OS_CALENDAR_START_HOUR,
  contentOsMadridDate,
  contentOsMadridTime,
  getContentOsQuickCreateRange,
  getContentOsWeekEventLayout,
  moveContentOsEventToSlot,
} from "./content-calendar-utils";

const eventStyles = {
  record: "border-cyan-300/25 bg-cyan-300/[0.1] text-cyan-100",
  edit: "border-violet-300/25 bg-violet-300/[0.1] text-violet-100",
  publish: "border-[#d6ae4f]/30 bg-[#d6ae4f]/10 text-[#f0ca70]",
} as const;

const calendarHours = Array.from(
  { length: CONTENT_OS_CALENDAR_END_HOUR - CONTENT_OS_CALENDAR_START_HOUR },
  (_, index) => CONTENT_OS_CALENDAR_START_HOUR + index,
);

type CalendarModalState =
  | {
      mode: "create";
      defaultDate: string;
      startsAt: string;
      endsAt: string;
    }
  | {
      mode: "edit";
      eventId: string;
    }
  | null;

function dateHeading(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function weekdayHeading(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "UTC",
    weekday: "short",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function dayNumber(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "UTC",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function dayMonthHeading(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
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

function CalendarEventCard({
  event,
  item,
  onOpen,
  compact = false,
  style,
  className = "",
}: {
  event: ContentOsCalendarEvent;
  item?: ContentOsItem;
  onOpen: () => void;
  compact?: boolean;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <button
      type="button"
      draggable
      onClick={onOpen}
      onDragStart={(dragEvent) => {
        dragEvent.stopPropagation();
        dragEvent.dataTransfer.setData("text/content-os-event-id", event.id);
        dragEvent.dataTransfer.effectAllowed = "move";
      }}
      style={style}
      className={`group overflow-hidden rounded-lg border text-left text-xs shadow-lg shadow-black/10 backdrop-blur-sm transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#d6ae4f]/50 ${
        compact ? "px-2 py-1.5" : "p-2.5"
      } ${eventStyles[event.eventType]} ${className}`}
    >
      <span className="flex items-start gap-1.5">
        <GripVertical className="mt-0.5 h-3 w-3 shrink-0 opacity-35" aria-hidden />
        <span className="min-w-0">
          <span className="block truncate font-semibold">{event.title}</span>
          <span className="mt-0.5 block truncate text-[10px] font-medium uppercase opacity-70">
            {CONTENT_OS_EVENT_TYPE_LABELS[event.eventType]} ·{" "}
            {contentOsMadridTime(event.startsAt)}
            {item ? ` · ${CONTENT_OS_ITEM_STATUS_LABELS[item.status]}` : ""}
          </span>
          {!compact && event.contentTitle ? (
            <span className="mt-1 block truncate opacity-70">
              {event.contentTitle}
            </span>
          ) : null}
        </span>
      </span>
    </button>
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
  const [modal, setModal] = useState<CalendarModalState>(null);
  const [isMoving, startMoving] = useTransition();
  const byDay = useMemo(() => {
    const result = new Map<string, ContentOsCalendarEvent[]>();
    for (const event of optimisticEvents) {
      const date = contentOsMadridDate(event.startsAt);
      result.set(date, [...(result.get(date) ?? []), event]);
    }
    for (const dayEvents of result.values()) {
      dayEvents.sort(
        (left, right) =>
          new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
      );
    }
    return result;
  }, [optimisticEvents]);
  const eventById = useMemo(
    () => new Map(optimisticEvents.map((event) => [event.id, event])),
    [optimisticEvents],
  );
  const itemById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );
  const eventCounts = useMemo(
    () =>
      optimisticEvents.reduce(
        (counts, event) => ({
          ...counts,
          [event.eventType]: counts[event.eventType] + 1,
        }),
        { record: 0, edit: 0, publish: 0 },
      ),
    [optimisticEvents],
  );
  const previousDate = getContentOsAdjacentDate(parameters, "previous");
  const nextDate = getContentOsAdjacentDate(parameters, "next");
  const today = contentOsMadridDate(new Date().toISOString());
  const selectedEvent =
    modal?.mode === "edit" ? eventById.get(modal.eventId) : undefined;
  const viewHref = (view: "week" | "month", date = parameters.anchorDate) =>
    `/warhome/content?view=${view}&date=${date}`;

  const closeModal = useCallback(() => setModal(null), []);
  const handleSaved = useCallback(() => {
    setModal(null);
    router.refresh();
  }, [router]);

  function openCreate(targetDate: string, targetHour = 10): void {
    const range = getContentOsQuickCreateRange(targetDate, targetHour);
    if (!range) {
      setMessage("No se ha podido preparar el nuevo bloque.");
      return;
    }
    setMessage(null);
    setModal({ mode: "create", defaultDate: targetDate, ...range });
  }

  function handleDrop(
    eventId: string,
    targetDate: string,
    targetHour?: number,
  ): void {
    const event = eventById.get(eventId);
    if (!event) return;
    const moved = moveContentOsEventToSlot(event, targetDate, targetHour);
    if (!moved) {
      setMessage("No se ha podido mover el bloque.");
      return;
    }
    if (moved.startsAt === event.startsAt) return;

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
        router.refresh();
        return;
      }
      router.refresh();
    });
  }

  function handleDropEvent(
    dragEvent: DragEvent,
    targetDate: string,
    targetHour?: number,
  ): void {
    dragEvent.preventDefault();
    dragEvent.stopPropagation();
    handleDrop(
      dragEvent.dataTransfer.getData("text/content-os-event-id"),
      targetDate,
      targetHour,
    );
  }

  return (
    <>
      <div className="mt-8 grid gap-7 2xl:grid-cols-[minmax(0,1fr)_18rem]">
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
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => openCreate(parameters.anchorDate)}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#d6ae4f] px-3 text-sm font-semibold text-[#07111f] transition hover:bg-[#e2bd62]"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Nuevo bloque
              </button>
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
          </div>

          <p aria-live="polite" className="mt-3 min-h-5 text-sm text-rose-300">
            {message ?? (isMoving ? "Actualizando calendario..." : "")}
          </p>

          {parameters.view === "week" ? (
            <div className="mt-2 overflow-hidden rounded-lg border border-white/[0.09] bg-[#091524] shadow-xl shadow-black/10">
              <div className="overflow-x-auto">
                <div className="grid min-w-[980px] grid-cols-[4.25rem_repeat(7,minmax(0,1fr))]">
                <div className="border-b border-r border-white/[0.08] bg-[#0a1626] px-2 py-3 text-center text-[10px] font-semibold uppercase text-slate-600">
                  Hora
                </div>
                {parameters.days.map((day) => (
                  <div
                    key={day}
                    className={`border-b border-r border-white/[0.08] px-2 py-3 text-center last:border-r-0 ${
                      day === today
                        ? "bg-[#172333] text-[#f0ca70]"
                        : "bg-[#0d192a] text-slate-400"
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                      {weekdayHeading(day)}
                    </p>
                    <p className="mt-0.5 text-base font-semibold capitalize">
                      {dayMonthHeading(day)}
                    </p>
                  </div>
                ))}

                <div className="border-r border-white/[0.08] bg-[#0a1626]">
                  {calendarHours.map((hour) => (
                    <div
                      key={hour}
                      style={{ height: CONTENT_OS_CALENDAR_SLOT_HEIGHT }}
                      className={`pr-2 pt-1 text-right text-[10px] tabular-nums text-slate-600 ${
                        hour % 2 === 0
                          ? "border-b border-white/[0.07]"
                          : "border-b border-white/[0.025]"
                      }`}
                    >
                      {hour % 2 === 0
                        ? `${String(hour).padStart(2, "0")}:00`
                        : ""}
                    </div>
                  ))}
                </div>

                {parameters.days.map((day) => {
                  const dayEvents = byDay.get(day) ?? [];
                  return (
                    <div
                      key={day}
                      onDragOver={(dragEvent) => {
                        dragEvent.preventDefault();
                        dragEvent.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(dragEvent) => {
                        const bounds = dragEvent.currentTarget.getBoundingClientRect();
                        const relativeY = Math.max(
                          0,
                          dragEvent.clientY - bounds.top,
                        );
                        const targetHour = Math.min(
                          CONTENT_OS_CALENDAR_END_HOUR - 1,
                          CONTENT_OS_CALENDAR_START_HOUR +
                            Math.floor(
                              relativeY / CONTENT_OS_CALENDAR_SLOT_HEIGHT,
                            ),
                        );
                        handleDropEvent(dragEvent, day, targetHour);
                      }}
                      className={`relative border-r border-white/[0.075] last:border-r-0 ${
                        day === today ? "bg-[#111f31]" : "bg-[#0d192a]"
                      }`}
                    >
                      {calendarHours.map((hour) => (
                        <button
                          key={hour}
                          type="button"
                          aria-label={`Añadir bloque el ${day} a las ${String(hour).padStart(2, "0")}:00`}
                          onClick={() => openCreate(day, hour)}
                          onDragOver={(dragEvent) => {
                            dragEvent.preventDefault();
                            dragEvent.dataTransfer.dropEffect = "move";
                          }}
                          onDrop={(dragEvent) =>
                            handleDropEvent(dragEvent, day, hour)
                          }
                          style={{ height: CONTENT_OS_CALENDAR_SLOT_HEIGHT }}
                          className={`block w-full text-left transition hover:bg-[#d6ae4f]/[0.035] focus:bg-[#d6ae4f]/[0.05] focus:outline-none ${
                            hour % 2 === 0
                              ? "border-b border-white/[0.07]"
                              : "border-b border-white/[0.025]"
                          }`}
                        />
                      ))}
                      {dayEvents.map((event) => {
                        const layout = getContentOsWeekEventLayout(event);
                        return (
                          <CalendarEventCard
                            key={event.id}
                            event={event}
                            item={
                              event.contentItemId
                                ? itemById.get(event.contentItemId)
                                : undefined
                            }
                            onOpen={() =>
                              setModal({ mode: "edit", eventId: event.id })
                            }
                            compact
                            style={{
                              top: layout.top + 2,
                              height: Math.max(34, layout.height - 4),
                            }}
                            className="absolute left-1.5 right-1.5 z-10 w-[calc(100%-0.75rem)]"
                          />
                        );
                      })}
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-2 overflow-x-auto rounded-lg border border-white/[0.09] bg-[#091524] shadow-xl shadow-black/10">
              <div className="grid min-w-[880px] grid-cols-7 gap-px bg-white/[0.08]">
                {parameters.days.slice(0, 7).map((day) => (
                  <div
                    key={`weekday-${day}`}
                    className="bg-[#0a1626] px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {weekdayHeading(day)}
                  </div>
                ))}
                {parameters.days.map((day) => {
                  const dayEvents = byDay.get(day) ?? [];
                  const outsideMonth =
                    day.slice(0, 7) !== parameters.anchorDate.slice(0, 7);
                  return (
                    <div
                      key={day}
                      onDragOver={(dragEvent) => {
                        dragEvent.preventDefault();
                        dragEvent.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(dragEvent) => handleDropEvent(dragEvent, day)}
                      className={`group/day flex min-h-32 flex-col p-2.5 transition ${
                        outsideMonth
                          ? "bg-[#0a1626] text-slate-700"
                          : day === today
                            ? "bg-[#111f31]"
                            : "bg-[#0d192a]"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p
                          className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-xs font-semibold ${
                            day === today
                              ? "bg-[#d6ae4f] text-[#07111f]"
                              : outsideMonth
                                ? "text-slate-700"
                                : "text-slate-400"
                          }`}
                        >
                          {dayNumber(day)}
                        </p>
                        <button
                          type="button"
                          onClick={() => openCreate(day)}
                          aria-label={`Crear bloque el ${day}`}
                          title="Añadir bloque"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-700 opacity-0 transition hover:bg-white/[0.06] hover:text-slate-300 focus:opacity-100 focus:outline-none group-hover/day:opacity-100"
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                      <div className="grid gap-2">
                        {dayEvents.map((event) => (
                          <CalendarEventCard
                            key={event.id}
                            event={event}
                            item={
                              event.contentItemId
                                ? itemById.get(event.contentItemId)
                                : undefined
                            }
                            onOpen={() =>
                              setModal({ mode: "edit", eventId: event.id })
                            }
                            compact
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => openCreate(day)}
                        aria-label={`Añadir bloque el ${day}`}
                        className="mt-2 min-h-6 flex-1 rounded-md border border-transparent transition hover:border-dashed hover:border-white/[0.08] hover:bg-white/[0.015] focus:border-white/[0.1] focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8 lg:hidden">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-white">Agenda del periodo</h2>
              <span className="text-sm tabular-nums text-slate-500">
                {optimisticEvents.length}
              </span>
            </div>
            {optimisticEvents.length ? (
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {optimisticEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => setModal({ mode: "edit", eventId: event.id })}
                    className="flex items-center justify-between gap-4 rounded-lg border border-white/[0.08] bg-[#0d192a] px-4 py-3 text-left transition hover:border-white/[0.14]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white">
                        {event.title}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {CONTENT_OS_EVENT_TYPE_LABELS[event.eventType]} ·{" "}
                        {dateHeading(contentOsMadridDate(event.startsAt))} ·{" "}
                        {contentOsMadridTime(event.startsAt)}
                      </span>
                    </span>
                    {event.contentItemId && itemById.get(event.contentItemId) ? (
                      <span className="shrink-0 text-xs text-slate-500">
                        {
                          CONTENT_OS_ITEM_STATUS_LABELS[
                            itemById.get(event.contentItemId)!.status
                          ]
                        }
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.1] bg-[#0d192a]/60 px-6 text-center">
                <CalendarDays className="h-7 w-7 text-slate-600" aria-hidden />
                <p className="mt-3 text-sm font-medium text-white">
                  Calendario vacío
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-white/[0.08] bg-[#0d192a] p-5 2xl:sticky 2xl:top-6">
            <h2 className="font-semibold text-white">Plan del periodo</h2>
            <dl className="mt-5 grid gap-3 text-sm">
              {(["record", "edit", "publish"] as const).map((eventType) => (
                <div
                  key={eventType}
                  className="flex items-center justify-between gap-4 border-b border-white/[0.07] pb-3 last:border-0 last:pb-0"
                >
                  <dt className="text-slate-400">
                    {CONTENT_OS_EVENT_TYPE_LABELS[eventType]}
                  </dt>
                  <dd className="font-semibold tabular-nums text-white">
                    {eventCounts[eventType]}
                  </dd>
                </div>
              ))}
            </dl>
            <button
              type="button"
              onClick={() => openCreate(parameters.anchorDate)}
              className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#d6ae4f]/35 text-sm font-semibold text-[#e4c46d] transition hover:bg-[#d6ae4f]/10"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Añadir bloque
            </button>
          </section>
        </aside>
      </div>

      {modal ? (
        <ContentCalendarEventModal
          key={
            modal.mode === "edit"
              ? `edit-${modal.eventId}`
              : `create-${modal.startsAt}`
          }
          event={selectedEvent}
          items={items}
          defaultDate={
            modal.mode === "create"
              ? modal.defaultDate
              : selectedEvent
                ? contentOsMadridDate(selectedEvent.startsAt)
                : parameters.anchorDate
          }
          defaultStartsAt={modal.mode === "create" ? modal.startsAt : undefined}
          defaultEndsAt={modal.mode === "create" ? modal.endsAt : undefined}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      ) : null}
    </>
  );
}
