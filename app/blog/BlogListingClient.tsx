"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Menu, Plane } from "lucide-react";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import {
  getBlogCategoriesWithPosts,
  type BlogCategoryFilter,
  type BlogPostMeta,
} from "@/lib/blog-types";

const PLATFORM_MODULES = [
  { id: "inicio", label: "Inicio", status: "available" as const, href: "/" },
  { id: "guia", label: "Guía Cómo ser piloto", status: "available" as const, href: "/guia-como-ser-piloto" },
  { id: "planifica", label: "Planifica tu ruta", status: "available" as const, href: "/" },
  { id: "compara", label: "Compara escuelas", status: "available" as const, href: "/schools" },
  {
    id: "opiniones",
    label: "Opiniones de escuelas",
    status: "available" as const,
    href: "/opiniones-escuelas",
  },
  { id: "atpl", label: "ATPL Planner", status: "soon" as const },
  { id: "ingles", label: "Inglés aeronáutico", status: "available" as const, href: "/ingles-aeronautico" },
  { id: "clases", label: "Clases PPL/ATPL", status: "available" as const, href: "/clases-ppl-atpl" },
  { id: "mentorias", label: "Mentorías", status: "available" as const, href: "/mentorias" },
  { id: "shop", label: "Shop", status: "available" as const, href: "/shop" },
  { id: "blog", label: "Blog", status: "available" as const, href: "/blog" },
];

const CURRENT_ITEM_ID = "blog";

type BlogListingClientProps = {
  posts: BlogPostMeta[];
  featuredPosts: BlogPostMeta[];
};

export function BlogListingClient({ posts, featuredPosts }: BlogListingClientProps) {
  const router = useRouter();
  const [logoFallback, setLogoFallback] = useState(false);
  const [heroImageFailed, setHeroImageFailed] = useState(false);
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<BlogCategoryFilter>("Todos");
  const moduleMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!moduleMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = moduleMenuRef.current;
      if (el && !el.contains(e.target as Node)) setModuleMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [moduleMenuOpen]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f7fb] text-[#0f1a33]">
      <header className="border-b border-white/10 bg-[#0f1a33] text-white shadow-[0_12px_40px_rgba(15,26,51,0.35)]">
        <div className="mx-auto flex max-h-[90px] max-w-7xl items-center justify-between gap-3 px-6 py-3 sm:gap-4 md:justify-normal md:gap-4 lg:px-10">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:flex-none md:min-w-0 md:flex-1 md:justify-start">
            <Link href="/" className="min-w-0 shrink">
              {!logoFallback ? (
                <div className="relative flex h-12 max-h-[60px] w-[180px] shrink-0 items-center sm:h-[54px] sm:max-h-[58px] sm:w-[220px] md:max-h-[60px] md:w-[252px] lg:w-[268px]">
                  <Image
                    src="/flypath-logo-white.png"
                    alt="FlyPath — inicio"
                    width={540}
                    height={162}
                    className="h-auto max-h-12 w-auto max-w-full object-contain object-left sm:max-h-[54px] md:max-h-[58px] lg:max-h-[60px]"
                    priority
                    onError={() => setLogoFallback(true)}
                  />
                </div>
              ) : (
                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#c9a454]/15 ring-1 ring-[#c9a454]/35">
                    <Plane className="h-4 w-4 text-[#f2ddaa]" aria-hidden />
                  </div>
                  <p className="truncate text-sm font-semibold tracking-tight text-white sm:text-base">
                    FlyPath
                  </p>
                </div>
              )}
            </Link>
          </div>
          <p
            className="pointer-events-none hidden min-w-0 select-none truncate text-center text-sm font-medium tracking-[0.14em] text-[#f2ddaa]/90 md:flex md:flex-1 md:items-center md:justify-center"
            aria-hidden
          >
            Blog
          </p>
          <div ref={moduleMenuRef} className="relative shrink-0 md:flex md:min-w-0 md:flex-1 md:justify-end">
            <button
              type="button"
              onClick={() => setModuleMenuOpen((open) => !open)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] text-white transition-colors hover:border-white/24 hover:bg-white/[0.14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a454]/55"
              aria-expanded={moduleMenuOpen}
              aria-haspopup="listbox"
              aria-label="Menú de módulos FlyPath Platform"
            >
              <Menu className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden />
            </button>
            {moduleMenuOpen ? (
              <ul
                role="listbox"
                className="absolute right-0 z-20 mt-2 max-h-[calc(100vh-120px)] w-[min(22rem,calc(100vw-2rem))] max-w-[min(96vw,26rem)] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200/90 bg-white px-1.5 py-2 shadow-[0_24px_52px_rgba(15,26,51,0.11),0_12px_32px_rgba(15,26,51,0.06)] ring-1 ring-slate-200/45"
              >
                {PLATFORM_MODULES.map((m) => {
                  const isSoon = m.status === "soon";
                  const isCurrent = m.id === CURRENT_ITEM_ID;
                  const hasHref = "href" in m && typeof m.href === "string" && m.href.length > 0;
                  const isClickable = hasHref || isSoon;
                  return (
                    <li key={m.id} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={isCurrent}
                        onClick={() => {
                          setModuleMenuOpen(false);
                          if (hasHref && m.href) {
                            router.push(m.href);
                            return;
                          }
                          if (isSoon) return;
                        }}
                        className={`flex w-full items-center justify-between gap-8 rounded-lg px-3.5 py-2.5 text-left transition-colors ${
                          isClickable ? "cursor-pointer" : "cursor-not-allowed"
                        } ${isCurrent ? "bg-[#fff8e8]" : ""}`}
                      >
                        <span
                          className={`min-w-0 flex-1 truncate text-[0.9375rem] font-medium leading-snug ${
                            isSoon ? "text-slate-500" : isCurrent ? "text-[#7a5a16]" : "text-slate-700"
                          }`}
                        >
                          {m.label}
                        </span>
                        {isSoon ? (
                          <span className="shrink-0 pl-1 text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400">
                            Próximamente
                          </span>
                        ) : isCurrent ? (
                          <span className="shrink-0 pl-1 text-[9px] font-medium uppercase tracking-[0.14em] text-[#a5802a]">
                            Actual
                          </span>
                        ) : (
                          <span className="shrink-0 pl-1 text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400">
                            Disponible
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </div>
      </header>

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
    </div>
  );
}
