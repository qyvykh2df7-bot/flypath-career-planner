"use client";

import { useActionState } from "react";
import { updateContentOsBrandProfileAction } from "@/app/warhome/(protected)/content/actions";
import { CONTENT_OS_INITIAL_ACTION_STATE } from "@/lib/warhome/content-os-action-state";
import {
  CONTENT_OS_BRAND_LIMITS,
  CONTENT_OS_BRAND_PRODUCTS,
  type ContentOsBrandProfile,
} from "@/lib/warhome/content-os-brand-contract";
import { CONTENT_OS_OBJECTIVES } from "@/lib/warhome/content-os-contract";
import {
  CONTENT_OS_OBJECTIVE_LABELS,
  CONTENT_OS_STRATEGY_PRODUCT_LABELS,
} from "./ContentOsLabels";
import { ContentOsSubmitButton } from "./ContentOsSubmitButton";

const inputClass =
  "min-h-10 w-full rounded-lg border border-white/[0.09] bg-[#091524] px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-[#d6ae4f]/50 focus:ring-2 focus:ring-[#d6ae4f]/15";
const textareaClass = `${inputClass} py-2.5`;

export function ContentBrandProfileForm({
  profile,
}: {
  profile: ContentOsBrandProfile;
}) {
  const [state, action] = useActionState(
    updateContentOsBrandProfileAction,
    CONTENT_OS_INITIAL_ACTION_STATE,
  );

  return (
    <form action={action} className="mt-8 grid gap-6">
      <section className="rounded-lg border border-white/[0.08] bg-[#0d192a] p-5 sm:p-6">
        <h2 className="text-base font-semibold text-white">Identidad</h2>
        <div className="mt-5 grid gap-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">
              Marca
            </span>
            <input
              name="brandName"
              defaultValue={profile.brandName}
              maxLength={CONTENT_OS_BRAND_LIMITS.name}
              required
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">
              Descripción
            </span>
            <textarea
              name="brandDescription"
              defaultValue={profile.brandDescription}
              maxLength={CONTENT_OS_BRAND_LIMITS.description}
              rows={4}
              required
              className={textareaClass}
            />
          </label>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-white/[0.08] bg-[#0d192a] p-5 sm:p-6">
          <h2 className="text-base font-semibold text-white">Audiencia y pilares</h2>
          <div className="mt-5 grid gap-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-400">
                Audiencias · una por línea
              </span>
              <textarea
                name="audiences"
                defaultValue={profile.audiences.join("\n")}
                rows={7}
                required
                className={textareaClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-400">
                Pilares · uno por línea
              </span>
              <textarea
                name="contentPillars"
                defaultValue={profile.contentPillars.join("\n")}
                rows={9}
                required
                className={textareaClass}
              />
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-white/[0.08] bg-[#0d192a] p-5 sm:p-6">
          <h2 className="text-base font-semibold text-white">Productos y objetivos</h2>
          <div className="mt-5 grid gap-4">
            {CONTENT_OS_BRAND_PRODUCTS.map((product) => (
              <label key={product} className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-400">
                  {CONTENT_OS_STRATEGY_PRODUCT_LABELS[product]}
                </span>
                <textarea
                  name={`product_${product}`}
                  defaultValue={profile.products[product]}
                  maxLength={CONTENT_OS_BRAND_LIMITS.productDescription}
                  rows={2}
                  required
                  className={textareaClass}
                />
              </label>
            ))}
            <fieldset>
              <legend className="mb-2 text-xs font-medium text-slate-400">
                Objetivos
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {CONTENT_OS_OBJECTIVES.map((objective) => (
                  <label
                    key={objective}
                    className="flex min-h-10 items-center gap-3 rounded-lg border border-white/[0.08] px-3 text-sm text-slate-300"
                  >
                    <input
                      type="checkbox"
                      name="objectives"
                      value={objective}
                      defaultChecked={profile.objectives.includes(objective)}
                      className="h-4 w-4 accent-[#d6ae4f]"
                    />
                    {CONTENT_OS_OBJECTIVE_LABELS[objective]}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-white/[0.08] bg-[#0d192a] p-5 sm:p-6">
        <h2 className="text-base font-semibold text-white">Tono</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            ["toneStyle", "Estilo", profile.toneStyle],
            ["tonePersonality", "Personalidad", profile.tonePersonality],
            ["toneCommunication", "Comunicación", profile.toneCommunication],
            ["toneAvoid", "Qué evitar", profile.toneAvoid],
          ].map(([name, label, value]) => (
            <label key={name} className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-400">
                {label}
              </span>
              <textarea
                name={name}
                defaultValue={value}
                maxLength={CONTENT_OS_BRAND_LIMITS.toneField}
                rows={4}
                required
                className={textareaClass}
              />
            </label>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          aria-live="polite"
          className={`text-sm ${
            state.status === "error" ? "text-rose-300" : "text-emerald-300"
          }`}
        >
          {state.message}
        </p>
        <ContentOsSubmitButton label="Guardar Brand DNA" />
      </div>
    </form>
  );
}
