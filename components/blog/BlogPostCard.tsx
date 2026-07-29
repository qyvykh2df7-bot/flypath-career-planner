"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, FileText } from "lucide-react";
import { formatBlogDate, type BlogPostMeta } from "@/lib/blog-types";

function CoverImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-[#eef2f8] to-[#e2e8f0]">
        <FileText className="h-10 w-10 text-[#c9a454]/80" aria-hidden />
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#eef2f8]">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function BlogPostCard({ post }: { post: BlogPostMeta }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(15,26,51,0.05)]">
      <CoverImage src={post.coverImage} alt={post.title} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          {post.featured ? (
            <span className="rounded-full border border-[#0f1a33]/15 bg-[#0f1a33] px-2.5 py-0.5 font-semibold uppercase tracking-[0.08em] text-white">
              Destacado
            </span>
          ) : null}
          <span className="rounded-full border border-[#c9a454]/35 bg-[#fff8e8] px-2.5 py-0.5 font-semibold uppercase tracking-[0.08em] text-[#7a5a16]">
            {post.category}
          </span>
          <time className="text-slate-500" dateTime={post.date}>
            {formatBlogDate(post.date)}
          </time>
        </div>
        <h2 className="mt-3 text-lg font-semibold leading-snug text-[#0f1a33]">{post.title}</h2>
        <p className="mt-2 flex-1 text-[15px] leading-relaxed text-slate-600">{post.description}</p>
        <p className="mt-3 text-[13px] font-medium text-[#7a5a16]">{post.author}</p>
        <Link
          href={`/blog/${post.slug}`}
          className="mt-4 inline-flex min-h-[44px] w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] font-semibold text-[#0f1a33] transition hover:border-[#c9a454]/45 hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
        >
          Leer artículo
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
