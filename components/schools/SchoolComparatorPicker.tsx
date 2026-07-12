"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import {
  dataStatusLabel,
  getSchoolCardBackgroundUrl,
  routeTypeLabel,
} from "@/lib/schools/schoolUtils";
import type { SchoolEntry } from "@/types/schools";

type Props = {
  schools: SchoolEntry[];
  selectedSchools: SchoolEntry[];
  maxSelected: number;
  onAddSchool: (id: string) => void;
  onSchoolSelected?: (selectionStep: 1 | 2) => void;
  onRemoveSchool: (id: string) => void;
  onSelectionLimit?: () => void;
};

function statusPillLabel(status: SchoolEntry["dataStatus"]): string {
  const label = dataStatusLabel(status);
  if (label === "Verificada") return "VERIFICADA";
  if (label === "En revisión") return "EN REVISIÓN";
  return label.toUpperCase();
}

function SelectedSchoolChip({
  school,
  onRemove,
}: {
  school: SchoolEntry;
  onRemove: () => void;
}) {
  const backgroundUrl = getSchoolCardBackgroundUrl(school);
  const pillLabel = statusPillLabel(school.dataStatus);
  const pillIsVerified = pillLabel === "VERIFICADA";

  return (
    <div className="flex w-full items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div
        aria-hidden
        className="relative w-20 shrink-0 bg-cover bg-center sm:w-24"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      >
        <div className="absolute inset-0 bg-[#0a1228]/55" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2.5">
        <p className="truncate text-[15px] font-semibold text-[#0f1a33]">{school.name}</p>
        <p className="truncate text-[12px] text-[#5a6b85]">
          {school.city} · {school.baseAirport}
        </p>
        <p className="truncate text-[11px] text-[#5a6b85]">
          {routeTypeLabel(school.routeType)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-between gap-2 px-3 py-2.5">
        <span
          className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
            pillIsVerified
              ? "border-emerald-300/60 bg-emerald-50/95 text-emerald-900"
              : "border-amber-300/55 bg-amber-50/95 text-amber-950"
          }`}
        >
          {pillLabel}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-rose-200/80 px-2.5 py-1 text-[11px] font-semibold text-rose-800 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/50"
        >
          <X className="h-3 w-3" aria-hidden />
          Quitar
        </button>
      </div>
    </div>
  );
}

export function SchoolComparatorPicker({
  schools,
  selectedSchools,
  maxSelected,
  onAddSchool,
  onSchoolSelected,
  onRemoveSchool,
  onSelectionLimit,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);
  const pendingSchoolIdsRef = useRef(new Set<string>());

  const selectedIdSet = useMemo(
    () => new Set(selectedSchools.map((s) => s.id)),
    [selectedSchools],
  );

  const filteredSchools = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter((school) => {
      const haystack = [
        school.name,
        school.city,
        school.country,
        school.baseAirport,
        routeTypeLabel(school.routeType),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [schools, pickerQuery]);

  const selectionFull = selectedSchools.length >= maxSelected;

  useEffect(() => {
    for (const schoolId of selectedIdSet) {
      pendingSchoolIdsRef.current.delete(schoolId);
    }
  }, [selectedIdSet]);

  useEffect(() => {
    if (!pickerOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [pickerOpen]);

  const handleAddSchool = (school: SchoolEntry) => {
    if (selectedIdSet.has(school.id) || pendingSchoolIdsRef.current.has(school.id)) return;
    if (selectionFull) {
      onSelectionLimit?.();
      return;
    }
    const willReachMax = selectedSchools.length + 1 >= maxSelected;
    pendingSchoolIdsRef.current.add(school.id);
    onAddSchool(school.id);
    onSchoolSelected?.((selectedSchools.length + 1) as 1 | 2);
    if (willReachMax) {
      setPickerOpen(false);
      setPickerQuery("");
    }
  };

  return (
    <div className="space-y-4">
      <div ref={pickerRef} className="relative">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5a6b85]"
              aria-hidden
            />
            <input
              type="search"
              value={pickerQuery}
              onChange={(e) => setPickerQuery(e.target.value)}
              onFocus={() => setPickerOpen(true)}
              placeholder="Elegir escuela"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-[15px] text-[#0f1a33] outline-none focus:border-[#c9a454]/50 focus:ring-2 focus:ring-[#D6AE4F]/30"
            />
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen((open) => !open)}
            aria-expanded={pickerOpen}
            aria-controls="school-comparator-picker"
            disabled={selectionFull}
            className="inline-flex min-h-[42px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#B8943F]/70 bg-[#D6AE4F] px-4 py-2 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ddaa]/50 disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
          >
            Añadir escuela
            <ChevronDown
              className={`h-4 w-4 transition ${pickerOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
        </div>

        {pickerOpen ? (
          <div
            id="school-comparator-picker"
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl border border-[#c9a454]/30 bg-white p-3.5 shadow-[0_16px_40px_-12px_rgba(15,26,51,0.35)] ring-1 ring-[#0f1a33]/8 sm:right-auto sm:w-[min(100%,24rem)]"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-[#0f1a33]">Escuelas disponibles</p>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-[#5a6b85] transition hover:bg-slate-50 hover:text-[#0f1a33]"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Cerrar
              </button>
            </div>
            {selectionFull ? (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-900 ring-1 ring-amber-200/80">
                Ya tienes {maxSelected} escuelas. Quita una para añadir otra.
              </p>
            ) : null}
            <ul className="mt-2 max-h-[min(280px,50vh)] overflow-y-auto overscroll-contain rounded-lg border border-slate-100">
              {filteredSchools.length === 0 ? (
                <li className="px-3 py-5 text-center text-[13px] text-[#5a6b85]">
                  No hay resultados.
                </li>
              ) : (
                filteredSchools.map((school) => {
                  const already = selectedIdSet.has(school.id);
                  return (
                    <li
                      key={school.id}
                      className="flex items-center justify-between gap-2 border-b border-slate-100 px-2.5 py-2 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-[#0f1a33]">
                          {school.name}
                        </p>
                        <p className="truncate text-[11px] text-[#5a6b85]">
                          {school.city} · {school.baseAirport}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (already) {
                            onRemoveSchool(school.id);
                          } else {
                            handleAddSchool(school);
                          }
                        }}
                        disabled={!already && selectionFull}
                        className={`shrink-0 cursor-pointer rounded-md border px-2.5 py-0.5 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                          already
                            ? "border-rose-200/90 bg-rose-50 text-rose-800 hover:border-rose-300 hover:bg-rose-100 focus-visible:ring-rose-300/50"
                            : "border-[#0f1a33]/12 bg-white text-[#0f1a33] hover:border-[#c9a454]/40 hover:bg-[#FFFCF7] focus-visible:ring-[#0f1a33]/20"
                        }`}
                      >
                        {already ? "Quitar" : "Añadir"}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        ) : null}
      </div>

      {selectedSchools.length > 0 ? (
        <div className="flex flex-col gap-3">
          {selectedSchools.map((school) => (
            <SelectedSchoolChip
              key={school.id}
              school={school}
              onRemove={() => onRemoveSchool(school.id)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
