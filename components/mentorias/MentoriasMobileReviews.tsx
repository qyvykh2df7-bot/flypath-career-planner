"use client";

import { useCallback, useRef, useState } from "react";

type Testimonial = {
  readonly quote: string;
  readonly author: string;
};

export function MentoriasMobileReviews({ reviews }: { reviews: readonly Testimonial[] }) {
  const [activeReview, setActiveReview] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || reviews.length <= 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveReview(Math.min(reviews.length - 1, Math.max(0, index)));
  }, [reviews.length]);

  return (
    <div className="md:hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {reviews.map((t) => (
          <figure key={t.author} className="box-border shrink-0 grow-0 basis-full snap-center">
            <div className="rounded-xl border border-white/10 bg-header-navy p-4 shadow-[0_14px_34px_rgba(7,18,36,0.16)]">
              <p className="text-sm tracking-wide text-[#D6AE4F]" aria-label="5 estrellas">
                ★★★★★
              </p>
              <blockquote className="mt-2 text-[15px] leading-relaxed text-white/80">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-[13px] font-semibold text-[#D6AE4F]">
                {t.author}
              </figcaption>
            </div>
          </figure>
        ))}
      </div>
      <div className="mt-4 flex justify-center gap-2" aria-hidden>
        {reviews.map((t, index) => (
          <span
            key={t.author}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              index === activeReview ? "bg-[#D6AE4F]" : "bg-[#0f1a33]/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
