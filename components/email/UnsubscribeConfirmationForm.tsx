"use client";

import { useState, type FormEvent } from "react";

type UnsubscribeConfirmationFormProps = {
  token: string;
};

export function UnsubscribeConfirmationForm({ token }: UnsubscribeConfirmationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || completed) return;

    setIsSubmitting(true);
    setError(false);

    try {
      const response = await fetch("/api/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok && response.status !== 400 && response.status !== 413) {
        throw new Error("unsubscribe request failed");
      }

      setCompleted(true);
    } catch {
      setError(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (completed) {
    return <p role="status" className="text-sm leading-6 text-slate-300">Tu preferencia de email ha sido actualizada.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#d6ae4f] px-4 text-sm font-semibold text-[#081426] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ae4f]/50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Actualizando…" : "Confirmar baja"}
      </button>
      {error ? <p role="alert" className="mt-3 text-sm text-slate-400">No se ha podido actualizar la preferencia. Inténtalo de nuevo.</p> : null}
    </form>
  );
}
