"use client";

import Link from "next/link";
import { useEffect, useReducer, useState, type FormEvent } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createFlyPathLoginHref,
  getSafeFlyPathLoginNext,
} from "@/lib/auth/login-navigation";
import { verifyFlyPathLoginOtp } from "@/lib/auth/otp";
import {
  clearPendingFlyPathOtpEmail,
  getPendingFlyPathOtpEmail,
} from "@/lib/auth/pending-otp";
import { bootstrapFlyPathIdentityAfterOtp } from "./actions";

export type LoginOtpVerifyFormState =
  | { status: "checking" | "idle" | "loading" | "success"; message: null }
  | { status: "missing" | "error"; message: string };

type LoginOtpVerifyFormAction =
  | { type: "email_loaded" }
  | { type: "email_missing" }
  | { type: "verification_started" }
  | { type: "verification_succeeded" }
  | { type: "verification_failed"; message: string };

export const initialLoginOtpVerifyFormState: LoginOtpVerifyFormState = {
  status: "checking",
  message: null,
};

export function loginOtpVerifyFormReducer(
  _state: LoginOtpVerifyFormState,
  action: LoginOtpVerifyFormAction,
): LoginOtpVerifyFormState {
  switch (action.type) {
    case "email_loaded":
      return { status: "idle", message: null };
    case "email_missing":
      return {
        status: "missing",
        message: "Solicita un nuevo código para continuar.",
      };
    case "verification_started":
      return { status: "loading", message: null };
    case "verification_succeeded":
      return { status: "success", message: null };
    case "verification_failed":
      return { status: "error", message: action.message };
  }
}

export function isLoginOtpVerifySubmitting(state: LoginOtpVerifyFormState): boolean {
  return state.status === "loading";
}

type LoginOtpVerifyFormProps = {
  nextPath: string;
};

export function getLoginOtpRecoveryHref(nextPath: string | string[] | undefined): string {
  return createFlyPathLoginHref(nextPath);
}

export function LoginOtpVerifyForm({ nextPath }: LoginOtpVerifyFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [state, dispatch] = useReducer(loginOtpVerifyFormReducer, initialLoginOtpVerifyFormState);
  const isSubmitting = isLoginOtpVerifySubmitting(state);
  const isUnavailable = state.status === "checking" || state.status === "missing";

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (!active) return;
      const pendingEmail = getPendingFlyPathOtpEmail();
      setEmail(pendingEmail);
      dispatch({ type: pendingEmail ? "email_loaded" : "email_missing" });
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email || isSubmitting || isUnavailable) return;

    dispatch({ type: "verification_started" });
    const result = await verifyFlyPathLoginOtp(email, code);

    if (result.ok) {
      clearPendingFlyPathOtpEmail();
      await bootstrapFlyPathIdentityAfterOtp().catch(() => undefined);
      dispatch({ type: "verification_succeeded" });
      router.replace(getSafeFlyPathLoginNext(nextPath));
      return;
    }

    dispatch({
      type: "verification_failed",
      message:
        result.reason === "invalid_code"
          ? "Introduce un código válido de 6 dígitos."
          : "No hemos podido verificar el código. Inténtalo de nuevo.",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
      <label className="block" htmlFor="login-otp-code">
        <span className="text-sm font-medium text-slate-200">Código de acceso</span>
        <span className="relative mt-2 block">
          <KeyRound
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            id="login-otp-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
            }}
            disabled={isUnavailable || isSubmitting || state.status === "success"}
            maxLength={6}
            pattern="[0-9]{6}"
            required
            aria-invalid={state.status === "error"}
            aria-describedby={state.message ? "login-verify-message" : undefined}
            placeholder="123456"
            className="min-h-11 w-full rounded-lg border border-white/12 bg-[#0a1529] py-2.5 pl-10 pr-3.5 text-[15px] tracking-[0.24em] text-white outline-none transition placeholder:tracking-normal placeholder:text-slate-500 focus:border-[#d6ae4f]/70 focus:ring-2 focus:ring-[#d6ae4f]/20 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </span>
      </label>

      {state.status === "checking" ? (
        <p className="text-sm leading-6 text-slate-300" role="status">
          Preparando la verificación...
        </p>
      ) : null}

      {state.message ? (
        <p
          id="login-verify-message"
          role={state.status === "error" || state.status === "missing" ? "alert" : "status"}
          className="rounded-lg border border-rose-300/20 bg-rose-400/10 px-3.5 py-2.5 text-sm leading-6 text-rose-100"
        >
          {state.message}
        </p>
      ) : null}

      {state.status === "missing" ? (
        <Link
          href={getLoginOtpRecoveryHref(nextPath)}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#d6ae4f] px-4 py-2.5 text-sm font-semibold text-[#0d1930] transition hover:bg-[#e3be63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1d485]/70"
        >
          Solicitar un nuevo código
        </Link>
      ) : (
        <button
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#d6ae4f] px-4 py-2.5 text-sm font-semibold text-[#0d1930] transition hover:bg-[#e3be63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1d485]/70 disabled:cursor-not-allowed disabled:opacity-70"
          type="submit"
          disabled={isUnavailable || isSubmitting || state.status === "success"}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {isSubmitting ? "Verificando código..." : "Verificar código"}
        </button>
      )}
    </form>
  );
}
