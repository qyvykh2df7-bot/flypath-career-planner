"use client";

import { useActionState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import {
  CONTENT_OS_INITIAL_ACTION_STATE,
  createContentOsCalendarEventAction,
  deleteContentOsCalendarEventAction,
  updateContentOsCalendarEventAction,
} from "@/app/warhome/(protected)/content/actions";
import {
  CONTENT_OS_EVENT_TYPES,
  CONTENT_OS_LIMITS,
  type ContentOsCalendarEvent,
  type ContentOsItem,
} from "@/lib/warhome/content-os-contract";
import {
  CONTENT_OS_EVENT_TYPE_LABELS,
  CONTENT_OS_ITEM_STATUS_LABELS,
} from "./ContentOsLabels";
import { ContentOsSubmitButton } from "./ContentOsSubmitButton";

const inputClass =
  "min-h-10 w-full rounded-lg border border-white/[0.09] bg-[#091524] px-3 text-sm text-slate-100 outline-none focus:border-[#d6ae4f]/50 focus:ring-2 focus:ring-[#d6ae4f]/15";

function madridDateTimeInput(value: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(new Date(value))
    .filter((part) => part.type !== "literal")
    .reduce<Record<string, string>>((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function CalendarFields({
  event,
  items,
  defaultDate,
  defaultStartsAt,
  defaultEndsAt,
  autoFocus,
}: {
  event?: ContentOsCalendarEvent;
  items: ContentOsItem[];
  defaultDate: string;
  defaultStartsAt?: string;
  defaultEndsAt?: string;
  autoFocus?: boolean;
}) {
  const defaultStart = event
    ? madridDateTimeInput(event.startsAt)
    : defaultStartsAt
      ? madridDateTimeInput(defaultStartsAt)
      : `${defaultDate}T10:00`;
  const defaultEnd = event
    ? madridDateTimeInput(event.endsAt)
    : defaultEndsAt
      ? madridDateTimeInput(defaultEndsAt)
      : `${defaultDate}T11:00`;

  return (
    <>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">Título</span>
        <input
          name="title"
          defaultValue={event?.title}
          maxLength={CONTENT_OS_LIMITS.calendarTitle}
          required
          autoFocus={autoFocus}
          className={inputClass}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Tipo</span>
          <select name="eventType" defaultValue={event?.eventType ?? "record"} className={inputClass}>
            {CONTENT_OS_EVENT_TYPES.map((value) => (
              <option key={value} value={value}>
                {CONTENT_OS_EVENT_TYPE_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Contenido</span>
          <select
            name="contentItemId"
            defaultValue={event?.contentItemId ?? ""}
            className={inputClass}
          >
            <option value="">Sin asociar</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} · {CONTENT_OS_ITEM_STATUS_LABELS[item.status]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Inicio</span>
          <input
            type="datetime-local"
            name="startsAt"
            defaultValue={defaultStart}
            required
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Fin</span>
          <input
            type="datetime-local"
            name="endsAt"
            defaultValue={defaultEnd}
            required
            className={inputClass}
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">Notas</span>
        <textarea
          name="notes"
          defaultValue={event?.notes ?? ""}
          maxLength={CONTENT_OS_LIMITS.calendarNotes}
          rows={3}
          className={`${inputClass} py-2.5`}
        />
      </label>
    </>
  );
}

export function ContentCalendarEventForm({
  event,
  items,
  defaultDate,
  defaultStartsAt,
  defaultEndsAt,
  autoFocus = false,
  onSaved,
}: {
  event?: ContentOsCalendarEvent;
  items: ContentOsItem[];
  defaultDate: string;
  defaultStartsAt?: string;
  defaultEndsAt?: string;
  autoFocus?: boolean;
  onSaved?: () => void;
}) {
  const updateAction = event
    ? updateContentOsCalendarEventAction.bind(null, event.id)
    : null;
  const [state, action] = useActionState(
    updateAction ?? createContentOsCalendarEventAction,
    CONTENT_OS_INITIAL_ACTION_STATE,
  );

  useEffect(() => {
    if (state.status === "success") onSaved?.();
  }, [onSaved, state.status]);

  return (
    <form action={action} className="grid gap-4">
      <CalendarFields
        event={event}
        items={items}
        defaultDate={defaultDate}
        defaultStartsAt={defaultStartsAt}
        defaultEndsAt={defaultEndsAt}
        autoFocus={autoFocus}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          aria-live="polite"
          className={`text-sm ${
            state.status === "error" ? "text-rose-300" : "text-emerald-300"
          }`}
        >
          {state.message}
        </p>
        <ContentOsSubmitButton label={event ? "Guardar bloque" : "Añadir bloque"} />
      </div>
    </form>
  );
}

export function DeleteContentCalendarEventButton({
  eventId,
  onDeleted,
}: {
  eventId: string;
  onDeleted?: () => void;
}) {
  const action = deleteContentOsCalendarEventAction.bind(null, eventId);
  const [state, formAction] = useActionState(
    action,
    CONTENT_OS_INITIAL_ACTION_STATE,
  );

  useEffect(() => {
    if (state.status === "success") onDeleted?.();
  }, [onDeleted, state.status]);

  return (
    <form action={formAction} className="flex items-center gap-3">
      {state.status === "error" ? (
        <p role="alert" className="text-sm text-rose-300">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        aria-label="Eliminar bloque"
        title="Eliminar bloque"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-400 transition hover:bg-rose-400/10 hover:text-rose-300"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        Eliminar bloque
      </button>
    </form>
  );
}
