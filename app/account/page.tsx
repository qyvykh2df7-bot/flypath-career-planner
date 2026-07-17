import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";
import { bootstrapFlyPathIdentity } from "@/lib/account/bootstrap";
import { getFlyPathAccountProfile } from "@/lib/account/profile";
import { createFlyPathLoginHref } from "@/lib/auth/login-navigation";
import { getFlyPathSessionState } from "@/lib/auth/session";
import { AccountLogoutButton } from "./AccountLogoutButton";
import { AccountProfileForm } from "./AccountProfileForm";

export const metadata: Metadata = {
  title: "Mi cuenta | FlyPath",
  robots: { index: false, follow: false },
};

function AccountUnavailable() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-6 py-12 text-[#0f1a33]">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold">No hemos podido cargar tu cuenta</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Inténtalo de nuevo en unos minutos.</p>
      </section>
    </main>
  );
}

export default async function AccountPage() {
  const session = await getFlyPathSessionState();
  if (session.status === "anonymous") redirect(createFlyPathLoginHref("/account"));
  if (session.status === "unavailable") return <AccountUnavailable />;

  const profile = await getFlyPathAccountProfile();
  if (profile.status === "anonymous") redirect(createFlyPathLoginHref("/account"));

  if (profile.status === "unavailable") return <AccountUnavailable />;

  const bootstrap = await bootstrapFlyPathIdentity();
  if (bootstrap.status === "unauthenticated") redirect(createFlyPathLoginHref("/account"));
  if (bootstrap.status === "unavailable") return <AccountUnavailable />;

  const refreshedProfile = await getFlyPathAccountProfile();
  if (refreshedProfile.status !== "authenticated") {
    if (refreshedProfile.status === "anonymous") redirect(createFlyPathLoginHref("/account"));
    return <AccountUnavailable />;
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-5 py-10 text-[#0f1a33] sm:px-6 sm:py-14">
      <section className="mx-auto w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-[0_12px_36px_rgba(15,26,51,0.08)] sm:p-8">
        <div className="inline-flex rounded-lg bg-[#0f1a33] px-3 py-2">
          <Image
            src="/flypath-logo-white.webp"
            alt="FlyPath"
            width={540}
            height={162}
            className="h-auto w-32 object-contain object-left"
            sizes="128px"
            priority
          />
        </div>
        <div className="mt-8 flex h-10 w-10 items-center justify-center rounded-lg border border-[#c9a454]/35 bg-[#c9a454]/10">
          <UserRound className="h-5 w-5 text-[#7a5a16]" aria-hidden />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Mi cuenta</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Gestiona los datos básicos de tu cuenta FlyPath.</p>
        <div className="mt-8 border-t border-slate-200 pt-6">
          <AccountProfileForm
            email={refreshedProfile.account.email}
            fullName={refreshedProfile.account.fullName}
          />
        </div>
        <div className="mt-8 border-t border-slate-200 pt-6">
          <AccountLogoutButton />
        </div>
      </section>
    </main>
  );
}
