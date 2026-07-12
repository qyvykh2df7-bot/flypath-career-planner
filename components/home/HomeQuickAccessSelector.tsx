"use client";

import Link from "next/link";
import { ArrowUpRight, BookOpen, Radar, Headset, Waypoints, type LucideIcon } from "lucide-react";
import {
  createTrackingCtaMetadata,
  trackCtaClicked,
} from "@/lib/tracking/client";
import type { TrackingCtaId } from "@/lib/tracking/events";

type QuickAccessItem = {
  id: string;
  label: string;
  description: string;
  descriptionLines?: [string, string];
  href: string;
  ctaId: TrackingCtaId;
  icon: LucideIcon;
};

const QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  {
    id: "career-planner",
    label: "Career Planner",
    description: "Descubre tu ruta ideal según tu perfil.",
    href: "/career-planner",
    ctaId: "home_quick_access_career_planner",
    icon: Waypoints,
  },
  {
    id: "guias",
    label: "Guías",
    description: "Entiende el camino antes de pagar.",
    href: "/guia-como-ser-piloto",
    ctaId: "home_quick_access_guides",
    icon: BookOpen,
  },
  {
    id: "aerocomms",
    label: "AeroComms",
    description: "Practica radio real en inglés.",
    descriptionLines: ["Practica radio real", "en inglés."],
    href: "/aerocomms",
    ctaId: "home_quick_access_aerocomms",
    icon: Radar,
  },
  {
    id: "mentoria",
    label: "Mentoría 1 a 1",
    description: "Resuelve tus dudas con un piloto.",
    href: "/mentorias",
    ctaId: "home_quick_access_mentorship",
    icon: Headset,
  },
];

export function HomeQuickAccessSelector() {
  return (
    <nav aria-label="Accesos rápidos a herramientas FlyPath" className="w-full">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-3.5">
        {QUICK_ACCESS_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id} className="flex min-w-0">
              <Link
                href={item.href}
                onClick={() => {
                  const metadata = createTrackingCtaMetadata(item.ctaId);
                  if (metadata) trackCtaClicked(metadata);
                }}
                className="group relative flex h-full min-h-[76px] w-full min-w-0 items-center gap-3.5 overflow-hidden rounded-2xl border border-white/12 border-b-[3px] border-b-[#D6AE4F]/75 bg-white/[0.07] px-4 py-3 text-left shadow-[0_12px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-white/22 hover:border-b-[#D6AE4F] hover:bg-white/[0.11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/50 sm:min-h-[80px] sm:gap-4 sm:px-4 sm:py-3.5 lg:min-h-[84px] lg:px-4 lg:py-3.5"
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#D6AE4F]/35 bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm transition duration-200 group-hover:border-[#D6AE4F]/55 group-hover:bg-black/35"
                  aria-hidden
                >
                  <Icon className="h-7 w-7 text-[#D6AE4F] sm:h-8 sm:w-8" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 pr-5">
                  <span className="block text-[14px] font-semibold leading-tight text-white sm:text-[15px]">
                    {item.label}
                  </span>
                  <span className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-slate-300/90 sm:text-[12.5px]">
                    {item.descriptionLines ? (
                      <>
                        <span className="block">{item.descriptionLines[0]}</span>
                        <span className="block">{item.descriptionLines[1]}</span>
                      </>
                    ) : (
                      item.description
                    )}
                  </span>
                </span>
                <ArrowUpRight
                  className="absolute right-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#D6AE4F]/75 transition duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-[calc(50%+2px)] group-hover:text-[#D6AE4F]"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
