import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { HomeFooter } from "@/components/home/HomeFooter";
import { ShopInteractiveContent } from "@/components/shop/ShopInteractiveContent";
import { FLYPATH_MENTORIA_CALCOM_URL } from "@/lib/mentorias/calcom";

export default function ShopPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f7fb] text-[#0f1a33]">
      <FlyPathPlatformHeader pageTitle="Shop" currentModuleId="shop" />

      <main>
        {/* Hero — server rendered, LCP image preloaded */}
        <section className="relative isolate overflow-hidden border-b border-[#0f1a33]/20 bg-[#0f1a33]">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <Image
              src="/shop.webp"
              alt=""
              fill
              preload
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#071226]/80 via-[#0f1a33]/40 to-[#0f1a33]/15" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071226]/65 via-[#0f1a33]/20 to-transparent sm:hidden" />
          </div>
          <div className="relative mx-auto max-w-7xl px-6 py-9 sm:py-10 lg:px-10 lg:py-11">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f2ddaa]">
              SHOP FLYPATH
            </p>
            <h1 className="mt-2 max-w-2xl text-[1.85rem] font-semibold leading-[1.12] tracking-tight text-white sm:text-[2.15rem] lg:text-[2.4rem]">
              Recursos FlyPath
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-100 sm:text-lg">
              Guías, mentorías, clases y logbooks para avanzar como piloto con más criterio.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {/* Native anchor — scroll without JS, no need for useRouter/useCallback */}
              <a
                href="#recursos-flypath"
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-7 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_10px_32px_rgba(201,164,84,0.35)] transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
              >
                Ver recursos
              </a>
              <Link
                href="/guia-como-ser-piloto"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-7 py-3 text-[15px] font-semibold text-white backdrop-blur-[2px] transition hover:border-white/40 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                Empezar por la guía
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        {/* Category filter + product sections — client island */}
        <ShopInteractiveContent />

        {/* CTA final — server rendered */}
        <section className="bg-gradient-to-b from-[#f8fafc] to-white py-9 sm:py-11">
          <div className="mx-auto max-w-3xl px-6 text-center lg:px-10">
            <h2 className="text-2xl font-semibold tracking-tight text-[#0f1a33] sm:text-3xl">
              ¿No sabes qué recurso encaja contigo?
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600 sm:text-base">
              Empieza por la guía si estás al principio, o reserva una mentoría si necesitas revisar tu caso
              antes de tomar una decisión.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/guia-como-ser-piloto"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-8 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_14px_40px_rgba(201,164,84,0.35)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:w-auto"
              >
                Ver guía
              </Link>
              <a
                href={FLYPATH_MENTORIA_CALCOM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-8 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#c9a454]/45 hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35 sm:w-auto"
              >
                Reservar mentoría
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </a>
            </div>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
