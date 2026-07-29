"use client";

import Image from "next/image";
import Link from "next/link";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { HomeFooter } from "@/components/home/HomeFooter";
import { useState, type ReactNode } from "react";
import { FileText } from "lucide-react";
import { formatBlogDate, type BlogPostMeta } from "@/lib/blog-types";


function PostCover({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#eef2f8] to-[#e2e8f0] ring-1 ring-slate-200/70">
        <FileText className="h-12 w-12 text-[#c9a454]/80" aria-hidden />
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-[#eef2f8] ring-1 ring-slate-200/70">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 768px"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

type BlogPostShellProps = {
  post: BlogPostMeta;
  children: ReactNode;
  footer?: ReactNode;
};

export function BlogPostShell({ post, children, footer }: BlogPostShellProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f7fb] text-[#0f1a33]">
      <FlyPathPlatformHeader pageTitle="Blog" currentModuleId="blog" />



      <main>
        <article className="border-b border-slate-200/70 bg-white py-9 sm:py-11">
          <div className="mx-auto max-w-3xl px-6 lg:px-10">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#7a5a16] transition hover:text-[#a5802a]"
            >
              ← Volver al blog
            </Link>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-[12px]">
              <span className="rounded-full border border-[#c9a454]/35 bg-[#fff8e8] px-2.5 py-0.5 font-semibold uppercase tracking-[0.08em] text-[#7a5a16]">
                {post.category}
              </span>
              <time className="text-slate-500" dateTime={post.date}>
                {formatBlogDate(post.date)}
              </time>
            </div>
            <h1 className="mt-4 text-[1.85rem] font-semibold leading-[1.15] tracking-tight text-[#0f1a33] sm:text-[2.15rem]">
              {post.title}
            </h1>
            <p className="mt-3 text-[17px] leading-relaxed text-slate-600">{post.description}</p>
            <p className="mt-2 text-[14px] font-medium text-[#7a5a16]">{post.author}</p>
            {post.coverImage ? (
              <div className="mt-8">
                <PostCover src={post.coverImage} alt={post.title} />
              </div>
            ) : null}
            <div className="blog-prose mt-8 max-w-none">{children}</div>
          </div>
        </article>

        {footer}
      </main>
      <HomeFooter />
    </div>
  );
}
