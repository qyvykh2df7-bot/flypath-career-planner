"use client";

import { useState } from "react";

export function MarketingConfirmationForm({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "complete" | "error">("idle");

  async function confirm() {
    if (status === "loading" || status === "complete") return;
    setStatus("loading");
    try {
      const response = await fetch("/api/email/confirm-marketing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setStatus(response.ok ? "complete" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "complete") {
    return <p role="status" className="mt-5 rounded-lg border border-[#d6ae4f]/35 bg-[#d6ae4f]/10 px-4 py-3 text-sm text-white">Tu suscripción ha quedado confirmada.</p>;
  }
  return (
    <div className="mt-5">
      <button type="button" onClick={confirm} disabled={status === "loading"} className="rounded-lg bg-[#d6ae4f] px-4 py-2.5 text-sm font-semibold text-[#081426] disabled:opacity-70">
        {status === "loading" ? "Confirmando…" : "Confirmar suscripción"}
      </button>
      {status === "error" ? <p role="alert" className="mt-3 text-sm text-rose-200">No hemos podido confirmar la suscripción ahora mismo. Inténtalo de nuevo.</p> : null}
    </div>
  );
}
