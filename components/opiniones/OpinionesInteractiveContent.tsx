"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ShieldCheck, Star, X } from "lucide-react";

const TOAST_TIMEOUT_MS = 2300;

const ADVENTIA_PREVIEW_SLUG = "adventia-usal";

const REVIEW_FORM_INTRO =
  "Tu opinión no se publicará automáticamente. FlyPath revisará la información antes de mostrarla públicamente y podrá anonimizar tus datos personales.";

const REVIEW_FORM_PREVIEW_NOTICE =
  "De momento este formulario es una vista previa. La recogida real de opiniones se activará próximamente.";

const REVIEW_FORM_ERROR_MESSAGE = "Completa los campos obligatorios antes de continuar.";
const REVIEW_FORM_SUCCESS_MESSAGE =
  "Formulario preparado. La recogida real de opiniones se activará próximamente.";

const RELATIONSHIP_OPTIONS = [
  "Soy alumno actual",
  "Soy antiguo alumno",
  "He terminado la formación",
  "Me cambié de escuela",
  "Solo pedí información",
];

const RATING_FIELDS: { name: string; label: string }[] = [
  { name: "ratingGeneral", label: "Valoración general" },
  { name: "ratingCosts", label: "Transparencia de costes" },
  { name: "ratingAvailability", label: "Disponibilidad de aviones" },
  { name: "ratingOrganization", label: "Organización de la formación" },
  { name: "ratingInstructors", label: "Calidad de instructores" },
  { name: "ratingSupport", label: "Soporte administrativo" },
  { name: "ratingContract", label: "Claridad de contrato y reembolso" },
];

const KEY_QUESTIONS: { name: string; label: string }[] = [
  { name: "qFinalCost", label: "¿El coste final se pareció al precio anunciado?" },
  { name: "qContract", label: "¿Recibiste contrato antes de pagar?" },
  { name: "qRefund", label: "¿La política de reembolso estaba clara?" },
  { name: "qWouldChoose", label: "¿Volverías a elegir esa escuela?" },
];

const KEY_QUESTION_OPTIONS = ["Sí", "No", "Parcialmente", "No lo sé"];

type ReviewFormStatus = "idle" | "error" | "success";

const ADVENTIA_DEMO_AREAS: { label: string; score: string }[] = [
  { label: "Transparencia de costes", score: "7,6/10" },
  { label: "Disponibilidad de aviones", score: "8,0/10" },
  { label: "Organización de la formación", score: "7,8/10" },
  { label: "Calidad de instructores", score: "8,5/10" },
  { label: "Soporte administrativo", score: "7,4/10" },
  { label: "Contrato y reembolso", score: "7,2/10" },
];

const ADVENTIA_DEMO_REVIEWS: { meta: string; quote: string }[] = [
  {
    meta: "Alumno verificado · Fase ATPL · 2024 · Simulada",
    quote:
      "Buena organización general y buen nivel docente. Antes de pagar, pediría el desglose completo de tasas y costes administrativos.",
  },
  {
    meta: "Antiguo alumno · Fase integrada · 2023 · Simulada",
    quote:
      "La experiencia fue positiva, especialmente en la parte teórica. Recomendaría confirmar por escrito calendario de pagos y política de reembolso.",
  },
];

type SchoolOption = { value: string; label: string };

export function OpinionesInteractiveContent({
  schoolOptions,
}: {
  schoolOptions: readonly SchoolOption[];
}) {
  const [toast, setToast] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [heroImageAvailable, setHeroImageAvailable] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [modalSchoolSlug, setModalSchoolSlug] = useState<string>("");
  const [formStatus, setFormStatus] = useState<ReviewFormStatus>("idle");
  const [formKey, setFormKey] = useState(0);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const reviewFormRef = useRef<HTMLFormElement>(null);

  const selectedSchoolLabel =
    schoolOptions.find((s) => s.value === selectedSchool)?.label ?? "";
  const isAdventiaPreview = selectedSchool === ADVENTIA_PREVIEW_SLUG;

  const setRating = (name: string, value: number) =>
    setRatings((current) =>
      current[name] === value
        ? (() => {
            const next = { ...current };
            delete next[name];
            return next;
          })()
        : { ...current, [name]: value },
    );

  const openReviewModal = (slug: string = selectedSchool) => {
    setModalSchoolSlug(slug);
    setFormStatus("idle");
    setRatings({});
    setFormKey((k) => k + 1);
    setReviewModalOpen(true);
  };
  const closeReviewModal = () => setReviewModalOpen(false);

  const handleReviewSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const fullName = String(data.get("fullName") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const schoolSlug = String(data.get("schoolSlug") ?? "").trim();
    const relationship = String(data.get("relationship") ?? "").trim();
    const acceptReview = data.get("acceptReview") === "on";
    if (!fullName || !email || !schoolSlug || !relationship || !acceptReview) {
      setFormStatus("error");
      return;
    }
    setFormStatus("success");
  };

  useEffect(() => {
    if (!reviewModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeReviewModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [reviewModalOpen]);

  useEffect(() => {
    if (!reviewModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [reviewModalOpen]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => {
      setToast((current) => (current === toast ? null : current));
    }, TOAST_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [toast]);

  return (
    <>
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-3 top-3 z-50 rounded-lg border border-[#c9a454]/35 bg-[#0f1a33] px-4 py-2 text-[15px] text-white shadow-lg"
        >
          {toast}
        </div>
      ) : null}

      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-white/90 bg-gradient-to-b from-[#fffdfb] via-[#f8fafc] to-[#f3f6fa] p-6 shadow-[0_14px_44px_-18px_rgba(15,26,51,0.1)] ring-1 ring-[#c9a454]/18 sm:p-8">
        {heroImageAvailable ? (
          <Image
            src="/opiniones-escuelas-hero.webp"
            alt=""
            fill
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 1100px) 95vw, 1100px"
            className="pointer-events-none -scale-x-100 object-cover opacity-[0.78] contrast-[1.02]"
            onError={() => setHeroImageAvailable(false)}
            aria-hidden
          />
        ) : (
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#f4f2ee]" />
        )}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#fffdf6]/22" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#fffdf9]/82 via-[#fffdf9]/35 to-transparent sm:from-[#fffdf9]/74 sm:via-[#fffdf9]/22"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_8%,rgba(201,164,84,0.10),transparent_58%)]"
        />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a5a16]">
              Opiniones verificadas
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#0f1a33] drop-shadow-[0_1px_0_rgba(255,255,255,0.95)] sm:text-4xl">
              Opiniones verificadas de escuelas de vuelo
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#0f1a33] drop-shadow-[0_1px_0_rgba(255,255,255,0.85)] [text-shadow:0_0_24px_rgba(255,253,249,0.65)]">
              Consulta el estado de opiniones verificadas por escuela y ayuda a otros futuros pilotos
              compartiendo tu experiencia antes de una decisión económica importante.
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#0f1a33]/82 sm:text-[15px]">
              FlyPath recogerá experiencias reales sobre costes, organización, disponibilidad de
              aviones, instructores, soporte administrativo y condiciones antes de pagar.
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => openReviewModal()}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-md transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
              >
                Dejar una opinión
              </button>
            </div>
          </div>

          <aside
            aria-hidden
            className="relative z-20 hidden isolate rounded-2xl border border-white/12 bg-[#0f1a33] p-4 text-white shadow-[0_14px_32px_rgba(15,26,51,0.28)] ring-1 ring-[#c9a454]/30 lg:block"
          >
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#c9a454]/15 ring-1 ring-[#c9a454]/35">
                <ShieldCheck className="h-4 w-4 text-[#f2ddaa]" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f2ddaa]">
                Opinión verificada
              </p>
            </div>
            <div className="mt-4 rounded-xl border border-white/15 bg-white/[0.06] p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-0.5">
                  {[0, 1, 2, 3].map((i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 text-[#f2ddaa]"
                      fill="currentColor"
                      strokeWidth={1.5}
                    />
                  ))}
                  <Star
                    className="h-4 w-4 text-[#f2ddaa]/30"
                    fill="currentColor"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="rounded-full border border-[#c9a454]/40 bg-[#c9a454]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#f2ddaa]">
                  En validación
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="h-1.5 w-[72%] rounded-full bg-white/15" />
                <div className="h-1.5 w-[55%] rounded-full bg-white/10" />
                <div className="h-1.5 w-[40%] rounded-full bg-white/10" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[12px] text-slate-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#f2ddaa]" />
              <span>Experiencias revisadas por FlyPath</span>
            </div>
          </aside>
        </div>
      </section>

      {/* SELECTOR de escuela */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-[#0f1a33]">Selecciona una escuela</h2>
        <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">
          Elige una escuela para consultar el estado de sus opiniones verificadas.
        </p>
        <label className="mt-4 block max-w-md">
          <span className="sr-only">Escuela</span>
          <select
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-[#0f1a33] shadow-sm transition focus:border-[#c9a454] focus:outline-none focus:ring-2 focus:ring-[#c9a454]/30"
          >
            <option value="">Elige una escuela</option>
            {schoolOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      {/* RESULTADO de escuela seleccionada */}
      {selectedSchool ? (
        isAdventiaPreview ? (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative bg-[#0f1a33] px-5 py-4 text-white sm:px-6">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_140%_at_100%_50%,rgba(201,164,84,0.14),transparent_60%)]"
              />
              <div className="relative flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f2ddaa]">
                    Vista previa de diseño
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">Adventia</h2>
                </div>
                <span className="inline-flex shrink-0 items-center rounded-full border border-amber-300/45 bg-amber-300/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-100">
                  Demo interna
                </span>
              </div>
            </div>

            <div className="px-5 py-5 sm:px-6 sm:py-6">
              <p className="text-[12px] leading-snug text-slate-500">
                Contenido simulado únicamente para previsualizar la interfaz. No son datos reales ni
                opiniones publicadas.
              </p>

              <div className="mt-5 border-b border-slate-100 pb-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Calificación global
                </p>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="text-4xl font-bold tabular-nums tracking-tight text-[#0f1a33]">
                    8,1
                    <span className="text-2xl font-semibold text-slate-500">/10</span>
                  </p>
                  <div
                    className="flex items-center gap-0.5 self-end pb-1.5"
                    aria-label="4 de 5 estrellas (simulado)"
                  >
                    {[0, 1, 2, 3].map((i) => (
                      <Star
                        key={i}
                        className="h-6 w-6 text-[#c9a454]"
                        fill="currentColor"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    ))}
                    <Star
                      className="h-6 w-6 text-[#c9a454]/25"
                      fill="currentColor"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                Basado en 12 opiniones verificadas simuladas para previsualizar el diseño.
              </p>

              <div className="mt-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Áreas
                </p>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {ADVENTIA_DEMO_AREAS.map((row) => (
                    <li
                      key={row.label}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-[14px]"
                    >
                      <span className="font-medium text-slate-700">{row.label}</span>
                      <span className="shrink-0 tabular-nums font-semibold text-[#0f1a33]">
                        {row.score}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Opiniones recientes simuladas
                </p>
                <ul className="mt-2 grid gap-3 sm:grid-cols-1">
                  {ADVENTIA_DEMO_REVIEWS.map((r) => (
                    <li
                      key={r.meta}
                      className="relative overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-3 pl-[14px] shadow-[0_1px_0_rgba(15,26,51,0.03)]"
                    >
                      <span
                        aria-hidden
                        className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-[#c9a454]/55"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500">
                          {r.meta}
                        </p>
                        <div className="flex items-center gap-0.5" aria-label="4 de 5 estrellas (simulado)">
                          {[0, 1, 2, 3].map((i) => (
                            <Star
                              key={i}
                              className="h-3.5 w-3.5 text-[#c9a454]"
                              fill="currentColor"
                              strokeWidth={1.5}
                              aria-hidden
                            />
                          ))}
                          <Star
                            className="h-3.5 w-3.5 text-[#c9a454]/30"
                            fill="currentColor"
                            strokeWidth={1.5}
                            aria-hidden
                          />
                        </div>
                      </div>
                      <blockquote className="mt-2 text-[15px] leading-relaxed text-slate-700">
                        &ldquo;{r.quote}&rdquo;
                      </blockquote>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  type="button"
                  onClick={() => openReviewModal(ADVENTIA_PREVIEW_SLUG)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-md transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
                >
                  Dejar una opinión sobre Adventia
                </button>
                <Link
                  href={`/schools?selected=${encodeURIComponent(ADVENTIA_PREVIEW_SLUG)}&source=reviews`}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#c9a454]/55 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
                >
                  Comparar esta escuela
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-[#c9a454]/30 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a5a16]">
                  Escuela seleccionada
                </p>
                <h2 className="mt-1 text-xl font-semibold text-[#0f1a33] sm:text-2xl">
                  {selectedSchoolLabel}
                </h2>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#c9a454]/35 bg-[#fff8e8] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7a5a16]">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Opiniones en validación
              </span>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
              Todavía no hay suficientes opiniones verificadas para mostrar una calificación pública de
              esta escuela.
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
              Cuando haya suficientes datos revisados, aquí verás calificación global, valoración por
              áreas, opiniones verificadas de alumnos y una lectura FlyPath de puntos fuertes y puntos
              a vigilar.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={() => openReviewModal(selectedSchool)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-md transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
              >
                {`Dejar una opinión sobre ${selectedSchoolLabel}`}
              </button>
              <Link
                href={`/schools?selected=${encodeURIComponent(selectedSchool)}&source=reviews`}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#c9a454]/55 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
              >
                Comparar esta escuela
              </Link>
            </div>
          </section>
        )
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5 sm:p-6">
          <p className="text-[15px] leading-relaxed text-slate-700">
            Selecciona una escuela para ver el estado de sus opiniones verificadas.
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-slate-500">
            Cuando existan suficientes opiniones revisadas, aquí aparecerán la calificación global,
            las áreas mejor valoradas y los puntos a vigilar.
          </p>
        </section>
      )}

      {/* MODAL: formulario de opinión */}
      {reviewModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-form-title"
          className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto bg-[#0a1228]/55 px-3 py-6 backdrop-blur-sm sm:items-center sm:px-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeReviewModal();
          }}
        >
          <div className="relative my-auto w-full max-w-[760px] overflow-hidden rounded-3xl border border-[#c9a454]/35 bg-white shadow-[0_28px_64px_-16px_rgba(15,26,51,0.45)] ring-1 ring-[#c9a454]/15">
            <div className="relative bg-[#0f1a33] px-5 py-4 text-white sm:px-7 sm:py-5">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_140%_at_100%_50%,rgba(201,164,84,0.14),transparent_60%)]"
              />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0 pr-8">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f2ddaa]">
                    Opinión verificada
                  </p>
                  <h3
                    id="review-form-title"
                    className="mt-1 text-xl font-semibold leading-tight text-white sm:text-2xl"
                  >
                    Deja una opinión verificada
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeReviewModal}
                  aria-label="Cerrar formulario de opinión"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/[0.08] text-white transition hover:border-white/35 hover:bg-white/[0.16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
                >
                  <X className="h-[18px] w-[18px]" aria-hidden />
                </button>
              </div>
            </div>

            <div className="max-h-[82vh] overflow-y-auto overscroll-contain px-5 pb-8 pt-4 [scrollbar-gutter:stable] sm:px-7 sm:pb-10 sm:pt-5">
              {formStatus === "success" ? (
                <div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                      Listo
                    </p>
                    <p className="mt-1 text-[15px] leading-relaxed text-emerald-900">
                      {REVIEW_FORM_SUCCESS_MESSAGE}
                    </p>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">{REVIEW_FORM_INTRO}</p>
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setFormStatus("idle")}
                      className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-[14px] font-semibold text-[#0f1a33] transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
                    >
                      Editar datos
                    </button>
                    <button
                      type="button"
                      onClick={closeReviewModal}
                      className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-5 py-2 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  ref={reviewFormRef}
                  key={formKey}
                  onSubmit={handleReviewSubmit}
                  noValidate
                  className="space-y-7"
                >
                  <div className="space-y-2">
                    <p className="text-sm leading-relaxed text-slate-600">{REVIEW_FORM_INTRO}</p>
                    <p className="rounded-xl border border-[#c9a454]/30 bg-[#fffdf6] px-3 py-1.5 text-sm leading-snug text-[#7a5a16]">
                      {REVIEW_FORM_PREVIEW_NOTICE}
                    </p>
                  </div>

                  <fieldset className="space-y-4">
                    <legend className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
                      Datos básicos
                    </legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">
                          Nombre completo <span className="text-rose-600">*</span>
                        </span>
                        <input
                          type="text"
                          name="fullName"
                          autoComplete="name"
                          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-[#0f1a33] shadow-sm transition focus:border-[#c9a454] focus:outline-none focus:ring-2 focus:ring-[#c9a454]/30"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">
                          Email <span className="text-rose-600">*</span>
                        </span>
                        <input
                          type="email"
                          name="email"
                          autoComplete="email"
                          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-[#0f1a33] shadow-sm transition focus:border-[#c9a454] focus:outline-none focus:ring-2 focus:ring-[#c9a454]/30"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">
                          Escuela <span className="text-rose-600">*</span>
                        </span>
                        <select
                          name="schoolSlug"
                          defaultValue={modalSchoolSlug}
                          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-[#0f1a33] shadow-sm transition focus:border-[#c9a454] focus:outline-none focus:ring-2 focus:ring-[#c9a454]/30"
                        >
                          <option value="">Selecciona una escuela</option>
                          {schoolOptions.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">
                          Programa o fase de formación
                        </span>
                        <input
                          type="text"
                          name="programPhase"
                          placeholder="Integrado ATPL, modular, PPL..."
                          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-[#0f1a33] shadow-sm transition focus:border-[#c9a454] focus:outline-none focus:ring-2 focus:ring-[#c9a454]/30"
                        />
                      </label>
                    </div>
                  </fieldset>

                  <fieldset className="space-y-4 border-t border-slate-100 pt-6">
                    <legend className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
                      Relación con la escuela
                    </legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">
                          Tu relación <span className="text-rose-600">*</span>
                        </span>
                        <select
                          name="relationship"
                          defaultValue=""
                          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-[#0f1a33] shadow-sm transition focus:border-[#c9a454] focus:outline-none focus:ring-2 focus:ring-[#c9a454]/30"
                        >
                          <option value="">Selecciona una opción</option>
                          {RELATIONSHIP_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">
                          Año aproximado
                        </span>
                        <input
                          type="text"
                          name="approxYear"
                          inputMode="numeric"
                          placeholder="Ej. 2024"
                          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-[#0f1a33] shadow-sm transition focus:border-[#c9a454] focus:outline-none focus:ring-2 focus:ring-[#c9a454]/30"
                        />
                      </label>
                    </div>
                  </fieldset>

                  <fieldset className="space-y-4 border-t border-slate-100 pt-6">
                    <legend className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
                      Valoraciones (1–10)
                    </legend>
                    <p className="text-sm leading-snug text-slate-500">
                      Toca las estrellas para valorar cada área. La equivalencia se muestra sobre 10.
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {RATING_FIELDS.map((field) => {
                        const current = ratings[field.name];
                        return (
                          <div
                            key={field.name}
                            className="rounded-xl border border-slate-200/60 bg-white/80 px-3 py-2.5"
                          >
                            <p className="text-sm font-medium leading-snug text-slate-700">
                              {field.label}
                            </p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <div
                                role="radiogroup"
                                aria-label={field.label}
                                className="flex items-center gap-0.5"
                              >
                                {[1, 2, 3, 4, 5].map((n) => {
                                  const value = n * 2;
                                  const active = (current ?? 0) >= value;
                                  return (
                                    <button
                                      key={n}
                                      type="button"
                                      role="radio"
                                      aria-checked={current === value}
                                      aria-label={`${value} sobre 10`}
                                      onClick={() => setRating(field.name, value)}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/45 hover:bg-slate-100"
                                    >
                                      <Star
                                        className={`h-5 w-5 transition ${
                                          active ? "text-[#c9a454]" : "text-slate-300"
                                        }`}
                                        fill="currentColor"
                                        strokeWidth={1.5}
                                        aria-hidden
                                      />
                                    </button>
                                  );
                                })}
                              </div>
                              <span className="text-[11.5px] font-medium tabular-nums text-slate-500">
                                {current ? `${current}/10` : "Sin valorar"}
                              </span>
                            </div>
                            <input type="hidden" name={field.name} value={current ?? ""} />
                          </div>
                        );
                      })}
                    </div>
                  </fieldset>

                  <fieldset className="space-y-4 border-t border-slate-100 pt-6">
                    <legend className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
                      Preguntas clave
                    </legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {KEY_QUESTIONS.map((q) => (
                        <label key={q.name} className="block">
                          <span className="text-sm font-medium leading-snug text-slate-700">
                            {q.label}
                          </span>
                          <select
                            name={q.name}
                            defaultValue=""
                            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-[#0f1a33] shadow-sm transition focus:border-[#c9a454] focus:outline-none focus:ring-2 focus:ring-[#c9a454]/30"
                          >
                            <option value="">Sin responder</option>
                            {KEY_QUESTION_OPTIONS.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="space-y-4 border-t border-slate-100 pt-6">
                    <legend className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
                      Tu experiencia
                    </legend>
                    <div className="grid gap-4">
                      {[
                        { name: "bestPart", label: "Lo mejor de tu experiencia" },
                        { name: "improvements", label: "Lo que mejorarías" },
                        { name: "advice", label: "Consejo para futuros alumnos" },
                      ].map((t) => (
                        <label key={t.name} className="block">
                          <span className="text-sm font-medium text-slate-700">{t.label}</span>
                          <textarea
                            name={t.name}
                            rows={3}
                            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] leading-relaxed text-[#0f1a33] shadow-sm transition focus:border-[#c9a454] focus:outline-none focus:ring-2 focus:ring-[#c9a454]/30"
                          />
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="space-y-3 border-t border-slate-100 pt-6">
                    <legend className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
                      Privacidad y revisión
                    </legend>
                    <label className="flex items-start gap-2.5 text-sm leading-snug text-slate-700">
                      <input
                        type="checkbox"
                        name="anonymous"
                        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-400 text-[#c9a454] focus:ring-[#c9a454]/40"
                      />
                      <span>Quiero que mi opinión se muestre de forma anónima.</span>
                    </label>
                    <label className="flex items-start gap-2.5 text-sm leading-snug text-slate-700">
                      <input
                        type="checkbox"
                        name="acceptReview"
                        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-400 text-[#c9a454] focus:ring-[#c9a454]/40"
                      />
                      <span>
                        Acepto que FlyPath revise esta información antes de publicarla y entiendo que no se
                        publicará automáticamente.{" "}
                        <span className="text-rose-600">*</span>
                      </span>
                    </label>
                  </fieldset>

                  <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-snug text-slate-600">
                    No incluyas datos sensibles ni acusaciones graves sin contexto. FlyPath podrá pedir
                    verificación adicional antes de publicar una opinión.
                  </p>

                  {formStatus === "error" ? (
                    <p
                      role="alert"
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[14px] font-medium text-rose-800"
                    >
                      {REVIEW_FORM_ERROR_MESSAGE}
                    </p>
                  ) : null}

                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      type="button"
                      onClick={closeReviewModal}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-md transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
                    >
                      Enviar opinión para revisión
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
