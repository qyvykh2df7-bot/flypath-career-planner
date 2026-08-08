"use client";

import { useActionState } from "react";
import {
  createContentOsItemAction,
  updateContentOsItemAction,
} from "@/app/warhome/(protected)/content/actions";
import { CONTENT_OS_INITIAL_ACTION_STATE } from "@/lib/warhome/content-os-action-state";
import {
  CONTENT_OS_CATEGORIES,
  CONTENT_OS_ITEM_STATUSES,
  CONTENT_OS_LIMITS,
  CONTENT_OS_OBJECTIVES,
  CONTENT_OS_PLATFORMS,
  type ContentOsItem,
} from "@/lib/warhome/content-os-contract";
import {
  CONTENT_OS_CATEGORY_LABELS,
  CONTENT_OS_ITEM_STATUS_LABELS,
  CONTENT_OS_OBJECTIVE_LABELS,
  CONTENT_OS_PLATFORM_LABELS,
} from "./ContentOsLabels";
import { ContentOsSubmitButton } from "./ContentOsSubmitButton";

const inputClass =
  "min-h-10 w-full rounded-lg border border-white/[0.09] bg-[#091524] px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-[#d6ae4f]/50 focus:ring-2 focus:ring-[#d6ae4f]/15";
const textareaClass = `${inputClass} py-2.5`;

export function ContentItemForm({ item }: { item?: ContentOsItem }) {
  const updateAction = item ? updateContentOsItemAction.bind(null, item.id) : null;
  const [state, action] = useActionState(
    updateAction ?? createContentOsItemAction,
    CONTENT_OS_INITIAL_ACTION_STATE,
  );

  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block lg:col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Título</span>
          <input
            name="title"
            defaultValue={item?.title}
            maxLength={CONTENT_OS_LIMITS.itemTitle}
            required
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Plataforma</span>
          <select
            name="platform"
            defaultValue={item?.platform ?? "tiktok_pilotfeliu"}
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
          <select name="objective" defaultValue={item?.objective ?? "growth"} className={inputClass}>
            {CONTENT_OS_OBJECTIVES.map((value) => (
              <option key={value} value={value}>
                {CONTENT_OS_OBJECTIVE_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Categoría</span>
          <select name="category" defaultValue={item?.category ?? ""} className={inputClass}>
            <option value="">Sin categoría</option>
            {CONTENT_OS_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {CONTENT_OS_CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Estado</span>
          <select name="status" defaultValue={item?.status ?? "draft"} className={inputClass}>
            {CONTENT_OS_ITEM_STATUSES.map((value) => (
              <option key={value} value={value}>
                {CONTENT_OS_ITEM_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">Hook</span>
        <textarea
          name="hook"
          defaultValue={item?.hook}
          maxLength={CONTENT_OS_LIMITS.itemHook}
          rows={3}
          required
          className={textareaClass}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">Guion</span>
        <textarea
          name="script"
          defaultValue={item?.script}
          maxLength={CONTENT_OS_LIMITS.itemScript}
          rows={12}
          required
          className={textareaClass}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">CTA</span>
        <textarea
          name="cta"
          defaultValue={item?.cta}
          maxLength={CONTENT_OS_LIMITS.itemCta}
          rows={3}
          required
          className={textareaClass}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">
            Fecha de grabación
          </span>
          <input
            type="date"
            name="plannedRecordingOn"
            defaultValue={item?.plannedRecordingOn ?? ""}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">
            Fecha de publicación
          </span>
          <input
            type="date"
            name="plannedPublishOn"
            defaultValue={item?.plannedPublishOn ?? ""}
            className={inputClass}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">Notas</span>
        <textarea
          name="notes"
          defaultValue={item?.notes ?? ""}
          maxLength={CONTENT_OS_LIMITS.itemNotes}
          rows={5}
          className={textareaClass}
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-5">
        <p
          aria-live="polite"
          className={`text-sm ${
            state.status === "error" ? "text-rose-300" : "text-emerald-300"
          }`}
        >
          {state.message}
        </p>
        <ContentOsSubmitButton label={item ? "Guardar contenido" : "Crear contenido"} />
      </div>
    </form>
  );
}
