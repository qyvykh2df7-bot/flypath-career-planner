"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  CalendarCheck,
  Check,
  LoaderCircle,
  Sparkles,
  X,
} from "lucide-react";
import {
  createContentOsAiProposalAction,
  reviewContentOsAiProposalAction,
} from "@/app/warhome/(protected)/content/actions";
import { CONTENT_OS_INITIAL_ACTION_STATE } from "@/lib/warhome/content-os-action-state";
import type { ContentOsPlannerWorkspace } from "@/lib/warhome/content-os-planning-contract";
import {
  CONTENT_OS_EVENT_TYPE_LABELS,
  CONTENT_OS_PLANNING_STATUS_LABELS,
} from "./ContentOsLabels";

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function PlannerSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#d6ae4f] px-4 text-sm font-semibold text-[#091524] transition hover:bg-[#e3bc62] disabled:cursor-wait disabled:opacity-65"
    >
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Sparkles className="h-4 w-4" aria-hidden />
      )}
      {pending ? "Preparando propuesta..." : "Generar próximas 2 semanas"}
    </button>
  );
}

function ReviewButton({
  decision,
}: {
  decision: "approved" | "rejected";
}) {
  const { pending } = useFormStatus();
  const approved = decision === "approved";
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
        approved
          ? "bg-[#d6ae4f] text-[#091524] hover:bg-[#e3bc62]"
          : "border border-white/[0.1] text-slate-300 hover:border-rose-300/30 hover:text-rose-200"
      }`}
    >
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
      ) : approved ? (
        <Check className="h-4 w-4" aria-hidden />
      ) : (
        <X className="h-4 w-4" aria-hidden />
      )}
      {approved ? "Aprobar plan" : "Rechazar"}
    </button>
  );
}

function ProposalReview({
  proposal,
  itemTitles,
  ideaTitles,
}: {
  proposal: ContentOsPlannerWorkspace["proposals"][number];
  itemTitles: ReadonlyMap<string, string>;
  ideaTitles: ReadonlyMap<string, string>;
}) {
  const approveAction = reviewContentOsAiProposalAction.bind(
    null,
    proposal.id,
    "approved",
  );
  const rejectAction = reviewContentOsAiProposalAction.bind(
    null,
    proposal.id,
    "rejected",
  );
  const [approveState, approveFormAction] = useActionState(
    approveAction,
    CONTENT_OS_INITIAL_ACTION_STATE,
  );
  const [rejectState, rejectFormAction] = useActionState(
    rejectAction,
    CONTENT_OS_INITIAL_ACTION_STATE,
  );
  const message = approveState.message ?? rejectState.message;
  const messageStatus =
    approveState.message !== null ? approveState.status : rejectState.status;

  return (
    <article className="rounded-lg border border-white/[0.08] bg-[#0d192a]">
      <div className="border-b border-white/[0.07] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded border border-violet-300/25 bg-violet-300/10 px-2 py-1 text-xs font-medium text-violet-200">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Propuesto por IA
              </span>
              <span className="text-xs text-slate-500">
                {CONTENT_OS_PLANNING_STATUS_LABELS[proposal.status]}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {proposal.summary}
            </p>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-slate-500">
            {proposal.events.length} bloques
          </span>
        </div>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {proposal.events.map((event) => {
          const linkedTitle = event.contentItemId
            ? itemTitles.get(event.contentItemId)
            : event.contentIdeaId
              ? ideaTitles.get(event.contentIdeaId)
              : null;
          return (
            <div
              key={event.id}
              className="grid gap-2 px-5 py-4 md:grid-cols-[10rem_minmax(0,1fr)]"
            >
              <div>
                <p className="text-xs font-semibold uppercase text-[#e3bc62]">
                  {CONTENT_OS_EVENT_TYPE_LABELS[event.eventType]}
                </p>
                <p className="mt-1 text-xs capitalize text-slate-500">
                  {formatDateTime(event.startsAt)}
                </p>
              </div>
              <div>
                <p className="font-medium text-white">{event.title}</p>
                {linkedTitle ? (
                  <p className="mt-1 text-sm text-slate-400">{linkedTitle}</p>
                ) : null}
                {event.notes ? (
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {event.notes}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 border-t border-white/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between">
        <p
          aria-live="polite"
          className={`text-sm ${
            messageStatus === "error" ? "text-rose-300" : "text-emerald-300"
          }`}
        >
          {message}
        </p>
        {proposal.status === "proposed" ? (
          <div className="flex flex-wrap gap-2">
            <form action={rejectFormAction}>
              <ReviewButton decision="rejected" />
            </form>
            <form action={approveFormAction}>
              <ReviewButton decision="approved" />
            </form>
          </div>
        ) : proposal.status === "approved" ? (
          <Link
            href="/warhome/content"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#d6ae4f]/35 px-3 text-sm font-semibold text-[#e3bc62] transition hover:bg-[#d6ae4f]/10"
          >
            <CalendarCheck className="h-4 w-4" aria-hidden />
            Ver en calendario
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export function ContentAiPlannerWorkspace({
  workspace,
}: {
  workspace: ContentOsPlannerWorkspace;
}) {
  const [state, action] = useActionState(
    createContentOsAiProposalAction,
    CONTENT_OS_INITIAL_ACTION_STATE,
  );
  const itemTitles = new Map(workspace.items.map((item) => [item.id, item.title]));
  const ideaTitles = new Map(workspace.ideas.map((idea) => [idea.id, idea.title]));
  const usableAvailability = workspace.availability.filter(
    (slot) =>
      slot.availabilityType === "rest" ||
      slot.availabilityType === "recording_available",
  ).length;
  const canGenerate =
    usableAvailability > 0 &&
    (workspace.ideas.length > 0 || workspace.items.length > 0);

  return (
    <div className="mt-8 grid gap-7 xl:grid-cols-[20rem_minmax(0,1fr)]">
      <aside className="h-fit space-y-4 xl:sticky xl:top-24">
        <section className="rounded-lg border border-white/[0.08] bg-[#0d192a] p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-300/10 text-violet-200">
              <Sparkles className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="font-semibold text-white">Nueva propuesta</h2>
              <p className="text-xs text-slate-500">Siempre requiere aprobación</p>
            </div>
          </div>
          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Franjas útiles</dt>
              <dd className="font-semibold tabular-nums text-white">
                {usableAvailability}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Ideas activas</dt>
              <dd className="font-semibold tabular-nums text-white">
                {workspace.ideas.length}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Piezas pendientes</dt>
              <dd className="font-semibold tabular-nums text-white">
                {workspace.items.length}
              </dd>
            </div>
          </dl>
          <form action={action} className="mt-6">
            <fieldset disabled={!canGenerate}>
              <PlannerSubmitButton />
            </fieldset>
          </form>
          <p
            aria-live="polite"
            className={`mt-3 text-sm ${
              state.status === "error" ? "text-rose-300" : "text-emerald-300"
            }`}
          >
            {state.message}
          </p>
          {!canGenerate ? (
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Añade una franja libre y al menos una idea o pieza pendiente.
            </p>
          ) : null}
        </section>
      </aside>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Propuestas</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ningún bloque entra en el calendario hasta que lo apruebes.
            </p>
          </div>
          <span className="text-sm tabular-nums text-slate-500">
            {workspace.proposals.length}
          </span>
        </div>
        {workspace.proposals.length ? (
          <div className="grid gap-4">
            {workspace.proposals.map((proposal) => (
              <ProposalReview
                key={proposal.id}
                proposal={proposal}
                itemTitles={itemTitles}
                ideaTitles={ideaTitles}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.1] bg-[#0d192a]/60 px-6 text-center">
            <Sparkles className="h-8 w-8 text-slate-600" aria-hidden />
            <h3 className="mt-4 font-semibold text-white">
              Sin propuestas todavía
            </h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              El asistente combinará roster, objetivos, ideas y piezas
              pendientes para preparar un plan revisable.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
