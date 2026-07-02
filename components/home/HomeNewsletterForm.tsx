"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check } from "lucide-react";

type HomeNewsletterFormProps = {
  variant?: "light" | "dark";
};

export function HomeNewsletterForm({ variant = "light" }: HomeNewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const isDark = variant === "dark";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    // Placeholder: pendiente de conectar con proveedor de email real.
    setSubmitted(true);
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
        Gracias. Te avisaremos con recursos útiles para tu ruta.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
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
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@email.com"
          className={
            isDark
              ? "min-w-0 flex-1 rounded-lg bg-transparent px-3 py-2.5 text-[14px] text-[#071224] placeholder:text-[#071224]/45 focus:outline-none"
              : "min-w-0 flex-1 rounded-xl bg-transparent px-3.5 py-2.5 text-[14px] text-[#071224] placeholder:text-[#071224]/40 focus:outline-none"
          }
        />
        <button
          type="submit"
          aria-label="Suscribirme a la newsletter"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D6AE4F] text-[#071224] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/45 sm:h-11 sm:w-11 sm:rounded-xl"
        >
          <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
        </button>
      </div>
      <p
        className={
          isDark
            ? "inline-flex items-center gap-1.5 text-[12px] leading-relaxed text-white/55"
            : "text-[12px] leading-relaxed text-[#071224]/50"
        }
      >
        {isDark ? <Check className="h-3 w-3 shrink-0 text-white/85" aria-hidden /> : null}
        Sin spam. Cancela cuando quieras.
      </p>
    </form>
  );
}
