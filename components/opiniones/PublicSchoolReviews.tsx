"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import type { SchoolReviewAggregates, SchoolReviewPublicDto } from "@/lib/school-reviews/contracts";

type PublicSchoolReviewPage = {
  school: { slug: string; name: string };
  reviews: SchoolReviewPublicDto[];
  aggregates: SchoolReviewAggregates;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type PublicSchoolReviewsProps = {
  schoolSlug: string;
  schoolName: string;
  onLeaveReview: () => void;
};

const RATING_LABELS: Record<string, string> = {
  general: "Valoración general",
  costs: "Transparencia de costes",
  availability: "Disponibilidad de aviones",
  organization: "Organización",
  instructors: "Instructores",
  support: "Soporte administrativo",
  contract: "Contrato y reembolso",
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-ES", { month: "short", year: "numeric" }).format(date);
}

function formatScore(value: number | null): string {
  return value === null ? "-" : value.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

function reviewMeta(review: PublicSchoolReviewPage["reviews"][number]): string {
  return [review.displayAuthor, review.programPhase, review.approximateYear ? String(review.approximateYear) : null]
    .filter((value): value is string => Boolean(value))
    .join(" · ");
}

export function PublicSchoolReviews({ schoolSlug, schoolName, onLeaveReview }: PublicSchoolReviewsProps) {
  const [result, setResult] = useState<{ key: string; data: PublicSchoolReviewPage | null; failed: boolean }>({ key: "", data: null, failed: false });
  const [page, setPage] = useState(1);
  const requestKey = `${schoolSlug}:${page}`;
  const loading = result.key !== requestKey;
  const failed = !loading && result.failed;
  const data = !loading ? result.data : null;

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/school-reviews/public?school=${encodeURIComponent(schoolSlug)}&page=${page}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Public school reviews unavailable");
        return response.json() as Promise<PublicSchoolReviewPage>;
      })
      .then((response) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, data: response, failed: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key: requestKey, data: null, failed: true });
      });
    return () => controller.abort();
  }, [page, requestKey, schoolSlug]);

  if (loading) {
    return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><p className="text-sm text-slate-500">Cargando opiniones verificadas...</p></section>;
  }

  if (failed || !data) {
    return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-semibold text-[#0f1a33]">No hemos podido cargar las opiniones</h2><p className="mt-2 text-[15px] text-slate-600">Inténtalo de nuevo más tarde.</p></section>;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-[#0f1a33] px-5 py-4 text-white sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f2ddaa]">Opiniones verificadas</p>
        <h2 className="mt-1 text-xl font-semibold sm:text-2xl">{data.school.name || schoolName}</h2>
      </div>
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        {data.total === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-5">
            <h3 className="font-semibold text-[#0f1a33]">Todavía no hay opiniones aprobadas</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600">Cuando una opinión verificada supere la revisión, aparecerá aquí. Las valoraciones editoriales de FlyPath se mantienen separadas.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 border-b border-slate-100 pb-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end">
              <div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Media general</p><p className="mt-1 text-4xl font-bold tabular-nums text-[#0f1a33]">{formatScore(data.aggregates.averageOverall)}<span className="text-xl font-semibold text-slate-500">/10</span></p></div>
              <div className="text-sm text-slate-600"><p>{data.total} {data.total === 1 ? "opinión aprobada" : "opiniones aprobadas"}</p>{data.aggregates.wouldChooseAgainPercent !== null ? <p className="mt-1">{formatScore(data.aggregates.wouldChooseAgainPercent)}% volvería a elegirla</p> : null}</div>
            </div>
            <dl className="mt-5 grid gap-2 sm:grid-cols-2">
              {Object.entries(RATING_LABELS).map(([key, label]) => <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm"><dt className="text-slate-700">{label}</dt><dd className="font-semibold tabular-nums text-[#0f1a33]">{formatScore(data.aggregates.averages[key as keyof typeof data.aggregates.averages] ?? null)}/10</dd></div>)}
            </dl>
            <div className="mt-5"><p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500">Distribución general</p><div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-10">{Object.entries(data.aggregates.distribution).map(([score, count]) => <div key={score} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-center"><p className="text-xs font-semibold text-[#0f1a33]">{score}</p><p className="mt-1 text-xs text-slate-500">{count}</p></div>)}</div></div>
            <ol className="mt-6 space-y-3">{data.reviews.map((review) => <li key={review.reviewId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_0_rgba(15,26,51,0.03)]"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-[#0f1a33]">{review.displayAuthor}</p><p className="mt-1 text-xs text-slate-500">{reviewMeta(review)}{formatDate(review.approvedAt) ? ` · ${formatDate(review.approvedAt)}` : ""}</p></div><span className="rounded-lg border border-[#c9a454]/30 bg-[#fff8e8] px-2 py-1 text-sm font-semibold tabular-nums text-[#7a5a16]">{review.ratings.general}/10</span></div><dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3"><div><dt className="text-xs text-slate-500">Lo mejor</dt><dd className="mt-1 leading-relaxed text-slate-700">{review.bestPart}</dd></div><div><dt className="text-xs text-slate-500">A mejorar</dt><dd className="mt-1 leading-relaxed text-slate-700">{review.improvements}</dd></div><div><dt className="text-xs text-slate-500">Consejo</dt><dd className="mt-1 leading-relaxed text-slate-700">{review.advice}</dd></div></dl></li>)}</ol>
            {data.totalPages > 1 ? <nav aria-label="Paginación de opiniones" className="mt-5 flex items-center justify-between gap-3"><button type="button" disabled={data.page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-300 px-3 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-45"><ChevronLeft className="h-4 w-4" aria-hidden />Anterior</button><p className="text-sm text-slate-500">Página {data.page} de {data.totalPages}</p><button type="button" disabled={data.page >= data.totalPages} onClick={() => setPage((current) => current + 1)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-300 px-3 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-45">Siguiente<ChevronRight className="h-4 w-4" aria-hidden /></button></nav> : null}
          </>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap"><button type="button" onClick={onLeaveReview} className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55">Dejar una opinión</button><Link href={`/schools?selected=${encodeURIComponent(schoolSlug)}&source=reviews`} className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#c9a454]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35">Comparar esta escuela</Link></div>
        <p className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-[#7a5a16]" aria-hidden />Solo se muestran opiniones aprobadas por FlyPath.</p>
      </div>
    </section>
  );
}
