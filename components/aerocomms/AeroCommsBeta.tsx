"use client";

import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { scrollCarouselToIndex } from "@/components/aerocomms/aerocomms-carousel";

const TESTIMONIALS = [
  {
    name: "Marta R.",
    role: "Student pilot",
    quote:
      "Me ayuda a practicar readbacks sin depender siempre de una clase o un simulador.",
  },
  {
    name: "Álvaro M.",
    role: "PPL student",
    quote: "La estructura por habilidades hace que sepa exactamente qué estoy entrenando.",
  },
  {
    name: "Laura C.",
    role: "Future pilot",
    quote: "Por fin una forma clara de entender listening, fraseología y escenarios.",
  },
  {
    name: "Daniel V.",
    role: "Airline cadet",
    quote: "El enfoque paso a paso reduce mucho la sensación de bloqueo al hablar por radio.",
  },
  {
    name: "Sergio P.",
    role: "Flight instructor",
    quote: "Tiene sentido para preparar alumnos antes de pasar a escenarios más complejos.",
  },
  {
    name: "Irene G.",
    role: "ATPL student",
    quote: "Me gusta que no sea teoría suelta: todo está conectado con situaciones reales.",
  },
] as const;

const INITIAL_TESTIMONIAL_INDEX = Math.floor(TESTIMONIALS.length / 2);

function TestimonialCard({
  name,
  role,
  quote,
}: {
  name: string;
  role: string;
  quote: string;
}) {
  return (
    <blockquote className="flex h-full flex-col rounded-[20px] border border-[rgba(15,23,42,0.07)] bg-white p-6 shadow-[0_8px_32px_rgba(15,23,42,0.04)] xl:p-6 2xl:p-7">
      <div className="flex gap-0.5" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-[#c9a454] text-[#c9a454]" />
        ))}
      </div>
      <p className="mt-4 flex-1 text-[15px] leading-relaxed text-[#071224] xl:text-[16px] xl:leading-[1.65] 2xl:text-[16px] 2xl:leading-[1.6]">&ldquo;{quote}&rdquo;</p>
      <footer className="mt-5">
        <p className="text-[14px] font-semibold text-[#071224] 2xl:text-[15px]">{name}</p>
        <p className="mt-0.5 text-[13px] text-[#6B7280] 2xl:text-[14px]">{role}</p>
      </footer>
    </blockquote>
  );
}

export function AeroCommsBeta() {
  const [activeTestimonial, setActiveTestimonial] = useState(INITIAL_TESTIMONIAL_INDEX);
  const testimonialsRef = useRef<HTMLDivElement | null>(null);
  const topRow = TESTIMONIALS.slice(0, 3);
  const bottomRow = TESTIMONIALS.slice(3, 6);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollCarouselToIndex(testimonialsRef.current, INITIAL_TESTIMONIAL_INDEX);
    });
  }, []);

  const handleTestimonialsScroll = () => {
    const el = testimonialsRef.current;
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

    setActiveTestimonial(closestIndex);
  };

  return (
    <section id="beta" className="border-t border-[rgba(15,23,42,0.05)] bg-[#f8f8f6]">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-14 sm:px-8 lg:px-10 lg:py-24 2xl:max-w-[1400px] 2xl:py-18">
        <div className="mx-auto max-w-[760px] text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B8923F]">
            Testimonios
          </p>
          <h2 className="mt-3 text-balance text-[1.85rem] font-semibold leading-[1.12] tracking-tight text-[#071224] sm:text-[2.15rem] lg:text-[2.35rem] xl:text-[2.5rem] 2xl:text-[52px] 2xl:leading-[1.05]">
            Feedback de pilotos y estudiantes que entrenan comunicaciones reales.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[#4B5563] sm:text-[16px] xl:text-[18px] xl:leading-[1.65]">
            Primeras impresiones de usuarios que están probando AeroComms para practicar
            listening, readbacks y escenarios guiados.
          </p>
        </div>

        {/* Mobile + tablet: horizontal swipe carousel */}
        <div className="mt-10 xl:hidden">
          <div
            ref={testimonialsRef}
            onScroll={handleTestimonialsScroll}
            className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-[10vw] pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Testimonios de pilotos y estudiantes"
          >
            {TESTIMONIALS.map((item) => (
              <div
                key={item.name}
                className="w-[78vw] max-w-[340px] shrink-0 snap-center flex-none md:w-[42vw] md:max-w-[430px]"
              >
                <TestimonialCard {...item} />
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-center gap-2 xl:hidden">
            {TESTIMONIALS.map((item, index) => (
              <span
                key={item.name}
                aria-label={`Slide ${index + 1}`}
                className={`h-2 rounded-full transition-all ${
                  index === activeTestimonial ? "w-6 bg-slate-900" : "w-2 bg-slate-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Desktop: 2 staggered rows */}
        <div className="mt-12 hidden xl:mx-auto xl:block xl:max-w-[1120px] xl:space-y-6 2xl:mt-10 2xl:max-w-[1280px] 2xl:space-y-5">
          <div className="grid grid-cols-3 gap-5 xl:gap-6 2xl:gap-7">
            {topRow.map((item, index) => (
              <div
                key={item.name}
                className={index === 1 ? "xl:-translate-y-3" : index === 2 ? "xl:translate-x-2" : "xl:-translate-x-2"}
              >
                <TestimonialCard {...item} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-5 xl:translate-x-4 xl:gap-6 2xl:gap-7">
            {bottomRow.map((item, index) => (
              <div
                key={item.name}
                className={index === 0 ? "xl:translate-x-3" : index === 2 ? "xl:-translate-x-3" : undefined}
              >
                <TestimonialCard {...item} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
