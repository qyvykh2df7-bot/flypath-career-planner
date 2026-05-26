"use client";

import type { AtplBankArea } from "@/lib/study-planner/atpl-bank-areas";
import {
  formatBankAreaLabel,
  getBankAreasForSubject,
} from "@/lib/study-planner/atpl-bank-areas";

type BankAreaFieldProps = {
  subjectId: string;
  value: AtplBankArea | null;
  onChange: (area: AtplBankArea | null) => void;
  labelClass?: string;
  fieldClass?: string;
};

export function BankAreaField({
  subjectId,
  value,
  onChange,
  labelClass = "text-[12px] font-semibold uppercase tracking-wide text-slate-500",
  fieldClass = "mt-1 w-full rounded-lg border border-slate-200/90 bg-white px-3 py-2.5 text-[14px] text-[#0f1a33] shadow-sm focus:border-[#c9a454]/50 focus:outline-none focus:ring-2 focus:ring-[#c9a454]/20",
}: BankAreaFieldProps) {
  const areas = getBankAreasForSubject(subjectId);

  if (areas.length === 0) {
    return (
      <p className="text-[12px] leading-snug text-slate-500">
        No hay áreas definidas para esta asignatura todavía.
      </p>
    );
  }

  return (
    <label className="block">
      <span className={labelClass}>Área de banco</span>
      <select
        value={value?.code ?? ""}
        onChange={(e) => {
          const code = e.target.value;
          if (!code) {
            onChange(null);
            return;
          }
          const area = areas.find((a) => a.code === code);
          onChange(area ?? null);
        }}
        className={fieldClass}
      >
        <option value="">Selecciona un área</option>
        {areas.map((area) => (
          <option key={area.code} value={area.code}>
            {formatBankAreaLabel(area)}
          </option>
        ))}
      </select>
    </label>
  );
}
