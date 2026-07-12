"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Check, Star, Table2 } from "lucide-react";
import { createTrackingCtaMetadata, trackCtaClicked } from "@/lib/tracking/client";

const COMPARATOR_HREF = "/schools";
const OPINIONS_HREF = "/opiniones-escuelas";

const COMPARATOR_ROWS = [
  {
    label: "Escuela A",
    price: "72.000 €",
    extras: "Vivienda",
    extrasWarn: true,
    risk: "Medio",
    opinions: "4,2",
    opinionsGood: true,
  },
  {
    label: "Escuela B",
    price: "68.000 €",
    extras: "Exámenes",
    extrasWarn: false,
    risk: "Bajo",
    opinions: "4,5",
    opinionsGood: true,
  },
  {
    label: "Escuela C",
    price: "75.000 €",
    extras: "Traslados",
    extrasWarn: true,
    risk: "Alto",
    opinions: "3,8",
    opinionsGood: false,
  },
] as const;

const REVIEW_SAMPLES = [
  {
    rating: 4,
    quote: "Buena organización, pero revisaría bien los costes extra.",
    good: "Planificación clara del curso",
    watch: "Extras y financiación",
  },
  {
    rating: 4,
    quote: "La experiencia cambia mucho según base, instructor y planificación.",
    good: "Buen seguimiento académico",
    watch: "Condiciones según sede",
  },
] as const;

const CARD_CTA_CLASS =
  "group mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#2563EB] transition hover:text-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30";

const CARD_SHELL_CLASS =
  "flex h-full flex-col rounded-[18px] border border-white/10 bg-header-navy p-5 shadow-[0_14px_36px_rgba(7,18,36,0.18)] sm:p-6";

const CARD_INNER_SURFACE_CLASS =
  "rounded-xl border border-white/8 bg-[#0f1a33]/75";

const CARD_ICON_BADGE_CLASS =
  "flex h-9 w-9 items-center justify-center rounded-[8px] border border-[rgba(212,175,55,0.45)] bg-[#071225]";

const RISK_PILL_CLASS =
  "inline-flex rounded-full border border-[rgba(212,175,55,0.45)] bg-[#071225] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#D6AE4F]";

type ComparatorRow = (typeof COMPARATOR_ROWS)[number];

function ComparatorMobileSchoolRow({ row }: { row: ComparatorRow }) {
  return (
    <div className={`${CARD_INNER_SURFACE_CLASS} px-3 py-3`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold text-white">{row.label}</p>
        <p className="shrink-0 text-[13px] font-semibold text-[#f2ddaa]">{row.price}</p>
      </div>
      <p className="mt-2 inline-flex flex-wrap items-center gap-1.5 text-[12px] text-white/70">
        <span className="text-white/50">Extras:</span>
        {row.extrasWarn ? (
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#B8923F]" aria-hidden />
        ) : (
          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
        )}
        {row.extras}
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
        <span className={RISK_PILL_CLASS}>{row.risk}</span>
        <span className="inline-flex items-center gap-1.5 text-[12px] text-white/75">
          <span className="text-white/50">Opinión:</span>
          {row.opinionsGood ? (
            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#B8923F]" aria-hidden />
          )}
          {row.opinions}
        </span>
      </div>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${index < rating ? "fill-[#D6AE4F] text-[#D6AE4F]" : "text-[#071224]/15"}`}
          aria-hidden
        />
      ))}
    </div>
  );
}

function SchoolsComparatorCard() {
  return (
    <article className={`${CARD_SHELL_CLASS} max-md:p-4`}>
      <div className="flex items-center gap-2.5">
        <span className={CARD_ICON_BADGE_CLASS}>
          <Table2 className="h-4 w-4 text-[#D6AE4F]" aria-hidden />
        </span>
        <h3 className="text-[16px] font-semibold text-white sm:text-[17px]">Comparador de escuelas</h3>
      </div>

      <div className="mt-4 space-y-2.5 md:hidden">
        {COMPARATOR_ROWS.map((row) => (
          <ComparatorMobileSchoolRow key={row.label} row={row} />
        ))}
      </div>

      <div className={`mt-4 hidden overflow-hidden md:block ${CARD_INNER_SURFACE_CLASS}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="px-3 py-2.5 font-semibold text-white/50"> </th>
                <th className="px-3 py-2.5 font-semibold text-white/50">Precio</th>
                <th className="px-3 py-2.5 font-semibold text-white/50">Extras</th>
                <th className="px-3 py-2.5 font-semibold text-white/50">Riesgo</th>
                <th className="px-3 py-2.5 font-semibold text-white/50">Opiniones</th>
              </tr>
            </thead>
            <tbody>
              {COMPARATOR_ROWS.map((row) => (
                <tr key={row.label} className="border-b border-white/6 last:border-b-0">
                  <td className="px-3 py-3 font-medium text-white/70">{row.label}</td>
                  <td className="px-3 py-3 text-white/80">{row.price}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1.5 text-white/75">
                      {row.extrasWarn ? (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#B8923F]" aria-hidden />
                      ) : (
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                      )}
                      {row.extras}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={RISK_PILL_CLASS}>
                      {row.risk}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1.5 text-white/80">
                      {row.opinionsGood ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#B8923F]" aria-hidden />
                      )}
                      {row.opinions}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Link
        href={COMPARATOR_HREF}
        onClick={() => {
          const metadata = createTrackingCtaMetadata("home_schools_open_comparator");
          if (metadata) trackCtaClicked(metadata);
        }}
        className={CARD_CTA_CLASS}
      >
        Comparar escuelas
        <ArrowRight className="h-4 w-4 shrink-0 text-current transition group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </article>
  );
}

function StudentOpinionsCard() {
  return (
    <article className={`${CARD_SHELL_CLASS} max-md:p-4`}>
      <div className="flex items-center gap-2.5">
        <span className={CARD_ICON_BADGE_CLASS}>
          <Star className="h-4 w-4 text-[#D6AE4F]" aria-hidden />
        </span>
        <h3 className="text-[16px] font-semibold text-white sm:text-[17px]">Opiniones reales</h3>
      </div>

      <div className="mt-4 space-y-3 max-md:mt-3 max-md:space-y-2">
        {REVIEW_SAMPLES.map((review, index) => (
          <div
            key={index}
            className={`${CARD_INNER_SURFACE_CLASS} px-4 py-3.5 max-md:px-3 max-md:py-2.5`}
          >
            <StarRating rating={review.rating} />
            <p className="mt-2 text-[13px] leading-relaxed text-white/70 max-md:mt-1.5 max-md:text-[12px] max-md:leading-snug">
              {review.quote}
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-4 max-md:mt-2 max-md:gap-1.5">
              <p className="inline-flex items-start gap-1.5 text-[11px] text-white/60 sm:text-[12px]">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                <span>
                  <span className="font-semibold text-white/75">Lo bueno:</span> {review.good}
                </span>
              </p>
              <p className="inline-flex items-start gap-1.5 text-[11px] text-white/60 sm:text-[12px]">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B8923F]" aria-hidden />
                <span>
                  <span className="font-semibold text-white/75">Ojo con:</span> {review.watch}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <Link href={OPINIONS_HREF} className={`${CARD_CTA_CLASS} max-md:mt-4`}>
        Ver opiniones
        <ArrowRight className="h-4 w-4 shrink-0 text-current transition group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </article>
  );
}

export function HomeSchoolsTrustSection() {
  return (
    <section className="overflow-hidden border-t border-[#071224]/[0.06] bg-[#F7F8FA]">
      <div className="mx-auto max-w-[76rem] px-6 py-10 lg:px-8 lg:py-12">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B8923F]">
            Antes de elegir escuela
          </p>
          <h2 className="mt-3 text-[1.65rem] font-semibold leading-tight tracking-tight text-[#071224] sm:text-[1.9rem] lg:text-[2rem]">
            Compara antes de pagar.
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-[#4B5563] sm:text-[15px]">
            Precios, extras, condiciones y opiniones para decidir con más criterio.
          </p>
        </header>

        <div className="mt-8 grid gap-5 lg:mt-9 lg:grid-cols-2 lg:gap-6">
          <SchoolsComparatorCard />
          <StudentOpinionsCard />
        </div>
      </div>
    </section>
  );
}
