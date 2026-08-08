"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import prePplInterior1 from "@/public/aerocomms/mockups/1.png";
import prePplInterior2 from "@/public/aerocomms/mockups/2.png";
import prePplInterior3 from "@/public/aerocomms/mockups/3.png";
import {
  type FocusEvent,
  type TouchEvent,
  type TransitionEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export const PRE_PPL_CAROUSEL_INTERVAL_MS = 4_000;

const INTERIOR_SLIDES = [
  {
    src: prePplInterior1,
    width: 1046,
    height: 705,
    alt: "Interior de Pre-PPL sobre la checklist before take off, el despegue y las velocidades",
  },
  {
    src: prePplInterior2,
    width: 1045,
    height: 707,
    alt: "Interior de Pre-PPL con cartas visuales de aproximación",
  },
  {
    src: prePplInterior3,
    width: 1048,
    height: 708,
    alt: "Interior de Pre-PPL sobre el walkaround y la entrada a cabina con instructor",
  },
] as const;

const SWIPE_THRESHOLD_PX = 48;

export function resolvePrePplSwipeOffset(distanceX: number, distanceY: number): -1 | 1 | null {
  if (Math.abs(distanceX) < SWIPE_THRESHOLD_PX || Math.abs(distanceX) <= Math.abs(distanceY)) return null;
  return distanceX < 0 ? 1 : -1;
}

export function PrePplInteriorCarousel() {
  const loopSlides = useMemo(
    () => [INTERIOR_SLIDES.at(-1)!, ...INTERIOR_SLIDES, INTERIOR_SLIDES[0]],
    [],
  );
  const [trackIndex, setTrackIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocusWithin, setHasFocusWithin] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const touchOrigin = useRef<{ x: number; y: number } | null>(null);

  const activeIndex = (trackIndex - 1 + INTERIOR_SLIDES.length) % INTERIOR_SLIDES.length;
  const isPaused = isHovered || hasFocusWithin;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  const moveBy = useCallback(
    (offset: -1 | 1) => {
      if (isTransitioning) return;

      if (prefersReducedMotion) {
        setTrackIndex((current) => {
          const currentSlide = (current - 1 + INTERIOR_SLIDES.length) % INTERIOR_SLIDES.length;
          const nextSlide =
            (currentSlide + offset + INTERIOR_SLIDES.length) % INTERIOR_SLIDES.length;
          return nextSlide + 1;
        });
        return;
      }

      setIsTransitioning(true);
      setTrackIndex((current) => current + offset);
    },
    [isTransitioning, prefersReducedMotion],
  );

  const goToSlide = useCallback(
    (slideIndex: number) => {
      if (isTransitioning || slideIndex === activeIndex) return;
      setIsTransitioning(!prefersReducedMotion);
      setTrackIndex(slideIndex + 1);
    },
    [activeIndex, isTransitioning, prefersReducedMotion],
  );

  useEffect(() => {
    if (isPaused || isTransitioning || prefersReducedMotion) return;

    const interval = window.setInterval(() => moveBy(1), PRE_PPL_CAROUSEL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [isPaused, isTransitioning, moveBy, prefersReducedMotion, trackIndex]);

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;

    if (trackIndex === 0) setTrackIndex(INTERIOR_SLIDES.length);
    if (trackIndex === INTERIOR_SLIDES.length + 1) setTrackIndex(1);
    setIsTransitioning(false);
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setHasFocusWithin(false);
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchOrigin.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const origin = touchOrigin.current;
    const touch = event.changedTouches[0];
    touchOrigin.current = null;
    if (!origin) return;

    const distanceX = touch.clientX - origin.x;
    const distanceY = touch.clientY - origin.y;
    const swipeOffset = resolvePrePplSwipeOffset(distanceX, distanceY);
    if (!swipeOffset) return;

    moveBy(swipeOffset);
  };

  return (
    <div
      ref={carouselRef}
      className="mx-auto mt-3 w-full max-w-[1240px] lg:max-w-[1180px]"
      role="region"
      aria-roledescription="carousel"
      aria-label="Interiores de la guía Pre-PPL"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setHasFocusWithin(true)}
      onBlurCapture={handleBlur}
    >
      <div
        className="relative touch-pan-y overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex"
          style={{
            transform: `translate3d(-${trackIndex * 100}%, 0, 0)`,
            transitionDuration: isTransitioning && !prefersReducedMotion ? "650ms" : "0ms",
            transitionProperty: "transform",
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {loopSlides.map((slide, index) => {
            const isClone = index === 0 || index === loopSlides.length - 1;
            const isVisible = index === trackIndex;

            return (
              <div
                key={`${slide.alt}-${index}`}
                className="flex w-full shrink-0 items-center justify-center"
                aria-hidden={!isVisible || isClone}
              >
                <Image
                  src={slide.src}
                  alt={isClone ? "" : slide.alt}
                  width={slide.width}
                  height={slide.height}
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 92vw, 1240px"
                  loading="eager"
                  unoptimized
                  className="block h-auto w-full object-contain"
                />
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => moveBy(-1)}
          disabled={isTransitioning}
          aria-label="Ver interior anterior"
          className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#071224]/10 bg-white/90 text-[#071224] shadow-[0_10px_25px_rgba(7,18,36,0.12)] backdrop-blur-sm transition hover:border-[#B8923F]/45 hover:text-[#B8923F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8923F]/45 disabled:cursor-default disabled:opacity-60 sm:inline-flex lg:left-5"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => moveBy(1)}
          disabled={isTransitioning}
          aria-label="Ver interior siguiente"
          className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#071224]/10 bg-white/90 text-[#071224] shadow-[0_10px_25px_rgba(7,18,36,0.12)] backdrop-blur-sm transition hover:border-[#B8923F]/45 hover:text-[#B8923F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8923F]/45 disabled:cursor-default disabled:opacity-60 sm:inline-flex lg:right-5"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-center gap-2.5 sm:mt-3" aria-label="Seleccionar interior">
        {INTERIOR_SLIDES.map((slide, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={slide.alt}
              type="button"
              aria-label={`Ver interior ${index + 1} de ${INTERIOR_SLIDES.length}`}
              aria-pressed={isActive}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-[width,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8923F]/50 focus-visible:ring-offset-2 ${
                isActive ? "w-7 bg-[#B8923F]" : "w-2 bg-[#071224]/20 hover:bg-[#071224]/35"
              }`}
            />
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        Interior {activeIndex + 1} de {INTERIOR_SLIDES.length}
      </p>
    </div>
  );
}
