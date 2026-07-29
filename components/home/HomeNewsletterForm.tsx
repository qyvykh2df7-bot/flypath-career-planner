"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { captureHomeNewsletterLead } from "@/lib/leads/capture-home-newsletter-client";
import { HOME_NEWSLETTER_MARKETING_CONSENT_TEXT } from "@/lib/leads/home-newsletter-consent";
import { trackEventOncePerSession } from "@/lib/tracking/client";
import {
  createTrackingUuid,
  getTrackingContext,
  initializeTrackingContext,
} from "@/lib/tracking/session";

type HomeNewsletterFormProps = {
  variant?: "light" | "dark";
};

export function HomeNewsletterForm({ variant = "light" }: HomeNewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const subscriptionEventIdRef = useRef<string | null>(null);
  const formStartedAtRef = useRef<number | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const isDark = variant === "dark";

  useEffect(() => {
    initializeTrackingContext();
    formStartedAtRef.current = Date.now();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    const idempotencyKey = subscriptionEventIdRef.current ?? createTrackingUuid();
    subscriptionEventIdRef.current = idempotencyKey;
    const result = await captureHomeNewsletterLead(
      email,
      getTrackingContext(),
      idempotencyKey,
      formStartedAtRef.current ?? 0,
      honeypot,
    );

    setIsLoading(false);

    if (result.ok) {
      setSubmitted(true);
      return;
    }

    setErrorMessage(result.message);
  }

  if (submitted) {
    return (
      <p
        role="status"
        className={
          isDark
            ? "rounded-xl border border-[#D6AE4F]/35 bg-[#D6AE4F]/12 px-5 py-4 text-[14px] font-semibold text-white"
            : "rounded-2xl border border-[#D6AE4F]/35 bg-[#D6AE4F]/10 px-5 py-4 text-[14px] font-semibold text-[#071224]"
        }
      >
        Revisa tu correo para confirmar la suscripción.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
      <input
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        name="website"
        value={honeypot}
        onChange={(event) => setHoneypot(event.target.value)}
        className="sr-only"
      />
      <div
        className={
          isDark
            ? "flex items-stretch gap-2 rounded-xl border border-white/14 bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.18)] focus-within:border-[#D6AE4F]/45 focus-within:ring-2 focus-within:ring-[#D6AE4F]/20"
            : "flex items-stretch gap-2 rounded-2xl border border-[#071224]/15 bg-white p-1.5 shadow-[0_10px_28px_rgba(7,18,36,0.06)] focus-within:border-[#D6AE4F]/50 focus-within:ring-2 focus-within:ring-[#D6AE4F]/25"
        }
      >
        <label htmlFor="home-newsletter-email" className="sr-only">
          Correo electrónico
        </label>
        <input
          id="home-newsletter-email"
          name="email"
          type="email"
          required
          disabled={isLoading}
          value={email}
          onFocus={() => {
            trackEventOncePerSession("form_started", { form_id: "home_newsletter" });
          }}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@email.com"
          className={
            isDark
              ? "min-w-0 flex-1 rounded-lg bg-transparent px-3 py-2.5 text-[14px] text-[#071224] placeholder:text-[#071224]/45 focus:outline-none disabled:opacity-60"
              : "min-w-0 flex-1 rounded-xl bg-transparent px-3.5 py-2.5 text-[14px] text-[#071224] placeholder:text-[#071224]/40 focus:outline-none disabled:opacity-60"
          }
        />
        <button
          type="submit"
          disabled={isLoading}
          aria-label="Suscribirme a la newsletter"
          aria-busy={isLoading}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D6AE4F] text-[#071224] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/45 disabled:cursor-not-allowed disabled:opacity-70 sm:h-11 sm:w-11 sm:rounded-xl"
        >
          {isLoading ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden />
          ) : (
            <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
          )}
        </button>
      </div>
      {errorMessage ? (
        <p
          role="alert"
          className={
            isDark
              ? "rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-2 text-[12px] font-medium text-red-100"
              : "rounded-lg border border-red-300/60 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700"
          }
        >
          {errorMessage}
        </p>
      ) : null}
      <p
        className={
          isDark
            ? "inline-flex items-center gap-1.5 text-[12px] leading-relaxed text-white/55"
            : "text-[12px] leading-relaxed text-[#071224]/50"
        }
      >
        {isDark ? <Check className="h-3 w-3 shrink-0 text-white/85" aria-hidden /> : null}
        <span>
          {HOME_NEWSLETTER_MARKETING_CONSENT_TEXT} Consulta la{" "}
          <Link
            href="/politica-de-privacidad"
            className={
              isDark
                ? "inline underline underline-offset-2 transition hover:text-white/85"
                : "inline underline underline-offset-2 transition hover:text-[#071224]/70"
            }
          >
            Política de Privacidad
          </Link>
          .
        </span>
      </p>
    </form>
  );
}
