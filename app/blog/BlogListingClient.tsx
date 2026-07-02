"use client";

import Image from "next/image";
import Link from "next/link";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { HomeFooter } from "@/components/home/HomeFooter";
import { useCallback, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import {
  getBlogCategoriesWithPosts,
  type BlogCategoryFilter,
  type BlogPostMeta,
} from "@/lib/blog-types";


type BlogListingClientProps = {
  posts: BlogPostMeta[];
  featuredPosts: BlogPostMeta[];
};

export function BlogListingClient({ posts, featuredPosts }: BlogListingClientProps) {
  const [heroImageFailed, setHeroImageFailed] = useState(false);
  const [activeCategory, setActiveCategory] = useState<BlogCategoryFilter>("Todos");

  const categoriesWithPosts = useMemo(() => getBlogCategoriesWithPosts(posts), [posts]);

  const featuredSlugs = useMemo(
    () => new Set(posts.filter((post) => post.featured).map((post) => post.slug)),
    [posts],
  );

  const filteredPosts = useMemo(() => {
    if (activeCategory === "Todos") {
      return posts.filter((post) => !featuredSlugs.has(post.slug));
    }
    return posts.filter((post) => post.category === activeCategory);
  }, [activeCategory, featuredSlugs, posts]);

  const showFeaturedSection = activeCategory === "Todos" && featuredPosts.length > 0;

  const scrollToPosts = useCallback(() => {
    document.getElementById("blog-posts")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f7fb] text-[#0f1a33]">
      <FlyPathPlatformHeader pageTitle="Blog" currentModuleId="blog" />



      <main>
        <section className="relative overflow-hidden border-b border-[#0f1a33]/10 bg-gradient-to-br from-[#0f1a33] via-[#152440] to-[#1a2d52] py-9 sm:py-10">
          {!heroImageFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/blog.jpg"
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setHeroImageFailed(true)}
            />
          ) : null}
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#071226]/80 via-[#0f1a33]/40 to-[#0f1a33]/15"
            aria-hidden
          />
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f2ddaa]">
              BLOG FLYPATH
            </p>
            <h1 className="mt-2 max-w-3xl text-[1.85rem] font-semibold leading-[1.12] tracking-tight text-white sm:text-[2.15rem] lg:text-[2.4rem]">
              Aprende a planificar tu ruta como piloto con más criterio
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-100 sm:text-lg">
              Artículos claros sobre formación de pilotos, escuelas de vuelo, costes, Clase 1, ATPL, inglés
              aeronáutico y decisiones importantes antes de pagar.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={scrollToPosts}
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-7 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_10px_32px_rgba(201,164,84,0.35)] transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
              >
                Leer artículos
              </button>
              <Link
                href="/guia-como-ser-piloto"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-7 py-3 text-[15px] font-semibold text-white transition hover:border-white/40 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                Ver guía
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        <section id="blog-posts" className="scroll-mt-20 border-b border-slate-200/70 bg-white py-3.5 sm:py-4">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Filtrar por categoría
            </p>
            <div
              className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto overscroll-x-contain px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="group"
              aria-label="Filtrar artículos por categoría"
            >
              {categoriesWithPosts.map((category) => {
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveCategory(category)}
                    className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/45 ${
                      isActive
                        ? "border-[#c9a454] bg-[#c9a454] text-[#0f1a33] shadow-sm"
                        : "border-slate-200/90 bg-[#f8fafc] text-slate-600 hover:border-[#c9a454]/40 hover:bg-[#fffdf8] hover:text-[#7a5a16]"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {showFeaturedSection ? (
          <section className="border-b border-slate-200/70 bg-white py-9 sm:py-11">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
              <h2 className="text-xl font-semibold tracking-tight text-[#0f1a33] sm:text-2xl">
                Artículos recomendados para empezar
              </h2>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600">
                Si estás empezando, estos artículos te ayudan a ordenar ruta, costes, Clase 1 y tipo de formación.
              </p>
              <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {featuredPosts.map((post) => (
                  <BlogPostCard key={post.slug} post={post} />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="bg-[#f8fafc] py-9 sm:py-11">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-[#0f1a33] sm:text-2xl">
                Últimos artículos
              </h2>
              <p className="text-[14px] text-slate-500">
                {activeCategory === "Todos"
                  ? `${posts.length} artículos`
                  : `${filteredPosts.length} de ${posts.filter((post) => post.category === activeCategory).length} artículos`}
              </p>
            </div>
            {filteredPosts.length > 0 ? (
              <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPosts.map((post) => (
                  <BlogPostCard key={post.slug} post={post} />
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-xl border border-slate-200/80 bg-white px-5 py-8 text-center text-[15px] text-slate-600">
                No hay artículos en esta categoría por ahora.
              </p>
            )}
          </div>
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}
