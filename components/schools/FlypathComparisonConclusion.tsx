"use client";

import { buildFlypathComparisonConclusion } from "@/lib/schools/comparisonConclusion";
import type { SchoolEntry } from "@/types/schools";

type Props = {
  schools: readonly [SchoolEntry, SchoolEntry];
  onProfileCta: () => void;
  // Opcional: solo se renderiza el botón "Volver al Planner" cuando el caller lo proporciona.
  // El caller (app/schools/page.tsx) lo pasa únicamente cuando el usuario llegó al comparador
  // desde un CTA del Planner > Escuelas (`?from=planner`).
  onBackToPlanner?: () => void;
  /**
   * Cuando es true, el contenido inferior (badges, riesgo, email, lectura y CTA)
   * no se muestra hasta desbloquear premium (pago real o modo QA).
   *
   * El encabezado de la sección (eyebrow + título + subtítulo) siempre queda visible
   * como teaser del bloque premium inferior de la página.
   */
  isLocked?: boolean;
};

export function FlypathComparisonConclusion({
  schools,
  onProfileCta,
  onBackToPlanner,
  isLocked = false,
}: Props) {
  const [a, b] = schools;
  const model = buildFlypathComparisonConclusion(a, b);

  const rows: { label: string; value: string }[] = [
    { label: "Opción más transparente", value: model.mostTransparent.text },
    { label: "Menor riesgo económico", value: model.lowerEconomicRisk.text },
    { label: "Más extras incluidos", value: model.mostExtras.text },
    { label: "Más datos pendientes", value: model.mostPending.text },
  ];

  const navyPanel =
    "rounded-3xl border border-[#c9a454]/55 bg-gradient-to-br from-[#0a1228] via-[#0f1a33] to-[#152545] shadow-[0_18px_50px_-18px_rgba(15,26,51,0.55)] ring-1 ring-[#c9a454]/15";
  const innerWhiteCard =
    "rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_6px_22px_-14px_rgba(15,26,51,0.45)]";
  const innerEyebrow = "text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c9a454]";

  return (
    <section className={`mt-6 ${navyPanel} p-5 sm:p-6`}>
      <div className="border-b border-white/10 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f2ddaa]">
          Resumen comparativo
        </p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight text-white sm:text-[1.6rem]">
          Conclusión FlyPath
        </h2>
        <p className="mt-1.5 text-base leading-relaxed text-slate-300">
          Resumen práctico de la comparación antes de pedir información o pagar una matrícula.
        </p>
      </div>

      {isLocked ? null : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {rows.map((row) => (
              <div key={row.label} className={innerWhiteCard}>
                <p className={innerEyebrow}>{row.label}</p>
                <p className="mt-2 text-lg font-bold leading-tight text-[#0f1a33] sm:text-xl">
                  {row.value}
                </p>
              </div>
            ))}
          </div>

          <div className={`mt-4 ${innerWhiteCard}`}>
            <p className={innerEyebrow}>Principal riesgo antes de pagar</p>
            <p className="mt-1.5 text-base leading-relaxed text-slate-700">{model.mainRisk}</p>
          </div>

          <div className={`mt-4 ${innerWhiteCard}`}>
            <p className={innerEyebrow}>Qué pedir por email</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-[15px] text-slate-700">
              {model.emailPoints.map((item) => (
                <li key={item} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className={`mt-4 ${innerWhiteCard}`}>
            <p className={innerEyebrow}>Lectura FlyPath</p>
            <p className="mt-2 text-base leading-relaxed text-slate-700">{model.reading}</p>
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
            <div className="min-w-0 lg:flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f2ddaa]">
                Siguiente paso recomendado
              </p>
              <p className="mt-1.5 text-base font-semibold leading-snug text-white lg:text-lg">
                Analiza estas 2 escuelas con tu perfil y recibe una conclusión FlyPath personalizada.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
              {onBackToPlanner ? (
                <button
                  type="button"
                  onClick={onBackToPlanner}
                  className="inline-flex min-h-[52px] shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-[15px] font-semibold text-white transition hover:border-white/50 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:px-7 sm:text-base"
                >
                  Volver al Planner
                </button>
              ) : null}
              <button
                type="button"
                onClick={onProfileCta}
                className="inline-flex min-h-[52px] shrink-0 items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-7 py-3.5 text-[15px] font-semibold text-[#0f1a33] shadow-md transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/60 sm:px-8 sm:text-base"
              >
                Analizar con mi perfil
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
