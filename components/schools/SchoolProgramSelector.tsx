"use client";

import type { SchoolProgramOption } from "@/lib/schools/school-detail-program-options";

type SchoolProgramSelectorProps = {
  options: SchoolProgramOption[];
  selectedId: string;
  onSelect: (id: string) => void;
};

function ProgramToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-6 py-3 text-[15px] leading-snug transition ${
        active
          ? "border-2 border-[#93c5fd] bg-[#dbeafe] font-bold text-[#0f1a33] shadow-[0_3px_14px_rgba(59,130,246,0.18)]"
          : "border border-[#d8dee8] bg-white font-semibold text-slate-600 hover:border-[#93c5fd]/80 hover:bg-[#f8fafc]"
      }`}
    >
      {label}
    </button>
  );
}

export function SchoolProgramSelector({ options, selectedId, onSelect }: SchoolProgramSelectorProps) {
  if (options.length <= 1) {
    return null;
  }

  return (
    <div className="flex w-full justify-center px-1">
      <div className="flex max-w-full flex-wrap items-center justify-center gap-3">
        {options.map((option) => (
          <ProgramToggle
            key={option.id}
            label={option.label}
            active={option.id === selectedId}
            onClick={() => onSelect(option.id)}
          />
        ))}
      </div>
    </div>
  );
}
