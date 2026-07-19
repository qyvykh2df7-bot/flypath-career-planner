"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PublicSchoolReviewSummary } from "@/lib/school-reviews/contracts";
import type { SchoolEntry } from "@/types/schools";

type ResponseBody = { items?: PublicSchoolReviewSummary[] };

export function SchoolReviewComparisonSummary({ schools }: { schools: readonly SchoolEntry[] }) {
  const slugs = useMemo(() => schools.map((school) => school.slug).filter(Boolean), [schools]);
  const requestKey = slugs.join(",");
  const [result, setResult] = useState<{ key: string; items: PublicSchoolReviewSummary[] }>({ key: "", items: [] });
  const loading = result.key !== requestKey;

  useEffect(() => {
    if (!slugs.length) return;
    const controller = new AbortController();
    void fetch(`/api/school-reviews/summaries?schools=${encodeURIComponent(slugs.join(","))}`, { signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<ResponseBody> : { items: [] })
      .then((body) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, items: Array.isArray(body.items) ? body.items : [] });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key: requestKey, items: [] });
      });
    return () => controller.abort();
  }, [requestKey, slugs]);

  const bySlug = new Map(result.items.map((item) => [item.schoolSlug, item]));
  return (
    <section className="rounded-xl border border-[#c9a454]/30 bg-[#fffdf6] p-3 shadow-[0_4px_18px_-12px_rgba(15,26,51,0.25)] sm:p-3.5">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-[#7a5a16]">F. Opiniones verificadas</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {schools.map((school) => {
          const summary = bySlug.get(school.slug);
          return <div key={school.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5"><p className="truncate text-sm font-medium text-[#0f1a33]">{school.name}</p>{loading ? <p className="mt-1 text-xs text-slate-500">Cargando opiniones...</p> : summary?.total ? <p className="mt-1 text-sm text-slate-600"><span className="font-semibold text-[#0f1a33]">{summary.averageOverall?.toLocaleString("es-ES", { maximumFractionDigits: 1 })}/10</span> · {summary.total} {summary.total === 1 ? "opinión" : "opiniones"}</p> : <p className="mt-1 text-xs text-slate-500">Sin opiniones aprobadas</p>}<Link href={`/opiniones-escuelas?school=${encodeURIComponent(school.slug)}`} className="mt-2 inline-flex text-xs font-semibold text-[#7a5a16] hover:underline">Ver opiniones</Link></div>;
        })}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">Estas opiniones se muestran por separado y no alteran la valoración editorial de FlyPath.</p>
    </section>
  );
}
