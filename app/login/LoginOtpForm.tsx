"use client";

import { useReducer, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { requestFlyPathLoginOtp } from "@/lib/auth/otp";

export type LoginOtpFormState =
  | { status: "idle"; message: null }
  | { status: "loading"; message: null }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type LoginOtpFormAction =
  | { type: "submit" }
  | { type: "success" }
  | { type: "error"; message: string }
  | { type: "reset" };

export const initialLoginOtpFormState: LoginOtpFormState = { status: "idle", message: null };

export function loginOtpFormReducer(
  _state: LoginOtpFormState,
  action: LoginOtpFormAction,
): LoginOtpFormState {
  switch (action.type) {
    case "submit":
      return { status: "loading", message: null };
    case "success":
      return {
        status: "success",
        message: "Te hemos enviado un código de acceso. Revisa tu correo.",
      };
    case "error":
      return { status: "error", message: action.message };
    case "reset":
      return initialLoginOtpFormState;
  }
}

export function isLoginOtpFormSubmitting(state: LoginOtpFormState): boolean {
  return state.status === "loading";
}

export function LoginOtpForm() {
  const [email, setEmail] = useState("");
  const [state, dispatch] = useReducer(loginOtpFormReducer, initialLoginOtpFormState);
  const isSubmitting = isLoginOtpFormSubmitting(state);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    dispatch({ type: "submit" });

    const result = await requestFlyPathLoginOtp(email);

    if (result.ok) {
      dispatch({ type: "success" });
      return;
    }

    dispatch({
      type: "error",
      message:
        result.reason === "invalid_email"
          ? "Introduce un email válido."
          : "No hemos podido enviar el código. Inténtalo de nuevo.",
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
              if (state.status !== "idle") {
                dispatch({ type: "reset" });
              }
            }}
            disabled={isSubmitting}
            maxLength={320}
            aria-invalid={state.status === "error"}
            aria-describedby={state.message ? "login-otp-message" : undefined}
            placeholder="tu@email.com"
            className="min-h-11 w-full rounded-lg border border-white/12 bg-[#0a1529] py-2.5 pl-10 pr-3.5 text-[15px] text-white outline-none transition placeholder:text-slate-500 focus:border-[#d6ae4f]/70 focus:ring-2 focus:ring-[#d6ae4f]/20 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </span>
      </label>

      {state.message ? (
        <p
          id="login-otp-message"
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "success"
              ? "flex items-start gap-2 rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-3.5 py-2.5 text-sm leading-6 text-emerald-50"
              : "rounded-lg border border-rose-300/20 bg-rose-400/10 px-3.5 py-2.5 text-sm leading-6 text-rose-100"
          }
        >
          {state.status === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : null}
          {state.message}
        </p>
      ) : null}

      <button
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#d6ae4f] px-4 py-2.5 text-sm font-semibold text-[#0d1930] transition hover:bg-[#e3be63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1d485]/70 disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {isSubmitting ? "Enviando código..." : "Continuar"}
      </button>
    </form>
  );
}
