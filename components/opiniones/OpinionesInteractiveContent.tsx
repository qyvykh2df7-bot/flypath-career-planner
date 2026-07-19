"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ShieldCheck, Star, X } from "lucide-react";
import { PublicSchoolReviews } from "./PublicSchoolReviews";
import { buildSchoolReviewFormPayload } from "./schoolReviewFormPayload";

const TOAST_TIMEOUT_MS = 2300;

const REVIEW_FORM_INTRO =
  "Tu opinión no se publicará automáticamente. FlyPath revisará la información antes de mostrarla públicamente y podrá anonimizar tus datos personales.";

const REVIEW_FORM_ERROR_MESSAGE = "Revisa los campos obligatorios e inténtalo de nuevo.";

const RELATIONSHIP_OPTIONS = [
  { value: "current_student", label: "Soy alumno actual" },
  { value: "former_student", label: "Soy antiguo alumno" },
  { value: "completed_training", label: "He terminado la formación" },
  { value: "transferred_school", label: "Me cambié de escuela" },
  { value: "information_requester", label: "Solo pedí información" },
];

const RATING_FIELDS = [
  { name: "general", label: "Valoración general" },
  { name: "costs", label: "Transparencia de costes" },
  { name: "availability", label: "Disponibilidad de aviones" },
  { name: "organization", label: "Organización de la formación" },
  { name: "instructors", label: "Calidad de instructores" },
  { name: "support", label: "Soporte administrativo" },
  { name: "contract", label: "Claridad de contrato y reembolso" },
];

const KEY_QUESTIONS: { name: string; label: string }[] = [
  { name: "finalCost", label: "¿El coste final se pareció al precio anunciado?" },
  { name: "contractBeforePayment", label: "¿Recibiste contrato antes de pagar?" },
  { name: "refundClarity", label: "¿La política de reembolso estaba clara?" },
  { name: "wouldChooseAgain", label: "¿Volverías a elegir esa escuela?" },
];

const KEY_QUESTION_OPTIONS = [
  { value: "yes", label: "Sí" },
  { value: "no", label: "No" },
  { value: "partial", label: "Parcialmente" },
  { value: "unknown", label: "No lo sé" },
];

type ReviewFormStatus = "idle" | "submitting" | "error" | "awaiting" | "pending" | "duplicate";

type SchoolOption = { value: string; label: string };

export function OpinionesInteractiveContent({
  schoolOptions,
  authenticatedEmail,
  initialSchoolSlug,
}: {
  schoolOptions: readonly SchoolOption[];
  authenticatedEmail: string | null;
  initialSchoolSlug: string | null;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<string>(initialSchoolSlug ?? "");
  const [heroImageAvailable, setHeroImageAvailable] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [modalSchoolSlug, setModalSchoolSlug] = useState<string>("");
  const [formStatus, setFormStatus] = useState<ReviewFormStatus>("idle");
  const [validationField, setValidationField] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [pendingVerification, setPendingVerification] = useState<{ reviewId: string; email: string } | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const reviewFormRef = useRef<HTMLFormElement>(null);

  const selectedSchoolLabel =
    schoolOptions.find((s) => s.value === selectedSchool)?.label ?? "";

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
    setValidationField(null);
    setRatings({});
    setPendingVerification(null);
    setSubmissionId(null);
    setFormKey((k) => k + 1);
    setReviewModalOpen(true);
  };
  const closeReviewModal = () => setReviewModalOpen(false);

  const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = authenticatedEmail ?? String(data.get("email") ?? "").trim();
    const requestId = submissionId ?? crypto.randomUUID();
    const formPayload = buildSchoolReviewFormPayload({
      data,
      submissionId: requestId,
      ratings,
      includeEmail: !authenticatedEmail,
    });
    if (!formPayload.ok || !email) {
      setValidationField(
        process.env.NODE_ENV === "development"
          ? formPayload.ok
            ? "email"
            : formPayload.field
          : null,
      );
      setFormStatus("error");
      return;
    }
    setSubmissionId(requestId);
    setValidationField(null);
    setFormStatus("submitting");
    try {
      const response = await fetch("/api/school-reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(formPayload.payload),
      });
      const result = await response.json() as {
        status?: string;
        reviewId?: string;
        validationField?: string;
      };
      if (!response.ok && process.env.NODE_ENV === "development") {
        setValidationField(result.validationField ?? null);
      }
      if (!response.ok || !result.status || !result.reviewId) throw new Error("Review submission failed");
      if (result.status === "awaiting_email_verification") {
        setPendingVerification({ reviewId: result.reviewId, email });
        setFormStatus("awaiting");
      } else if (result.status === "pending_moderation") {
        setFormStatus("pending");
      } else if (result.status === "duplicate") {
        setFormStatus("duplicate");
      } else {
        throw new Error("Unexpected review result");
      }
    } catch {
      setFormStatus("error");
    }
  };

  const resendVerification = async () => {
    if (!pendingVerification) return;
    try {
      const response = await fetch("/api/school-reviews/resend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(pendingVerification),
      });
      const result = await response.json() as { status?: string };
      setToast(result.status === "sent" ? "Hemos reenviado el enlace de verificación." : "No hemos podido reenviar el enlace ahora mismo.");
    } catch {
      setToast("No hemos podido reenviar el enlace ahora mismo.");
    }
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
        <PublicSchoolReviews
          key={selectedSchool}
          schoolSlug={selectedSchool}
          schoolName={selectedSchoolLabel}
          onLeaveReview={() => openReviewModal(selectedSchool)}
        />
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
              {formStatus === "awaiting" || formStatus === "pending" || formStatus === "duplicate" ? (
                <div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                      {formStatus === "duplicate" ? "Opinión ya registrada" : "Listo"}
                    </p>
                    <p className="mt-1 text-[15px] leading-relaxed text-emerald-900">
                      {formStatus === "awaiting"
                        ? "Te hemos enviado un enlace para verificar tu email. Cuando lo confirmes, la opinión pasará a revisión."
                        : formStatus === "pending"
                          ? "Hemos recibido tu opinión. Ahora queda pendiente de revisión antes de mostrarse públicamente."
                          : "Ya existe una opinión activa para esta escuela con esta identidad verificada."}
                    </p>
                  </div>
                  {formStatus === "awaiting" ? (
                    <button
                      type="button"
                      onClick={resendVerification}
                      className="mt-4 inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-[14px] font-semibold text-[#0f1a33] transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
                    >
                      Reenviar enlace de verificación
                    </button>
                  ) : null}
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">{REVIEW_FORM_INTRO}</p>
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    {formStatus === "duplicate" ? (
                      <button
                        type="button"
                        onClick={() => setFormStatus("idle")}
                        className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-[14px] font-semibold text-[#0f1a33] transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
                      >
                        Revisar datos
                      </button>
                    ) : null}
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
                  className="space-y-7"
                >
                  <div className="space-y-2">
                    <p className="text-sm leading-relaxed text-slate-600">{REVIEW_FORM_INTRO}</p>
                    <p className="rounded-xl border border-[#c9a454]/30 bg-[#fffdf6] px-3 py-1.5 text-sm leading-snug text-[#7a5a16]">
                      Las opiniones pasan por una revisión antes de publicarse. Tu email no se mostrará públicamente.
                    </p>
                  </div>

                  <fieldset className="space-y-4">
                    <legend className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
                      Datos básicos
                    </legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {authenticatedEmail ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 sm:col-span-2">
                          Usaremos el email verificado de tu cuenta para validar esta opinión. No se mostrará públicamente.
                        </div>
                      ) : (
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">
                            Email <span className="text-rose-600">*</span>
                          </span>
                          <input
                            type="email"
                            name="email"
                            autoComplete="email"
                            maxLength={320}
                            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-[#0f1a33] shadow-sm transition focus:border-[#c9a454] focus:outline-none focus:ring-2 focus:ring-[#c9a454]/30"
                          />
                        </label>
                      )}
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
                              <option key={r.value} value={r.value}>
                                {r.label}
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
                              {field.label} <span className="text-rose-600">*</span>
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
                            {q.label} <span className="text-rose-600">*</span>
                          </span>
                          <select
                            name={q.name}
                            defaultValue=""
                            required
                            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-[#0f1a33] shadow-sm transition focus:border-[#c9a454] focus:outline-none focus:ring-2 focus:ring-[#c9a454]/30"
                          >
                            <option value="">Sin responder</option>
                            {KEY_QUESTION_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
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
                          <span className="text-sm font-medium text-slate-700">
                            {t.label} <span className="text-rose-600">*</span>
                          </span>
                          <textarea
                            name={t.name}
                            rows={3}
                            required
                            maxLength={3000}
                            aria-describedby={`${t.name}-hint`}
                            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] leading-relaxed text-[#0f1a33] shadow-sm transition focus:border-[#c9a454] focus:outline-none focus:ring-2 focus:ring-[#c9a454]/30"
                          />
                          <span id={`${t.name}-hint`} className="mt-1 block text-xs text-slate-500">
                            Campo obligatorio.
                          </span>
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
                      {validationField ? ` Campo no válido: ${validationField}.` : ""}
                    </p>
                  ) : null}

                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      type="button"
                      onClick={closeReviewModal}
                      disabled={formStatus === "submitting"}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={formStatus === "submitting"}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-md transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
                    >
                      {formStatus === "submitting" ? "Enviando opinión..." : "Enviar opinión para revisión"}
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
