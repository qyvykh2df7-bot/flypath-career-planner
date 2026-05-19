import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PlatformModuleStatus } from "@/lib/platform-navigation";

const LANDING_HUB_CARDS: {
  href: string;
  title: string;
  description: string;
  status: PlatformModuleStatus;
  badge?: string;
}[] = [
  {
    href: "/planifica-tu-ruta",
    title: "Planifica tu ruta",
    description:
      "Career Planner y guía para entender tu camino, costes y decisiones antes de elegir escuela.",
    status: "available",
  },
  {
    href: "/escuelas",
    title: "Escuelas",
    description:
      "Comparador de escuelas y opiniones reales de alumnos para validar antes de firmar.",
    status: "available",
  },
  {
    href: "/atpl-estudio",
    title: "ATPL & Estudio",
    description:
      "ATPL Planner, calendario de estudio y clases de apoyo para asignaturas teóricas.",
    status: "available",
  },
  {
    href: "/recursos",
    title: "Recursos",
    description: "Shop con guías, mentorías, logbooks y blog con artículos prácticos para pilotos.",
    status: "available",
  },
  {
    href: "/assessment-prep",
    title: "Assessment Prep",
    description:
      "Preparación para entrevistas, tests y dinámicas de selección (en desarrollo).",
    status: "soon",
    badge: "En desarrollo",
  },
];

export function LandingPlatformModules() {
  return (
    <section
      id="flypath-platform"
      className="scroll-mt-20 border-b border-slate-200/80 bg-[#f8fafc] py-10 lg:py-12"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c9a454]">
          FLYPATH PLATFORM
        </p>
        <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-[#0f1a33] md:text-3xl">
          Más herramientas FlyPath
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
          Cuando hayas visto el diagnóstico principal, explora el resto de la plataforma por etapa:
          escuelas, estudio teórico, recursos y preparación para selección.
        </p>
        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LANDING_HUB_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group relative flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_rgba(15,26,51,0.04)] transition hover:border-[#c9a454]/40 hover:bg-[#fffdf8] hover:shadow-[0_8px_28px_rgba(15,26,51,0.07)]"
            >
              {card.badge ? (
                <span className="absolute right-4 top-4 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  {card.badge}
                </span>
              ) : null}
              <h3 className="pr-20 text-lg font-semibold text-[#0f1a33]">{card.title}</h3>
              <p className="mt-2 flex-1 text-[15px] leading-relaxed text-slate-600">{card.description}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#7a5a16]">
                {card.status === "soon" ? "Ver avance" : "Explorar sección"}
                <ArrowRight
                  className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-[14px] leading-relaxed text-slate-600">
            <span className="font-medium text-[#0f1a33]">Mi dashboard</span> — vista previa de tu
            cabina personal (sin registro). Accesos rápidos a herramientas; sin datos centralizados
            todavía.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-semibold text-[#7a5a16] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40"
          >
            Ver vista previa
            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </Link>
        </div>
        <p className="mt-5 text-[13px] text-slate-500">
          También en el menú:{" "}
          <Link href="/ingles-aeronautico" className="font-medium text-[#7a5a16] hover:underline">
            Inglés aeronáutico
          </Link>
          {" · "}
          <Link href="/mentorias" className="font-medium text-[#7a5a16] hover:underline">
            Mentorías
          </Link>
        </p>
      </div>
    </section>
  );
}
