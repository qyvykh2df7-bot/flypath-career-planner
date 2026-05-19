"use client";

import type { StudySubject } from "@/lib/study-planner/types";

type SubjectSelectorProps = {
  subjects: StudySubject[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function SubjectSelector({ subjects, selectedIds, onChange }: SubjectSelectorProps) {
  const selected = new Set(selectedIds);

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
      onChange([...next]);
    } else {
      next.add(id);
      onChange([...next]);
    }
  };

  const selectAll = () => onChange(subjects.map((s) => s.id));
  const clearAll = () => onChange([]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={selectAll}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:border-[#c9a454]/40"
        >
          Seleccionar todas
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:border-slate-300"
        >
          Quitar todas
        </button>
        <span className="self-center text-[12px] text-slate-500">
          {selectedIds.length} de {subjects.length} activas
        </span>
      </div>
      <ul className="max-h-[min(50vh,22rem)] space-y-2 overflow-y-auto overscroll-contain rounded-xl border border-slate-200/90 bg-[#f8fafc] p-2">
        {subjects.map((subject) => {
          const isOn = selected.has(subject.id);
          return (
            <li key={subject.id}>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                  isOn
                    ? "border-[#c9a454]/45 bg-[#fffdf8]"
                    : "border-transparent bg-white hover:border-slate-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isOn}
                  onChange={() => toggle(subject.id)}
                  className="h-4 w-4 rounded border-slate-300 text-[#c9a454] focus:ring-[#c9a454]/40"
                />
                <span className="text-[14px] font-medium text-[#0f1a33]">{subject.name}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
