import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BlogPostMeta } from "@/lib/blog-types";

export function BlogRelatedPosts({ posts }: { posts: BlogPostMeta[] }) {
  if (posts.length === 0) return null;

  return (
    <section
      className="border-t border-slate-200/70 bg-[#f8fafc] py-9 sm:py-10"
      aria-labelledby="blog-related-title"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <h2
          id="blog-related-title"
          className="text-xl font-semibold tracking-tight text-[#0f1a33] sm:text-2xl"
        >
          También te puede interesar
        </h2>
        <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {posts.map((post) => (
            <li key={post.slug}>
              <article className="flex h-full flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <span className="w-fit rounded-full border border-[#c9a454]/35 bg-[#fff8e8] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7a5a16]">
                  {post.category}
                </span>
                <h3 className="mt-2.5 text-[16px] font-semibold leading-snug text-[#0f1a33]">{post.title}</h3>
                <p className="mt-2 line-clamp-3 flex-1 text-[14px] leading-relaxed text-slate-600">
                  {post.description}
                </p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-3 inline-flex w-fit items-center gap-1.5 text-[14px] font-semibold text-[#7a5a16] underline decoration-[#c9a454]/50 underline-offset-2 transition hover:text-[#a5802a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40"
                >
                  Leer artículo
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
