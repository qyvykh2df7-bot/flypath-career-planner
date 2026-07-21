"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, LoaderCircle, X } from "lucide-react";
import { CAREER_PLANNER_PREMIUM_SNAPSHOT_MAX_SIZE, CAREER_PLANNER_PREMIUM_SNAPSHOT_STORAGE_KEY } from "@/lib/commerce/career-planner-report-snapshot";
import {
  canCloseCareerPlannerCheckoutConfirmation,
  parseCareerPlannerCheckoutPresentationStatus,
  shouldPollCareerPlannerCheckoutConfirmation,
  type CareerPlannerCheckoutPresentationStatus,
} from "@/lib/commerce/checkout-confirmation";

type PresentationStatus = CareerPlannerCheckoutPresentationStatus;

const POLL_INTERVAL_MS = 2_500;
const MAX_AUTOMATIC_POLLS = 12;

function readStoredSnapshot(): unknown | null {
  try {
    const stored = window.sessionStorage.getItem(CAREER_PLANNER_PREMIUM_SNAPSHOT_STORAGE_KEY);
    if (!stored || stored.length > CAREER_PLANNER_PREMIUM_SNAPSHOT_MAX_SIZE) return null;
    return JSON.parse(stored) as unknown;
  } catch {
    return null;
  }
}

export function CareerPlannerCheckoutConfirmationModal({ sessionId }: { sessionId: string | null }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<PresentationStatus>("verifying");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const verifyAndReadStatus = useCallback(async (): Promise<PresentationStatus> => {
    if (!sessionId) return "expired";

    const access = await fetch("/api/commerce/checkout/access", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    if (!access.ok) return "delayed";

    const response = await fetch("/api/commerce/checkout/status", { cache: "no-store" });
    const payload: unknown = await response.json().catch(() => null);
    const nextStatus = typeof payload === "object" && payload !== null && "status" in payload
      ? (payload as { status?: unknown }).status
      : null;
    const parsedStatus = parseCareerPlannerCheckoutPresentationStatus(nextStatus);
    return response.ok && parsedStatus ? parsedStatus : "delayed";
  }, [sessionId]);

  useEffect(() => {
    let disposed = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let polls = 0;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();

    const poll = async () => {
      const nextStatus = await verifyAndReadStatus().catch(() => "delayed" as const);
      if (disposed) return;
      setStatus(nextStatus);
      if (shouldPollCareerPlannerCheckoutConfirmation(nextStatus, polls, MAX_AUTOMATIC_POLLS)) {
        polls += 1;
        timeout = setTimeout(() => void poll(), POLL_INTERVAL_MS);
      } else if (nextStatus === "verifying") {
        setStatus("delayed");
      }
    };

    void poll();
    return () => {
      disposed = true;
      if (timeout) clearTimeout(timeout);
      previousFocus?.focus();
    };
  }, [verifyAndReadStatus]);

  const close = () => {
    if (!canCloseCareerPlannerCheckoutConfirmation(status)) return;
    window.location.assign("/career-planner");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      if (status !== "verifying") close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const retry = async () => {
    setStatus("verifying");
    const nextStatus = await verifyAndReadStatus().catch(() => "delayed" as const);
    setStatus(nextStatus);
  };

  const download = async () => {
    const snapshot = readStoredSnapshot();
    if (!snapshot) {
      setDownloadError("No encontramos este informe en el navegador. Vuelve a Career Planner para generarlo de nuevo.");
      return;
    }

    setIsDownloading(true);
    setDownloadError(null);
    try {
      const response = await fetch("/api/commerce/checkout/download", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ snapshot }),
      });
      if (!response.ok) throw new Error("Download unavailable");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "flypath-career-report.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError("No hemos podido preparar el informe. Puedes volver a intentarlo.");
    } finally {
      setIsDownloading(false);
    }
  };

  const isVerifying = status === "verifying";
  const title = status === "confirmed"
    ? "Pago confirmado"
    : status === "failed"
      ? "No se ha confirmado el pago"
      : status === "expired"
        ? "Esta comprobación ya no está disponible"
        : "Estamos verificando tu pago";
  const copy = status === "confirmed"
    ? "Tu informe premium ya está disponible para descargar."
    : status === "failed"
      ? "No se ha realizado ningún cargo confirmado. Puedes volver a intentarlo desde Career Planner."
      : status === "expired"
        ? "Vuelve a Career Planner para iniciar una nueva compra."
        : status === "delayed"
          ? "La confirmación está tardando un poco más de lo habitual. Puedes reintentar la comprobación."
          : "Confirmamos el pago de forma segura antes de habilitar el informe.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f1a33] px-6 py-12 text-white">
      <div className="fixed inset-0 bg-black/55" aria-hidden />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="career-checkout-title"
        aria-describedby="career-checkout-description"
        aria-live="polite"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="relative z-10 w-full max-w-lg rounded-xl border border-white/10 bg-[#16223f] p-7 shadow-[0_16px_48px_rgba(0,0,0,0.28)] outline-none sm:p-9"
      >
        {!isVerifying ? (
          <button type="button" onClick={close} className="absolute right-4 top-4 rounded-md p-2 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Cerrar">
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d6ae4f]">Career Planner Premium</p>
        <h1 id="career-checkout-title" className="mt-3 text-2xl font-semibold">{title}</h1>
        <p id="career-checkout-description" className="mt-3 text-sm leading-6 text-slate-300">{copy}</p>

        {isVerifying ? <LoaderCircle className="mt-6 h-5 w-5 animate-spin text-[#d6ae4f]" aria-label="Verificando pago" /> : null}
        {status === "confirmed" ? (
          <div className="mt-7 space-y-3">
            <button type="button" onClick={() => void download()} disabled={isDownloading} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#d6ae4f] px-4 py-2 text-sm font-bold text-[#101b35] hover:brightness-105 disabled:cursor-wait disabled:opacity-70">
              <Download className="h-4 w-4" aria-hidden />
              {isDownloading ? "Preparando informe…" : "Descargar informe"}
            </button>
            {downloadError ? <p className="text-sm text-rose-200" role="alert">{downloadError}</p> : null}
          </div>
        ) : null}
        {status === "delayed" || status === "failed" ? (
          <button type="button" onClick={() => void retry()} className="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#d6ae4f]/60 px-4 py-2 text-sm font-semibold text-[#f2ddaa] hover:border-[#d6ae4f]">
            Reintentar comprobación
          </button>
        ) : null}
        {!isVerifying ? <button type="button" onClick={close} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-white/30">Volver a Career Planner</button> : null}
      </section>
    </main>
  );
}
