import Image from "next/image";
import Link from "next/link";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { HomeFooter } from "@/components/home/HomeFooter";
import { GuiaProductSection } from "@/components/guia/GuiaProductSection";
import { GuiaTocAccordion } from "@/components/guia/GuiaTocAccordion";
import { GuiaFormatCards } from "@/components/guia/GuiaFormatCards";
import { GuiaCTABuyButton } from "@/components/guia/GuiaCTABuyButton";
import { ArrowRight, ClipboardCheck, Route, Star, Wallet } from "lucide-react";

const WHY_GUIDE_CARDS = [
  {
    title: "Evita errores caros",
    text: "Entiende dónde se va realmente el dinero y qué costes suelen aparecer tarde.",
    icon: Wallet,
  },
  {
    title: "Compara rutas reales",
    text: "Modular, integrado, licencias, tiempos y riesgos explicados sin humo.",
    icon: Route,
  },
  {
    title: "Decide con criterio",
    text: "Aprende qué preguntar, qué revisar y cuándo avanzar antes de pagar matrícula.",
    icon: ClipboardCheck,
  },
] as const;

const TESTIMONIALS = [
  {
    quote:
      "Me ayudó a entender la diferencia entre integrado y modular sin depender solo de lo que decía cada escuela.",
    author: "Alumno PPL · España",
  },
  {
    quote:
      "Antes solo miraba el precio. Después de leer la guía empecé a preguntar por contrato, tasas, reembolsos y costes extra.",
    author: "Futuro piloto comercial",
  },
  {
    quote:
      "Muy útil para explicar a mi familia cuánto cuesta realmente el camino y qué pasos había que validar antes de pagar.",
    author: "Aspirante a piloto · Ruta modular",
  },
];

export default function GuiaComoSerPilotoPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f7fb] text-[#0f1a33]">
      <FlyPathPlatformHeader pageTitle="Guía Cómo ser piloto" currentModuleId="guia" />

      <main>
        {/* HERO — server rendered, LCP images preloaded */}
        <section className="relative overflow-hidden bg-[#F7F8FA] pt-8 pb-8 md:py-14 xl:min-h-[680px] xl:py-16 xl:pt-[72px] xl:pb-12 2xl:min-h-[720px] 2xl:pb-10 [@media(min-width:1280px)_and_(min-height:850px)]:min-h-[740px]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 65% 45% at 90% 8%, rgba(7,18,36,0.04), transparent 55%), radial-gradient(ellipse 50% 40% at 6% 92%, rgba(7,18,36,0.03), transparent 55%), linear-gradient(180deg, #F7F8FA 0%, #FFFFFF 100%)",
            }}
          />
          <div className="relative z-[1] mx-auto w-full max-w-[1280px] px-6 sm:px-8 lg:px-10 2xl:max-w-[1400px]">
            <div className="md:mx-auto md:max-w-[620px] xl:grid xl:grid-cols-[0.9fr_1.1fr] xl:items-center xl:gap-10 xl:mx-0 xl:max-w-none 2xl:gap-12">
              <div className="relative max-w-[560px] md:mx-auto xl:mx-0 xl:max-w-none">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#B8923F]">
                  GUÍA FLYPATH
                </p>
                <h1 className="mt-3 mb-0 w-full max-w-[600px] overflow-visible text-[2.5rem] font-semibold leading-[1.02] tracking-tight text-[#071224] sm:text-[3.25rem] sm:leading-[1.04] md:text-[52px] md:leading-[0.98] xl:mt-5 xl:text-[3.75rem] xl:leading-[1.04] 2xl:text-[64px] 2xl:leading-[0.95]">
                  <span className="block xl:whitespace-nowrap">Cómo ser piloto</span>
                  <span className="block xl:whitespace-nowrap">sin tomar decisiones</span>
                  <span className="block font-serif italic text-[#B8923F]">a ciegas.</span>
                </h1>

                {/* Mobile hero image */}
                <div className="relative left-1/2 -mt-6 w-screen max-w-[100vw] -translate-x-1/2 md:hidden">
                  <Image
                    src="/comoserpilotohero.webp"
                    alt="Portada de la guía Cómo ser piloto"
                    width={1122}
                    height={1402}
                    preload
                    sizes="100vw"
                    className="mx-auto block h-auto w-full max-w-none -mb-6 object-contain drop-shadow-[0_28px_35px_rgba(15,23,42,0.28)]"
                  />
                </div>

                {/* Tablet hero image */}
                <div className="mx-auto mt-7 hidden w-full max-w-[305px] md:block xl:hidden">
                  <Image
                    src="/comoserpilotohero.webp"
                    alt="Portada de la guía Cómo ser piloto"
                    width={1122}
                    height={1402}
                    preload
                    sizes="305px"
                    className="mx-auto h-auto w-full object-contain drop-shadow-[0_28px_35px_rgba(15,23,42,0.28)]"
                  />
                </div>

                <p className="-mt-2 mb-4 max-w-[520px] text-left text-[16px] leading-[1.7] text-[#4B5563] md:mt-5 md:max-w-[620px] md:text-[17px] md:leading-[1.55] xl:mb-0 xl:mt-6 xl:max-w-[520px] xl:text-[18px] xl:leading-[1.65]">
                  Entiende rutas, licencias, costes reales, Clase 1, escuelas de vuelo y decisiones clave
                  antes de comprometer tu dinero.
                </p>

                {/* Native anchor buttons — scroll without JS */}
                <div className="flex flex-col gap-2.5 sm:flex-row md:mt-6 md:gap-4 xl:mt-8 xl:gap-3">
                  <a
                    href="#comprar-guia"
                    className="inline-flex h-auto items-center justify-center rounded-[14px] bg-[#D6AE4F] px-7 py-3.5 text-[15px] font-bold tracking-tight text-[#071224] transition duration-200 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/45 md:h-[56px] md:px-8 md:text-base xl:h-auto xl:px-7 xl:py-3.5 xl:text-[15px] 2xl:h-[56px] 2xl:px-8 2xl:text-[16px]"
                  >
                    Comprar guía digital
                  </a>
                  <a
                    href="#contenido-guia"
                    className="inline-flex h-auto items-center justify-center gap-2 rounded-[14px] border border-[#071224]/15 bg-white px-7 py-3.5 text-[15px] font-semibold text-[#071224] transition duration-200 hover:border-[#071224]/30 hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#071224]/20 md:h-[56px] md:px-8 md:text-base xl:h-auto xl:px-7 xl:py-3.5 xl:text-[15px] 2xl:h-[56px] 2xl:px-8 2xl:text-[16px]"
                  >
                    Ver contenido
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </a>
                </div>

                <p className="mt-2.5 text-[13px] font-medium tracking-[0.02em] text-[#6B7280] xl:mt-7">
                  Digital · Física · Pago único · Actualizada 2026
                </p>
              </div>

              {/* Desktop hero image */}
              <div className="relative hidden min-h-[480px] self-start xl:block 2xl:min-h-[520px]">
                <Image
                  src="/comoserpilotohero.webp"
                  alt="Portada de la guía Cómo ser piloto"
                  width={1122}
                  height={1402}
                  preload
                  sizes="(max-width: 1536px) 535px, 593px"
                  className="absolute right-10 top-0 h-auto w-full max-w-[535px] -translate-y-12 object-contain object-top object-right drop-shadow-[0_28px_35px_rgba(15,23,42,0.28)] 2xl:max-w-[593px]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* BLOQUE PRODUCTO — client island (carousel + format picker + toast) */}
        <GuiaProductSection />

        {/* TABLA DE CONTENIDOS */}
        <section
          id="contenido-guia"
          className="border-b border-slate-200/70 bg-[#f4f7fb] py-14 lg:py-20"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2 lg:items-center lg:gap-14">
              <div className="order-1 min-w-0 w-full lg:order-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B8923F]">
                  TABLA DE CONTENIDOS
                </p>
                <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight text-[#0f1a33] sm:text-[2rem]">
                  Tabla de contenidos por capítulos
                </h2>
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
                  Conoce qué podrás encontrar en esta guía y de qué manera está estructurada.
                </p>
                {/* Accordion — client island */}
                <GuiaTocAccordion />
              </div>
              <div className="order-2 w-full lg:order-1 lg:flex lg:items-center lg:justify-center">
                <div className="w-full overflow-hidden rounded-3xl border border-[#c9a454]/30 border-slate-200/80 bg-white shadow-[0_24px_60px_rgba(15,26,51,0.10)] ring-1 ring-black/[0.04] lg:mx-auto lg:w-[88%] lg:max-w-[520px]">
                  <Image
                    src="/avgas.webp"
                    alt="Avión de aviación general como vista previa de la guía Cómo ser piloto"
                    width={3024}
                    height={4032}
                    className="block h-auto w-full max-w-full rounded-2xl object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* POR QUÉ ESTA GUÍA — static */}
        <section className="border-b border-slate-200/70 bg-[#F7F8FA] py-14 lg:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16">
              <div className="order-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B8923F]">
                  POR QUÉ ESTA GUÍA
                </p>
                <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-[1.12] tracking-tight text-[#0f1a33] sm:text-[2rem] lg:max-w-lg">
                  No es una guía teórica.
                  <br />
                  Es claridad antes de pagar una formación.
                </h2>
                <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-slate-600 lg:max-w-lg">
                  Cómo ser Piloto reúne lo que a mí me habría gustado entender antes de elegir escuela,
                  ruta y forma de financiar la formación.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:gap-3.5">
                  {WHY_GUIDE_CARDS.map(({ title, text, icon: Icon }) => (
                    <div
                      key={title}
                      className="flex gap-3.5 rounded-[18px] border border-[#E5E7EB] bg-white p-4 sm:gap-4 sm:p-5"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fffdf6] ring-1 ring-[#c9a454]/25">
                        <Icon className="h-4 w-4 text-[#c9a454]" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold leading-snug text-[#0f1a33]">{title}</h3>
                        <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="order-2 flex w-full justify-center lg:order-2">
                <div className="w-full max-w-[300px] overflow-hidden rounded-3xl border border-[#c9a454]/30 border-slate-200/80 bg-white shadow-[0_20px_50px_rgba(15,26,51,0.10)] ring-1 ring-black/[0.04] sm:max-w-[360px] lg:max-w-[500px]">
                  <Image
                    src="/atardecer.jpg"
                    alt="Atardecer aeronáutico como apoyo visual de la guía Cómo ser piloto"
                    width={2000}
                    height={1500}
                    className="block h-auto w-full rounded-2xl object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FORMATOS Y COMPRA — client island (pricing cards + toast) */}
        <GuiaFormatCards />

        {/* RESEÑAS — static (mobile CSS snap without dot tracking, desktop grid) */}
        <section className="border-b border-slate-200/70 bg-[#f8fafc] py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <h2 className="text-2xl font-semibold tracking-tight text-[#0f1a33] sm:text-3xl">
              Lo que dicen otros futuros pilotos
            </h2>
            {/* Mobile — CSS snap carousel, no dot tracking needed */}
            <div className="mt-8 md:hidden">
              <div className="-mx-6 flex snap-x snap-mandatory overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {TESTIMONIALS.map((t) => (
                  <figure
                    key={t.author}
                    className="box-border w-full shrink-0 grow-0 basis-full snap-center"
                  >
                    <div className="flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_14px_38px_rgba(15,26,51,0.06)] ring-1 ring-black/[0.03]">
                      <div className="flex items-center gap-0.5" aria-label="Valoración 5 sobre 5">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <Star
                            key={i}
                            className="h-3.5 w-3.5 fill-[#c9a454] text-[#c9a454]"
                            aria-hidden
                          />
                        ))}
                      </div>
                      <blockquote className="mt-3 text-[15px] leading-relaxed text-slate-700">
                        &ldquo;{t.quote}&rdquo;
                      </blockquote>
                      <figcaption className="mt-4 text-[13px] font-medium text-slate-500">
                        {t.author}
                      </figcaption>
                    </div>
                  </figure>
                ))}
              </div>
              {/* Static dot indicators — first always highlighted */}
              <div className="mt-4 flex justify-center gap-2" aria-hidden>
                {TESTIMONIALS.map((t, index) => (
                  <span
                    key={t.author}
                    className={`h-1.5 w-1.5 rounded-full ${
                      index === 0 ? "bg-[#c9a454]" : "bg-[#0f1a33]/20"
                    }`}
                  />
                ))}
              </div>
            </div>
            {/* Desktop grid — static */}
            <div className="mt-8 hidden gap-5 md:grid md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <figure
                  key={t.author}
                  className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_14px_38px_rgba(15,26,51,0.06)] ring-1 ring-black/[0.03]"
                >
                  <div className="flex items-center gap-0.5" aria-label="Valoración 5 sobre 5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star
                        key={i}
                        className="h-3.5 w-3.5 fill-[#c9a454] text-[#c9a454]"
                        aria-hidden
                      />
                    ))}
                  </div>
                  <blockquote className="mt-3 text-[15px] leading-relaxed text-slate-700">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-4 text-[13px] font-medium text-slate-500">
                    {t.author}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL — hero CTA button (client island) + Link (server) */}
        <section className="bg-gradient-to-b from-[#f8fafc] to-white py-14 lg:py-20">
          <div className="mx-auto max-w-3xl px-6 text-center lg:px-10">
            <h2 className="text-2xl font-semibold tracking-tight text-[#0f1a33] sm:text-3xl">
              Empieza con la guía, valida tu ruta y después compara escuelas con más criterio.
            </h2>
            <p className="mt-2 text-[12px] font-medium uppercase tracking-[0.22em] text-slate-500">
              LEE · PLANIFICA · COMPARA
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <GuiaCTABuyButton />
              <Link
                href="/career-planner"
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-8 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#c9a454]/45 hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35 sm:w-auto"
              >
                Planificar mi ruta
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
