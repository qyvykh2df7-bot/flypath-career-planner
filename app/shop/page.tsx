"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ComponentType, type MouseEvent } from "react";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  ExternalLink,
  GraduationCap,
  Languages,
  Menu,
  Plane,
  Sparkles,
  Users,
} from "lucide-react";

const TOAST_MS = 2800;
const AMAZON_TOAST = "Enlace de Amazon próximamente";

const AMAZON_LINKS = {
  pilot: "#",
  student: "#",
  flightTraining: "#",
  professional: "#",
} as const;

const PLATFORM_MODULES = [
  { id: "inicio", label: "Inicio", status: "available" as const, href: "/" },
  { id: "guia", label: "Guía Cómo ser piloto", status: "available" as const, href: "/guia-como-ser-piloto" },
  { id: "planifica", label: "Planifica tu ruta", status: "available" as const, href: "/" },
  { id: "compara", label: "Compara escuelas", status: "available" as const, href: "/schools" },
  {
    id: "opiniones",
    label: "Opiniones de escuelas",
    status: "available" as const,
    href: "/opiniones-escuelas",
  },
  { id: "atpl", label: "ATPL Planner", status: "soon" as const },
  { id: "ingles", label: "Inglés aeronáutico", status: "available" as const, href: "/ingles-aeronautico" },
  { id: "clases", label: "Clases PPL/ATPL", status: "available" as const, href: "/clases-ppl-atpl" },
  { id: "mentorias", label: "Mentorías", status: "available" as const, href: "/mentorias" },
  { id: "shop", label: "Shop", status: "available" as const, href: "/shop" },
  { id: "blog", label: "Blog", status: "available" as const, href: "/blog" },
];

const CURRENT_ITEM_ID = "shop";

const CATEGORIES = [
  { id: "todos", label: "Todo" },
  { id: "guia", label: "Guía" },
  { id: "mentorias", label: "Mentorías" },
  { id: "clases", label: "Clases" },
  { id: "logbooks", label: "Logbooks" },
] as const;

type ShopCategory = (typeof CATEGORIES)[number]["id"];

type ImageSlotSize = "service" | "logbook";

function ProductImageSlot({
  src,
  alt,
  fallbackIcon: FallbackIcon,
  size = "service",
}: {
  src: string;
  alt: string;
  fallbackIcon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  size?: ImageSlotSize;
}) {
  const [failed, setFailed] = useState(false);

  const shellClass =
    size === "logbook"
      ? "relative aspect-[4/3] w-full shrink-0 overflow-hidden border-b border-slate-100/80 bg-gradient-to-br from-[#f4f7fb] to-[#e8edf4]"
      : "relative aspect-[16/10] w-full shrink-0 overflow-hidden border-b border-slate-100/80 bg-gradient-to-r from-[#f8fafc] via-[#f4f7fb] to-[#eef2f8]";

  const iconClass = size === "logbook" ? "h-10 w-10 sm:h-11 sm:w-11" : "h-10 w-10 sm:h-12 sm:w-12";

  return (
    <div className={shellClass}>
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full min-h-[inherit] w-full items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff8e8] ring-1 ring-[#c9a454]/25">
            <FallbackIcon className={`${iconClass} text-[#c9a454]`} aria-hidden />
          </div>
        </div>
      )}
    </div>
  );
}

function ShopHeroBackground() {
  const [failed, setFailed] = useState(false);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/shop.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f1a33] via-[#152440] to-[#1a2d52]" />
      )}
      {failed ? <div className="absolute inset-0 bg-[#0f1a33]/85" /> : null}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${
          failed
            ? "from-[#0f1a33]/90 via-[#0f1a33]/75 to-[#0f1a33]/55"
            : "from-[#071226]/80 via-[#0f1a33]/40 to-[#0f1a33]/15"
        }`}
      />
      <div
        className={`absolute inset-0 bg-gradient-to-t sm:hidden ${
          failed
            ? "from-[#0f1a33]/80 via-[#0f1a33]/35 to-transparent"
            : "from-[#071226]/65 via-[#0f1a33]/20 to-transparent"
        }`}
      />
    </div>
  );
}

function GuideCoverImage() {
  const [failed, setFailed] = useState(false);

  return (
    <div className="mx-auto w-full max-w-[200px] sm:max-w-[240px] md:mx-0">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-gradient-to-br from-[#eef2f8] to-[#e2e8f0] shadow-[0_16px_48px_rgba(15,26,51,0.14)] ring-1 ring-slate-200/70">
        {!failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/como-ser-piloto-cover.jpeg"
            alt="Portada de la guía Cómo ser Piloto"
            className="h-full w-full object-contain object-center p-2"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="h-16 w-16 text-[#c9a454]" aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [logoFallback, setLogoFallback] = useState(false);
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ShopCategory>("todos");
  const moduleMenuRef = useRef<HTMLDivElement>(null);

  const showGuide = activeCategory === "todos" || activeCategory === "guia";
  const showMentorias = activeCategory === "todos" || activeCategory === "mentorias";
  const showClases = activeCategory === "todos" || activeCategory === "clases";
  const showLogbooks = activeCategory === "todos" || activeCategory === "logbooks";
  const showServiciosSection = showMentorias || showClases;

  const scrollToRecursos = useCallback(() => {
    setActiveCategory("todos");
    document.getElementById("recursos-flypath")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const handleAmazonClick = useCallback((e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href === "#") {
      e.preventDefault();
      setToast(AMAZON_TOAST);
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast((t) => (t === toast ? null : t)), TOAST_MS);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!moduleMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = moduleMenuRef.current;
      if (el && !el.contains(e.target as Node)) setModuleMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [moduleMenuOpen]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f7fb] text-[#0f1a33]">
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-3 top-3 z-50 max-w-[min(22rem,calc(100vw-1.5rem))] rounded-lg border border-[#c9a454]/35 bg-[#0f1a33] px-4 py-2.5 text-[15px] text-white shadow-lg sm:right-5 sm:top-5"
        >
          {toast}
        </div>
      ) : null}

      <header className="border-b border-white/10 bg-[#0f1a33] text-white shadow-[0_12px_40px_rgba(15,26,51,0.35)]">
        <div className="mx-auto flex max-h-[90px] max-w-7xl items-center justify-between gap-3 px-6 py-3 sm:gap-4 md:justify-normal md:gap-4 lg:px-10">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:flex-none md:min-w-0 md:flex-1 md:justify-start">
            <Link href="/" className="min-w-0 shrink">
              {!logoFallback ? (
                <div className="relative flex h-12 max-h-[60px] w-[180px] shrink-0 items-center sm:h-[54px] sm:max-h-[58px] sm:w-[220px] md:max-h-[60px] md:w-[252px] lg:w-[268px]">
                  <Image
                    src="/flypath-logo-white.png"
                    alt="FlyPath — inicio"
                    width={540}
                    height={162}
                    className="h-auto max-h-12 w-auto max-w-full object-contain object-left sm:max-h-[54px] md:max-h-[58px] lg:max-h-[60px]"
                    priority
                    onError={() => setLogoFallback(true)}
                  />
                </div>
              ) : (
                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#c9a454]/15 ring-1 ring-[#c9a454]/35">
                    <Plane className="h-4 w-4 text-[#f2ddaa]" aria-hidden />
                  </div>
                  <p className="truncate text-sm font-semibold tracking-tight text-white sm:text-base">
                    FlyPath
                  </p>
                </div>
              )}
            </Link>
          </div>
          <p
            className="pointer-events-none hidden min-w-0 select-none truncate text-center text-sm font-medium tracking-[0.14em] text-[#f2ddaa]/90 md:flex md:flex-1 md:items-center md:justify-center"
            aria-hidden
          >
            Shop
          </p>
          <div ref={moduleMenuRef} className="relative shrink-0 md:flex md:min-w-0 md:flex-1 md:justify-end">
            <button
              type="button"
              onClick={() => setModuleMenuOpen((open) => !open)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] text-white transition-colors hover:border-white/24 hover:bg-white/[0.14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a454]/55"
              aria-expanded={moduleMenuOpen}
              aria-haspopup="listbox"
              aria-label="Menú de módulos FlyPath Platform"
            >
              <Menu className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden />
            </button>
            {moduleMenuOpen ? (
              <ul
                role="listbox"
                className="absolute right-0 z-20 mt-2 max-h-[calc(100vh-120px)] w-[min(22rem,calc(100vw-2rem))] max-w-[min(96vw,26rem)] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200/90 bg-white px-1.5 py-2 shadow-[0_24px_52px_rgba(15,26,51,0.11),0_12px_32px_rgba(15,26,51,0.06)] ring-1 ring-slate-200/45"
              >
                {PLATFORM_MODULES.map((m) => {
                  const isSoon = m.status === "soon";
                  const isCurrent = m.id === CURRENT_ITEM_ID;
                  const hasHref = "href" in m && typeof m.href === "string" && m.href.length > 0;
                  const isClickable = hasHref || isSoon;
                  return (
                    <li key={m.id} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={isCurrent}
                        onClick={() => {
                          setModuleMenuOpen(false);
                          if (hasHref && m.href) {
                            router.push(m.href);
                            return;
                          }
                          if (isSoon) setToast("Próximamente");
                        }}
                        className={`flex w-full items-center justify-between gap-8 rounded-lg px-3.5 py-2.5 text-left transition-colors ${
                          isClickable ? "cursor-pointer" : "cursor-not-allowed"
                        } ${isCurrent ? "bg-[#fff8e8]" : ""}`}
                      >
                        <span
                          className={`min-w-0 flex-1 truncate text-[0.9375rem] font-medium leading-snug ${
                            isSoon ? "text-slate-500" : isCurrent ? "text-[#7a5a16]" : "text-slate-700"
                          }`}
                        >
                          {m.label}
                        </span>
                        {isSoon ? (
                          <span className="shrink-0 pl-1 text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400">
                            Próximamente
                          </span>
                        ) : isCurrent ? (
                          <span className="shrink-0 pl-1 text-[9px] font-medium uppercase tracking-[0.14em] text-[#a5802a]">
                            Actual
                          </span>
                        ) : (
                          <span className="shrink-0 pl-1 text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400">
                            Disponible
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden border-b border-[#0f1a33]/20">
          <ShopHeroBackground />
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
              <button
                type="button"
                onClick={scrollToRecursos}
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-7 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_10px_32px_rgba(201,164,84,0.35)] transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
              >
                Ver recursos
              </button>
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

        {/* Categorías rápidas */}
        <section
          id="recursos-flypath"
          className="scroll-mt-20 border-b border-slate-200/70 bg-white py-3.5 sm:py-4"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Explora por categoría
            </p>
            <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto overscroll-x-contain px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/45 ${
                      isActive
                        ? "border-[#c9a454] bg-[#fff8e8] text-[#7a5a16] shadow-sm"
                        : "border-slate-200/90 bg-[#f8fafc] text-slate-600 hover:border-[#c9a454]/40 hover:bg-[#fffdf8] hover:text-[#7a5a16]"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {showGuide ? (
        <section id="guia" className="scroll-mt-20 border-b border-slate-200/70 bg-[#f8fafc] py-9 sm:py-11">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <h2 className="text-xl font-semibold tracking-tight text-[#0f1a33] sm:text-2xl">
              Empieza por entender el camino
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600 sm:text-base">
              Antes de comparar escuelas o pagar matrícula, entiende las rutas, licencias, costes y errores
              habituales.
            </p>

            <article className="mt-7 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_32px_rgba(15,26,51,0.06)] ring-1 ring-slate-200/50">
              <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-10 md:p-8">
                <GuideCoverImage />
                <div className="flex flex-col justify-center md:py-2">
                  <span className="inline-flex w-fit rounded-full border border-[#c9a454]/40 bg-[#fff8e8] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
                    Recomendado para empezar
                  </span>
                  <h3 className="mt-3 text-xl font-semibold text-[#0f1a33] sm:text-2xl">Guía Cómo ser Piloto</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                    La guía para entender cómo llegar a piloto: rutas de formación, costes, tiempos, requisitos
                    y decisiones importantes antes de elegir escuela.
                  </p>
                  <Link
                    href="/guia-como-ser-piloto"
                    className="mt-5 inline-flex min-h-[44px] w-fit items-center justify-center gap-2 rounded-2xl border border-[#c9a454] bg-[#c9a454] px-6 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
                  >
                    Ver guía
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </section>
        ) : null}

        {showServiciosSection ? (
        <section id="servicios-flypath" className="scroll-mt-20 border-b border-slate-200/70 bg-white py-9 sm:py-11">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <h2 className="text-xl font-semibold tracking-tight text-[#0f1a33] sm:text-2xl">Servicios FlyPath</h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600 sm:text-base">
              Mentorías y clases para resolver dudas, tomar mejores decisiones y avanzar con más seguridad.
            </p>

            {showMentorias ? (
            <div id="mentorias-productos" className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
              <ServiceCard
                icon={Users}
                imageSrc="/shop/mentoria-individual.jpg"
                imageAlt="Mentoría individual FlyPath"
                title="Mentoría individual"
                price="44,95 €"
                description="Una sesión para revisar tu caso, resolver dudas concretas y salir con próximos pasos claros."
                cta="Ver mentoría"
                href="/mentorias"
              />
              <ServiceCard
                icon={Sparkles}
                imageSrc="/shop/acompanamiento-flypath.jpg"
                imageAlt="Acompañamiento FlyPath"
                title="Acompañamiento FlyPath"
                price="A consultar"
                badge="Seguimiento"
                description="Seguimiento para decisiones que no se resuelven en una sola llamada: ruta, escuelas, presupuesto, documentación y próximos pasos."
                cta="Solicitar acompañamiento"
                href="/mentorias#acompanamiento-flypath"
              />
            </div>
            ) : null}

            {showClases ? (
            <div
              id="clases-productos"
              className={`grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 ${showMentorias ? "mt-4" : "mt-7"}`}
            >
              <ServiceCard
                icon={Languages}
                imageSrc="/shop/ingles-aeronautico.jpg"
                imageAlt="Inglés aeronáutico FlyPath"
                title="Inglés aeronáutico"
                price="Desde 49 €"
                description="Clases prácticas de comunicaciones ATC, fraseología, listening, speaking e ICAO English aplicado a aviación."
                cta="Ver clases"
                href="/ingles-aeronautico"
              />
              <ServiceCard
                icon={GraduationCap}
                imageSrc="/shop/clases-ppl-atpl.jpg"
                imageAlt="Clases PPL/ATPL FlyPath"
                title="Clases PPL/ATPL"
                price="Desde 49 €"
                description="Apoyo para asignaturas, dudas concretas, preparación de examen y planificación del estudio."
                cta="Ver clases"
                href="/clases-ppl-atpl"
              />
            </div>
            ) : null}
          </div>
        </section>
        ) : null}

        {showLogbooks ? (
        <section id="logbooks" className="scroll-mt-20 border-b border-slate-200/70 bg-[#eef2f8] py-9 sm:py-11">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <h2 className="text-xl font-semibold tracking-tight text-[#0f1a33] sm:text-2xl">Logbooks</h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600 sm:text-base">
              Cuadernos para registrar horas, vuelos, formación y progreso como piloto.
            </p>

            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <LogbookCard
                title="Pilot Logbook"
                description="Cuaderno para registrar horas de vuelo, experiencia y progreso como piloto."
                imageSrc="/shop/logbook-pilot.jpg"
                href={AMAZON_LINKS.pilot}
                onAmazonClick={handleAmazonClick}
              />
              <LogbookCard
                title="Student Pilot Logbook"
                description="Logbook pensado para alumnos piloto y seguimiento de formación."
                imageSrc="/shop/logbook-student-pilot.jpg"
                href={AMAZON_LINKS.student}
                onAmazonClick={handleAmazonClick}
              />
              <LogbookCard
                title="Flight Training Logbook"
                description="Registro práctico para vuelos de instrucción, ejercicios y progreso durante la formación."
                imageSrc="/shop/logbook-flight-training.jpg"
                href={AMAZON_LINKS.flightTraining}
                onAmazonClick={handleAmazonClick}
              />
              <LogbookCard
                title="Professional Pilot Logbook"
                description="Formato pensado para pilotos que quieren llevar un registro ordenado de su experiencia."
                imageSrc="/shop/logbook-professional-pilot.jpg"
                href={AMAZON_LINKS.professional}
                onAmazonClick={handleAmazonClick}
              />
            </div>

            <p className="mt-6 text-[13px] leading-relaxed text-slate-500">
              Los logbooks se compran a través de Amazon.
            </p>
          </div>
        </section>
        ) : null}

        {/* CTA final */}
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
              <Link
                href="/mentorias"
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-8 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#c9a454]/45 hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35 sm:w-auto"
              >
                Reservar mentoría
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ServiceCard({
  icon: Icon,
  imageSrc,
  imageAlt,
  title,
  price,
  badge,
  description,
  cta,
  href,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  imageSrc: string;
  imageAlt: string;
  title: string;
  price: string;
  badge?: string;
  description: string;
  cta: string;
  href: string;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(15,26,51,0.05)]">
      <ProductImageSlot src={imageSrc} alt={imageAlt} fallbackIcon={Icon} size="service" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-[#0f1a33]">{title}</h3>
          {badge ? (
            <span className="rounded-full border border-[#c9a454]/35 bg-[#fff8e8] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7a5a16]">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-[15px] font-semibold text-[#7a5a16]">{price}</p>
        <p className="mt-2 flex-1 text-[15px] leading-relaxed text-slate-600">{description}</p>
        <Link
          href={href}
          className="mt-4 inline-flex min-h-[44px] w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] font-semibold text-[#0f1a33] transition hover:border-[#c9a454]/45 hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
        >
          {cta}
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

function LogbookCard({
  title,
  description,
  imageSrc,
  href,
  onAmazonClick,
}: {
  title: string;
  description: string;
  imageSrc: string;
  href: string;
  onAmazonClick: (e: MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200/75 bg-white shadow-sm">
      <ProductImageSlot src={imageSrc} alt={title} fallbackIcon={ClipboardList} size="logbook" />
      <div className="flex flex-1 flex-col p-4">
        <span className="inline-flex w-fit rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-800">
          Amazon
        </span>
        <h3 className="mt-2 text-base font-semibold text-[#0f1a33]">{title}</h3>
        <p className="mt-1.5 flex-1 text-[14px] leading-relaxed text-slate-600">{description}</p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => onAmazonClick(e, href)}
          className="mt-3 inline-flex min-h-[40px] w-fit items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-[13px] font-semibold text-[#0f1a33] transition hover:border-[#c9a454]/40 hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
        >
          Ver en Amazon
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
        </a>
      </div>
    </article>
  );
}
