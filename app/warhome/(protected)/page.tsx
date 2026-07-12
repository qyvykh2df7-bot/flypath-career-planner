import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Construction,
  Database,
  NotebookPen,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

type QuickAccessItem = {
  title: string;
  description: string;
  status: "available" | "coming_soon";
  href?: string;
  icon: LucideIcon;
};

const QUICK_ACCESS_ITEMS: readonly QuickAccessItem[] = [
  {
    title: "Leads",
    description: "Prepara el acceso al futuro espacio de captación y seguimiento.",
    status: "available",
    href: "/warhome/leads",
    icon: UsersRound,
  },
  {
    title: "Notas",
    description: "Contexto interno para dar continuidad al trabajo del equipo.",
    status: "coming_soon",
    icon: NotebookPen,
  },
  {
    title: "Analítica",
    description: "Lectura transversal de actividad, conversión y rendimiento.",
    status: "coming_soon",
    icon: BarChart3,
  },
  {
    title: "Agentes",
    description: "Automatización asistida para operaciones repetibles de FlyPath.",
    status: "coming_soon",
    icon: Bot,
  },
] as const;

const SYSTEM_STATUS = [
  { label: "Acceso administrativo protegido", icon: ShieldCheck },
  { label: "Supabase conectado", icon: Database },
  { label: "Tracking básico implementado", icon: CheckCircle2 },
  { label: "Warhome MVP en construcción", icon: Construction },
] as const;

export default function WarhomePage() {
  return (
    <div className="mx-auto max-w-[1440px]">
      <section className="max-w-3xl">
        <p className="text-xs font-semibold uppercase text-[#d6ae4f]">Centro de mando</p>
        <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Resumen</h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-400">
          Warhome centralizará la operación interna de FlyPath en un espacio protegido, claro y
          preparado para crecer por módulos.
        </p>
      </section>

      <section aria-labelledby="quick-access-title" className="mt-9">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="quick-access-title" className="text-lg font-semibold text-white">
              Accesos rápidos
            </h2>
            <p className="mt-1 text-sm text-slate-500">Módulos principales del entorno interno.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACCESS_ITEMS.map((item) => {
            const Icon = item.icon;
            const content = (
              <>
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#d6ae4f]/20 bg-[#d6ae4f]/10">
                    <Icon className="h-5 w-5 text-[#e3bc62]" aria-hidden />
                  </span>
                  {item.status === "coming_soon" ? (
                    <span className="rounded border border-white/[0.08] px-2 py-1 text-[11px] font-medium text-slate-500">
                      Próximamente
                    </span>
                  ) : (
                    <ArrowRight className="h-4 w-4 text-[#d6ae4f]" aria-hidden />
                  )}
                </div>
                <h3 className="mt-5 text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
              </>
            );

            return item.href ? (
              <Link
                key={item.title}
                href={item.href}
                className="min-h-48 rounded-lg border border-white/[0.08] bg-[#0e1b2d] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.12)] transition hover:border-[#d6ae4f]/35 hover:bg-[#102034] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ae4f]/40"
              >
                {content}
              </Link>
            ) : (
              <article
                key={item.title}
                aria-disabled="true"
                className="min-h-48 rounded-lg border border-white/[0.07] bg-[#0c1828] p-5 opacity-75"
              >
                {content}
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="system-status-title" className="mt-9 border-t border-white/[0.08] pt-8">
        <div className="rounded-lg border border-white/[0.08] bg-[#0d192a] p-5 sm:p-6">
          <h2 id="system-status-title" className="text-lg font-semibold text-white">
            Estado del sistema
          </h2>
          <p className="mt-1 text-sm text-slate-500">Base técnica disponible para el Warhome MVP.</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {SYSTEM_STATUS.map((status) => {
              const Icon = status.icon;
              return (
                <li
                  key={status.label}
                  className="flex min-h-12 items-center gap-3 border-l-2 border-[#d6ae4f]/45 bg-white/[0.02] px-4 py-3"
                >
                  <Icon className="h-[18px] w-[18px] shrink-0 text-[#d6ae4f]" aria-hidden />
                  <span className="text-sm text-slate-300">{status.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
