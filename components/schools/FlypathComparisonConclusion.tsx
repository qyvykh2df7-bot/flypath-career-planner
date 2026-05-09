"use client";

import { Lock } from "lucide-react";
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
   * Cuando es true, el CONTENIDO inferior (badges, principal riesgo, email,
   * lectura FlyPath y CTA) se renderiza igual pero blurreado y bloqueado a
   * interacción, y se monta encima un overlay con la propuesta premium.
   *
   * El encabezado de la sección (eyebrow "Resumen comparativo" + título
   * "Conclusión FlyPath" + subtítulo) **siempre** queda visible y legible,
   * para que actúe como teaser del contenido bloqueado.
   *
   * El contenido real nunca se sustituye ni se elimina: se renderiza siempre
   * debajo para que en preview/QA pueda revisarse y para que al desbloquear
   * premium aparezca sin reconstruir nada.
   */
  isLocked?: boolean;
  /**
   * Handler del CTA "Desbloquear análisis premium" del overlay. Solo se usa cuando
   * `isLocked === true`. Cuando conectemos el pago real, el caller cambiará
   * este handler por el inicio del flujo de checkout.
   */
  onUnlockClick?: () => void;
};

export function FlypathComparisonConclusion({
  schools,
  onProfileCta,
  onBackToPlanner,
  isLocked = false,
  onUnlockClick,
}: Props) {
  const [a, b] = schools;
  const model = buildFlypathComparisonConclusion(a, b);

  // Resumen visual rápido: solo título y nombre de escuela. Las explicaciones largas se han retirado de los
  // 4 badges superiores para que funcionen como cabecera de la conclusión, no como mini-fichas.
  const rows: { label: string; value: string }[] = [
    { label: "Opción más transparente", value: model.mostTransparent.text },
    { label: "Menor riesgo económico", value: model.lowerEconomicRisk.text },
    { label: "Más extras incluidos", value: model.mostExtras.text },
    { label: "Más datos pendientes", value: model.mostPending.text },
  ];

  // Estética FlyPath: navy oscuro de marca, borde dorado fino, badges blancos con mini títulos dorados.
  const navyPanel =
    "rounded-3xl border border-[#c9a454]/55 bg-gradient-to-br from-[#0a1228] via-[#0f1a33] to-[#152545] shadow-[0_18px_50px_-18px_rgba(15,26,51,0.55)] ring-1 ring-[#c9a454]/15";
  const innerWhiteCard =
    "rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_6px_22px_-14px_rgba(15,26,51,0.45)]";
  const innerEyebrow = "text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c9a454]";

  return (
    <section className={`mt-6 ${navyPanel} p-5 sm:p-6`}>
      {/* Cabecera: título blanco + subtítulo gris claro.
          SIEMPRE visible (también con premium bloqueado): actúa como teaser
          del contenido inferior. NO se blurréa ni se cubre con overlay. */}
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

      {/* Bloque bloqueable: badges + riesgo + email + lectura + CTA.
          - El contenido real siempre se monta debajo (nunca se sustituye).
          - Si `isLocked`, se aplica blur + pointer-events-none + select-none
            y se monta un overlay premium centrado encima. */}
      <div className="relative">
        <div
          className={
            isLocked
              ? "pointer-events-none select-none blur-[3px] opacity-80"
              : ""
          }
          aria-hidden={isLocked}
        >
          {/* Badges de comparación: tarjetas blancas con mini-título dorado y nombre de escuela en navy. */}
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

          {/* CTA de cierre: cierre natural de la Conclusión, integrado en el panel navy.
              Layout: en desktop (lg) el texto va a la izquierda y los botones agrupados a la
              derecha con separación clara. En móvil/tablet se apilan: texto arriba y botones
              debajo. Los botones, dentro de su grupo, también se apilan en móvil pequeño y se
              ponen en fila desde sm. "Volver al Planner" sólo se muestra cuando el caller pasa
              el handler (origen=planner). "Analizar con mi perfil" se muestra siempre. */}
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
        </div>

        {isLocked ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-4 sm:p-6">
            <div
              role="dialog"
              aria-labelledby="flypath-premium-lock-title"
              aria-describedby="flypath-premium-lock-desc"
              className="w-full max-w-md rounded-2xl border border-[#c9a454]/55 bg-gradient-to-br from-[#0a1228] via-[#0f1a33] to-[#152545] p-6 text-white shadow-[0_24px_60px_-20px_rgba(15,26,51,0.7)] ring-1 ring-[#c9a454]/15 sm:p-7"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#c9a454]/15 ring-1 ring-[#c9a454]/35">
                  <Lock className="h-4 w-4 text-[#f2ddaa]" aria-hidden />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f2ddaa]">
                  Análisis premium FlyPath
                </span>
              </div>
              <h3
                id="flypath-premium-lock-title"
                className="mt-3 text-xl font-semibold leading-tight text-white sm:text-2xl"
              >
                Descubre qué escuela encaja mejor contigo
              </h3>
              <p
                id="flypath-premium-lock-desc"
                className="mt-2 text-[15px] leading-relaxed text-slate-300"
              >
                Analiza estas 2 escuelas con tu perfil y recibe una conclusión
                aplicada a tu situación real.
              </p>
              <ul className="mt-4 space-y-2 text-[15px] text-slate-200">
                {[
                  "Mejor escuela para tu perfil",
                  "Comparación personalizada entre ambas opciones",
                  "Informe premium de decisión",
                  "Próximos pasos adaptados a tu caso",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 leading-relaxed">
                    <span
                      aria-hidden
                      className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a454]"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={onUnlockClick}
                className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-6 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-md transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/60 sm:text-base"
              >
                Desbloquear análisis premium
              </button>
              <p className="mt-3 text-center text-[12px] text-slate-400">
                Pago seguro. Acceso inmediato al análisis.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
