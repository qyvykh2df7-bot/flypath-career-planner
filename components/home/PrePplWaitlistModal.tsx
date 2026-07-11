"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import { capturePrepplWaitlistLead } from "@/lib/leads/capture-preppl-waitlist-client";

type PrePplWaitlistModalProps = {
  open: boolean;
  onClose: () => void;
};

const SUCCESS_MESSAGE =
  "Gracias. Te avisaremos con novedades y acceso anticipado cuando Pre-PPL esté disponible.";

export function PrePplWaitlistModal({ open, onClose }: PrePplWaitlistModalProps) {
  const titleId = useId();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleClose = useCallback(() => {
    setEmail("");
    setIsLoading(false);
    setErrorMessage(null);
    setSubmitted(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    const result = await capturePrepplWaitlistLead(email);

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
      <div className="relative my-auto w-full max-w-[440px] overflow-hidden rounded-2xl border border-[#071224]/10 bg-white shadow-[0_24px_56px_rgba(7,18,36,0.18)]">
        <div className="flex items-start justify-between gap-3 border-b border-[#071224]/[0.06] bg-[#0f1a33] px-5 py-4">
          <h2
            id={titleId}
            className="pr-6 text-[17px] font-semibold leading-snug tracking-tight text-white sm:text-[18px]"
          >
            Únete a la lista de espera de Pre-PPL
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

        <div className="px-5 py-5 sm:px-6 sm:py-6">
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
                Sé de los primeros en conocer el lanzamiento y recibir novedades, avances y acceso
                anticipado.
              </p>
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div>
                  <label htmlFor="preppl-waitlist-email" className="sr-only">
                    Correo electrónico
                  </label>
                  <input
                    id="preppl-waitlist-email"
                    name="email"
                    type="email"
                    required
                    disabled={isLoading}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="tu@email.com"
                    className="w-full rounded-xl border border-[#071224]/15 bg-white px-3.5 py-2.5 text-[14px] text-[#071224] placeholder:text-[#071224]/40 focus:border-[#D6AE4F]/50 focus:outline-none focus:ring-2 focus:ring-[#D6AE4F]/25 disabled:opacity-60"
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
                    "Unirme a la lista"
                  )}
                </button>
              </form>
            </>
          )}

          <p className="mt-4 text-[12px] leading-relaxed text-[#071224]/50">
            Al unirte, aceptas recibir emails de FlyPath. Puedes darte de baja en cualquier momento.
            Consulta la{" "}
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
