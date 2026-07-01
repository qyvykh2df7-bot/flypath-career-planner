import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import type { BlogPostMeta } from "@/lib/blog-types";
import { formatBlogDate } from "@/lib/blog-types";
import { HomeNewsletterForm } from "@/components/home/HomeNewsletterForm";

export function HomeBlogNewsletterSection({
  latestPost,
}: {
  latestPost: BlogPostMeta | null;
}) {
  return (
    <section className="border-t border-[#071224]/[0.06] bg-white">
      <div className="mx-auto max-w-[76rem] px-6 py-14 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B8923F]">
              Del blog
            </p>
            <h2 className="mt-3 text-[1.5rem] font-semibold tracking-tight text-[#071224] sm:text-[1.75rem]">
              Último artículo
            </h2>

            {latestPost ? (
              <article className="mt-6 overflow-hidden rounded-[24px] border border-[#071224]/10 bg-[#f8fafc] shadow-[0_16px_40px_rgba(7,18,36,0.06)]">
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#eef2f8]">
                  {latestPost.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={latestPost.coverImage}
                      alt={latestPost.title}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <FileText className="h-10 w-10 text-[#D6AE4F]/80" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <time className="text-[12px] font-medium text-[#6B7280]" dateTime={latestPost.date}>
                    {formatBlogDate(latestPost.date)}
                  </time>
                  <h3 className="mt-2 text-[18px] font-semibold leading-snug text-[#071224]">
                    {latestPost.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#4B5563]">
                    {latestPost.description}
                  </p>
                  <Link
                    href={`/blog/${latestPost.slug}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#071224] transition hover:text-[#B8923F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/45"
                  >
                    Leer artículo
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </Link>
                </div>
              </article>
            ) : (
              <p className="mt-6 rounded-[24px] border border-[#071224]/10 bg-[#f8fafc] px-6 py-10 text-center text-[14px] text-[#6B7280]">
                Muy pronto encontrarás aquí nuestro contenido del blog.
              </p>
            )}
          </div>

          <div className="rounded-[24px] border border-[#071224]/10 bg-[#F7F4EC] p-7 sm:p-9 lg:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B8923F]">
              Newsletter
            </p>
            <h2 className="mt-3 text-[1.35rem] font-semibold leading-snug tracking-tight text-[#071224] sm:text-[1.5rem]">
              Recursos, consejos y novedades directo a tu email.
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-[#4B5563] sm:text-[15px]">
              Recibe contenido útil para avanzar en tu ruta como piloto.
            </p>
            <div className="mt-6">
              <HomeNewsletterForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
