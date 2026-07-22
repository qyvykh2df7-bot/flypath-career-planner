import Image from "next/image";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { FlyPathTeamSection } from "@/components/FlyPathTeamSection";
import { HomeFooter } from "@/components/home/HomeFooter";
import { MentoriasMobileProcess } from "@/components/mentorias/MentoriasMobileProcess";
import { MentoriasMobileReviews } from "@/components/mentorias/MentoriasMobileReviews";
import { MentoriasPricingSection } from "@/components/mentorias/MentoriasPricingSection";
import { FLYPATH_MENTORIA_CALCOM_URL } from "@/lib/mentorias/calcom";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Calculator,
  Check,
  CircleCheck,
  Clock,
  Euro,
  ListChecks,
  Map,
  Plane,
  Route,
  Scale,
  ShieldAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const HERO_BG = "/aerocomms/mockups/heromento.webp";

const HERO_BADGES = [
  { label: "Ruta clara", icon: Map },
  { label: "Costes reales", icon: Euro },
  { label: "Escuela correcta", icon: Building2 },
  { label: "Próximo paso", icon: CircleCheck },
] as const;

type DiagnosisTone = "review" | "key" | "risk";

const HERO_DIAGNOSIS_ITEMS: ReadonlyArray<{
  label: string;
  status: string;
  tone: DiagnosisTone;
  icon: LucideIcon;
}> = [
  { label: "Presupuesto", status: "A REVISAR", tone: "review", icon: Calculator },
  { label: "Tiempo disponible", status: "CLAVE", tone: "key", icon: Clock },
  { label: "Nivel de inglés", status: "A REVISAR", tone: "review", icon: BookOpen },
  { label: "Tipo de ruta", status: "A REVISAR", tone: "review", icon: Route },
  { label: "Riesgo antes de firmar", status: "RIESGO", tone: "risk", icon: ShieldAlert },
];

const DIAGNOSIS_PILL_CLASS: Record<DiagnosisTone, string> = {
  review: "border-[#D6AE4F]/60 bg-[#1a2744]/95 text-[#f5e5b8]",
  key: "border-emerald-400/55 bg-emerald-950/60 text-emerald-200",
  risk: "border-rose-400/55 bg-rose-950/60 text-rose-200",
};

const AUDIENCE = [
  {
    icon: Route,
    title: "No sé qué ruta encaja mejor conmigo.",
    text: "Necesito entender qué opción tiene más sentido según mi situación.",
  },
  {
    icon: Scale,
    title: "Estoy comparando escuelas y no sé cuál tiene más sentido.",
    text: "Quiero claridad en los pros, contras y diferencias reales.",
  },
  {
    icon: ShieldAlert,
    title: "Quiero evitar errores antes de pagar matrícula o depósito.",
    text: "Necesito saber en qué fijarme antes de comprometer mi dinero.",
  },
  {
    icon: ListChecks,
    title: "Necesito ordenar mi plan, costes y próximos pasos.",
    text: "Quiero un plan claro y realista con lo que tengo hoy.",
  },
] as const;

const MENTORSHIP_WORK = [
  {
    title: "Ruta y timing",
    image: "/aerocomms/mockups/mento1.webp",
    icon: Map,
    items: [
      "Integrado vs modular",
      "Edad, disponibilidad y trabajo",
      "Orden lógico de pasos",
      "Cuándo empezar y cómo planificar",
    ],
  },
  {
    title: "Costes y riesgos",
    image: "/aerocomms/mockups/mento2.webp",
    icon: Euro,
    items: [
      "Presupuesto realista",
      "Pagos, depósitos y extras",
      "Coste total por tipo de ruta",
      "Riesgos antes de firmar",
    ],
  },
  {
    title: "Escuelas y condiciones",
    image: "/aerocomms/mockups/mento3.webp",
    icon: Building2,
    items: [
      "Comparación de opciones reales",
      "Preguntas clave a escuelas",
      "Contrato y condiciones",
      "Plan de acción concreto",
    ],
  },
] as const;

const PROCESS_STEPS = [
  {
    step: "01",
    title: "Nos cuentas tu situación",
    text: "Rellenas un breve formulario para entender tu caso real.",
  },
  {
    step: "02",
    title: "Revisamos ruta, costes y opciones",
    text: "Analizamos tu caso y te damos claridad con datos reales y experiencia.",
  },
  {
    step: "03",
    title: "Sales con próximos pasos claros",
    text: "Te llevas un plan concreto para tomar la mejor decisión.",
  },
] as const;

const TESTIMONIALS = [
  {
    quote: "Me ayudó a entender qué ruta tenía más sentido para mi situación.",
    author: "Aspirante a piloto",
  },
  {
    quote: "Salí con una lista clara de preguntas para hacer a las escuelas.",
    author: "Alumno modular",
  },
  {
    quote: "Me hizo ver costes y riesgos que no estaba teniendo en cuenta.",
    author: "Futuro piloto",
  },
] as const;

const TEAM = [
  {
    id: "jorge-feliu",
    name: "Jorge Feliu",
    role: "First Officer B737",
    text: "Experiencia real en aerolínea y formación de pilotos.",
    image: "/jorge.webp",
  },
  {
    id: "carlos-vaello",
    name: "Carlos Vaello",
    role: "Commercial Pilot",
    text: "Experiencia en formación aeronáutica y apoyo a futuros pilotos.",
    image: "/pollo.jpg",
  },
] as const;

const SECTION_LIGHT_BG = "bg-[#F7F8FA]";

export default function MentoriasPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#0f1a33]">
      <FlyPathPlatformHeader pageTitle="Mentorías" currentModuleId="mentorias" />

      <main>
        {/* 1. Hero — server rendered, LCP image preloaded */}
        <section className="relative isolate min-h-0 overflow-hidden bg-[#06111F]">
          <div aria-hidden className="absolute inset-0 overflow-hidden">
            <Image
              src={HERO_BG}
              alt=""
              width={1695}
              height={928}
              preload
              sizes="100vw"
              className="absolute left-1/2 top-1/2 max-w-none"
              style={{
                minWidth: "100%",
                minHeight: "100%",
                width: "auto",
                height: "auto",
                transform: "translate(-62%, -50%)",
              }}
            />
          </div>
          <div
            className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,18,37,0.88)_0%,rgba(7,18,37,0.65)_35%,rgba(7,18,37,0.20)_60%,rgba(7,18,37,0.05)_100%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#06111F]/55 to-transparent sm:h-20 lg:hidden"
            aria-hidden
          />

          <div className="relative z-[1] mx-auto max-w-7xl px-6 py-10 sm:py-12 lg:px-10 lg:py-12 lg:pb-14">
            <div className="flex flex-col gap-7 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:items-center lg:gap-10">
              <div className="min-w-0 lg:max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D6AE4F]">
                  MENTORÍAS FLYPATH
                </p>
                <h1 className="mt-4 text-[2rem] font-semibold leading-[1.14] tracking-tight text-white sm:text-[2.5rem] lg:text-[2.85rem] lg:leading-[1.08]">
                  Antes de pagar una escuela,{" "}
                  <span className="text-[#D6AE4F]">entiende tu ruta.</span>
                </h1>
                <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-100/90 sm:text-[16.5px]">
                  Revisamos tu situación real —edad, presupuesto, tiempo, inglés y objetivos— para
                  ayudarte a tomar la mejor decisión con criterio antes de comprometer miles de euros.
                </p>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  {HERO_BADGES.map(({ label, icon: Icon }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-2 rounded-full border border-[#D6AE4F]/40 bg-[#0f1a33]/80 px-3.5 py-2 text-[12.5px] font-semibold text-white/90 shadow-[0_4px_14px_rgba(0,0,0,0.2)] backdrop-blur-sm transition hover:border-[#D6AE4F]/60"
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 text-[#D6AE4F]" aria-hidden />
                      {label}
                    </span>
                  ))}
                </div>

                {/* Native anchors keep the booking CTA independent from client state. */}
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <a
                    href={FLYPATH_MENTORIA_CALCOM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-[#c9a454] bg-[#c9a454] px-7 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_12px_36px_rgba(201,164,84,0.4)] transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 shrink-0 text-[#0f1a33]"
                      aria-hidden
                    >
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                      <line x1="16" x2="16" y1="2" y2="6" />
                      <line x1="8" x2="8" y1="2" y2="6" />
                      <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                    Reservar mentoría
                  </a>
                  <a
                    href="#como-funciona-mentorias"
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-7 py-3 text-[15px] font-semibold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    Ver cómo funciona
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </a>
                </div>
              </div>

              <div className="hidden w-full overflow-hidden rounded-[20px] border border-[rgba(212,175,55,0.45)] bg-[#0f1a33]/75 shadow-[0_20px_50px_rgba(0,0,0,0.4),0_0_28px_rgba(212,175,55,0.1)] backdrop-blur-md sm:block sm:rounded-[24px] lg:mt-0 lg:justify-self-end">
                <div className="border-b border-white/10 px-5 py-3.5 sm:px-6 sm:py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D6AE4F]">
                    DIAGNÓSTICO DE RUTA
                  </p>
                </div>
                <ul className="divide-y divide-white/10 px-5 sm:px-6">
                  {HERO_DIAGNOSIS_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li
                        key={item.label}
                        className="flex items-center gap-2.5 py-3 first:pt-3.5 last:pb-3.5"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-[#D6AE4F]" aria-hidden />
                        <span className="min-w-0 flex-1 text-[13.5px] leading-snug text-white/90 sm:text-[14px]">
                          {item.label}
                        </span>
                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${DIAGNOSIS_PILL_CLASS[item.tone]}`}
                        >
                          {item.status}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="border-t border-white/10 px-5 py-3.5 sm:px-6 sm:py-4">
                  <p className="text-[13px] leading-relaxed text-white/65">
                    Te ayudamos a analizar cada punto antes de tomar una decisión.
                  </p>
                  <div
                    className="mt-3.5 h-px w-full bg-gradient-to-r from-transparent via-[#D6AE4F]/70 to-transparent"
                    aria-hidden
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Para quién es — static */}
        <section className={`border-t border-[#071224]/[0.06] ${SECTION_LIGHT_BG} py-12 sm:py-14`}>
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B8923F]">
                PARA QUIÉN ES
              </p>
              <h2 className="mt-2 text-2xl font-semibold leading-[1.12] tracking-tight text-[#071224] sm:text-3xl">
                Para quién es esta mentoría
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[#4B5563] sm:text-base">
                Si te sientes identificado con alguna de estas situaciones, esta mentoría es para ti.
              </p>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
              {AUDIENCE.map((b) => {
                const Icon = b.icon;
                return (
                  <article
                    key={b.title}
                    className="flex h-full flex-col items-center rounded-2xl border border-[#071224]/[0.08] bg-white px-2.5 py-4 text-center shadow-[0_8px_28px_rgba(7,18,36,0.06)] transition hover:border-[#071224]/[0.12] hover:shadow-[0_12px_36px_rgba(7,18,36,0.09)] sm:p-7"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FBF6EC] text-[#D6AE4F] ring-1 ring-[#D6AE4F]/20 sm:h-[3.75rem] sm:w-[3.75rem]">
                      <Icon className="h-7 w-7 sm:h-9 sm:w-9" aria-hidden />
                    </span>
                    <h3 className="mt-3 text-[13px] font-semibold leading-snug text-[#071224] sm:mt-5 sm:text-base">
                      {b.title}
                    </h3>
                    <p className="mt-1.5 text-[11px] leading-snug text-[#4B5563] sm:mt-2 sm:text-[14px] sm:leading-relaxed">
                      {b.text}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. Qué revisamos — static with images */}
        <section
          id="que-revisamos-mentorias"
          className={`border-t border-[#071224]/[0.06] ${SECTION_LIGHT_BG} py-12 sm:py-14 lg:py-16`}
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B8923F]">
                QUÉ REVISAMOS EN TU CASO
              </p>
              <h2 className="mt-2 text-2xl font-semibold leading-[1.12] tracking-tight text-[#071224] sm:text-3xl">
                Analizamos tu situación a fondo
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[#4B5563] sm:text-base">
                No damos respuestas genéricas. Revisamos tu situación real: ruta, presupuesto, tiempo
                disponible, escuelas candidatas y próximos pasos.
              </p>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:mt-10 lg:grid-cols-3 lg:gap-6">
              {MENTORSHIP_WORK.map((block) => {
                const Icon = block.icon;
                return (
                  <article
                    key={block.title}
                    className="relative flex h-full overflow-hidden rounded-2xl border border-[#071224]/[0.08] shadow-[0_12px_36px_rgba(7,18,36,0.1)]"
                  >
                    <Image
                      src={block.image}
                      alt=""
                      aria-hidden
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(0deg, rgba(7, 18, 37, 0.45) 0%, rgba(7, 18, 37, 0.12) 65%, rgba(7, 18, 37, 0.04) 100%), linear-gradient(90deg, rgba(7, 18, 37, 0.58) 0%, rgba(7, 18, 37, 0.42) 45%, rgba(7, 18, 37, 0.22) 100%)",
                      }}
                      aria-hidden
                    />
                    <div className="relative z-[1] w-full px-4 py-3 sm:px-5 sm:py-3">
                      <div className="flex w-full items-start gap-2.5 sm:gap-3">
                        <Icon
                          className="mt-0.5 h-9 w-9 shrink-0 text-[#D6AE4F] drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]"
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[17px] font-semibold leading-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)] sm:text-[18px]">
                            {block.title}
                          </h3>
                          <ul className="mt-2 space-y-1.5">
                            {block.items.map((item) => (
                              <li
                                key={item}
                                className="flex items-center gap-2 text-[14px] leading-[1.4] text-white/92 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] sm:text-[15px]"
                              >
                                <span
                                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#D6AE4F]/25 ring-1 ring-[#D6AE4F]/55"
                                  aria-hidden
                                >
                                  <Check className="h-2.5 w-2.5 stroke-[3] text-[#D6AE4F]" />
                                </span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. Cómo funciona — desktop static + mobile client island */}
        <section
          id="como-funciona-mentorias"
          className={`border-t border-[#071224]/[0.06] ${SECTION_LIGHT_BG} py-10 sm:py-12`}
        >
          <div className="mx-auto max-w-5xl px-6 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B8923F]">
                CÓMO FUNCIONA
              </p>
              <h2 className="mt-2 text-2xl font-semibold leading-[1.12] tracking-tight text-[#071224] sm:text-3xl">
                Un proceso claro en 3 pasos
              </h2>
            </div>

            <div className="relative mt-8 sm:mt-10">
              {/* Dashed connector line — desktop only */}
              <div
                className="pointer-events-none absolute inset-x-6 top-6 hidden items-center sm:flex lg:inset-x-10"
                aria-hidden
              >
                <div className="ml-[calc(16.666%-1.5rem)] flex flex-1 items-center">
                  <div className="h-0 flex-1 border-t border-dashed border-[#D6AE4F]/80" />
                  <Plane className="ml-1.5 h-4 w-4 shrink-0 rotate-90 text-[#D6AE4F]" aria-hidden />
                </div>
              </div>

              {/* Mobile carousel — client island */}
              <MentoriasMobileProcess steps={PROCESS_STEPS} />

              {/* Desktop grid — static */}
              <div className="hidden gap-6 sm:grid sm:grid-cols-3">
                {PROCESS_STEPS.map((step) => (
                  <div key={step.step} className="relative flex flex-col items-center text-center">
                    <span className="relative z-[1] flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#D6AE4F]/55 bg-white text-[15px] font-semibold text-[#0f1a33] shadow-[0_4px_16px_rgba(7,18,36,0.08)]">
                      {step.step}
                    </span>
                    <h3 className="mt-4 text-[16px] font-semibold leading-snug text-[#071224] sm:text-[17px]">
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-[260px] text-[14px] leading-relaxed text-[#4B5563] sm:text-[15px]">
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 5. Modalidades / Pricing — client island (toast + cal links) */}
        <MentoriasPricingSection />

        {/* 6. Equipo — server component */}
        <FlyPathTeamSection
          title="Te ayudamos desde experiencia real"
          description="Te ayudamos desde experiencia real en aviación, formación y toma de decisiones, con un enfoque claro: evitar humo y ayudarte a decidir con criterio."
          members={TEAM}
          sectionClassName={SECTION_LIGHT_BG}
        />

        {/* 7. Reviews — mobile client island + desktop static */}
        <section className={`border-t border-[#071224]/[0.06] ${SECTION_LIGHT_BG} py-10 sm:py-12`}>
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <h2 className="text-center text-xl font-semibold tracking-tight text-[#071224] sm:text-2xl">
              Lo que más valoran quienes ya han pedido orientación
            </h2>

            <div className="mt-7">
              {/* Mobile carousel — client island */}
              <MentoriasMobileReviews reviews={TESTIMONIALS} />

              {/* Desktop grid — static */}
              <div className="hidden gap-4 md:grid md:grid-cols-3">
                {TESTIMONIALS.map((t) => (
                  <figure
                    key={t.author}
                    className="rounded-xl border border-white/10 bg-header-navy p-4 shadow-[0_14px_34px_rgba(7,18,36,0.16)] sm:p-5"
                  >
                    <p className="text-sm tracking-wide text-[#D6AE4F]" aria-label="5 estrellas">
                      ★★★★★
                    </p>
                    <blockquote className="mt-2 text-[15px] leading-relaxed text-white/80">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-3 text-[13px] font-semibold text-[#D6AE4F]">
                      {t.author}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
