import Link from "next/link";
import { ArrowRight, FileText, Mail, Plane } from "lucide-react";
import type { BlogPostMeta } from "@/lib/blog-types";
import { formatBlogDate } from "@/lib/blog-types";
import { HomeNewsletterForm } from "@/components/home/HomeNewsletterForm";

function NewsletterDecorativeRoute() {
  return (
    <div
      className="pointer-events-none absolute right-3 top-3 h-24 w-28 opacity-35 sm:right-5 sm:top-4 sm:h-28 sm:w-32"
      aria-hidden
    >
      <svg
        viewBox="0 0 112 96"
        fill="none"
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 72 C 28 58, 44 82, 64 48 S 92 18, 104 8"
          stroke="#D6AE4F"
          strokeWidth="1.5"
          strokeDasharray="4 5"
          strokeLinecap="round"
        />
      </svg>
      <Plane className="absolute right-0 top-0 h-3.5 w-3.5 -rotate-12 text-[#D6AE4F]" />
    </div>
  );
}

export function HomeBlogNewsletterSection({
  latestPost,
}: {
  latestPost: BlogPostMeta | null;
}) {
  return (
    <section className="border-t border-[#071224]/[0.06] bg-[#F7F8FA]">
      <div className="mx-auto max-w-[76rem] px-6 py-10 lg:px-8 lg:py-12">
        <div className="grid items-stretch gap-5 lg:grid-cols-2 lg:gap-6">
          <div className="flex min-h-0 flex-col">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B8923F]">
              Del blog
            </p>
            <h2 className="mt-2 text-[1.35rem] font-semibold tracking-tight text-[#071224] sm:text-[1.5rem]">
              Último artículo
            </h2>

            {latestPost ? (
              <article className="mt-4 flex flex-1 overflow-hidden rounded-[20px] border border-[#071224]/[0.07] bg-white shadow-[0_12px_32px_rgba(7,18,36,0.06)]">
                <div className="relative w-[34%] min-w-[108px] max-w-[148px] shrink-0 self-stretch bg-[#eef2f8] sm:min-w-[120px] sm:max-w-[160px]">
                  {latestPost.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={latestPost.coverImage}
                      alt={latestPost.title}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-[132px] w-full items-center justify-center">
                      <FileText className="h-8 w-8 text-[#D6AE4F]/80" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-4 sm:px-5 sm:py-5">
                  <time className="text-[11px] font-medium text-[#6B7280]" dateTime={latestPost.date}>
                    {formatBlogDate(latestPost.date)}
                  </time>
                  <h3 className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug text-[#071224] sm:text-[16px]">
                    {latestPost.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-[#4B5563] sm:text-[14px]">
                    {latestPost.description}
                  </p>
                  <Link
                    href={`/blog/${latestPost.slug}`}
                    className="group mt-3 inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-[#2563EB] transition hover:text-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 sm:text-[14px]"
                  >
                    Leer artículo
                    <ArrowRight className="h-4 w-4 shrink-0 text-current" aria-hidden />
                  </Link>
                </div>
              </article>
            ) : (
              <p className="mt-4 flex flex-1 items-center justify-center rounded-[20px] border border-[#071224]/[0.07] bg-white px-5 py-8 text-center text-[14px] text-[#6B7280] shadow-[0_12px_32px_rgba(7,18,36,0.06)]">
                Muy pronto encontrarás aquí nuestro contenido del blog.
              </p>
            )}
          </div>

          <div className="relative flex min-h-0 flex-col overflow-hidden rounded-[20px] border border-[#0f1a33]/20 bg-[#0f1a33] p-5 shadow-[0_16px_40px_rgba(7,18,36,0.18)] sm:p-6 lg:p-7">
            <NewsletterDecorativeRoute />
            <div className="relative z-[1] flex flex-1 flex-col">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D6AE4F]">
                <Mail className="h-3.5 w-3.5 shrink-0 text-[#D6AE4F]" aria-hidden />
                Newsletter
              </p>
              <h2 className="mt-2 max-w-md text-[1.25rem] font-semibold leading-snug tracking-tight text-white sm:text-[1.4rem]">
                Recursos, consejos y novedades directo a tu email.
              </h2>
              <p className="mt-2 max-w-md text-[13px] leading-relaxed text-white/72 sm:text-[14px]">
                Únete a futuros pilotos que reciben contenido exclusivo cada semana.
              </p>
              <div className="mt-5 flex-1">
                <HomeNewsletterForm variant="dark" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
