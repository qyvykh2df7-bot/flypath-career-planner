import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BlogCtaContent } from "@/lib/blog-cta";
import { FLYPATH_MENTORIA_CALCOM_URL } from "@/lib/mentorias/calcom";

export function BlogPostCta({ cta }: { cta: BlogCtaContent }) {
  const isExternalMentorshipCta = (href: string) => href === FLYPATH_MENTORIA_CALCOM_URL;

  return (
    <section className="bg-gradient-to-b from-[#f8fafc] to-white py-9 sm:py-11" aria-labelledby="blog-post-cta-title">
      <div className="mx-auto max-w-3xl px-6 text-center lg:px-10">
        <h2
          id="blog-post-cta-title"
          className="text-2xl font-semibold tracking-tight text-[#0f1a33] sm:text-[1.65rem]"
        >
          {cta.title}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-600 sm:text-base">{cta.text}</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
          {isExternalMentorshipCta(cta.primary.href) ? (
            <a
              href={cta.primary.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-8 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_14px_40px_rgba(201,164,84,0.35)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:w-auto"
            >
              {cta.primary.label}
            </a>
          ) : (
            <Link
              href={cta.primary.href}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-8 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_14px_40px_rgba(201,164,84,0.35)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:w-auto"
            >
              {cta.primary.label}
            </Link>
          )}
          {isExternalMentorshipCta(cta.secondary.href) ? (
            <a
              href={cta.secondary.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-8 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#c9a454]/45 hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35 sm:w-auto"
            >
              {cta.secondary.label}
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </a>
          ) : (
            <Link
              href={cta.secondary.href}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-8 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#c9a454]/45 hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35 sm:w-auto"
            >
              {cta.secondary.label}
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
