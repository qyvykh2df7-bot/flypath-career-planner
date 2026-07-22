"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { scrollCarouselToIndex } from "@/components/aerocomms/aerocomms-carousel";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    badge: null,
    price: "Gratis",
    description: "Para empezar a practicar fundamentos de radio.",
    features: [
      "Ejercicios básicos de listening",
      "Primeros readbacks",
      "Fraseología esencial",
      "Progreso local básico",
    ],
    cta: "Empezar gratis",
    href: "#training",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Más completo",
    price: "€5,99/mes",
    description: "Acceso completo a módulos, escenarios y feedback avanzado.",
    features: [
      "Todos los niveles de entrenamiento",
      "Escenarios guiados completos",
      "Feedback detallado",
      "Seguimiento de habilidades",
      "Práctica de fraseología y readbacks",
    ],
    cta: "Desbloquear AeroComms Pro",
    href: "/aerocomms/app/paywall",
    highlighted: true,
  },
  {
    id: "schools",
    name: "Schools",
    badge: null,
    price: "A medida",
    description: "Para escuelas, instructores o grupos de alumnos.",
    features: [
      "Acceso para varios estudiantes",
      "Panel de progreso",
      "Ejercicios guiados por nivel",
      "Soporte para formación estructurada",
    ],
    cta: "Contactar",
    href: "mailto:hola@flypath.es?subject=AeroComms%20Schools",
    highlighted: false,
  },
] as const;

type Plan = (typeof PLANS)[number];

function PlanFeatures({
  features,
  light,
}: {
  features: readonly string[];
  light?: boolean;
}) {
  return (
    <ul className="mt-6 space-y-3">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              light ? "bg-[#c9a454]/20" : "bg-[#c9a454]/12"
            }`}
          >
            <Check
              className={`h-3 w-3 ${light ? "text-[#f2ddaa]" : "text-[#7a5a16]"}`}
              aria-hidden
            />
          </span>
          <span className={`text-[14px] leading-snug md:text-[15px] xl:text-[14px] 2xl:text-[16px] 2xl:leading-[1.6] ${light ? "text-slate-200" : "text-[#4B5563]"}`}>
            {feature}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PricingCard({ plan, className }: { plan: Plan; className?: string }) {
  const isHighlighted = plan.highlighted;

  return (
    <div
      className={`${
        isHighlighted
          ? "relative flex h-full flex-col rounded-[28px] border border-white/[0.08] bg-[#06111f] p-8 shadow-[0_20px_56px_rgba(7,18,36,0.18)] xl:-my-3 xl:p-10 2xl:p-10"
          : "flex h-full flex-col rounded-[28px] border border-[rgba(15,23,42,0.08)] bg-white/70 p-8 xl:p-9 2xl:p-8"
      } ${className ?? ""}`}
    >
      {plan.badge ? (
        <span className="mb-4 inline-flex w-fit rounded-full bg-[#c9a454]/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#f2ddaa]">
          {plan.badge}
        </span>
      ) : (
        <span className="mb-4 block h-[26px]" aria-hidden />
      )}

      <p
        className={`text-[13px] font-semibold uppercase tracking-[0.14em] 2xl:text-[24px] ${
          isHighlighted ? "text-[#f2ddaa]/80" : "text-[#B8923F]"
        }`}
      >
        {plan.name}
      </p>
      <p
        className={`mt-2 text-[2rem] font-semibold leading-none tracking-tight 2xl:text-[34px] ${
          isHighlighted ? "text-white" : "text-[#071224]"
        }`}
      >
        {plan.price}
      </p>
      <p
        className={`mt-3 text-[14px] leading-relaxed md:text-[15px] xl:text-[14px] 2xl:text-[16px] 2xl:leading-[1.65] ${
          isHighlighted ? "text-slate-300" : "text-[#4B5563]"
        }`}
      >
        {plan.description}
      </p>

      <PlanFeatures features={plan.features} light={isHighlighted} />

      <Link
        href={plan.href}
        className={
          isHighlighted
            ? "mt-8 inline-flex items-center justify-center rounded-[14px] bg-[#D6AE4F] px-6 py-3.5 text-[14px] font-bold tracking-tight text-[#06111f] transition duration-200 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/45 2xl:h-[52px] 2xl:text-[15px]"
            : "mt-8 inline-flex items-center justify-center rounded-[14px] border border-[rgba(15,23,42,0.12)] bg-white px-6 py-3.5 text-[14px] font-semibold text-[#071224] transition hover:border-[rgba(15,23,42,0.2)] hover:bg-[#f8f8f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/30 2xl:h-[52px] 2xl:text-[15px]"
        }
      >
        {plan.cta}
      </Link>
    </div>
  );
}

export function AeroCommsPricing() {
  const pricingCarouselRef = useRef<HTMLDivElement | null>(null);
  const [activePricing, setActivePricing] = useState(1);

  const handlePricingScroll = () => {
    const el = pricingCarouselRef.current;
    if (!el) return;

    const children = Array.from(el.children) as HTMLElement[];
    if (!children.length) return;

    const center = el.scrollLeft + el.clientWidth / 2;

    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    children.forEach((child, index) => {
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const distance = Math.abs(center - childCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActivePricing(closestIndex);
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollCarouselToIndex(pricingCarouselRef.current, 1);
    });
  }, []);

  return (
    <section className="border-t border-[rgba(15,23,42,0.05)] bg-[#f8f8f6]">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-14 sm:px-8 lg:px-10 lg:py-20 2xl:max-w-[1320px] 2xl:py-16">
        <div className="mx-auto max-w-[720px] text-center">
          <h2 className="text-balance text-[1.85rem] font-semibold leading-[1.12] tracking-tight text-[#071224] sm:text-[2.35rem] lg:text-[2.5rem] xl:text-[2.65rem] 2xl:text-[52px] 2xl:leading-[1.05]">
            Planes para entrenar a tu ritmo.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[#4B5563] sm:text-[16px] xl:text-[18px] xl:leading-[1.65]">
            Empieza con lo esencial y desbloquea entrenamientos completos cuando estés listo.
          </p>
        </div>

        {/* Mobile (<768px) — stacked cards, Pro first */}
        <div className="mx-auto mt-12 grid grid-cols-1 gap-5 md:hidden">
          {[PLANS[1], PLANS[0], PLANS[2]].map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              className="mx-auto w-full max-w-[520px]"
            />
          ))}
        </div>

        {/* Tablet (768px–1279px) — horizontal carousel, Pro centered by default */}
        <div className="mt-12 md:block xl:hidden">
          <div
            ref={pricingCarouselRef}
            onScroll={handlePricingScroll}
            className="-mx-6 hidden snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-[20vw] pb-4 [scrollbar-width:none] md:flex xl:hidden [&::-webkit-scrollbar]:hidden"
            style={{ scrollPaddingInline: "20vw" }}
            aria-label="Planes de AeroComms"
          >
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className="w-[64vw] max-w-[390px] shrink-0 snap-center flex-none"
              >
                <PricingCard plan={plan} className="h-full" />
              </div>
            ))}
          </div>

          <div className="mt-4 hidden justify-center gap-2 md:flex xl:hidden">
            {PLANS.map((plan, index) => (
              <span
                key={plan.id}
                aria-label={`Plan ${index + 1}`}
                className={`h-2 rounded-full transition-all ${
                  index === activePricing ? "w-6 bg-slate-900" : "w-2 bg-slate-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Desktop (1280px+) — 3-column grid */}
        <div className="mt-12 hidden grid-cols-3 items-center gap-6 xl:grid 2xl:mt-10 2xl:gap-7">
          {PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}
