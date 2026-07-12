"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { Calendar, CheckCircle2, ShieldCheck, User } from "lucide-react";
import { MentorshipSupportModal } from "@/components/mentorias/MentorshipSupportModal";
import { initializeTrackingContext } from "@/lib/tracking/session";

const TOAST_MS = 2800;
const MAIN_TOAST = "Reserva de mentoría próximamente";

/** Sustituir por URL real de Cal.com cuando esté disponible */
const CALCOM_MENTORIA_URL = "#";

const MENTORIA_IDEAL_FOR = [
  "Dudas concretas",
  "Revisar tu ruta actual",
  "Definir próximos pasos",
] as const;

const ACOMPANIMENT_INCLUDES = [
  "Comparación de rutas y escuelas",
  "Revisión de presupuestos y condiciones",
  "Preparación de preguntas para escuelas",
  "Seguimiento durante el proceso de decisión",
  "Próximos pasos claros tras cada avance",
] as const;

const SECTION_LIGHT_BG = "bg-[#F7F8FA]";

export function MentoriasPricingSection() {
  const [toast, setToast] = useState<string | null>(null);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  const handleCalLinkClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, href: string, toastMessage?: string) => {
      if (href === "#") {
        e.preventDefault();
        setToast(toastMessage ?? MAIN_TOAST);
      }
    },
    [],
  );

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast((t) => (t === toast ? null : t)), TOAST_MS);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    initializeTrackingContext();
  }, []);

  return (
    <>
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-3 top-3 z-50 max-w-[min(22rem,calc(100vw-1.5rem))] rounded-lg border border-[#c9a454]/35 bg-[#0f1a33] px-4 py-2.5 text-[15px] text-white shadow-lg sm:right-5 sm:top-5"
        >
          {toast}
        </div>
      ) : null}

      <section
        id="modalidades-mentorias"
        className={`border-t border-[#071224]/[0.06] ${SECTION_LIGHT_BG} py-12 sm:py-14`}
      >
        <div className="mx-auto max-w-5xl px-6 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B8923F]">
              MODALIDADES
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-[1.12] tracking-tight text-[#071224] sm:text-3xl">
              Elige cómo quieres revisar tu decisión
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[#4B5563] sm:text-base">
              Una sesión puede ahorrarte meses de dudas y miles de euros.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:mt-10">
            {/* Mentoría individual */}
            <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-header-navy p-5 shadow-[0_14px_40px_rgba(7,18,36,0.18)] sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D6AE4F]/12 ring-1 ring-[#D6AE4F]/30">
                  <User className="h-7 w-7 text-[#D6AE4F]" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold text-white">Mentoría individual</h3>
                  <p className="mt-0.5 text-2xl font-semibold tracking-tight text-white">44,95 €</p>
                </div>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-white/70">
                Una sesión directa para analizar tu situación y salir con una decisión más clara.
              </p>
              <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#D6AE4F]">
                Ideal para:
              </p>
              <ul className="mt-2 space-y-1.5">
                {MENTORIA_IDEAL_FOR.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-[14px] leading-snug text-white/75 sm:text-[15px]"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D6AE4F]" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-5">
                <a
                  href={CALCOM_MENTORIA_URL}
                  onClick={(e) => handleCalLinkClick(e, CALCOM_MENTORIA_URL, MAIN_TOAST)}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-[#c9a454] bg-[#c9a454] px-6 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-[0_10px_28px_rgba(201,164,84,0.3)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
                >
                  <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                  Reservar mentoría
                </a>
              </div>
            </article>

            {/* Acompañamiento FlyPath */}
            <article
              id="acompanamiento-flypath"
              className="relative flex h-full scroll-mt-24 flex-col overflow-visible rounded-2xl border border-[rgba(212,175,55,0.65)] bg-header-navy p-5 shadow-[0_20px_50px_rgba(212,175,55,0.16),0_14px_40px_rgba(7,18,36,0.18)] sm:p-6"
            >
              <span className="pointer-events-none absolute left-1/2 top-0 z-10 inline-flex -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#c9a454] bg-[#c9a454] px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0f1a33] shadow-[0_8px_24px_rgba(212,175,55,0.35)]">
                RECOMENDADO
              </span>
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D6AE4F]/12 ring-1 ring-[#D6AE4F]/30">
                  <ShieldCheck className="h-7 w-7 text-[#D6AE4F]" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold text-white">Acompañamiento FlyPath</h3>
                  <p className="mt-0.5 text-2xl font-semibold tracking-tight text-[#D6AE4F]">
                    A consultar
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-white/70">
                Un apoyo más continuado para tomar decisiones con criterio antes de comprometer dinero.
              </p>
              <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#D6AE4F]">
                Podemos ayudarte con:
              </p>
              <ul className="mt-2 space-y-1.5">
                {ACOMPANIMENT_INCLUDES.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-[14px] leading-snug text-white/75 sm:text-[15px]"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D6AE4F]" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-5">
                <button
                  type="button"
                  onClick={() => setSupportModalOpen(true)}
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-6 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-[0_10px_28px_rgba(201,164,84,0.3)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
                >
                  Solicitar acompañamiento
                </button>
              </div>
            </article>
          </div>
        </div>
      </section>

      <MentorshipSupportModal
        open={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
      />
    </>
  );
}
