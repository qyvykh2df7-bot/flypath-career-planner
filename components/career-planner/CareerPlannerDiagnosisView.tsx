"use client";

import { useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import { CareerPlannerCostAdjustForm } from "./CareerPlannerCostAdjustForm";
import {
  plannerBody,
  plannerBtnPrimary,
  plannerBtnSecondary,
  plannerEyebrow,
  plannerTitle,
} from "./planner-surface";
import {
  buildRouteDiagnosisSummary,
  resolveDiagnosisRiskDisplay,
  resolveDiagnosisViabilityDisplay,
  routeDiagnosisTagline,
  type DiagnosisCtaTarget,
  type DiagnosisDimensionLevel,
  type DiagnosisQualitativeRisk,
  type DiagnosisRiskPillTone,
  type RouteDiagnosisSummaryLine,
} from "@/lib/planner-diagnosis-ui";
import type { CostComputation, CostInputs, Profile, RouteRecommendation } from "@/lib/reporting/types/shared";

const ivoryBadge =
  "flex flex-col rounded-xl border border-[#0f1a33]/10 bg-[#FAF9F6] p-4 shadow-[0_4px_20px_rgba(15,26,51,0.09)] ring-1 ring-inset ring-white/60 sm:p-[1.125rem]";

const ivoryLabel = "text-[10px] font-semibold uppercase tracking-[0.14em] text-[#3d4f6f]";

const ivoryBody = "text-[14px] font-medium leading-snug text-[#0f1a33]";

const ivorySecondary = "text-[13px] leading-snug text-[#2a3a55]";

const ivoryMuted = "text-[12px] leading-snug text-[#3d4f6f]";

const ivoryActionPill =
  "inline-flex items-center rounded-full border border-[#B8943F]/55 bg-[#D6AE4F]/18 px-3.5 py-2 text-[12px] font-semibold text-[#5c4820] shadow-[0_1px_6px_rgba(184,148,63,0.2)] transition hover:border-[#B8943F]/75 hover:bg-[#D6AE4F]/28 active:scale-[0.98]";

function clampPct(value: number) {
  return Math.min(100, Math.max(0, value));
}

function formatEuroHeroAmount(value: number) {
  const formatted = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
  const symbol = formatted.replace(/[\d\s.,]/g, "").trim() || "€";
  const amount = formatted.replace(symbol, "").trim();
  return { amount, symbol };
}

function riskPillClass(tone: DiagnosisRiskPillTone): string {
  if (tone === "alto") {
    return "border-amber-700/35 bg-amber-100 text-amber-950 shadow-sm";
  }
  if (tone === "medio") {
    return "border-[#0f1a33]/14 bg-[#eef1f6] text-[#2a3a55]";
  }
  return "border-emerald-800/20 bg-emerald-50 text-emerald-950";
}

function viabilityHeroClass(tone: DiagnosisRiskPillTone): string {
  if (tone === "alto") return "text-amber-950";
  if (tone === "medio") return "text-[#2a3a55]";
  return "text-emerald-950";
}

function dimensionLevelClass(level: DiagnosisDimensionLevel): string {
  if (level === "Alto") return "font-semibold text-emerald-900";
  if (level === "Medio") return "font-semibold text-[#2a3a55]";
  return "font-semibold text-amber-950";
}

function ViabilityRow({ label, level }: { label: string; level: DiagnosisDimensionLevel }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#0f1a33]/[0.07] py-2 last:border-0">
      <span className="text-[13px] font-bold text-[#0f1a33]">{label}</span>
      <span className={`text-[13px] ${dimensionLevelClass(level)}`}>{level}</span>
    </div>
  );
}

const riskSectionLabel = "text-[10px] font-bold uppercase tracking-[0.1em] text-[#3d4f6f]";

function RiskCopyBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className={riskSectionLabel}>{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function QualitativeRiskPanel({
  qualitative,
  contextualLink,
}: {
  qualitative: DiagnosisQualitativeRisk;
  contextualLink?: { href: string; label: string };
}) {
  return (
    <div className="mt-3 space-y-2.5">
      <RiskCopyBlock label="Estado actual">
        <p className="text-[13px] font-medium leading-snug text-[#0f1a33]">{qualitative.estadoActual}</p>
      </RiskCopyBlock>
      <RiskCopyBlock label="Por qué importa">
        <p className="text-[13px] leading-snug text-[#2a3a55]">{qualitative.porQueImporta}</p>
      </RiskCopyBlock>
      <RiskCopyBlock label="Acción recomendada">
        <p className="text-[13px] font-medium leading-snug text-[#0f1a33]">{qualitative.recommendedAction}</p>
        {contextualLink ? (
          <Link
            href={contextualLink.href}
            className="mt-1.5 inline-flex text-[12px] font-medium text-[#6b5424] underline decoration-[#C9A85A]/50 underline-offset-2 transition hover:text-[#5c4820] hover:decoration-[#C9A85A]"
          >
            {contextualLink.label}
          </Link>
        ) : null}
      </RiskCopyBlock>
    </div>
  );
}

function NoCriticalRiskPanel({ body, footnote }: { body: string; footnote: string }) {
  return (
    <div className="mt-3 space-y-2">
      <p className="text-[13px] font-medium leading-snug text-[#0f1a33]">{body}</p>
      <p className="text-[13px] leading-snug text-[#2a3a55]">{footnote}</p>
    </div>
  );
}

function FinancialRiskPanel({
  panel,
  pill,
  recommendedAction,
}: {
  panel: { brechaFormatted: string; coberturaPct: number };
  pill: string;
  recommendedAction: string;
}) {
  return (
    <>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-[#0f1a33]/10 bg-white px-2.5 py-2 shadow-[0_1px_6px_rgba(15,26,51,0.05)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#3d4f6f]">Brecha estimada</p>
          <p className="mt-1 text-[1.2rem] font-bold leading-none tabular-nums tracking-tight text-[#0f1a33] sm:text-[1.3rem]">
            {panel.brechaFormatted}
          </p>
          <p className="mt-1 text-[10px] leading-snug text-[#3d4f6f]">Dinero que falta para cubrir el coste realista.</p>
        </div>
        <div className="rounded-lg border border-[#0f1a33]/10 bg-white px-2.5 py-2 shadow-[0_1px_6px_rgba(15,26,51,0.05)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#3d4f6f]">Cobertura actual</p>
          <p className="mt-1 text-[1.15rem] font-bold leading-none tabular-nums text-[#0f1a33]">{panel.coberturaPct}%</p>
          <p className="mt-1 text-[10px] leading-snug text-[#3d4f6f]">
            Porcentaje del coste que cubre tu presupuesto.
          </p>
        </div>
      </div>
      <div className="mt-2.5">
        <p className={riskSectionLabel}>Acción recomendada</p>
        <p className="mt-0.5 text-[13px] font-medium leading-snug text-[#0f1a33]">{recommendedAction}</p>
      </div>
      <span className="sr-only">Nivel de riesgo: {pill}</span>
    </>
  );
}

function RouteSummaryChip({ line }: { line: RouteDiagnosisSummaryLine }) {
  const isRec = line.isRecommended;
  return (
    <div
      className={`flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-2.5 py-2 ${
        isRec
          ? "border-[#C9A85A]/45 bg-[#fffdf6] shadow-[0_1px_8px_rgba(201,168,90,0.15)]"
          : "border-[#0f1a33]/10 bg-white"
      }`}
    >
      <span
        className={`shrink-0 rounded-md px-2 py-0.5 text-[12px] font-semibold leading-none ${
          isRec ? "bg-[#D6AE4F]/22 text-[#7a5f28]" : "bg-[#0f1a33]/[0.06] text-[#0f1a33]"
        }`}
      >
        {line.name}
      </span>
      <span className={`min-w-0 text-[12px] leading-snug ${isRec ? "font-medium text-[#6b5424]" : ivorySecondary}`}>
        {line.hint}
      </span>
    </div>
  );
}

type CareerPlannerDiagnosisViewProps = {
  route: RouteRecommendation;
  costs: CostComputation;
  profile: Pick<Profile, "class1" | "ingles" | "disponibilidad" | "necesitaTrabajar" | "objetivo">;
  costInputs: CostInputs;
  setCostInputs: Dispatch<SetStateAction<CostInputs>>;
  onNavigate: (target: DiagnosisCtaTarget | "schools" | "report") => void;
};

export function CareerPlannerDiagnosisView({
  route,
  costs,
  profile,
  costInputs,
  setCostInputs,
  onNavigate,
}: CareerPlannerDiagnosisViewProps) {
  const [costAdjustOpen, setCostAdjustOpen] = useState(false);
  const costSlice = {
    brechaFinanciacion: costs.brechaFinanciacion,
    coverage: costs.coverage,
    riesgoFinanciero: costs.riesgoFinanciero,
  };
  const routeSlice = {
    recommended: route.recommended,
    conflicts: route.conflicts,
  };
  const riskDisplay = resolveDiagnosisRiskDisplay({
    profile,
    costs: costSlice,
    route: routeSlice,
  });
  const viabilityDisplay = resolveDiagnosisViabilityDisplay({
    profile,
    costs: costSlice,
    route: routeSlice,
  });

  const { amount, symbol } = formatEuroHeroAmount(costs.totalRealista);
  const routeSummary = buildRouteDiagnosisSummary(route);
  const barItems = [
    { label: "Formación", value: costs.subtotalFormacion, tone: "bg-[#1a2d52]/70" },
    { label: "Extras", value: costs.subtotalExtras, tone: "bg-[#2a3f66]/55" },
    { label: "Costes de vida", value: costs.subtotalVida, tone: "bg-[#3d4f6f]/45" },
    { label: "Margen", value: costs.buffer, tone: "bg-[#C9A85A]/80" },
  ];

  return (
    <div className="min-w-0 space-y-5 pb-1">
      <header className="border-b border-white/[0.08] pb-4">
        <p className={plannerEyebrow}>Career Planner</p>
        <h1 className={`mt-1.5 text-2xl tracking-tight sm:text-[1.6rem] ${plannerTitle}`}>Diagnóstico</h1>
        <p className={`mt-2 max-w-2xl ${plannerBody}`}>
          Ruta, coste, riesgo principal y viabilidad para avanzar — antes de comparar escuelas.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
        <article className={ivoryBadge}>
          <p className={ivoryLabel}>Ruta recomendada</p>
          <p className="mt-2.5 text-[1.8rem] font-bold leading-none tracking-tight text-[#9a7b3c] sm:text-[1.9rem]">
            {route.recommended}
          </p>
          <p className={`mt-2.5 ${ivoryBody}`}>{routeDiagnosisTagline(route.recommended)}</p>
          <div className="mt-3.5 flex flex-col gap-2 border-t border-[#0f1a33]/[0.08] pt-3.5">
            {routeSummary.map((line) => (
              <RouteSummaryChip key={line.name} line={line} />
            ))}
          </div>
        </article>

        <article className={`${ivoryBadge} justify-between`}>
          <div>
            <p className={ivoryLabel}>Coste realista</p>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-[1.9rem] font-bold tabular-nums tracking-tight text-[#0f1a33] sm:text-[2.05rem]">
                {amount}
              </span>
              <span className="text-base font-semibold text-[#3d4f6f]">{symbol}</span>
            </div>
            <div className="mt-3.5 space-y-2.5">
              {barItems.map((item) => {
                const pct = costs.totalRealista > 0 ? (item.value / costs.totalRealista) * 100 : 0;
                return (
                  <div key={item.label}>
                    <div className="mb-1 flex justify-between gap-2 text-[13px]">
                      <span className="font-semibold text-[#0f1a33]">{item.label}</span>
                      <span className="tabular-nums font-medium text-[#3d4f6f]">{Math.round(pct)}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#0f1a33]/10">
                      <motion.div
                        className={`h-full rounded-full ${item.tone}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${clampPct(pct)}%` }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <button type="button" onClick={() => setCostAdjustOpen(true)} className={`${ivoryActionPill} mt-4 self-start`}>
            Ajustar costes
          </button>
        </article>

        <article className={ivoryBadge}>
          <p className={ivoryLabel}>Riesgo principal</p>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <p className="text-lg font-semibold text-[#0f1a33]">{riskDisplay.title}</p>
            <span
              className={`inline-flex shrink-0 rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${riskPillClass(riskDisplay.pillTone)}`}
            >
              {riskDisplay.pill}
            </span>
          </div>
          {riskDisplay.financialPanel && riskDisplay.recommendedAction ? (
            <FinancialRiskPanel
              panel={riskDisplay.financialPanel}
              pill={riskDisplay.pill}
              recommendedAction={riskDisplay.recommendedAction}
            />
          ) : null}
          {riskDisplay.qualitative ? (
            <QualitativeRiskPanel
              qualitative={riskDisplay.qualitative}
              contextualLink={riskDisplay.contextualLink}
            />
          ) : null}
          {riskDisplay.body && riskDisplay.footnote ? (
            <NoCriticalRiskPanel body={riskDisplay.body} footnote={riskDisplay.footnote} />
          ) : null}
        </article>

        <article className={ivoryBadge}>
          <p className={ivoryLabel}>Viabilidad actual</p>
          <p
            className={`mt-2.5 text-[1.65rem] font-bold leading-none tracking-tight sm:text-[1.75rem] ${viabilityHeroClass(viabilityDisplay.overallTone)}`}
          >
            {viabilityDisplay.overall}
          </p>
          <p className={`mt-2.5 ${ivoryBody}`}>{viabilityDisplay.summary}</p>
          <div className="mt-3 border-t border-[#0f1a33]/[0.08] pt-1">
            <ViabilityRow label="Presupuesto" level={viabilityDisplay.dimensions.presupuesto} />
            <ViabilityRow label="Tiempo" level={viabilityDisplay.dimensions.tiempo} />
            <ViabilityRow label="Inglés" level={viabilityDisplay.dimensions.ingles} />
            <div className="flex items-center justify-between gap-3 py-2">
              <span className="text-[13px] font-bold text-[#0f1a33]">Clase 1</span>
              <span className={`text-[13px] ${dimensionLevelClass(viabilityDisplay.dimensions.class1.level)}`}>
                {viabilityDisplay.dimensions.class1.label}
              </span>
            </div>
          </div>
        </article>
      </div>

      <footer className="mt-1 border-t border-white/[0.06] px-0.5 pt-6 pb-5">
        <p className="max-w-2xl text-left text-[11px] leading-relaxed text-slate-400">
          Este diagnóstico no elige por ti. Ordena tu ruta, dinero y riesgos antes de comprometer matrícula.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3 pb-1">
          <button type="button" onClick={() => onNavigate("schools")} className={plannerBtnPrimary}>
            Comparar escuelas
          </button>
          <button type="button" onClick={() => onNavigate("report")} className={plannerBtnSecondary}>
            Ver informe
          </button>
        </div>
      </footer>

      {costAdjustOpen ? (
        <div
          className="fixed inset-0 z-[55] flex items-end justify-center bg-[#0f1a33]/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cost-adjust-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Cerrar"
            onClick={() => setCostAdjustOpen(false)}
          />
          <div className="relative z-10 flex max-h-[min(90dvh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#101B35] shadow-2xl sm:rounded-2xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 bg-[#101B35] px-4 py-3.5 sm:px-5">
              <div>
                <p id="cost-adjust-title" className="text-base font-semibold text-white">
                  Ajustar mi estimación de costes
                </p>
                <p className="mt-0.5 text-[13px] text-slate-300">
                  Modifica formación, extras, costes de vida y margen de seguridad.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCostAdjustOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Cerrar ajuste de costes"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#F4F2EC] px-4 py-4 sm:px-5 sm:py-5">
              <CareerPlannerCostAdjustForm route={route} costInputs={costInputs} setCostInputs={setCostInputs} />
            </div>
            <div className="shrink-0 border-t border-white/10 bg-[#101B35] px-4 py-3.5 sm:px-5">
              <button
                type="button"
                onClick={() => setCostAdjustOpen(false)}
                className="w-full rounded-lg bg-[#D6AE4F] px-4 py-2.5 text-[14px] font-semibold text-[#101B35] transition hover:brightness-105 sm:w-auto sm:min-w-[10rem]"
              >
                Guardar estimación
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
