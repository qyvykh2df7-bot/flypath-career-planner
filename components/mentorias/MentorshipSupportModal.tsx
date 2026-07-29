"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import { captureMentorshipSupportLead } from "@/lib/leads/capture-mentorship-support-client";
import { MENTORSHIP_SUPPORT_SITUATIONS } from "@/lib/leads/mentorship-support-consent";
import { trackEventOncePerSession } from "@/lib/tracking/client";
import {
  createTrackingUuid,
  getTrackingContext,
  initializeTrackingContext,
} from "@/lib/tracking/session";

type MentorshipSupportModalProps = {
  open: boolean;
  onClose: () => void;
};

const SUCCESS_MESSAGE =
  "Gracias. Hemos recibido tu solicitud y nos pondremos en contacto contigo pronto.";

const FIELD_CLASS =
  "w-full rounded-xl border border-[#071224]/15 bg-white px-3.5 py-2.5 text-[14px] text-[#071224] placeholder:text-[#071224]/40 focus:border-[#D6AE4F]/50 focus:outline-none focus:ring-2 focus:ring-[#D6AE4F]/25 disabled:opacity-60";

export function MentorshipSupportModal({ open, onClose }: MentorshipSupportModalProps) {
  const titleId = useId();
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [situation, setSituation] = useState("");
  const [helpText, setHelpText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const submissionIdRef = useRef<string | null>(null);
  const formStartedAtRef = useRef<number | null>(null);
  const [honeypot, setHoneypot] = useState("");

  const handleClose = useCallback(() => {
    setFullName("");
    setEmail("");
    setPhone("");
    setSituation("");
    setHelpText("");
    setIsLoading(false);
    setErrorMessage(null);
    setSubmitted(false);
    submissionIdRef.current = null;
    formStartedAtRef.current = null;
    setHoneypot("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    formStartedAtRef.current = Date.now();
    initializeTrackingContext();
    trackEventOncePerSession("popup_opened", { popup_id: "mentorship_support" });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose]);

  useEffect(() => {
    if (!open || submitted) return;
    firstFieldRef.current?.focus();
  }, [open, submitted]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    const idempotencyKey = submissionIdRef.current ?? createTrackingUuid();
    submissionIdRef.current = idempotencyKey;
    const result = await captureMentorshipSupportLead({
      fullName,
      email,
      phone: phone.trim() || undefined,
      situation,
      helpText,
    }, getTrackingContext(), idempotencyKey, formStartedAtRef.current ?? 0, honeypot);

    setIsLoading(false);

    if (result.ok) {
      setSubmitted(true);
      return;
    }

    setErrorMessage(result.message);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto bg-[#0a1228]/55 px-4 py-6 backdrop-blur-sm sm:items-center sm:px-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div className="relative my-auto w-full max-w-[520px] overflow-hidden rounded-2xl border border-[#071224]/10 bg-white shadow-[0_24px_56px_rgba(7,18,36,0.18)]">
        <div className="flex items-start justify-between gap-3 border-b border-[#071224]/[0.06] bg-[#0f1a33] px-5 py-4">
          <h2
            id={titleId}
            className="pr-6 text-[17px] font-semibold leading-snug tracking-tight text-white sm:text-[18px]"
          >
            Solicita acompañamiento FlyPath
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/[0.08] text-white transition hover:border-white/35 hover:bg-white/[0.16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/55"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="max-h-[82vh] overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
          {submitted ? (
            <p
              role="status"
              className="rounded-xl border border-[#D6AE4F]/35 bg-[#D6AE4F]/10 px-4 py-3 text-[14px] font-medium leading-relaxed text-[#071224]"
            >
              {SUCCESS_MESSAGE}
            </p>
          ) : (
            <>
              <p className="text-[14px] leading-relaxed text-[#4B5563]">
                Cuéntanos brevemente tu situación y nos pondremos en contacto contigo para valorar
                cómo podemos ayudarte.
              </p>
              <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  name="website"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)}
                  className="sr-only"
                />
                <div>
                  <label htmlFor="mentorship-support-name" className="sr-only">
                    Nombre
                  </label>
                  <input
                    ref={firstFieldRef}
                    id="mentorship-support-name"
                    name="fullName"
                    type="text"
                    required
                    disabled={isLoading}
                    value={fullName}
                    onFocus={() => {
                      trackEventOncePerSession("form_started", { form_id: "mentorship_support" });
                    }}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Nombre"
                    className={FIELD_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="mentorship-support-email" className="sr-only">
                    Correo electrónico
                  </label>
                  <input
                    id="mentorship-support-email"
                    name="email"
                    type="email"
                    required
                    disabled={isLoading}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Email"
                    className={FIELD_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="mentorship-support-phone" className="sr-only">
                    Teléfono (opcional)
                  </label>
                  <input
                    id="mentorship-support-phone"
                    name="phone"
                    type="tel"
                    disabled={isLoading}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Teléfono (opcional)"
                    className={FIELD_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="mentorship-support-situation" className="sr-only">
                    Situación actual
                  </label>
                  <select
                    id="mentorship-support-situation"
                    name="situation"
                    required
                    disabled={isLoading}
                    value={situation}
                    onChange={(event) => setSituation(event.target.value)}
                    className={FIELD_CLASS}
                  >
                    <option value="" disabled>
                      Situación actual
                    </option>
                    {MENTORSHIP_SUPPORT_SITUATIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="mentorship-support-help" className="sr-only">
                    ¿En qué necesitas ayuda?
                  </label>
                  <textarea
                    id="mentorship-support-help"
                    name="helpText"
                    required
                    disabled={isLoading}
                    rows={4}
                    value={helpText}
                    onChange={(event) => setHelpText(event.target.value)}
                    placeholder="¿En qué necesitas ayuda?"
                    className={`${FIELD_CLASS} resize-y`}
                  />
                </div>
                {errorMessage ? (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-300/60 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700"
                  >
                    {errorMessage}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={isLoading}
                  aria-busy={isLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D6AE4F] px-4 py-2.5 text-[14px] font-semibold text-[#071224] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/45 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Enviando…
                    </>
                  ) : (
                    "Enviar solicitud"
                  )}
                </button>
              </form>
            </>
          )}

          <p className="mt-4 text-[12px] leading-relaxed text-[#071224]/50">
            Al enviar la solicitud, aceptas que FlyPath contacte contigo en relación con el servicio
            solicitado. Consulta la{" "}
            <Link
              href="/politica-de-privacidad"
              className="inline underline underline-offset-2 transition hover:text-[#071224]/70"
            >
              Política de Privacidad
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
