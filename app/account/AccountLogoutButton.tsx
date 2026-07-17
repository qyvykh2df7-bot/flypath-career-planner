"use client";

import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOutFlyPath } from "@/lib/auth/client";

export function AccountLogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function handleLogout() {
    if (isPending) return;

    setIsPending(true);
    setHasError(false);
    const signedOut = await signOutFlyPath();

    if (signedOut) {
      router.replace("/");
      router.refresh();
      return;
    }

    setIsPending(false);
    setHasError(true);
  }

  return (
    <div className="space-y-3">
      {hasError ? (
        <p className="text-sm text-rose-700" role="alert">
          No hemos podido cerrar la sesión. Inténtalo de nuevo.
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleLogout}
        disabled={isPending}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <LogOut className="h-4 w-4" aria-hidden />}
        {isPending ? "Cerrando sesión..." : "Cerrar sesión"}
      </button>
    </div>
  );
}
