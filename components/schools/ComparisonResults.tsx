import { useState } from "react";
import {
  confidenceLabel,
  dataStatusLabel,
  getPriceGap,
  getSchoolInitials,
  summarizeComparison,
} from "@/lib/schools/schoolUtils";
import type { SchoolEntry } from "@/types/schools";

type Props = {
  schools: SchoolEntry[];
};

type RouteMode = "integrated" | "modular";

type ModularProfile = {
  announcedText: string;
  estimatedText: string;
  gapText: string;
  durationText: string;
  basesText: string;
  modulesPublished: string[];
  scheduleSummary: string;
  financingValue: "yes" | "no" | "unknown";
  financingNote: string;
  extrasItems: Array<{ label: string; value: string; display: string }>;
  reading: string;
  flags: string[];
  questions: string[];
  costsNote: string;
  estimateNote: string;
};

/**
 * Patrón reutilizable para escuelas con varias rutas (integrado + modular).
 *
 * Reglas de producto:
 * - Una sola ruta principal -> no mostrar toggle.
 * - Integrado + modular -> mostrar toggle y adaptar bloques A/B/C + lectura + riesgos + preguntas.
 * - Modular: la suma publicada no equivale automáticamente a ruta completa.
 * - Modular: no marcar MCC/UPRT como extras incluidos si son módulos independientes.
 * - Modular: financiación por defecto "no", salvo evidencia explícita de financiación modular.
 */
function getEuropeanFlyersModularProfile(): ModularProfile {
  return {
    announcedText: "56.425 €",
    estimatedText: "78.000 €",
    gapText: "21.575 €",
    durationText: "Variable según módulos y disponibilidad.",
    basesText: "Madrid (Cuatro Vientos) y Alicante (Mutxamel), según curso.",
    modulesPublished: [
      "PPL: 12.000 €",
      "ATPL teórico: 6.200 €",
      "CPL: 6.150 €",
      "ME: 5.000 €",
      "ME & IR: 19.850 €",
      "MCC APS: 5.200 €",
      "UPRT: 1.450 €",
      "PBN: 575 € Madrid / 450 € Alicante",
    ],
    scheduleSummary: "Calendario de pagos modular no publicado.",
    financingValue: "no",
    financingNote: "",
    extrasItems: [
      { label: "Tasas", value: "unknown", display: "Por confirmar" },
      { label: "Skill tests", value: "unknown", display: "Por confirmar" },
      { label: "Materiales", value: "unknown", display: "Por confirmar" },
      { label: "Alojamiento", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "Ruta modular publicada por módulos. La estimación FlyPath añade módulos/costes necesarios no publicados y un margen prudente por imprevistos antes de considerar la ruta completa.",
    flags: [
      "La suma de módulos publicados no equivale necesariamente a una ruta completa desde cero.",
      "Faltan costes como Night Rating, hour building u otros conceptos necesarios para completar la ruta.",
      "Tasas, skill tests y materiales quedan por confirmar para la ruta modular.",
      "Confirmar vigencia actual de cada precio modular.",
    ],
    questions: [
      "¿Qué módulos exactos necesito según mi punto de partida?",
      "¿Night Rating, hour building, tasas, skill tests y materiales están incluidos o van aparte?",
      "¿Qué precios modulares siguen vigentes para la convocatoria actual?",
      "¿Hay packs o descuentos si se contratan varios módulos?",
    ],
    costsNote:
      "Suma de módulos publicados. No equivale necesariamente a una ruta completa desde cero.",
    estimateNote:
      "Estimación FlyPath: suma de módulos publicados + módulos/costes necesarios no publicados + margen por imprevistos, horas extra y costes externos.",
  };
}

function supportsMultiRouteProfile(school: SchoolEntry): boolean {
  return school.slug === "european-flyers";
}

function flag(value: string) {
  return value === "yes" ? "Sí" : value === "no" ? "No" : value === "partial" ? "Parcial" : value === "optional" ? "Opcional" : "No claro";
}

function chipClass(value: string): string {
  if (value === "yes") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (value === "no") return "border-slate-300 bg-slate-100 text-slate-700";
  if (value === "partial" || value === "optional") return "border-[#c9a454]/35 bg-[#fff8e8] text-[#7a5a16]";
  return "border-slate-300 bg-slate-100 text-slate-600";
}

function routeTypeLabel(type: SchoolEntry["routeType"], school?: SchoolEntry): string {
  if (school?.slug === "european-flyers") return "Formación integrada y modular";
  if (type === "integrated") return "Escuela integrada";
  if (type === "modular") return "Ruta modular";
  return "Universidad / Grado + licencia";
}

function euro(value: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function priceDisplay(value: number, pendingLabel: string): string {
  return value > 0 ? euro(value) : pendingLabel;
}

function flypathReading(school: SchoolEntry, gap: number): string {
  const missingCoreExtras = [school.examFeesIncluded, school.skillTestsIncluded, school.trainingMaterialsIncluded].filter(
    (item) => item === "unknown" || item === "no",
  ).length;

  if (school.pendingData.length >= 3 || school.dataConfidence === "low") {
    return "Datos todavía incompletos antes de tomar una decisión.";
  }
  if (Number.isFinite(gap) && gap >= 7000) {
    return "Brecha alta; conviene confirmar el coste final por escrito.";
  }
  if (missingCoreExtras >= 2) {
    return "Claridad media; conviene confirmar tasas y extras antes de pagar.";
  }
  return "Buena claridad relativa, con puntos de coste por validar en contrato.";
}

function normalizeSummary(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function shortRefundSummary(text: string): string {
  const v = normalizeSummary(text);
  if (v.includes("horas no voladas")) return "Parcial por horas no voladas";
  if (
    v.includes("detallada en la web") ||
    v.includes("sin politica publica") ||
    v.includes("no detallada publicamente") ||
    (v.includes("sin politica") && v.includes("detallada"))
  ) {
    return "No público detallado";
  }
  if (v.includes("conceptos no consumidos")) return "Parcial por no consumido";
  if (v.includes("email")) return "Parcial por email";
  if (v.includes("reglas separadas")) return "Reglas separadas";
  if (v.includes("resumen comercial")) return "Sin condiciones completas";
  if (v.includes("sin documento unificado")) return "Sin documento unificado";
  if (v.includes("academico claro")) return "Académico claro; vuelo aparte";
  if (v.includes("academico") && v.includes("vuelo")) return "Reglas separadas";
  if (v.includes("parcial")) return "Reembolso parcial";
  return "Confirmar con la escuela";
}

function shortScheduleSummary(text: string): string {
  const v = normalizeSummary(text);
  if (v.includes("hitos") && v.includes("fases")) return "5 hitos por fases";
  if (v.includes("modulo")) return "Pago por módulo";
  if (v.includes("trimestral")) return "Matrícula + trimestral";
  if (v.includes("bloque") && v.includes("reserva")) return "Pago por bloque";
  if (v.includes("externos")) return "Matrícula + vuelo externo";
  if (v.includes("deposito") && v.includes("hitos")) return "Depósito + hitos por fase";
  if (v.includes("coste academico anual")) return "Anual académico + vuelo";
  if (v.includes("matricula anual academica")) return "Matrícula + vuelo por bloques";
  if (v.includes("mensual")) return "Pago mensual";
  return "Confirmar calendario";
}

export function ComparisonResults({ schools }: Props) {
  const [europeanFlyersRouteMode, setEuropeanFlyersRouteMode] = useState<RouteMode>("integrated");
  const summary = summarizeComparison(schools);
  if (!summary) return null;
  const maxComparableCost = Math.max(
    ...schools.map((s) => Math.max(s.advertisedPriceEUR, s.flypathEstimatedRealCostEUR, 0)),
  );
  const gridColsClass = schools.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-[#0f1a33]">Análisis comparativo FlyPath</h2>

      <p className="text-sm text-slate-600">
        Compara las escuelas seleccionadas con los mismos criterios: costes, contrato, extras, riesgos y preguntas clave.
      </p>

      <div className={`grid gap-3.5 ${gridColsClass}`}>
        {schools.map((school) => {
          const isEuropeanFlyers = school.slug === "european-flyers";
          const isEuropeanFlyersModular = isEuropeanFlyers && europeanFlyersRouteMode === "modular";
          const modularProfile = isEuropeanFlyersModular ? getEuropeanFlyersModularProfile() : null;
          const gap = getPriceGap(school);
          const hasAnnounced = school.advertisedPriceEUR > 0;
          const hasEstimated = school.flypathEstimatedRealCostEUR > 0;
          const hasComparableCosts =
            !isEuropeanFlyersModular && hasAnnounced && hasEstimated && Number.isFinite(gap);
          const announcedPct =
            hasComparableCosts && maxComparableCost > 0
              ? Math.max(6, Math.round((school.advertisedPriceEUR / maxComparableCost) * 100))
              : 0;
          const estimatedPct =
            hasComparableCosts && maxComparableCost > 0
              ? Math.max(8, Math.round((school.flypathEstimatedRealCostEUR / maxComparableCost) * 100))
              : 0;
          const flags = modularProfile ? modularProfile.flags : school.redFlags.slice(0, 2);
          const questions = modularProfile ? modularProfile.questions : school.keyQuestions.slice(0, 3);
          const reading = modularProfile ? modularProfile.reading : flypathReading(school, gap);
          const initials = getSchoolInitials(school.name);
          const announcedText = modularProfile
            ? modularProfile.announcedText
            : priceDisplay(school.advertisedPriceEUR, "No publicado");
          const estimatedText = modularProfile
            ? modularProfile.estimatedText
            : priceDisplay(school.flypathEstimatedRealCostEUR, "Pendiente");
          const gapText = modularProfile ? modularProfile.gapText : hasComparableCosts ? euro(gap) : "Pendiente";
          const scheduleSummary = modularProfile
            ? modularProfile.scheduleSummary
            : shortScheduleSummary(school.paymentScheduleSummary);
          const financingValue = modularProfile ? modularProfile.financingValue : school.financingAvailable;
          const financingNote = modularProfile
            ? modularProfile.financingNote
            : isEuropeanFlyers
              ? "Ofrecen financiación a medida."
              : "";
          const extrasItems = modularProfile
            ? modularProfile.extrasItems
            : [
                { label: "MCC/JOC", value: school.mccJocIncluded },
                { label: "Advanced UPRT", value: school.advancedUprtIncluded },
                { label: "Tasas", value: school.examFeesIncluded },
                { label: "Skill tests", value: school.skillTestsIncluded },
                { label: "Materiales", value: school.trainingMaterialsIncluded },
                { label: "Alojamiento", value: school.accommodationIncluded },
              ];

          return (
            <article key={school.id} className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="rounded-t-2xl border-b border-[#c9a454]/20 bg-gradient-to-r from-[#0f1a33] to-[#132240] p-4 text-white">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-xs font-semibold tracking-wide text-[#f2ddaa]">
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-base font-bold leading-snug text-white">{school.name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-300">{routeTypeLabel(school.routeType, school)}</p>
                    <p className="mt-0.5 text-[11px] text-slate-300">{school.city} · {school.baseAirport}</p>
                  </div>
                  <span className="rounded-full border border-[#c9a454]/35 bg-[#fff8e8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#7a5a16]">
                    {dataStatusLabel(school.dataStatus)}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-2.5 p-3.5">
                {supportsMultiRouteProfile(school) ? (
                  <div className="flex justify-center">
                    <div className="inline-flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setEuropeanFlyersRouteMode("integrated")}
                        className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                          europeanFlyersRouteMode === "integrated"
                            ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                            : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                        }`}
                      >
                        Integrado ATPL
                      </button>
                      <button
                        type="button"
                        onClick={() => setEuropeanFlyersRouteMode("modular")}
                        className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                          europeanFlyersRouteMode === "modular"
                            ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                            : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                        }`}
                      >
                        Ruta modular
                      </button>
                    </div>
                  </div>
                ) : null}

                <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">A. Costes</p>
                  <div className="mt-1.5 space-y-1.5 text-sm text-slate-700">
                    <p>
                      <span className="font-semibold text-[#0f1a33]">Precio anunciado:</span>{" "}
                      <span className="text-[17px] font-bold leading-none text-[#0f1a33]">
                        {announcedText}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold text-[#0f1a33]">Coste real estimado FlyPath:</span>{" "}
                      <span className="text-[17px] font-bold leading-none text-[#0f1a33]">{estimatedText}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Brecha estimada:</span>{" "}
                      <span className="inline-flex rounded-full border border-[#c9a454]/45 bg-[#fff8e8] px-2 py-0.5 text-sm font-semibold text-[#7a5a16]">
                        {gapText}
                      </span>
                    </p>
                    {modularProfile ? (
                      <p className="text-xs text-slate-600">
                        {modularProfile.costsNote}
                      </p>
                    ) : null}
                    {modularProfile ? (
                      <p className="text-xs text-slate-600">
                        {modularProfile.estimateNote}
                      </p>
                    ) : null}
                    {modularProfile ? (
                      <>
                        <p>
                          <span className="font-semibold text-slate-700">Duración:</span> {modularProfile.durationText}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-700">Bases:</span> {modularProfile.basesText}
                        </p>
                        <div>
                          <p className="font-semibold text-slate-700">Módulos publicados:</p>
                          <ul className="mt-1 grid gap-x-4 gap-y-1 text-sm text-slate-700 sm:grid-cols-2">
                            {modularProfile.modulesPublished.map((module) => (
                              <li key={module}>- {module}</li>
                            ))}
                          </ul>
                        </div>
                      </>
                    ) : isEuropeanFlyers ? (
                      <>
                        <p>
                          <span className="font-semibold text-slate-700">Duración:</span> 24 meses
                        </p>
                        <p>
                          <span className="font-semibold text-slate-700">Flota:</span> {school.fleetSummary}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-700">Idioma formación:</span>{" "}
                          {school.languageOfInstruction}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-700">Class 1:</span> {school.class1Requirement}
                        </p>
                      </>
                    ) : null}
                  </div>
                  {hasComparableCosts ? (
                    <div className="mt-2.5 space-y-1.5">
                      <div>
                        <p className="mb-0.5 text-[11px] text-slate-500">Anunciado</p>
                        <div className="h-1.5 rounded-full bg-slate-100">
                          <div className="h-1.5 rounded-full bg-slate-400/70" style={{ width: `${announcedPct}%` }} />
                        </div>
                      </div>
                      <div>
                        <p className="mb-0.5 text-[11px] text-slate-500">Real estimado</p>
                        <div className="h-1.5 rounded-full bg-slate-100">
                          <div className="h-1.5 rounded-full bg-[#0f1a33]" style={{ width: `${estimatedPct}%` }} />
                        </div>
                      </div>
                    </div>
                  ) : !modularProfile ? (
                    <p className="mt-2.5 text-xs text-slate-500">Dato pendiente</p>
                  ) : null}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">B. Contrato y pagos</p>
                  <div className="mt-1 divide-y divide-slate-200/80 rounded-lg bg-slate-50/40">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">Contrato</p>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${chipClass(school.contractAvailableBeforePayment)}`}>{flag(school.contractAvailableBeforePayment)}</span>
                    </div>
                    <div className="min-w-0 px-2 py-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">Reembolso</p>
                      <p className="mt-0.5 break-words text-sm font-medium text-slate-800">{shortRefundSummary(school.refundPolicySummary)}</p>
                    </div>
                    <div className="min-w-0 px-2 py-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">Calendario</p>
                      <p className="mt-0.5 break-words text-sm font-medium text-slate-800">{scheduleSummary}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">Depósito</p>
                      <p className="text-sm font-semibold text-slate-800">{euro(school.depositOrEnrollmentFeeEUR)}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">Financiación</p>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${chipClass(financingValue)}`}>{flag(financingValue)}</span>
                    </div>
                    {financingNote ? (
                      <div className="min-w-0 px-2 py-1">
                        <p className="mt-0.5 break-words text-sm font-medium text-slate-800">{financingNote}</p>
                      </div>
                    ) : null}
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">C. Extras incluidos</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                    {extrasItems.map((item) => (
                      <span key={item.label} className={`rounded-full border px-2 py-1 ${chipClass(item.value)}`}>
                        {item.label}: <span className="font-semibold">{"display" in item ? item.display : flag(item.value)}</span>
                      </span>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-[#c9a454]/30 bg-[#fffdf7] p-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a5a16]">Lectura FlyPath</p>
                  <p className="mt-1 text-sm text-slate-700">{reading}</p>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">D. Riesgos</p>
                  <div className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 p-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-900">Red flags</p>
                    <ul className="mt-1 space-y-1 text-sm text-amber-900">
                      {(flags.length ? flags : ["Sin alertas críticas destacadas en esta versión."]).map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-600">
                    Confianza del dato:{" "}
                    <span className="font-semibold">
                      {(() => {
                        const score = school.scores.dataConfidenceScore;
                        const hasReliableScore = typeof score === "number" && Number.isFinite(score) && score > 0;
                        return hasReliableScore
                          ? `${confidenceLabel(school.dataConfidence)} (${score}/100)`
                          : confidenceLabel(school.dataConfidence);
                      })()}
                    </span>
                  </p>
                  {school.pendingData.length > 0 ? (
                    <p className="mt-1 text-sm text-slate-500">+ datos pendientes: {school.pendingData.length}</p>
                  ) : null}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">E. Preguntas clave</p>
                  <ul className="mt-1 space-y-1.5 text-sm text-slate-700">
                    {questions.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </section>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

