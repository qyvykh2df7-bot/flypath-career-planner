"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { scrollCarouselToIndex } from "@/components/aerocomms/aerocomms-carousel";

const CHECKLIST = [
  "Módulos progresivos",
  "Ejercicios prácticos",
  "Escenarios guiados",
  "Feedback detallado",
  "Seguimiento de tu progreso",
] as const;

const TABLET_CHECKLIST_ROW_1 = CHECKLIST.slice(0, 3);
const TABLET_CHECKLIST_ROW_2 = CHECKLIST.slice(3);
const TABLET_LANDSCAPE_ROW_1 = CHECKLIST.slice(0, 4);
const TABLET_LANDSCAPE_ROW_2 = CHECKLIST.slice(4);

const TABLET_CHIP_WIDTHS: Record<(typeof CHECKLIST)[number], string> = {
  "Módulos progresivos": "w-[178px]",
  "Ejercicios prácticos": "w-[178px]",
  "Escenarios guiados": "w-[178px]",
  "Feedback detallado": "w-[178px]",
  "Seguimiento de tu progreso": "w-[240px]",
};

const TABLET_CHIP_CLASS =
  "inline-flex h-[40px] items-center justify-center gap-2 whitespace-nowrap rounded-full border border-black/5 bg-white px-5 text-[14px] font-medium text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.04)]";

function ChecklistItem({ item }: { item: (typeof CHECKLIST)[number] }) {
  return (
    <li className="flex items-center gap-3 text-[15px] text-[#071224] xl:text-[16px]">
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#c9a454]/15">
        <Check className="h-3 w-3 shrink-0 text-[#7a5a16]" aria-hidden />
      </span>
      {item}
    </li>
  );
}

function TabletChecklistChip({
  item,
  widthClass,
}: {
  item: (typeof CHECKLIST)[number];
  widthClass?: string;
}) {
  return (
    <span
      className={`${TABLET_CHIP_CLASS} ${widthClass ?? TABLET_CHIP_WIDTHS[item]}`}
    >
      <Check className="h-4 w-4 shrink-0 text-[#7a5a16]" aria-hidden strokeWidth={2} />
      {item}
    </span>
  );
}

type MobileShowcaseSlide = {
  key: string;
  src: string;
  width: number;
  height: number;
  /** carrousel1/2 tienen más margen en el PNG; escala mínima para igualar 3–5. */
  imageScaleClass?: string;
};

const MOBILE_SHOWCASE_SLIDES: readonly MobileShowcaseSlide[] = [
  { key: "carrousel-1", src: "/aerocomms/mockups/carrousel1.webp", width: 1014, height: 1550, imageScaleClass: "scale-[1.08]" },
  { key: "carrousel-2", src: "/aerocomms/mockups/carrousel2.webp", width: 1024, height: 1536, imageScaleClass: "scale-[1.08]" },
  { key: "carrousel-3", src: "/aerocomms/mockups/carrousel3.webp", width: 1024, height: 1536 },
  { key: "carrousel-4", src: "/aerocomms/mockups/carrousel4.webp", width: 1024, height: 1536 },
  { key: "carrousel-5", src: "/aerocomms/mockups/carrousel5.webp", width: 941, height: 1672 },
];

const MOBILE_CAROUSEL_SLIDE_CLASS =
  "flex h-[520px] w-[68vw] max-w-[300px] shrink-0 snap-center flex-none items-center justify-center overflow-visible bg-transparent md:h-[560px] md:w-[54vw] md:max-w-[360px]";

/** Altura fija común: todas las capturas escalan por alto (como carrousel5), no por ancho del wrapper. */
const MOBILE_CAROUSEL_IMAGE_CLASS =
  "block h-[520px] w-auto max-w-none object-contain md:h-[560px]";

const INITIAL_SHOWCASE_INDEX = 2;

export function AeroCommsTrainingShowcase() {
  const [activeSlide, setActiveSlide] = useState(INITIAL_SHOWCASE_INDEX);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollCarouselToIndex(carouselRef.current, INITIAL_SHOWCASE_INDEX);
    });
  }, []);

  const handleCarouselScroll = () => {
    const el = carouselRef.current;
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

    setActiveSlide(closestIndex);
  };

  return (
    <section
      id="training"
      className="relative overflow-hidden border-t border-[rgba(15,23,42,0.05)] bg-[#f8f8f6] pt-14 pb-6 xl:min-h-[680px] xl:py-16 2xl:min-h-[620px] 2xl:py-12 2xl:pb-8"
    >
      {/* Layer 0 — desktop background (xl+ only) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 z-0 hidden w-full max-w-[1280px] -translate-x-1/2 bg-no-repeat xl:block xl:[background-size:cover] xl:[background-position:center_right] 2xl:inset-0 2xl:left-0 2xl:max-w-none 2xl:translate-x-0 2xl:[background-size:1120px_auto] 2xl:[background-position:calc(50%+140px)_center]"
        style={{
          backgroundImage: "url('/aerocomms/mockups/seccion3-white-2x.webp')",
        }}
      />

      {/* Layer 1 — content */}
      <div className="relative z-[1] mx-auto w-full max-w-[1280px] px-6 sm:px-8 lg:px-10 2xl:max-w-[1400px]">
        <div className="max-w-[520px] lg:max-w-[940px] xl:max-w-[520px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B8923F]">
            Entrenamiento que se adapta a ti
          </p>
          <h2 className="mt-3 text-balance text-[2rem] font-semibold leading-[1.14] tracking-tight text-[#071224] sm:text-[2.4rem] md:text-[42px] md:leading-[1.12] xl:text-[44px] xl:leading-[1.12] 2xl:text-[52px] 2xl:leading-[1.05]">
            Una app. Todas las habilidades de radio que necesitas.
          </h2>
          <p className="mt-4 max-w-[480px] text-[16px] leading-[1.7] text-[#4B5563] md:text-[17px] md:leading-[1.6] xl:text-[18px] xl:leading-[1.65]">
            Listening, readbacks, fraseología y escenarios
            <br />
            en un entrenamiento estructurado y progresivo.
          </p>
          {/* Mobile checklist (<768px) */}
          <ul className="mt-6 flex flex-col gap-2.5 md:hidden">
            {CHECKLIST.map((item) => (
              <ChecklistItem key={item} item={item} />
            ))}
          </ul>

          {/* Tablet portrait (768px–1023px) — two-row layout */}
          <div className="mt-6 hidden flex-col items-center gap-3 md:flex lg:hidden">
            <div className="flex justify-center gap-3">
              {TABLET_CHECKLIST_ROW_1.map((item) => (
                <TabletChecklistChip key={item} item={item} />
              ))}
            </div>
            <div className="flex justify-center gap-3">
              {TABLET_CHECKLIST_ROW_2.map((item) => (
                <TabletChecklistChip key={item} item={item} />
              ))}
            </div>
          </div>

          {/* Tablet landscape (1024px–1279px) — 4 + 1 layout */}
          <div className="mt-6 hidden flex-col items-center gap-3 lg:flex xl:hidden">
            <div className="flex justify-center gap-3">
              {TABLET_LANDSCAPE_ROW_1.map((item) => (
                <TabletChecklistChip key={item} item={item} widthClass="w-auto" />
              ))}
            </div>
            <div className="flex justify-center">
              {TABLET_LANDSCAPE_ROW_2.map((item) => (
                <TabletChecklistChip key={item} item={item} widthClass="w-[240px]" />
              ))}
            </div>
          </div>

          {/* Desktop checklist (1280px+) */}
          <ul className="mt-6 hidden flex-col gap-2.5 xl:flex">
            {CHECKLIST.map((item) => (
              <ChecklistItem key={item} item={item} />
            ))}
          </ul>
        </div>

        {/* Mobile only — horizontal swipe carousel */}
        <div className="mt-[18px] xl:hidden">
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-[16vw] pb-2 [scrollbar-width:none] md:gap-6 md:px-[22vw] md:[scroll-padding-inline:22vw] [&::-webkit-scrollbar]:hidden"
            style={{ scrollPaddingInline: "16vw" }}
            aria-label="Capturas de la app AeroComms"
          >
            {MOBILE_SHOWCASE_SLIDES.map((slide) => (
              <div key={slide.key} className={MOBILE_CAROUSEL_SLIDE_CLASS}>
                <Image
                  src={slide.src}
                  alt={`AeroComms — ${slide.key}`}
                  width={slide.width}
                  height={slide.height}
                  sizes="(max-width: 767px) 68vw, (max-width: 1279px) 54vw, 300px"
                  className={`${MOBILE_CAROUSEL_IMAGE_CLASS} ${slide.imageScaleClass ?? ""}`}
                  loading="lazy"
                  draggable={false}
                />
              </div>
            ))}
          </div>

          <div className="mt-2 flex justify-center gap-2 xl:hidden">
            {MOBILE_SHOWCASE_SLIDES.map((slide, index) => (
              <span
                key={slide.key}
                aria-label={`Slide ${index + 1}`}
                className={`h-2 rounded-full transition-all ${
                  index === activeSlide ? "w-6 bg-slate-900" : "w-2 bg-slate-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
