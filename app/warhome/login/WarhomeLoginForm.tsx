"use client";

import { useActionState } from "react";
import { LockKeyhole } from "lucide-react";
import { loginWarhome, type WarhomeLoginState } from "@/lib/warhome/actions";

const initialWarhomeLoginState: WarhomeLoginState = { error: null };

export function WarhomeLoginForm() {
  const [state, formAction, isPending] = useActionState(loginWarhome, initialWarhomeLoginState);

  return (
    <form action={formAction} className="mt-8 space-y-5" noValidate>
      <label className="block">
        <span className="text-sm font-medium text-slate-200">Email</span>
        <input
          className="mt-2 min-h-11 w-full rounded-lg border border-white/12 bg-[#0a1529] px-3.5 py-2.5 text-[15px] text-white outline-none transition placeholder:text-slate-500 focus:border-[#d6ae4f]/70 focus:ring-2 focus:ring-[#d6ae4f]/20"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-200">Contraseña</span>
        <input
          className="mt-2 min-h-11 w-full rounded-lg border border-white/12 bg-[#0a1529] px-3.5 py-2.5 text-[15px] text-white outline-none transition placeholder:text-slate-500 focus:border-[#d6ae4f]/70 focus:ring-2 focus:ring-[#d6ae4f]/20"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {state.error ? (
        <p className="rounded-md border border-rose-300/20 bg-rose-400/10 px-3.5 py-2.5 text-sm text-rose-100" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#d6ae4f] px-4 py-2.5 text-sm font-semibold text-[#0d1930] transition hover:bg-[#e3be63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1d485]/70 disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={isPending}
      >
        <LockKeyhole className="h-4 w-4" aria-hidden />
        {isPending ? "Comprobando acceso..." : "Acceder"}
      </button>
    </form>
  );
}
