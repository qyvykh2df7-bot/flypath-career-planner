"use client";

import { useState } from "react";

type VerificationStatus = "idle" | "verifying" | "verified" | "invalid" | "error";

export function ReviewEmailVerification({ token }: { token: string | null }) {
  const [status, setStatus] = useState<VerificationStatus>(token ? "idle" : "invalid");

  const verify = async () => {
    if (!token) return;
    setStatus("verifying");
    try {
      const response = await fetch("/api/school-reviews/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = await response.json() as { status?: string };
      if (response.ok && (result.status === "verified" || result.status === "already_verified")) {
        setStatus("verified");
      } else {
        setStatus("invalid");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] px-5 py-16 text-[#0f1a33]">
      <section className="mx-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a5a16]">Opiniones verificadas</p>
        <h1 className="mt-2 text-2xl font-semibold">Verifica tu opinión</h1>
        {status === "verified" ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
            Tu email ha quedado verificado. La opinión pasa ahora a revisión.
          </p>
        ) : status === "invalid" ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Este enlace no es válido o ha caducado. Puedes volver al formulario para solicitar otro enlace.
          </p>
        ) : status === "error" ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900">
            No hemos podido verificar la opinión ahora mismo. Inténtalo de nuevo en unos minutos.
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm leading-6 text-slate-600">Confirma que quieres enviar tu opinión a revisión.</p>
            <button
              type="button"
              onClick={verify}
              disabled={status === "verifying"}
              className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55 disabled:cursor-wait disabled:opacity-70"
            >
              {status === "verifying" ? "Verificando..." : "Verificar opinión"}
            </button>
          </>
        )}
      </section>
    </main>
  );
}
