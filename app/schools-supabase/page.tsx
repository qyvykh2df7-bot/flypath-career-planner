import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getSupabaseSchoolEntriesWithProfiles } from "@/lib/schoolMapper";
import type { SchoolEntry } from "@/types/schools";
import type { FullSchoolProfile } from "@/lib/schoolQueries";
import { SupabaseSchoolsListing } from "./_components/SupabaseSchoolsListing";

export const dynamic = "force-dynamic";

/** Página de debug interna: no debe indexarse. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function SchoolsSupabasePage() {
  let entries: SchoolEntry[] = [];
  let profilesBySlug: Record<string, FullSchoolProfile> = {};
  let errorMessage: string | null = null;

  try {
    const payload = await getSupabaseSchoolEntriesWithProfiles();
    entries = payload.entries;
    profilesBySlug = payload.profilesBySlug;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Error desconocido";
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8fafc] text-[#0f1a33]">
      <SupabaseHeader />
      <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto w-full max-w-[1200px] space-y-6">
          <SupabaseHero schoolCount={errorMessage ? 0 : entries.length} />

          {errorMessage ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
              <strong className="block text-red-800">Error loading schools</strong>
              <span className="mt-1 block">{errorMessage}</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-[15px] text-slate-600 shadow-sm">
              No se han encontrado escuelas activas en Supabase.
            </div>
          ) : (
            <SupabaseSchoolsListing schools={entries} profilesBySlug={profilesBySlug} />
          )}

          <p className="pt-2 text-xs text-slate-500">
            Página temporal · MVP Supabase. El comparador real (<code>/schools</code>) sigue
            usando <code>lib/schools/schoolsSpain.ts</code> sin cambios.
          </p>
        </div>
      </main>
    </div>
  );
}

function SupabaseHeader() {
  return (
    <header className="border-b border-white/10 bg-header-navy text-white shadow-[0_12px_40px_rgba(15,26,51,0.35)]">
      <div className="mx-auto flex max-h-[90px] max-w-7xl items-center justify-between gap-3 px-6 py-3 sm:gap-4 md:gap-4 lg:px-10">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
        >
          <div className="relative flex h-12 max-h-[60px] w-[180px] shrink-0 items-center sm:h-[54px] sm:max-h-[58px] sm:w-[220px] md:max-h-[60px] md:w-[252px] lg:w-[268px]">
            <Image
              src="/flypath-logo-white.webp"
              alt="FlyPath"
              width={540}
              height={162}
              className="h-auto max-h-12 w-auto max-w-full object-contain object-left sm:max-h-[54px] md:max-h-[58px] lg:max-h-[60px]"
            />
          </div>
        </Link>
        <p
          className="pointer-events-none hidden min-w-0 select-none truncate text-center text-sm font-medium tracking-[0.14em] text-[#f2ddaa]/90 md:flex md:flex-1 md:items-center md:justify-center"
          aria-hidden
        >
          Comparador de escuelas · Supabase MVP
        </p>
        <Link
          href="/schools"
          className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:border-white/24 hover:bg-white/[0.14]"
        >
          Ver comparador real →
        </Link>
      </div>
    </header>
  );
}

function SupabaseHero({ schoolCount }: { schoolCount: number }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-white via-[#f7f9fc] to-[#f4f7fb] p-5 shadow-sm sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_95%_10%,rgba(201,164,84,0.10),transparent_55%),radial-gradient(ellipse_70%_60%_at_10%_90%,rgba(15,26,51,0.06),transparent_52%)]"
      />
      <div className="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a5a16]">
            Página temporal · MVP Supabase
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#0f1a33] sm:text-4xl">
            Comparador FlyPath leyendo desde Supabase.
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-base">
            Listado en vivo desde Supabase mapeado a <code>SchoolEntry</code> (escuela +
            programa principal + costes + extras + risk flags). Solo escuelas con{" "}
            <code>status = &quot;active&quot;</code>. Cada tarjeta abre la ficha temporal con todos los
            campos del esquema.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "Datos en vivo",
              "Sin tocar /schools",
              "Sin tocar landing",
              "Diseño tipo comparador",
            ].map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600"
              >
                {chip}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2.5 text-[11px] font-medium text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1">
              1. Filtra
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1">
              2. Abre la ficha
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1">
              3. Valida los datos
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-[#c9a454]/30 bg-[#0f1a33] p-4 text-white shadow-[0_12px_28px_rgba(15,26,51,0.18)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f2ddaa]">
            Estado MVP
          </p>
          <div className="mt-3 space-y-2.5">
            <SupabaseHeroStat
              label="Escuelas activas en Supabase"
              value={schoolCount.toString()}
            />
            <SupabaseHeroStat label="Origen de datos" value="SchoolEntry[] (Supabase, status=active)" />
            <SupabaseHeroStat
              label="Comparador real"
              value="/schools intacto · usa schoolsSpain.ts"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function SupabaseHeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f2ddaa]/85">
        {label}
      </p>
      <p className="mt-1 break-words text-[14px] font-semibold text-white">{value}</p>
    </div>
  );
}
