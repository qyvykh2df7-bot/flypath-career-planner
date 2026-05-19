import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleDashed, Clock } from "lucide-react";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { PLATFORM_HOME } from "@/lib/platform-navigation";

const DASHBOARD_TOOL_CARDS = [
  {
    title: "Planifica tu ruta",
    description: "Arranca o retoma el diagnóstico de ruta, costes y escuelas candidatas.",
    href: "/?start=onboarding",
    cta: "Abrir Career Planner",
  },
  {
    title: "Comparar escuelas",
    description: "Abre el comparador para contrastar opciones, fichas y señales antes de firmar.",
    href: "/schools",
    cta: "Ir al comparador",
  },
  {
    title: "ATPL Planner",
    description: "Organiza asignaturas, calendario de estudio y bloques de preparación teórica.",
    href: "/atpl-planner",
    cta: "Abrir ATPL Planner",
  },
  {
    title: "Inglés aeronáutico",
    description: "Practica vocabulario y situaciones ICAO con el coach de inglés de FlyPath.",
    href: "/ingles-aeronautico",
    cta: "Practicar inglés",
  },
  {
    title: "Assessment Prep",
    description: "Preparación para entrevistas, tests y dinámicas de selección (en desarrollo).",
    href: "/assessment-prep",
    cta: "Ver sección",
  },
  {
    title: "Mentorías",
    description: "Sesiones con pilotos para revisar tu caso, ruta y decisiones con calma.",
    href: "/mentorias",
    cta: "Ver mentorías",
  },
] as const;

const RECOMMENDED_STEPS = [
  {
    step: "1",
    title: "Completa tu diagnóstico de ruta",
    text: "Introduce perfil, presupuesto y escuelas candidatas para tener una base clara.",
    href: "/?start=onboarding",
  },
  {
    step: "2",
    title: "Compara al menos 2 escuelas",
    text: "Contrasta precio, formato, reputación y condiciones antes de pagar matrícula.",
    href: "/schools",
  },
  {
    step: "3",
    title: "Organiza tu preparación ATPL o assessment",
    text: "Planifica teoría con el ATPL Planner y revisa Assessment Prep cuando esté listo.",
    href: "/atpl-planner",
  },
] as const;

type PlatformStatusKind = "available" | "soon" | "future";

const PLATFORM_STATUS_BADGES: {
  label: string;
  kind: PlatformStatusKind;
}[] = [
  { label: "Career Planner disponible", kind: "available" },
  { label: "Comparador disponible", kind: "available" },
  { label: "ATPL Planner disponible", kind: "available" },
  { label: "Assessment Prep próximamente", kind: "soon" },
  { label: "English Coach en desarrollo futuro", kind: "future" },
];

function statusBadgeClasses(kind: PlatformStatusKind): string {
  if (kind === "available") {
    return "border-emerald-200/80 bg-emerald-50 text-emerald-800";
  }
  if (kind === "soon") {
    return "border-amber-200/80 bg-amber-50 text-amber-900";
  }
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function StatusIcon({ kind }: { kind: PlatformStatusKind }) {
  if (kind === "available") {
    return <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />;
  }
  if (kind === "soon") {
    return <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />;
  }
  return <CircleDashed className="h-3.5 w-3.5 shrink-0" aria-hidden />;
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f7fb] text-[#0f1a33]">
      <FlyPathPlatformHeader pageTitle="Mi dashboard" currentModuleId="dashboard" />
      <main>
        <section className="border-b border-slate-200/70 bg-gradient-to-b from-white to-[#f8fafc] py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c9a454]">
              VISTA PREVIA · FLYPATH
            </p>
            <span className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600">
              Sin registro · sin datos centralizados
            </span>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-[#0f1a33] sm:text-4xl">
              Tu cabina FlyPath
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-600 sm:text-base">
              Punto de acceso a las herramientas de FlyPath y a los pasos que suelen seguir los
              aspirantes. En el futuro reunirá aquí tu ruta y progreso; hoy es solo una vista previa.
            </p>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-slate-500">
              Cada herramienta (Career Planner, comparador, ATPL Planner…) guarda lo suyo en tu
              navegador por separado hasta que exista cuenta de usuario.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={PLATFORM_HOME.href}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-[14px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#c9a454]/45 hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
              >
                Volver al inicio
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
              <Link
                href="/planifica-tu-ruta"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-[14px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/50"
              >
                Explorar secciones
              </Link>
            </div>
          </div>
        </section>

        <section className="py-9 sm:py-11">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Accesos rápidos
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {DASHBOARD_TOOL_CARDS.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_24px_rgba(15,26,51,0.05)] transition hover:border-[#c9a454]/40 hover:shadow-[0_8px_32px_rgba(15,26,51,0.08)]"
                >
                  <h2 className="text-lg font-semibold text-[#0f1a33]">{card.title}</h2>
                  <p className="mt-2 flex-1 text-[15px] leading-relaxed text-slate-600">{card.description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-[14px] font-semibold text-[#7a5a16]">
                    {card.cta}
                    <ArrowRight
                      className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200/70 bg-white py-9 sm:py-11">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <h2 className="text-xl font-semibold tracking-tight text-[#0f1a33] sm:text-2xl">
              Próximos pasos recomendados
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600">
              Sugerencias generales (no personalizadas) para avanzar con criterio antes de comprometer
              dinero o firmar con una escuela.
            </p>
            <ol className="mt-6 space-y-4">
              {RECOMMENDED_STEPS.map((item) => (
                <li key={item.step}>
                  <Link
                    href={item.href}
                    className="group flex gap-4 rounded-2xl border border-slate-200/80 bg-[#f8fafc] p-5 transition hover:border-[#c9a454]/35 hover:bg-[#fffdf8]"
                  >
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0f1a33] text-sm font-bold text-[#f2ddaa]">
                      {item.step}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#0f1a33]">{item.title}</p>
                      <p className="mt-1 text-[14px] leading-relaxed text-slate-600">{item.text}</p>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#7a5a16]">
                        Ir ahora
                        <ArrowRight
                          className="h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-slate-200/70 py-9 sm:py-11">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <h2 className="text-xl font-semibold tracking-tight text-[#0f1a33] sm:text-2xl">
              Estado de plataforma
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600">
              Qué puedes usar hoy en FlyPath y qué llegará en próximas fases.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2.5">
              {PLATFORM_STATUS_BADGES.map((badge) => (
                <li key={badge.label}>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium ${statusBadgeClasses(badge.kind)}`}
                  >
                    <StatusIcon kind={badge.kind} />
                    {badge.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
