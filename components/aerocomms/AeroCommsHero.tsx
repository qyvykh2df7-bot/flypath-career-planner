import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play, ShieldCheck } from "lucide-react";

const DESKTOP_HERO_OVERLAY =
  "linear-gradient(to right, #faf9f5 0%, rgba(250, 249, 245, 0.98) 24%, rgba(250, 249, 245, 0.72) 34%, rgba(250, 249, 245, 0.22) 43%, rgba(250, 249, 245, 0) 52%)";

export function AeroCommsHero() {
  return (
    <section className="relative overflow-hidden bg-[#faf9f5] pt-8 pb-8 md:py-14 xl:min-h-[680px] xl:py-16 xl:pt-[72px] xl:pb-12 2xl:min-h-[720px] 2xl:pb-10 [@media(min-width:1280px)_and_(min-height:850px)]:min-h-[740px]">
      {/* Layer 0 — desktop hero background (xl+ only, full section width) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 hidden xl:block"
      >
        <Image
          src="/aerocomms/mockups/herodesktop-white-2x.webp"
          alt=""
          fill
          fetchPriority="high"
          sizes="(min-width: 1280px) 100vw, 0vw"
          className="object-cover"
          style={{ objectPosition: "center 58%" }}
        />
      </div>

      {/* Layer 1 — desktop warm left overlay (xl+ only, full section width) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] hidden h-full w-full xl:block"
        style={{ background: DESKTOP_HERO_OVERLAY }}
      />

      {/* Layer 2 — hero content */}
      <div className="relative z-[1] mx-auto w-full max-w-[1280px] px-6 sm:px-8 lg:px-10 2xl:max-w-[1400px]">
        <div className="md:mx-auto md:max-w-[620px] xl:grid xl:grid-cols-[0.9fr_1.1fr] xl:items-center xl:gap-10 xl:mx-0 xl:max-w-none 2xl:gap-12">
          {/* Left column — copy and CTAs */}
          <div className="relative max-w-[560px] md:mx-auto xl:mx-0 xl:max-w-none">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#B8923F]">
              AeroComms by FlyPath
            </p>
            <h1 className="mt-3 mb-0 max-w-[600px] text-balance text-[2.5rem] font-semibold leading-[1.04] tracking-tight text-[#071224] sm:text-[3.25rem] md:text-[52px] md:leading-[0.98] xl:mt-5 xl:text-[3.75rem] xl:leading-[1.04] 2xl:text-[64px] 2xl:leading-[0.95]">
              Entrena tus comunicaciones ATC con{" "}
              <span className="font-serif italic text-[#B8923F]">confianza.</span>
            </h1>

            {/* Mobile only (<768px) — approved layout */}
            <Image
              src="/aerocomms/mockups/heromovil-compact.webp"
              alt="Vista previa de la app AeroComms en móvil"
              width={941}
              height={1168}
              className="mx-auto mt-1 h-auto w-full max-w-[370px] object-contain md:hidden"
              sizes="(max-width: 768px) min(100vw, 370px)"
              fetchPriority="high"
            />

            {/* Tablet (768px–1279px) — centered mockup between headline and copy */}
            <div className="mx-auto mt-7 hidden w-full max-w-[540px] md:block xl:hidden">
              <Image
                src="/aerocomms/mockups/heromovil-compact.webp"
                alt="Vista previa de la app AeroComms"
                width={941}
                height={1168}
                className="mx-auto h-auto w-full object-contain"
                sizes="(max-width: 1280px) min(100vw, 540px)"
                fetchPriority="high"
              />
            </div>

            <p className="mt-1 mb-4 max-w-[520px] text-left text-[16px] leading-[1.7] text-[#4B5563] md:mt-5 md:max-w-[620px] md:text-[17px] md:leading-[1.55] xl:mb-0 xl:mt-6 xl:max-w-[520px] xl:text-[18px] xl:leading-[1.65]">
              Practica listening, readbacks, fraseología y escenarios guiados para llegar
              mejor preparado a la radio real.
            </p>

            <div className="flex flex-col gap-2.5 sm:flex-row md:mt-6 md:gap-4 xl:mt-8 xl:gap-3">
              <Link
                href="/aerocomms/app"
                className="inline-flex h-auto items-center justify-center gap-2 rounded-[14px] bg-[#D6AE4F] px-7 py-3.5 text-[15px] font-bold tracking-tight text-[#071224] transition duration-200 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/45 md:h-[56px] md:px-8 md:text-base xl:h-auto xl:px-7 xl:py-3.5 xl:text-[15px] 2xl:h-[56px] 2xl:px-8 2xl:text-[16px]"
              >
                Probar AeroComms
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
              <Link
                href="#training"
                className="inline-flex h-auto items-center justify-center gap-2 rounded-[14px] border border-[#071224]/15 bg-white px-7 py-3.5 text-[15px] font-semibold text-[#071224] transition duration-200 hover:border-[#071224]/30 hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#071224]/20 md:h-[56px] md:px-8 md:text-base xl:h-auto xl:px-7 xl:py-3.5 xl:text-[15px] 2xl:h-[56px] 2xl:px-8 2xl:text-[16px]"
              >
                <Play className="h-4 w-4 shrink-0" aria-hidden />
                Ver cómo funciona
              </Link>
            </div>

            <p className="mt-2.5 inline-flex items-center gap-2 text-[13px] font-medium text-[#6B7280] xl:mt-7 2xl:text-[15px]">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
              Diseñado para student pilots y futuros pilotos.
            </p>
          </div>

          {/* Right column — desktop mockup (background layer shows through) */}
          <div className="relative hidden min-h-[480px] xl:block 2xl:min-h-[520px]" aria-hidden />
        </div>
      </div>
    </section>
  );
}
