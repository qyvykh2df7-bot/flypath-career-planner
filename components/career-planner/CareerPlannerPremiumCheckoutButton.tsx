"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import {
  CAREER_PLANNER_PREMIUM_CHECKOUT_KEY,
  isStripeCheckoutUrl,
} from "@/lib/commerce/checkout";

const CHECKOUT_ERROR_MESSAGE = "No hemos podido abrir el pago. Inténtalo de nuevo.";

export function CareerPlannerPremiumCheckoutButton({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const startCheckout = async () => {
    if (status === "loading") return;
    setStatus("loading");

    try {
      const result = await fetch("/api/commerce/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productKey: CAREER_PLANNER_PREMIUM_CHECKOUT_KEY }),
      });
      const payload: unknown = await result.json().catch(() => null);
      const url =
        typeof payload === "object" && payload !== null && "url" in payload
          ? (payload as { url?: unknown }).url
          : null;

      if (!result.ok || !isStripeCheckoutUrl(url)) throw new Error("Checkout unavailable");
      window.location.assign(url);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={startCheckout}
        disabled={status === "loading"}
        className={className}
      >
        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {status === "loading" ? "Abriendo pago…" : label}
      </button>
      {status === "error" ? <p className="mt-2 text-xs text-rose-300">{CHECKOUT_ERROR_MESSAGE}</p> : null}
    </div>
  );
}
