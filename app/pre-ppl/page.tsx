import Image from "next/image";
import { ArrowRight, BookOpen, CheckCircle2, CircleHelp, Tablet } from "lucide-react";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { HomeFooter } from "@/components/home/HomeFooter";
import { PrePplDigitalCheckoutButton } from "@/components/pre-ppl/PrePplDigitalCheckoutButton";
import { PrePplInteriorCarousel } from "@/components/pre-ppl/PrePplInteriorCarousel";
import { PrePplPhysicalAmazonButton } from "@/components/pre-ppl/PrePplPhysicalAmazonButton";
import { PrePplPageTracking } from "@/components/pre-ppl/PrePplPageTracking";
import { PRE_PPL_DIGITAL_PRICE_LABEL, PRE_PPL_PHYSICAL_PRICE_LABEL, PRE_PPL_PHYSICAL_AMAZON_URL } from "@/lib/pre-ppl";

const PRE_PPL_CONTENT = [
  {
    number: "01",
    title: "Tu escuela de vuelo",
    text: "Cómo se estructura el PPL, quién es quién dentro de la escuela, qué material necesitarás y qué puedes esperar de la formación.",
  },
  {
    number: "02",
    title: "El avión y la cabina",
    text: "Partes de la aeronave, instrumentos, mandos, six pack y conceptos que empezarás a escuchar desde tus primeras clases.",
  },
  {
    number: "03",
    title: "Del walkaround al despegue",
    text: "Inspecciones, checklists, arranque, taxi, prueba de motor, briefings y procedimientos previos al vuelo.",
  },
  {
    number: "04",
    title: "Tus primeras horas de vuelo",
    text: "Circuito, velocidades, despegue, aproximación, aterrizaje y las maniobras básicas que encontrarás durante el PPL.",
  },
  {
    number: "05",
    title: "Navegación y meteorología",
    text: "Cartas VFR, routings, METAR, TAF, NOTAM, AIP y conceptos básicos para empezar a preparar una navegación.",
  },
  {
    number: "06",
    title: "Llegar con contexto, no desde cero",
    text: "Preguntas frecuentes, consejos y mentalidad de alumno para entender mejor qué te espera antes y durante la formación.",
  },
] as const;

const FAQS = [
  ["¿Para quién está pensada?", "Para personas que están considerando empezar su formación como piloto o quieren llegar mejor preparadas a sus primeras clases."],
  ["¿Cómo se compra la versión digital?", "La versión digital se compra de forma segura en FlyPath y queda disponible después de confirmar el pago."],
  ["¿Dónde se compra la versión física?", "La versión física se venderá a través de Amazon. El enlace se activará aquí cuando esté disponible."],
  ["¿Son el mismo producto?", "Ambas opciones corresponden a Pre-PPL en formato digital o físico."],
] as const;

const primaryButtonClass = "mt-8 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-[#c9a454] bg-[#c9a454] px-6 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_10px_28px_rgba(201,164,84,0.28)] transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55 disabled:cursor-wait disabled:opacity-70";
const secondaryButtonClass = "mt-8 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-white/30 bg-transparent px-6 py-3 text-[15px] font-semibold text-white transition hover:border-white/50 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-60";

export default function PrePplPage() {
  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#071224]">
      <PrePplPageTracking />
      <FlyPathPlatformHeader pageTitle="Pre-PPL" currentModuleId="pre-ppl" />
      <main>
        <section className="relative overflow-hidden border-b border-[#071224]/10 bg-[#F7F8FA] pt-8 pb-8 md:py-14 xl:min-h-[680px] xl:py-16 xl:pt-[72px] xl:pb-12 2xl:min-h-[720px] 2xl:pb-10 [@media(min-width:1280px)_and_(min-height:850px)]:min-h-[740px]">
          <div className="mx-auto w-full max-w-[1280px] px-6 sm:px-8 lg:px-10 2xl:max-w-[1400px]">
            <div className="md:mx-auto md:max-w-[620px] xl:grid xl:grid-cols-[0.9fr_1.1fr] xl:items-center xl:gap-10 xl:mx-0 xl:max-w-none 2xl:gap-12">
              <div className="relative max-w-[560px] md:mx-auto xl:mx-0 xl:max-w-none">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#B8923F]">GUÍA FLYPATH</p>
                <h1 className="mt-3 mb-0 w-full max-w-[600px] overflow-visible text-[2.5rem] font-semibold leading-[1.02] tracking-tight text-[#071224] sm:text-[3.25rem] sm:leading-[1.04] md:text-[52px] md:leading-[0.98] xl:mt-5 xl:text-[3.75rem] xl:leading-[1.04] 2xl:text-[64px] 2xl:leading-[0.95]">
                  <span className="block xl:hidden">Una guía para entender mejor</span>
                  <span className="block xl:hidden">el punto de partida</span>
                  <span className="hidden xl:block xl:whitespace-nowrap">Una guía para entender</span>
                  <span className="hidden xl:block xl:whitespace-nowrap">mejor el punto de partida</span>
                  <span className="block font-serif italic text-[#B8923F] xl:hidden">
                    antes de comenzar tu formación como piloto.
                  </span>
                  <span className="hidden font-serif italic text-[#B8923F] xl:block xl:whitespace-nowrap">
                    antes de comenzar tu
                  </span>
                  <span className="hidden font-serif italic text-[#B8923F] xl:block xl:whitespace-nowrap">
                    formación como piloto.
                  </span>
                </h1>

                <div className="mx-auto mt-2 w-full max-w-[286px] md:hidden">
                  <Image
                    src="/aerocomms/mockups/prepplsinfondo.png"
                    alt="Portada de la guía Pre-PPL"
                    width={1122}
                    height={1402}
                    preload
                    sizes="100vw"
                    className="mx-auto block h-auto w-full object-contain drop-shadow-[0_28px_35px_rgba(15,23,42,0.28)]"
                  />
                </div>

                <div className="mx-auto mt-7 hidden w-full max-w-[270px] md:block xl:hidden">
                  <Image
                    src="/aerocomms/mockups/prepplsinfondo.png"
                    alt="Portada de la guía Pre-PPL"
                    width={1122}
                    height={1402}
                    preload
                    sizes="270px"
                    className="mx-auto h-auto w-full object-contain drop-shadow-[0_28px_35px_rgba(15,23,42,0.28)]"
                  />
                </div>

                <p className="mt-2 mb-4 max-w-[520px] text-left text-[16px] leading-[1.7] text-[#4B5563] md:mt-5 md:max-w-[620px] md:text-[17px] md:leading-[1.55] xl:mb-0 xl:mt-6 xl:max-w-[520px] xl:text-[18px] xl:leading-[1.65]">
                  Pensada para ayudarte a orientarte y llegar a tus primeras clases con una base más clara.
                </p>
                <div className="flex flex-col gap-2.5 sm:flex-row md:mt-6 md:gap-4 xl:mt-8 xl:gap-3">
                  <PrePplDigitalCheckoutButton
                    className="inline-flex h-auto min-h-0 w-full items-center justify-center gap-2 rounded-[14px] bg-[#D6AE4F] px-7 py-3.5 text-[15px] font-bold tracking-tight text-[#071224] transition duration-200 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/45 disabled:cursor-not-allowed disabled:opacity-55 md:h-[56px] md:px-8 md:text-base xl:h-auto xl:w-auto xl:px-7 xl:py-3.5 xl:text-[15px] 2xl:h-[56px] 2xl:px-8 2xl:text-[16px]"
                    label="Comprar guía digital"
                  />
                  <a href="#formatos" className="inline-flex h-auto items-center justify-center gap-2 rounded-[14px] border border-[#071224]/15 bg-white px-7 py-3.5 text-[15px] font-semibold text-[#071224] transition duration-200 hover:border-[#071224]/30 hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#071224]/20 md:h-[56px] md:px-8 md:text-base xl:h-auto xl:px-7 xl:py-3.5 xl:text-[15px] 2xl:h-[56px] 2xl:px-8 2xl:text-[16px]">
                    Ver formatos
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </a>
                </div>
              </div>

              <div className="relative hidden min-h-[480px] self-start xl:block 2xl:min-h-[520px]">
                <Image
                  src="/aerocomms/mockups/prepplsinfondo.png"
                  alt="Portada de la guía Pre-PPL"
                  width={1122}
                  height={1402}
                  preload
                  sizes="(max-width: 1536px) 430px, 480px"
                  className="absolute right-10 top-0 h-auto w-full max-w-[430px] -translate-y-8 object-contain object-top object-right drop-shadow-[0_28px_35px_rgba(15,23,42,0.28)] 2xl:max-w-[480px]"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#071224]/10 bg-white py-14 sm:py-16 lg:py-20">
          <div className="mx-auto w-full max-w-[1280px] px-6 sm:px-8 lg:px-10 2xl:max-w-[1400px]">
            <div className="mx-auto max-w-[900px] text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B8923F]">POR DENTRO</p>
              <h2 className="mt-3 text-3xl font-semibold leading-[1.12] tracking-tight text-[#071224] sm:text-4xl lg:text-[2.75rem]">
                Dentro de Pre-PPL no vas a encontrar teoría infinita.
              </h2>
              <p className="mx-auto mt-4 max-w-[820px] font-serif text-xl italic leading-snug text-[#B8923F] sm:text-2xl lg:text-[1.75rem]">
                Vas a empezar a entender lo que realmente te encontrarás cuando llegues a la escuela de vuelo.
              </p>
            </div>

            <PrePplInteriorCarousel />
          </div>
        </section>

        <section className="border-b border-[#071224]/10 bg-[#F7F8FA] py-14 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B8923F]">QUÉ ENCONTRARÁS</p>
            <h2 className="mt-3 max-w-4xl text-3xl font-semibold leading-[1.12] tracking-tight text-[#071224] sm:text-4xl">
              Todo lo que normalmente empiezas a entender cuando ya estás dentro.
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#4B5563] sm:text-[17px]">
              Pre-PPL te da contexto antes de empezar para que conceptos, procedimientos y situaciones de tus primeras clases ya te resulten familiares.
            </p>

            <div className="mt-10 grid gap-x-12 md:grid-cols-2 lg:mt-12 lg:gap-x-16">
              {PRE_PPL_CONTENT.map((item) => (
                <article
                  key={item.number}
                  className="grid grid-cols-[3.25rem_1fr] gap-4 border-t border-[#071224]/12 py-6 sm:grid-cols-[4.25rem_1fr] sm:gap-5 sm:py-7"
                >
                  <p className="font-serif text-[2.25rem] italic leading-none text-[#B8923F] sm:text-[3rem]" aria-hidden>
                    {item.number}
                  </p>
                  <div>
                    <h3 className="text-lg font-semibold leading-snug tracking-tight text-[#071224] sm:text-xl">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[15px] leading-6 text-[#4B5563] sm:text-base sm:leading-7">
                      {item.text}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="formatos"
          className="border-b border-white/5 bg-header-navy pt-14 pb-10 text-white lg:pt-20 lg:pb-12"
        >
          <div className="relative z-[1] mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mx-auto max-w-[1080px]">
              <div className="mx-auto max-w-[760px] text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B8923F]">
                  ELIGE TU FORMATO
                </p>
                <h2 className="mt-3 text-2xl font-semibold leading-[1.12] tracking-tight text-white sm:text-3xl lg:text-[2rem]">
                  Empieza como tú prefieras.
                  <br className="hidden sm:block" />{" "}
                  Dos formatos, el mismo objetivo.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-white/70 lg:text-[17px]">
                  Elige cómo quieres empezar: descarga inmediata o edición impresa para tenerla siempre a mano.
                </p>
              </div>

              <div className="mt-10 grid auto-rows-fr grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:mt-12">
                <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-header-navy p-5 shadow-[0_14px_40px_rgba(7,18,36,0.18)] sm:p-6 md:max-w-[520px] md:justify-self-end">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D6AE4F]/12 ring-1 ring-[#D6AE4F]/30">
                      <BookOpen className="h-5 w-5 text-[#D6AE4F]" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D6AE4F]">
                        FÍSICO
                      </p>
                      <h3 className="mt-1 text-2xl font-semibold text-white">Guía física</h3>
                    </div>
                  </div>
                  <p className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-4xl font-semibold tracking-tight text-white sm:text-[2.5rem]">
                      {PRE_PPL_PHYSICAL_PRICE_LABEL}
                    </span>
                    <span className="whitespace-nowrap text-[13px] font-medium text-white/65">
                      Edición impresa
                    </span>
                  </p>
                  <ul className="mt-6 flex-1 space-y-2.5 text-[14px] leading-snug text-white/75 sm:text-[15px]">
                    <li className="flex gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D6AE4F]" aria-hidden />
                      <span>Libro impreso para leer y consultar con calma</span>
                    </li>
                    <li className="flex gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D6AE4F]" aria-hidden />
                      <span>Ideal para tenerlo contigo durante tu formación</span>
                    </li>
                    <li className="flex gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D6AE4F]" aria-hidden />
                      <span>Compra y envío gestionados a través de Amazon</span>
                    </li>
                  </ul>
                  <PrePplPhysicalAmazonButton className={secondaryButtonClass} />
                  {!PRE_PPL_PHYSICAL_AMAZON_URL ? (
                    <p id="pre-ppl-amazon-note" className="sr-only">
                      La compra en Amazon todavía no está disponible.
                    </p>
                  ) : null}
                </article>

                <article className="relative flex h-full flex-col overflow-visible rounded-2xl border border-[rgba(212,175,55,0.65)] bg-header-navy p-5 shadow-[0_14px_40px_rgba(7,18,36,0.18)] sm:p-6 sm:pt-7 md:max-w-[520px] md:justify-self-start">
                  <span className="pointer-events-none absolute left-1/2 top-0 z-10 inline-flex -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#c9a454] bg-[#c9a454] px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0f1a33]">
                    RECOMENDADO
                  </span>
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D6AE4F]/12 ring-1 ring-[#D6AE4F]/30">
                      <Tablet className="h-5 w-5 text-[#D6AE4F]" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D6AE4F]">
                        DIGITAL
                      </p>
                      <h3 className="mt-1 text-2xl font-semibold text-white">Guía digital</h3>
                    </div>
                  </div>
                  <p className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-4xl font-semibold tracking-tight text-[#D6AE4F] sm:text-[2.5rem]">
                      {PRE_PPL_DIGITAL_PRICE_LABEL}
                    </span>
                    <span className="whitespace-nowrap text-[13px] font-medium text-white/65">
                      Descarga inmediata
                    </span>
                  </p>
                  <ul className="mt-6 flex-1 space-y-2.5 text-[14px] leading-snug text-white/75 sm:text-[15px]">
                    <li className="flex gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D6AE4F]" aria-hidden />
                      <span>Acceso inmediato tras la compra</span>
                    </li>
                    <li className="flex gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D6AE4F]" aria-hidden />
                      <span>Formato digital para consultar desde cualquier dispositivo</span>
                    </li>
                    <li className="flex gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D6AE4F]" aria-hidden />
                      <span>Ideal para empezar a prepararte antes de tus primeras clases</span>
                    </li>
                  </ul>
                  <PrePplDigitalCheckoutButton className={primaryButtonClass} label="Comprar digital" />
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-14 sm:px-8 lg:py-20">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B8923F]">PREGUNTAS FRECUENTES</p>
          <div className="mt-7 divide-y divide-[#071224]/10 border-y border-[#071224]/10">
            {FAQS.map(([question, answer]) => <article key={question} className="py-5"><h2 className="flex items-center gap-2 text-base font-semibold"><CircleHelp className="h-4 w-4 text-[#B8923F]" aria-hidden />{question}</h2><p className="mt-2 pl-6 text-sm leading-6 text-[#4B5563]">{answer}</p></article>)}
          </div>
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}
