"use client";

import { useReducer, useState, type FormEvent } from "react";
import { CheckCircle2, KeyRound, Loader2, Mail } from "lucide-react";
import { requestFlyPathLoginOtp, verifyFlyPathLoginOtp } from "@/lib/auth/otp";

export type LoginOtpFormState =
  | { step: "request"; status: "idle" | "loading" | "error"; message: string | null }
  | { step: "verify"; status: "idle" | "loading" | "error" | "success"; message: string | null };

type LoginOtpFormAction =
  | { type: "request_started" }
  | { type: "request_succeeded" }
  | { type: "request_failed"; message: string }
  | { type: "verification_started" }
  | { type: "verification_succeeded" }
  | { type: "verification_failed"; message: string }
  | { type: "reset" };

export const initialLoginOtpFormState: LoginOtpFormState = {
  step: "request",
  status: "idle",
  message: null,
};

export function loginOtpFormReducer(
  _state: LoginOtpFormState,
  action: LoginOtpFormAction,
): LoginOtpFormState {
  switch (action.type) {
    case "request_started":
      return { step: "request", status: "loading", message: null };
    case "request_succeeded":
      return {
        step: "verify",
        status: "idle",
        message: "Te hemos enviado un código de acceso. Revisa tu correo.",
      };
    case "request_failed":
      return { step: "request", status: "error", message: action.message };
    case "verification_started":
      return { step: "verify", status: "loading", message: null };
    case "verification_succeeded":
      return {
        step: "verify",
        status: "success",
        message: "Sesión iniciada correctamente.",
      };
    case "verification_failed":
      return { step: "verify", status: "error", message: action.message };
    case "reset":
      return initialLoginOtpFormState;
  }
}

export function isLoginOtpFormSubmitting(state: LoginOtpFormState): boolean {
  return state.status === "loading";
}

export function isLoginOtpFormComplete(state: LoginOtpFormState): boolean {
  return state.step === "verify" && state.status === "success";
}

export function LoginOtpForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [state, dispatch] = useReducer(loginOtpFormReducer, initialLoginOtpFormState);
  const isSubmitting = isLoginOtpFormSubmitting(state);
  const isComplete = isLoginOtpFormComplete(state);
  const isVerifyStep = state.step === "verify";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || isComplete) return;

    if (!isVerifyStep) {
      dispatch({ type: "request_started" });
      const result = await requestFlyPathLoginOtp(email);

      if (result.ok) {
        dispatch({ type: "request_succeeded" });
        return;
      }

      dispatch({
        type: "request_failed",
        message:
          result.reason === "invalid_email"
            ? "Introduce un email válido."
            : "No hemos podido enviar el código. Inténtalo de nuevo.",
      });
      return;
    }

    dispatch({ type: "verification_started" });
    const result = await verifyFlyPathLoginOtp(email, code);

    if (result.ok) {
      dispatch({ type: "verification_succeeded" });
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
      <label className="block" htmlFor="login-email">
        <span className="text-sm font-medium text-slate-200">Email</span>
        <span className="relative mt-2 block">
          <Mail
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (state.step === "request" && state.status !== "idle") {
                dispatch({ type: "reset" });
              }
            }}
            disabled={isVerifyStep || isSubmitting}
            maxLength={320}
            aria-invalid={state.step === "request" && state.status === "error"}
            aria-describedby={state.message ? "login-otp-message" : undefined}
            placeholder="tu@email.com"
            className="min-h-11 w-full rounded-lg border border-white/12 bg-[#0a1529] py-2.5 pl-10 pr-3.5 text-[15px] text-white outline-none transition placeholder:text-slate-500 focus:border-[#d6ae4f]/70 focus:ring-2 focus:ring-[#d6ae4f]/20 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </span>
      </label>

      {isVerifyStep ? (
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
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={isSubmitting || isComplete}
              maxLength={6}
              pattern="[0-9]{6}"
              required
              aria-invalid={state.status === "error"}
              aria-describedby={state.message ? "login-otp-message" : undefined}
              placeholder="123456"
              className="min-h-11 w-full rounded-lg border border-white/12 bg-[#0a1529] py-2.5 pl-10 pr-3.5 text-[15px] tracking-[0.24em] text-white outline-none transition placeholder:tracking-normal placeholder:text-slate-500 focus:border-[#d6ae4f]/70 focus:ring-2 focus:ring-[#d6ae4f]/20 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </span>
        </label>
      ) : null}

      {state.message ? (
        <p
          id="login-otp-message"
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "success" || (state.step === "verify" && state.status === "idle")
              ? "flex items-start gap-2 rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-3.5 py-2.5 text-sm leading-6 text-emerald-50"
              : "rounded-lg border border-rose-300/20 bg-rose-400/10 px-3.5 py-2.5 text-sm leading-6 text-rose-100"
          }
        >
          {state.status === "success" || (state.step === "verify" && state.status === "idle") ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          ) : null}
          {state.message}
        </p>
      ) : null}

      <button
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#d6ae4f] px-4 py-2.5 text-sm font-semibold text-[#0d1930] transition hover:bg-[#e3be63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1d485]/70 disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={isSubmitting || isComplete}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {isSubmitting ? "Comprobando código..." : isVerifyStep ? "Verificar código" : "Continuar"}
      </button>
    </form>
  );
}
