"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";

export type HubLinkCard = {
  title: string;
  description: string;
  href: string;
  cta?: string;
  highlights?: string[];
};

type PlatformHubShellProps = {
  currentModuleId: string;
  pageTitle: string;
  title: string;
  description: string;
  /** Encabezado sobre el grid de herramientas (p. ej. "Empieza aquí"). */
  cardsSectionLabel: string;
  /** Párrafo adicional bajo la descripción principal. */
  intro?: string;
  cards: HubLinkCard[];
  children?: React.ReactNode;
};

export function PlatformHubShell({
  currentModuleId,
  pageTitle,
  title,
  description,
  cardsSectionLabel,
  intro,
  cards,
  children,
}: PlatformHubShellProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f7fb] text-[#0f1a33]">
      <FlyPathPlatformHeader pageTitle={pageTitle} currentModuleId={currentModuleId} />
      <main>
        <section className="border-b border-slate-200/70 bg-gradient-to-b from-white to-[#f8fafc] py-9 sm:py-11">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-[#0f1a33] sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-600 sm:text-base">
              {description}
            </p>
            {intro ? (
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-500">{intro}</p>
            ) : null}
          </div>
        </section>

        <section className="py-8 sm:py-10">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {cardsSectionLabel}
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {cards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_24px_rgba(15,26,51,0.05)] transition hover:border-[#c9a454]/40 hover:shadow-[0_8px_32px_rgba(15,26,51,0.08)]"
                >
                  <h2 className="text-xl font-semibold text-[#0f1a33]">{card.title}</h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{card.description}</p>
                  {card.highlights?.length ? (
                    <ul className="mt-3 flex-1 space-y-1.5 text-[13px] text-slate-500">
                      {card.highlights.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="text-[#c9a454]" aria-hidden>
                            ·
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex-1" />
                  )}
                  <span className="mt-5 inline-flex items-center gap-2 text-[14px] font-semibold text-[#7a5a16]">
                    {card.cta ?? "Abrir"}
                    <ArrowRight
                      className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </Link>
              ))}
            </div>
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}
