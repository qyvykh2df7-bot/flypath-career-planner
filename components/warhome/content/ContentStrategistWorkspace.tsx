"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowRight,
  Check,
  Lightbulb,
  LoaderCircle,
  Sparkles,
  X,
} from "lucide-react";
import {
  createContentOsStrategyProposalsAction,
  reviewContentOsStrategyProposalAction,
} from "@/app/warhome/(protected)/content/actions";
import { CONTENT_OS_INITIAL_ACTION_STATE } from "@/lib/warhome/content-os-action-state";
import type {
  ContentOsStrategistWorkspace,
  ContentOsStrategyProposal,
} from "@/lib/warhome/content-os-strategy-contract";
import {
  CONTENT_OS_OBJECTIVE_LABELS,
  CONTENT_OS_PLATFORM_LABELS,
  CONTENT_OS_STRATEGY_FORMAT_LABELS,
  CONTENT_OS_STRATEGY_PILLAR_LABELS,
  CONTENT_OS_STRATEGY_PRIORITY_LABELS,
  CONTENT_OS_STRATEGY_PRODUCT_LABELS,
} from "./ContentOsLabels";

const balanceFields = [
  { name: "growth", label: "Crecimiento" },
  { name: "authority", label: "Autoridad" },
  { name: "community", label: "Comunidad" },
  { name: "conversion", label: "Conversión" },
] as const;

function GenerateButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#d6ae4f] px-4 text-sm font-semibold text-[#091524] transition hover:bg-[#e3bc62] disabled:cursor-wait disabled:opacity-65"
    >
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Sparkles className="h-4 w-4" aria-hidden />
      )}
      {pending ? "Preparando ideas..." : "Generar 10 propuestas"}
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
      {approved ? "Guardar en banco" : "Rechazar"}
    </button>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

function StrategyProposalCard({
  proposal,
}: {
  proposal: ContentOsStrategyProposal;
}) {
  const approveAction = reviewContentOsStrategyProposalAction.bind(
    null,
    proposal.id,
    "approved",
  );
  const rejectAction = reviewContentOsStrategyProposalAction.bind(
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
      <div className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded border border-violet-300/25 bg-violet-300/10 px-2 py-1 font-medium text-violet-200">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Propuesta IA
              </span>
              <span className="text-slate-500">
                {CONTENT_OS_OBJECTIVE_LABELS[proposal.objective]}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">
                {CONTENT_OS_STRATEGY_PILLAR_LABELS[proposal.pillar]}
              </span>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-white">
              {proposal.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {proposal.idea}
            </p>
          </div>
          <span
            className={`w-fit shrink-0 rounded border px-2 py-1 text-xs font-medium ${
              proposal.priority === "high"
                ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
                : "border-white/[0.1] text-slate-400"
            }`}
          >
            Prioridad {CONTENT_OS_STRATEGY_PRIORITY_LABELS[proposal.priority]}
          </span>
        </div>

        <div className="mt-5 grid gap-4 border-t border-white/[0.07] pt-5 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-[#e3bc62]">
              Hook
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {proposal.hook}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[#e3bc62]">
              Enfoque
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {proposal.explanation}
            </p>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 rounded-lg border border-white/[0.06] bg-[#091524] p-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <dt className="text-xs text-slate-500">Formato</dt>
            <dd className="mt-1 font-medium text-slate-200">
              {CONTENT_OS_STRATEGY_FORMAT_LABELS[proposal.format]}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Duración</dt>
            <dd className="mt-1 font-medium text-slate-200">
              {formatDuration(proposal.durationSeconds)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Plataformas</dt>
            <dd className="mt-1 font-medium text-slate-200">
              {proposal.platforms
                .map((platform) => CONTENT_OS_PLATFORM_LABELS[platform])
                .join(" · ")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Producto</dt>
            <dd className="mt-1 font-medium text-slate-200">
              {proposal.relatedProduct
                ? CONTENT_OS_STRATEGY_PRODUCT_LABELS[proposal.relatedProduct]
                : "Sin relación comercial"}
            </dd>
          </div>
        </dl>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase text-slate-500">CTA</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{proposal.cta}</p>
        </div>
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
        {proposal.proposalStatus === "proposed" ? (
          <div className="flex flex-wrap gap-2">
            <form action={rejectFormAction}>
              <ReviewButton decision="rejected" />
            </form>
            <form action={approveFormAction}>
              <ReviewButton decision="approved" />
            </form>
          </div>
        ) : proposal.proposalStatus === "approved" ? (
          <Link
            href="/warhome/content/ideas"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#d6ae4f]/35 px-3 text-sm font-semibold text-[#e3bc62] transition hover:bg-[#d6ae4f]/10"
          >
            Ver en banco
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : (
          <span className="text-sm text-slate-500">Propuesta rechazada</span>
        )}
      </div>
    </article>
  );
}

export function ContentStrategistWorkspace({
  workspace,
}: {
  workspace: ContentOsStrategistWorkspace;
}) {
  const [state, action] = useActionState(
    createContentOsStrategyProposalsAction,
    CONTENT_OS_INITIAL_ACTION_STATE,
  );

  return (
    <div className="mt-8 grid gap-7 xl:grid-cols-[21rem_minmax(0,1fr)]">
      <aside className="h-fit space-y-4 xl:sticky xl:top-24">
        <section className="rounded-lg border border-white/[0.08] bg-[#0d192a] p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-300/10 text-violet-200">
              <Sparkles className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="font-semibold text-white">Nueva estrategia</h2>
              <p className="text-xs text-slate-500">
                Ideas revisables, nunca calendario
              </p>
            </div>
          </div>

          <form action={action} className="mt-6">
            <fieldset className="grid grid-cols-2 gap-3">
              <legend className="col-span-2 mb-2 text-xs font-semibold uppercase text-slate-500">
                Balance de objetivos
              </legend>
              {balanceFields.map(({ name, label }) => (
                <label key={name} className="block">
                  <span className="mb-1.5 block text-xs text-slate-400">
                    {label}
                  </span>
                  <div className="flex items-center rounded-lg border border-white/[0.1] bg-[#091524]">
                    <input
                      name={name}
                      type="number"
                      min={0}
                      max={100}
                      required
                      defaultValue={workspace.defaultBalance[name]}
                      className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-white outline-none"
                    />
                    <span className="pr-3 text-xs text-slate-500">%</span>
                  </div>
                </label>
              ))}
            </fieldset>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              La suma debe ser 100 %. El reparto inicial prioriza crecimiento y
              autoridad.
            </p>
            <div className="mt-5">
              <GenerateButton />
            </div>
          </form>

          <p
            aria-live="polite"
            className={`mt-3 text-sm ${
              state.status === "error" ? "text-rose-300" : "text-emerald-300"
            }`}
          >
            {state.message}
          </p>

          <dl className="mt-5 grid gap-3 border-t border-white/[0.07] pt-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Histórico analizado</dt>
              <dd className="font-semibold tabular-nums text-white">
                {workspace.historyCount}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Publicados</dt>
              <dd className="font-semibold tabular-nums text-white">
                {workspace.publishedCount}
              </dd>
            </div>
          </dl>
        </section>
      </aside>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Propuestas estratégicas
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Solo las ideas guardadas pasan al banco y quedan disponibles para
              el Planner IA.
            </p>
          </div>
          <span className="text-sm tabular-nums text-slate-500">
            {workspace.proposals.length}
          </span>
        </div>

        {workspace.proposals.length ? (
          <div className="grid gap-4">
            {workspace.proposals.map((proposal) => (
              <StrategyProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.1] bg-[#0d192a]/60 px-6 text-center">
            <Lightbulb className="h-8 w-8 text-slate-600" aria-hidden />
            <h3 className="mt-4 font-semibold text-white">
              Sin propuestas estratégicas
            </h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              El Strategist combinará marca, audiencia, productos e histórico
              para sugerir qué crear a continuación.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
