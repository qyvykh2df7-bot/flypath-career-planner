"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import {
  CAREER_PLANNER_PREMIUM_CHECKOUT_KEY,
  isStripeCheckoutUrl,
} from "@/lib/commerce/checkout";
import {
  CAREER_PLANNER_PREMIUM_SNAPSHOT_MAX_SIZE,
  CAREER_PLANNER_PREMIUM_SNAPSHOT_STORAGE_KEY,
} from "@/lib/commerce/career-planner-report-snapshot";
import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";

const CHECKOUT_ERROR_MESSAGE = "No hemos podido abrir el pago. Inténtalo de nuevo.";

export function CareerPlannerPremiumCheckoutButton({
  className,
  label,
  reportSnapshot,
}: {
  className: string;
  label: string;
  reportSnapshot?: ReportSnapshotV1;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const startCheckout = async () => {
    if (status === "loading") return;
    setStatus("loading");

    try {
      if (reportSnapshot) {
        const serializedSnapshot = JSON.stringify(reportSnapshot);
        if (serializedSnapshot.length <= CAREER_PLANNER_PREMIUM_SNAPSHOT_MAX_SIZE) {
          try {
            window.sessionStorage.setItem(CAREER_PLANNER_PREMIUM_SNAPSHOT_STORAGE_KEY, serializedSnapshot);
          } catch {
            // Checkout stays available. The return screen can explain that the
            // local report snapshot was not retained for this browser.
          }
        }
      }
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
