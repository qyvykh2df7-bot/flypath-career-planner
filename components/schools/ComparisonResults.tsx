import {
  confidenceLabel,
  getPriceGap,
  getSchoolInitials,
  summarizeComparison,
} from "@/lib/schools/schoolUtils";
import type { SchoolEntry } from "@/types/schools";

type Props = {
  schools: SchoolEntry[];
};

function flag(value: string) {
  return value === "yes" ? "Sí" : value === "no" ? "No" : value === "partial" ? "Parcial" : value === "optional" ? "Opcional" : "No claro";
}

function chipClass(value: string): string {
  if (value === "yes") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (value === "no") return "border-slate-300 bg-slate-100 text-slate-700";
  if (value === "partial" || value === "optional") return "border-[#c9a454]/35 bg-[#fff8e8] text-[#7a5a16]";
  return "border-slate-300 bg-slate-100 text-slate-600";
}

function routeTypeLabel(type: SchoolEntry["routeType"]): string {
  if (type === "integrated") return "Escuela integrada";
  if (type === "modular") return "Ruta modular";
  return "Universidad / Grado + licencia";
}

function euro(value: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function flypathReading(school: SchoolEntry, gap: number): string {
  const missingCoreExtras = [school.examFeesIncluded, school.skillTestsIncluded, school.trainingMaterialsIncluded].filter(
    (item) => item === "unknown" || item === "no",
  ).length;

  if (school.pendingData.length >= 3 || school.dataConfidence === "low") {
    return "Datos todavía incompletos antes de tomar una decisión.";
  }
  if (gap >= 7000) {
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
  const summary = summarizeComparison(schools);
  if (!summary) return null;
  const maxEstimated = Math.max(...schools.map((s) => s.flypathEstimatedRealCostEUR));
  const gridColsClass = schools.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-[#0f1a33]">Análisis comparativo FlyPath</h2>

      <p className="text-sm text-slate-600">
        Compara las escuelas seleccionadas con los mismos criterios: costes, contrato, extras, riesgos y preguntas clave.
      </p>

      <div className={`grid gap-3.5 ${gridColsClass}`}>
        {schools.map((school) => {
          const gap = getPriceGap(school);
          const announcedPct = Math.max(
            6,
            Math.round((school.advertisedPriceEUR / maxEstimated) * 100),
          );
          const estimatedPct = Math.max(
            8,
            Math.round((school.flypathEstimatedRealCostEUR / maxEstimated) * 100),
          );
          const flags = school.redFlags.slice(0, 2);
          const questions = school.keyQuestions.slice(0, 3);
          const reading = flypathReading(school, gap);
          const initials = getSchoolInitials(school.name);

          return (
            <article key={school.id} className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="rounded-t-2xl border-b border-[#c9a454]/20 bg-gradient-to-r from-[#0f1a33] to-[#132240] p-4 text-white">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-xs font-semibold tracking-wide text-[#f2ddaa]">
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{school.name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-300">{routeTypeLabel(school.routeType)}</p>
                    <p className="mt-0.5 text-[11px] text-slate-300">{school.city} · {school.baseAirport}</p>
                  </div>
                  <span className="rounded-full border border-[#c9a454]/35 bg-[#fff8e8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#7a5a16]">
                    {school.dataStatus}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-2.5 p-3.5">
                <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">A. Costes</p>
                  <div className="mt-1.5 space-y-1.5 text-sm text-slate-700">
                    <p className="text-xs text-slate-600">Precio anunciado: <span className="font-semibold text-slate-700">{euro(school.advertisedPriceEUR)}</span></p>
                    <p>
                      <span className="font-semibold text-[#0f1a33]">Coste real estimado FlyPath:</span>{" "}
                      <span className="text-[17px] font-bold text-[#0f1a33]">{euro(school.flypathEstimatedRealCostEUR)}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Brecha estimada:</span>{" "}
                      <span className="inline-flex rounded-full border border-[#c9a454]/45 bg-[#fff8e8] px-2 py-0.5 text-sm font-semibold text-[#7a5a16]">
                        {euro(gap)}
                      </span>
                    </p>
                  </div>
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
                      <p className="mt-0.5 break-words text-sm font-medium text-slate-800">{shortScheduleSummary(school.paymentScheduleSummary)}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">Depósito</p>
                      <p className="text-sm font-semibold text-slate-800">{euro(school.depositOrEnrollmentFeeEUR)}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">Financiación</p>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${chipClass(school.financingAvailable)}`}>{flag(school.financingAvailable)}</span>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">C. Extras incluidos</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                    {[
                      { label: "MCC/JOC", value: school.mccJocIncluded },
                      { label: "Advanced UPRT", value: school.advancedUprtIncluded },
                      { label: "Tasas", value: school.examFeesIncluded },
                      { label: "Skill tests", value: school.skillTestsIncluded },
                      { label: "Materiales", value: school.trainingMaterialsIncluded },
                      { label: "Alojamiento", value: school.accommodationIncluded },
                    ].map((item) => (
                      <span key={item.label} className={`rounded-full border px-2 py-1 ${chipClass(item.value)}`}>
                        {item.label}: <span className="font-semibold">{flag(item.value)}</span>
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
                      {confidenceLabel(school.dataConfidence)} ({school.scores.dataConfidenceScore}/100)
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

