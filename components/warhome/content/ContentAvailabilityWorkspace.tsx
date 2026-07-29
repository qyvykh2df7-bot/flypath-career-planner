"use client";

import { useActionState } from "react";
import { CalendarClock, Trash2 } from "lucide-react";
import {
  CONTENT_OS_INITIAL_ACTION_STATE,
  createContentOsAvailabilityAction,
  deleteContentOsAvailabilityAction,
  updateContentOsAvailabilityAction,
} from "@/app/warhome/(protected)/content/actions";
import {
  CONTENT_OS_AVAILABILITY_TYPES,
  CONTENT_OS_PLANNING_LIMITS,
  type ContentOsAvailabilitySlot,
} from "@/lib/warhome/content-os-planning-contract";
import { CONTENT_OS_AVAILABILITY_TYPE_LABELS } from "./ContentOsLabels";
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

function dateRange(slot: ContentOsAvailabilitySlot): string {
  const formatter = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${formatter.format(new Date(slot.startsAt))} – ${formatter.format(
    new Date(slot.endsAt),
  )}`;
}

function ActionMessage({
  state,
}: {
  state: typeof CONTENT_OS_INITIAL_ACTION_STATE;
}) {
  if (!state.message) return null;
  return (
    <p
      aria-live="polite"
      className={`text-sm ${
        state.status === "error" ? "text-rose-300" : "text-emerald-300"
      }`}
    >
      {state.message}
    </p>
  );
}

function AvailabilityFields({
  slot,
  defaultStartsAt,
  defaultEndsAt,
}: {
  slot?: ContentOsAvailabilitySlot;
  defaultStartsAt: string;
  defaultEndsAt: string;
}) {
  return (
    <>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">
          Tipo
        </span>
        <select
          name="availabilityType"
          defaultValue={slot?.availabilityType ?? "recording_available"}
          className={inputClass}
        >
          {CONTENT_OS_AVAILABILITY_TYPES.map((value) => (
            <option key={value} value={value}>
              {CONTENT_OS_AVAILABILITY_TYPE_LABELS[value]}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">
            Inicio
          </span>
          <input
            type="datetime-local"
            name="startsAt"
            defaultValue={
              slot ? madridDateTimeInput(slot.startsAt) : defaultStartsAt
            }
            required
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">
            Fin
          </span>
          <input
            type="datetime-local"
            name="endsAt"
            defaultValue={
              slot ? madridDateTimeInput(slot.endsAt) : defaultEndsAt
            }
            required
            className={inputClass}
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">
          Notas
        </span>
        <textarea
          name="notes"
          defaultValue={slot?.notes ?? ""}
          maxLength={CONTENT_OS_PLANNING_LIMITS.availabilityNotes}
          rows={3}
          className={`${inputClass} py-2.5`}
          placeholder="Contexto útil para planificar"
        />
      </label>
    </>
  );
}

function CreateAvailabilityForm({
  defaultStartsAt,
  defaultEndsAt,
}: {
  defaultStartsAt: string;
  defaultEndsAt: string;
}) {
  const [state, action] = useActionState(
    createContentOsAvailabilityAction,
    CONTENT_OS_INITIAL_ACTION_STATE,
  );
  return (
    <form action={action} className="grid gap-4">
      <AvailabilityFields
        defaultStartsAt={defaultStartsAt}
        defaultEndsAt={defaultEndsAt}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ActionMessage state={state} />
        <ContentOsSubmitButton label="Añadir disponibilidad" />
      </div>
    </form>
  );
}

function AvailabilityCard({
  slot,
  defaultStartsAt,
  defaultEndsAt,
}: {
  slot: ContentOsAvailabilitySlot;
  defaultStartsAt: string;
  defaultEndsAt: string;
}) {
  const updateAction = updateContentOsAvailabilityAction.bind(null, slot.id);
  const deleteAction = deleteContentOsAvailabilityAction.bind(null, slot.id);
  const [updateState, updateFormAction] = useActionState(
    updateAction,
    CONTENT_OS_INITIAL_ACTION_STATE,
  );
  const [deleteState, deleteFormAction] = useActionState(
    deleteAction,
    CONTENT_OS_INITIAL_ACTION_STATE,
  );

  return (
    <article className="rounded-lg border border-white/[0.08] bg-[#0d192a]">
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="inline-flex rounded border border-[#d6ae4f]/25 bg-[#d6ae4f]/10 px-2 py-1 text-xs font-medium text-[#e3bc62]">
            {CONTENT_OS_AVAILABILITY_TYPE_LABELS[slot.availabilityType]}
          </span>
          <p className="mt-3 text-sm font-medium capitalize text-white">
            {dateRange(slot)}
          </p>
          {slot.notes ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
              {slot.notes}
            </p>
          ) : null}
        </div>
        <form action={deleteFormAction}>
          <button
            type="submit"
            title="Eliminar disponibilidad"
            aria-label="Eliminar disponibilidad"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rose-300/20 text-rose-300 transition hover:bg-rose-300/10"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </form>
      </div>
      <details className="border-t border-white/[0.07]">
        <summary className="cursor-pointer list-none px-5 py-3 text-sm font-medium text-slate-400 hover:text-white">
          Editar franja
        </summary>
        <form
          action={updateFormAction}
          className="grid gap-4 border-t border-white/[0.07] p-5"
        >
          <AvailabilityFields
            slot={slot}
            defaultStartsAt={defaultStartsAt}
            defaultEndsAt={defaultEndsAt}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ActionMessage
              state={
                deleteState.message && !updateState.message
                  ? deleteState
                  : updateState
              }
            />
            <ContentOsSubmitButton label="Guardar cambios" />
          </div>
        </form>
      </details>
    </article>
  );
}

export function ContentAvailabilityWorkspace({
  slots,
  defaultStartsAt,
  defaultEndsAt,
}: {
  slots: ContentOsAvailabilitySlot[];
  defaultStartsAt: string;
  defaultEndsAt: string;
}) {
  return (
    <div className="mt-8 grid gap-7 xl:grid-cols-[22rem_minmax(0,1fr)]">
      <aside className="h-fit rounded-lg border border-white/[0.08] bg-[#0d192a] p-5 xl:sticky xl:top-24">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d6ae4f]/10 text-[#e3bc62]">
            <CalendarClock className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-semibold text-white">Añadir franja</h2>
            <p className="text-xs text-slate-500">Roster manual</p>
          </div>
        </div>
        <CreateAvailabilityForm
          defaultStartsAt={defaultStartsAt}
          defaultEndsAt={defaultEndsAt}
        />
      </aside>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">
            Próxima disponibilidad
          </h2>
          <span className="text-sm tabular-nums text-slate-500">
            {slots.length}
          </span>
        </div>
        {slots.length ? (
          <div className="grid gap-4">
            {slots.map((slot) => (
              <AvailabilityCard
                key={slot.id}
                slot={slot}
                defaultStartsAt={defaultStartsAt}
                defaultEndsAt={defaultEndsAt}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.1] bg-[#0d192a]/60 px-6 text-center">
            <CalendarClock className="h-8 w-8 text-slate-600" aria-hidden />
            <h3 className="mt-4 font-semibold text-white">
              Todavía no hay roster
            </h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Añade trabajo, descanso, viajes o franjas de grabación para que el
              planificador conozca tu disponibilidad real.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
