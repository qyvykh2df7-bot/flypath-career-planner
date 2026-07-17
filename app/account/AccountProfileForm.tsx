"use client";

import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";
import {
  initialUpdateFlyPathProfileNameState,
  updateFlyPathProfileName,
} from "./actions";

type AccountProfileFormProps = {
  email: string | null;
  fullName: string | null;
};

export function AccountProfileForm({ email, fullName }: AccountProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateFlyPathProfileName,
    initialUpdateFlyPathProfileNameState,
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <label className="block" htmlFor="account-full-name">
        <span className="text-sm font-medium text-slate-800">Nombre visible</span>
        <input
          id="account-full-name"
          name="full_name"
          type="text"
          autoComplete="name"
          defaultValue={fullName ?? ""}
          maxLength={120}
          required
          className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-[#0f1a33] outline-none transition placeholder:text-slate-400 focus:border-[#a5802a] focus:ring-2 focus:ring-[#c9a454]/20"
          placeholder="Tu nombre"
        />
      </label>

      <label className="block" htmlFor="account-email">
        <span className="text-sm font-medium text-slate-800">Email</span>
        <input
          id="account-email"
          type="email"
          value={email ?? "Email no disponible"}
          readOnly
          aria-readonly="true"
          className="mt-2 min-h-11 w-full cursor-default rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[15px] text-slate-600 outline-none"
        />
      </label>

      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "success"
              ? "rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800"
              : "rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800"
          }
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#0f1a33] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#182545] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
        {isPending ? "Guardando..." : "Guardar nombre"}
      </button>
    </form>
  );
}
