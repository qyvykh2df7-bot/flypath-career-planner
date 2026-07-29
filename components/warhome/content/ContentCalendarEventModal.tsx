"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef } from "react";
import { Clock3, ExternalLink, X } from "lucide-react";
import type {
  ContentOsCalendarEvent,
  ContentOsItem,
} from "@/lib/warhome/content-os-contract";
import {
  CONTENT_OS_EVENT_TYPE_LABELS,
  CONTENT_OS_ITEM_STATUS_LABELS,
} from "./ContentOsLabels";
import {
  ContentCalendarEventForm,
  DeleteContentCalendarEventButton,
} from "./ContentCalendarEventForm";
import {
  contentOsMadridDate,
  contentOsMadridTime,
} from "./content-calendar-utils";

export function ContentCalendarEventModal({
  event,
  items,
  defaultDate,
  defaultStartsAt,
  defaultEndsAt,
  onClose,
  onSaved,
}: {
  event?: ContentOsCalendarEvent;
  items: ContentOsItem[];
  defaultDate: string;
  defaultStartsAt?: string;
  defaultEndsAt?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const linkedItem = useMemo(
    () => items.find((item) => item.id === event?.contentItemId),
    [event?.contentItemId, items],
  );

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (event) closeButtonRef.current?.focus();

    function handleKeyDown(keyEvent: KeyboardEvent): void {
      if (keyEvent.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [event, onClose]);

  return (
    <div
      role="presentation"
      onMouseDown={(mouseEvent) => {
        if (mouseEvent.target === mouseEvent.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#020813]/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[92vh] w-full overflow-y-auto border border-white/[0.1] bg-[#0d192a] shadow-2xl sm:max-w-2xl sm:rounded-lg"
      >
        <header className="flex items-start justify-between gap-5 border-b border-white/[0.08] px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase text-[#d6ae4f]">
              {event ? "Detalle del bloque" : "Nuevo bloque"}
            </p>
            <h2 id={titleId} className="mt-1 text-xl font-semibold text-white">
              {event ? event.title : "Planificar contenido"}
            </h2>
            {event ? (
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-400">
                <span>{CONTENT_OS_EVENT_TYPE_LABELS[event.eventType]}</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden />
                  {contentOsMadridDate(event.startsAt)} ·{" "}
                  {contentOsMadridTime(event.startsAt)}
                </span>
                <span aria-hidden>·</span>
                <span>{event.proposalSource === "ai" ? "Propuesta IA" : "Manual"}</span>
              </p>
            ) : null}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            title="Cerrar"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        {linkedItem ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-[#091524]/70 px-5 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{linkedItem.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {CONTENT_OS_ITEM_STATUS_LABELS[linkedItem.status]}
              </p>
            </div>
            <Link
              href={`/warhome/content/library/${linkedItem.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#d6ae4f] hover:text-[#eccd7a]"
            >
              Abrir ficha
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        ) : null}

        <div className="p-5 sm:p-6">
          <ContentCalendarEventForm
            event={event}
            items={items}
            defaultDate={defaultDate}
            defaultStartsAt={defaultStartsAt}
            defaultEndsAt={defaultEndsAt}
            autoFocus={!event}
            onSaved={onSaved}
          />
          {event ? (
            <div className="mt-5 flex justify-end border-t border-white/[0.08] pt-4">
              <DeleteContentCalendarEventButton
                eventId={event.id}
                onDeleted={onSaved}
              />
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
