"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { PRE_PPL_GUIDE_CHECKOUT_KEY, isStripeCheckoutUrl } from "@/lib/commerce/checkout";
import { createTrackingCtaMetadata, trackCtaClicked } from "@/lib/tracking/client";

const CHECKOUT_ERROR_MESSAGE = "No hemos podido abrir el pago. Inténtalo de nuevo.";

export function PrePplDigitalCheckoutButton({ className, label }: { className: string; label: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const startCheckout = async () => {
    if (status === "loading") return;
    setStatus("loading");
    const metadata = createTrackingCtaMetadata("preppl_digital_checkout");
    if (metadata) trackCtaClicked(metadata);
    try {
      const response = await fetch("/api/commerce/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productKey: PRE_PPL_GUIDE_CHECKOUT_KEY }),
      });
      const payload: unknown = await response.json().catch(() => null);
      const url = typeof payload === "object" && payload !== null && "url" in payload
        ? (payload as { url?: unknown }).url
        : null;
      if (!response.ok || !isStripeCheckoutUrl(url)) throw new Error("Checkout unavailable");
      window.location.assign(url);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div>
      <button type="button" onClick={startCheckout} disabled={status === "loading"} className={className}>
        <Lock className="h-4 w-4 shrink-0" aria-hidden />
        {status === "loading" ? "Abriendo pago..." : label}
      </button>
      {status === "error" ? <p className="mt-2 text-sm text-rose-700" role="alert">{CHECKOUT_ERROR_MESSAGE}</p> : null}
    </div>
  );
}
