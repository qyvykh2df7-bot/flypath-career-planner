"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Lightbulb, Sparkles } from "lucide-react";
import {
  createContentOsIdeaAction,
  promoteContentOsIdeaAction,
  updateContentOsIdeaAction,
} from "@/app/warhome/(protected)/content/actions";
import { CONTENT_OS_INITIAL_ACTION_STATE } from "@/lib/warhome/content-os-action-state";
import {
  CONTENT_OS_CATEGORIES,
  CONTENT_OS_IDEA_STATUSES,
  CONTENT_OS_LIMITS,
  CONTENT_OS_OBJECTIVES,
  CONTENT_OS_PLATFORMS,
  type ContentOsIdea,
} from "@/lib/warhome/content-os-contract";
import {
  CONTENT_OS_CATEGORY_LABELS,
  CONTENT_OS_IDEA_STATUS_LABELS,
  CONTENT_OS_OBJECTIVE_LABELS,
  CONTENT_OS_PLATFORM_LABELS,
} from "./ContentOsLabels";
import { ContentOsSubmitButton } from "./ContentOsSubmitButton";

const inputClass =
  "min-h-10 w-full rounded-lg border border-white/[0.09] bg-[#091524] px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-[#d6ae4f]/50 focus:ring-2 focus:ring-[#d6ae4f]/15";
const textareaClass = `${inputClass} py-2.5`;

function ActionMessage({
  state,
}: {
  state: typeof CONTENT_OS_INITIAL_ACTION_STATE;
}) {
  if (!state.message) return null;
  return (
    <p
      aria-live="polite"
      className={`text-sm ${state.status === "error" ? "text-rose-300" : "text-emerald-300"}`}
    >
      {state.message}
    </p>
  );
}

function IdeaFields({ idea }: { idea?: ContentOsIdea }) {
  return (
    <>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">Título</span>
        <input
          name="title"
          defaultValue={idea?.title}
          maxLength={CONTENT_OS_LIMITS.ideaTitle}
          required
          className={inputClass}
          placeholder="Una idea clara y reconocible"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">Descripción</span>
        <textarea
          name="description"
          defaultValue={idea?.description}
          maxLength={CONTENT_OS_LIMITS.ideaDescription}
          required
          rows={4}
          className={textareaClass}
          placeholder="Contexto, enfoque o experiencia que no quieres perder"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Categoría</span>
          <select name="category" defaultValue={idea?.category ?? "aviation"} className={inputClass}>
            {CONTENT_OS_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {CONTENT_OS_CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Plataforma</span>
          <select
            name="platform"
            defaultValue={idea?.platform ?? "tiktok_pilotfeliu"}
            className={inputClass}
          >
            {CONTENT_OS_PLATFORMS.map((value) => (
              <option key={value} value={value}>
                {CONTENT_OS_PLATFORM_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Objetivo</span>
          <select name="objective" defaultValue={idea?.objective ?? "growth"} className={inputClass}>
            {CONTENT_OS_OBJECTIVES.map((value) => (
              <option key={value} value={value}>
                {CONTENT_OS_OBJECTIVE_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Estado</span>
          <select name="status" defaultValue={idea?.status ?? "new"} className={inputClass}>
            {CONTENT_OS_IDEA_STATUSES.map((value) => (
              <option key={value} value={value}>
                {CONTENT_OS_IDEA_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
}

function CreateIdeaForm() {
  const [state, action] = useActionState(
    createContentOsIdeaAction,
    CONTENT_OS_INITIAL_ACTION_STATE,
  );
  return (
    <form action={action} className="grid gap-4">
      <IdeaFields />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ActionMessage state={state} />
        <ContentOsSubmitButton label="Guardar idea" />
      </div>
    </form>
  );
}

function IdeaCard({ idea }: { idea: ContentOsIdea }) {
  const updateAction = updateContentOsIdeaAction.bind(null, idea.id);
  const promoteAction = promoteContentOsIdeaAction.bind(null, idea.id);
  const [state, action] = useActionState(updateAction, CONTENT_OS_INITIAL_ACTION_STATE);

  return (
    <article className="rounded-lg border border-white/[0.08] bg-[#0d192a]">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded border border-[#d6ae4f]/25 bg-[#d6ae4f]/10 px-2 py-1 font-medium text-[#e3bc62]">
              {CONTENT_OS_IDEA_STATUS_LABELS[idea.status]}
            </span>
            <span className="text-slate-500">{CONTENT_OS_PLATFORM_LABELS[idea.platform]}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500">{CONTENT_OS_OBJECTIVE_LABELS[idea.objective]}</span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-white">{idea.title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
            {idea.description}
          </p>
          {idea.proposalSource === "ai" && idea.strategyHook ? (
            <div className="mt-4 border-l-2 border-violet-300/25 pl-3">
              <p className="text-xs font-semibold uppercase text-violet-200">
                Hook propuesto
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                {idea.strategyHook}
              </p>
              {idea.strategyPlatforms.length ? (
                <p className="mt-2 text-xs text-slate-500">
                  {idea.strategyPlatforms
                    .map((platform) => CONTENT_OS_PLATFORM_LABELS[platform])
                    .join(" · ")}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        {idea.contentItemId ? (
          <Link
            href={`/warhome/content/library/${idea.contentItemId}`}
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-white/[0.1] px-3 text-sm font-medium text-slate-200 transition hover:border-[#d6ae4f]/35 hover:text-white"
          >
            Abrir pieza
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : idea.status === "discarded" ? (
          <span className="inline-flex min-h-10 shrink-0 items-center text-sm font-medium text-slate-500">
            Idea descartada
          </span>
        ) : (
          <form action={promoteAction}>
            <button
              type="submit"
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-[#d6ae4f]/35 px-3 text-sm font-semibold text-[#e3bc62] transition hover:bg-[#d6ae4f]/10"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Crear pieza
            </button>
          </form>
        )}
      </div>
      <details className="border-t border-white/[0.07]">
        <summary className="cursor-pointer list-none px-5 py-3 text-sm font-medium text-slate-400 hover:text-white">
          Editar idea
        </summary>
        <form action={action} className="grid gap-4 border-t border-white/[0.07] p-5">
          <IdeaFields idea={idea} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ActionMessage state={state} />
            <ContentOsSubmitButton label="Guardar cambios" />
          </div>
        </form>
      </details>
    </article>
  );
}

export function ContentIdeaWorkspace({ ideas }: { ideas: ContentOsIdea[] }) {
  return (
    <div className="mt-8 grid gap-7 xl:grid-cols-[22rem_minmax(0,1fr)]">
      <aside className="h-fit rounded-lg border border-white/[0.08] bg-[#0d192a] p-5 xl:sticky xl:top-24">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d6ae4f]/10 text-[#e3bc62]">
            <Lightbulb className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-semibold text-white">Nueva idea</h2>
            <p className="text-xs text-slate-500">Captura manual</p>
          </div>
        </div>
        <CreateIdeaForm />
      </aside>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Ideas</h2>
          <span className="text-sm tabular-nums text-slate-500">{ideas.length}</span>
        </div>
        {ideas.length ? (
          <div className="grid gap-4">{ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} />)}</div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.1] bg-[#0d192a]/60 px-6 text-center">
            <Lightbulb className="h-8 w-8 text-slate-600" aria-hidden />
            <h3 className="mt-4 font-semibold text-white">Banco de ideas vacío</h3>
            <p className="mt-2 text-sm text-slate-500">La primera idea aparecerá aquí.</p>
          </div>
        )}
      </section>
    </div>
  );
}
