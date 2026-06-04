"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { CostInputs, RouteRecommendation } from "@/lib/reporting/types/shared";

const fieldLabel =
  "mb-2 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#2a3a55]";

const fieldInput =
  "box-border h-12 w-full min-w-0 rounded-lg border border-[#0f1a33]/14 bg-white px-3 text-[16px] font-semibold tabular-nums leading-none text-[#0f1a33] shadow-sm outline-none [-moz-appearance:textfield] placeholder:text-[#0f1a33]/30 focus:border-[#C9A85A]/60 focus:ring-2 focus:ring-[#C9A85A]/20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

const fieldWrap = "flex min-w-0 w-full flex-col";

function CostAdjustSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[#0f1a33]/[0.09] bg-white p-4 shadow-sm sm:p-5">
      <h3 className="border-b border-[#0f1a33]/[0.08] pb-2.5 text-sm font-semibold text-[#0f1a33]">{title}</h3>
      <div className="mt-4 grid grid-cols-1 items-start gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function CostNumberField({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  return (
    <label className={className ?? fieldWrap}>
      <span className={fieldLabel}>{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className={fieldInput}
      />
    </label>
  );
}

type CareerPlannerCostAdjustFormProps = {
  route: Pick<RouteRecommendation, "recommended">;
  costInputs: CostInputs;
  setCostInputs: Dispatch<SetStateAction<CostInputs>>;
};

export function CareerPlannerCostAdjustForm({
  route,
  costInputs,
  setCostInputs,
}: CareerPlannerCostAdjustFormProps) {
  const integratedPack =
    costInputs.ppl +
    (costInputs.nightRating ?? 3000) +
    costInputs.atplTheory +
    costInputs.hourBuilding +
    costInputs.cpl +
    costInputs.mep +
    costInputs.ir;

  return (
    <div className="space-y-5 pb-2">
      <CostAdjustSection title={route.recommended === "Integrada" ? "Formación integrada" : "Formación"}>
        {route.recommended === "Integrada" ? (
          <>
            <p className="sm:col-span-2 text-[13px] leading-relaxed text-[#3d4f6f]">
              En una ruta integrada, la formación suele venderse como un paquete completo. Edita el precio total y
              después ajusta extras, costes de vida y margen.
            </p>
            <CostNumberField
              label="Programa integrado completo"
              value={integratedPack}
              onChange={(v) => {
                if (integratedPack <= 0) return;
                const factor = v / integratedPack;
                setCostInputs((c) => ({
                  ...c,
                  ppl: Math.round(c.ppl * factor),
                  nightRating: Math.round((c.nightRating ?? 3000) * factor),
                  atplTheory: Math.round(c.atplTheory * factor),
                  hourBuilding: Math.round(c.hourBuilding * factor),
                  cpl: Math.round(c.cpl * factor),
                  mep: Math.round(c.mep * factor),
                  ir: Math.round(c.ir * factor),
                }));
              }}
            />
            <CostNumberField
              label="MCC/JOC si no está incluido"
              value={costInputs.mccJoc}
              onChange={(v) => setCostInputs((c) => ({ ...c, mccJoc: v }))}
            />
            <CostNumberField
              label="Advanced UPRT si no está incluido"
              value={costInputs.advancedUprt}
              onChange={(v) => setCostInputs((c) => ({ ...c, advancedUprt: v }))}
            />
          </>
        ) : (
          <>
            <p className="sm:col-span-2 text-[13px] leading-relaxed text-[#3d4f6f]">
              Revisa cada fase por separado para controlar pagos, ritmo y riesgo.
            </p>
            <CostNumberField label="PPL" value={costInputs.ppl} onChange={(v) => setCostInputs((c) => ({ ...c, ppl: v }))} />
            <CostNumberField
              label="Night Rating / NR"
              value={costInputs.nightRating ?? 3000}
              onChange={(v) => setCostInputs((c) => ({ ...c, nightRating: v }))}
            />
            <CostNumberField
              label="Teoría ATPL"
              value={costInputs.atplTheory}
              onChange={(v) => setCostInputs((c) => ({ ...c, atplTheory: v }))}
            />
            <CostNumberField
              label="Horas de vuelo / Hour building"
              value={costInputs.hourBuilding}
              onChange={(v) => setCostInputs((c) => ({ ...c, hourBuilding: v }))}
            />
            <CostNumberField label="CPL" value={costInputs.cpl} onChange={(v) => setCostInputs((c) => ({ ...c, cpl: v }))} />
            <CostNumberField label="MEP" value={costInputs.mep} onChange={(v) => setCostInputs((c) => ({ ...c, mep: v }))} />
            <CostNumberField label="IR" value={costInputs.ir} onChange={(v) => setCostInputs((c) => ({ ...c, ir: v }))} />
            <CostNumberField
              label="MCC/JOC"
              value={costInputs.mccJoc}
              onChange={(v) => setCostInputs((c) => ({ ...c, mccJoc: v }))}
            />
            <CostNumberField
              label="Advanced UPRT"
              value={costInputs.advancedUprt}
              onChange={(v) => setCostInputs((c) => ({ ...c, advancedUprt: v }))}
            />
          </>
        )}
      </CostAdjustSection>

      <CostAdjustSection title="Extras">
        <CostNumberField
          label="Reconocimiento médico Clase 1"
          value={costInputs.class1Medical}
          onChange={(v) => setCostInputs((c) => ({ ...c, class1Medical: v }))}
        />
        <CostNumberField
          label="Tasas exámenes"
          value={costInputs.tasasExamenes}
          onChange={(v) => setCostInputs((c) => ({ ...c, tasasExamenes: v }))}
        />
        <CostNumberField
          label="Skill tests"
          value={costInputs.skillTests}
          onChange={(v) => setCostInputs((c) => ({ ...c, skillTests: v }))}
        />
        <CostNumberField label="Headset" value={costInputs.headset} onChange={(v) => setCostInputs((c) => ({ ...c, headset: v }))} />
        <CostNumberField
          label="iPad/apps/cartas"
          value={costInputs.ipadAppsCartas}
          onChange={(v) => setCostInputs((c) => ({ ...c, ipadAppsCartas: v }))}
        />
        <CostNumberField
          label="Uniforme/material"
          value={costInputs.uniformeMaterial}
          onChange={(v) => setCostInputs((c) => ({ ...c, uniformeMaterial: v }))}
        />
        <CostNumberField
          label="Repeticiones"
          value={costInputs.repeticiones}
          onChange={(v) => setCostInputs((c) => ({ ...c, repeticiones: v }))}
        />
        <CostNumberField
          label="Type rating opcional"
          value={costInputs.typeRatingOpcional}
          onChange={(v) => setCostInputs((c) => ({ ...c, typeRatingOpcional: v }))}
        />
      </CostAdjustSection>

      <CostAdjustSection title="Costes de vida">
        <CostNumberField
          label="Alojamiento"
          value={costInputs.alojamiento}
          onChange={(v) => setCostInputs((c) => ({ ...c, alojamiento: v }))}
        />
        <CostNumberField
          label="Transporte"
          value={costInputs.transporte}
          onChange={(v) => setCostInputs((c) => ({ ...c, transporte: v }))}
        />
        <CostNumberField label="Comida" value={costInputs.comida} onChange={(v) => setCostInputs((c) => ({ ...c, comida: v }))} />
        <CostNumberField
          label="Otros gastos de vida"
          value={costInputs.otrosGastosVida}
          onChange={(v) => setCostInputs((c) => ({ ...c, otrosGastosVida: v }))}
        />
      </CostAdjustSection>

      <CostAdjustSection title="Margen de seguridad">
        <CostNumberField
          label="Margen de seguridad %"
          value={costInputs.bufferPct}
          onChange={(v) => setCostInputs((c) => ({ ...c, bufferPct: v }))}
          className={`${fieldWrap} sm:max-w-[calc(50%-0.5rem)]`}
        />
      </CostAdjustSection>
    </div>
  );
}
