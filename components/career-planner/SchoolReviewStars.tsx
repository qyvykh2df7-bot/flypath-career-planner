"use client";

import Link from "next/link";
import { Star } from "lucide-react";

import type { PublicSchoolReviewSummary } from "@/lib/school-reviews/contracts";
import {
  formatSchoolReviewRating,
  schoolReviewSummaryStarFillPercent,
  schoolReviewSummaryToFive,
} from "@/lib/school-reviews/presentation";

type SchoolReviewStarsProps = {
  summary: PublicSchoolReviewSummary | undefined;
  loading: boolean;
  href?: string;
  tone?: "light" | "dark";
};

/** Visual treatment reserved exclusively for approved student-review aggregates. */
export function SchoolReviewStars({ summary, loading, href, tone = "light" }: SchoolReviewStarsProps) {
  const rating = schoolReviewSummaryToFive(summary);
  const total = summary?.total ?? 0;
  const mutedText = tone === "dark" ? "text-slate-400" : "text-[#5a6b85]";
  const emptyStar = tone === "dark" ? "text-slate-600" : "text-slate-300";

  if (loading) {
    return <span className={`text-[11px] font-medium ${mutedText}`}>Cargando opiniones…</span>;
  }

  const stars = (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className="relative block h-3.5 w-3.5">
          <Star className={`absolute inset-0 h-3.5 w-3.5 ${emptyStar}`} aria-hidden />
          {rating !== null ? (
            <span
              className="absolute inset-y-0 left-0 block overflow-hidden"
              style={{ width: `${schoolReviewSummaryStarFillPercent(summary, index)}%` }}
            >
              <Star className="h-3.5 w-3.5 fill-[#c9a454] text-[#c9a454]" aria-hidden />
            </span>
          ) : null}
        </span>
      ))}
    </span>
  );

  const label = rating === null
    ? "Sin opiniones aprobadas"
    : `Ver ${total} ${total === 1 ? "opinión aprobada" : "opiniones aprobadas"} de la escuela (valoración ${formatSchoolReviewRating(rating)} de 5)`;
  const content = (
    <>
      {stars}
      {rating === null ? (
        <span className={`whitespace-nowrap text-[11px] font-medium ${mutedText}`}>Sin opiniones</span>
      ) : (
        <span className={`whitespace-nowrap text-[11px] font-medium ${mutedText}`}>({total})</span>
      )}
    </>
  );

  if (!href) {
    return (
      <span className="inline-flex min-h-7 items-center gap-1 px-0.5" aria-label={label}>
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex min-h-7 shrink-0 items-center gap-1 rounded-md px-0.5 py-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/45"
      aria-label={label}
    >
      {content}
    </Link>
  );
}
