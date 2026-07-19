import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CircleGauge,
  Clock3,
  Mail,
  RadioTower,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import {
  getWarhomeAeroCommsLabel,
} from "@/components/warhome/WarhomeUsersTable";
import type { WarhomeUserDetail as WarhomeUserDetailData } from "@/lib/warhome/user-detail";

type WarhomeUserDetailProps = {
  detail: WarhomeUserDetailData;
};

const PROFILE_LANGUAGE_LABELS: Record<string, string> = {
  es: "Español",
  en: "Inglés",
};

const PROFILE_TRAINING_STAGE_LABELS: Record<string, string> = {
  exploring: "Explorando opciones",
  pre_ppl: "Pre-PPL",
  ppl_student: "Alumno PPL",
  ppl_holder: "PPL obtenido",
  atpl_theory: "Teoría ATPL",
  commercial_training: "Formación comercial",
  licensed_pilot: "Piloto con licencia",
  airline_pilot: "Piloto de aerolínea",
  other: "Otro",
};

const PROFILE_CAREER_GOAL_LABELS: Record<string, string> = {
  airline_pilot: "Piloto de aerolínea",
  private_pilot: "Piloto privado",
  flight_instructor: "Instructor de vuelo",
  career_change: "Cambio profesional",
  aviation_enthusiast: "Afición por la aviación",
  undecided: "Por decidir",
  other: "Otro",
};

const LEVEL_LABELS: Record<string, string> = {
  cadet: "Cadet",
  "student-pilot": "Student Pilot",
  "ready-for-radio": "Ready For Radio",
  "airline-prep": "Airline Prep",
  "advanced-ops": "Advanced Ops",
};

const SUBSCRIPTION_LIST_LABELS: Record<string, string> = {
  newsletter: "Newsletter",
  home_newsletter: "Newsletter",
  career_planner: "Career Planner",
  preppl: "Pre-PPL",
  aerocomms: "AeroComms",
  mentoring: "Mentorías",
  general_marketing: "Marketing general",
};

const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  subscribed: "Suscrito",
  unsubscribed: "Baja",
  bounced: "Rebotado",
  complained: "Queja",
  blocked: "Bloqueado",
};

export function formatWarhomeUserDetailDate(value: string | null): string {
  if (!value) return "Sin datos";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin datos";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusClasses(status: string): string {
  if (status === "active" || status === "subscribed") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  }
  if (status === "not_synced" || status === "not_applicable") {
    return "border-white/[0.08] bg-white/[0.04] text-slate-400";
  }
  return "border-amber-300/20 bg-amber-300/10 text-amber-100";
}

function getProfileLabel(
  value: string | null,
  labels: Record<string, string>,
): string {
  if (!value) return "Sin datos";
  return labels[value] ?? "Sin datos";
}

function getSubscriptionDateLabel(status: string): string {
  return {
    subscribed: "Confirmación",
    unsubscribed: "Baja",
    bounced: "Rebote",
    complained: "Queja",
    blocked: "Bloqueo",
  }[status] ?? "Actualización";
}

export function WarhomeUserDetail({ detail }: WarhomeUserDetailProps) {
  const { identity, profile, aerocomms, recentSessions, lead, marketing } = detail;
  return (
    <div className="mx-auto max-w-[1440px]">
      <Link
        href="/warhome/users"
        className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ae4f]/35"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a Usuarios
      </Link>

      <section className="mt-5 border-b border-white/[0.08] pb-8">
        <p className="text-xs font-semibold uppercase text-[#d6ae4f]">Ficha de usuario</p>
        <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
          {profile.fullName ?? "Sin nombre"}
        </h2>
        <p className="mt-2 inline-flex items-center gap-2 text-[15px] text-slate-300">
          <Mail className="h-4 w-4 text-slate-500" aria-hidden />
          {identity.email ?? "Email no disponible"}
        </p>
      </section>

      <section aria-labelledby="identity-title" className="mt-8">
        <h3 id="identity-title" className="text-lg font-semibold text-white">Identidad y cuenta</h3>
        <dl className="mt-4 grid gap-px overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 xl:grid-cols-3">
          {[
            ["Email confirmado", identity.emailConfirmed ? "Confirmado" : "Sin confirmar"],
            ["Cuenta creada", formatWarhomeUserDetailDate(identity.createdAt)],
            ["Último acceso", formatWarhomeUserDetailDate(identity.lastSignInAt)],
            ["Estado del perfil", profile.isIncomplete ? "Incompleto" : "Completo"],
          ].map(([label, value]) => (
            <div key={label} className="min-h-20 bg-[#0d192a] px-4 py-4">
              <dt className="text-xs text-slate-500">{label}</dt>
              <dd className="mt-1 text-sm font-medium text-slate-200">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-labelledby="profile-title" className="rounded-lg border border-white/[0.08] bg-[#0d192a]">
          <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
            <UserRound className="h-5 w-5 text-[#d6ae4f]" aria-hidden />
            <div>
              <h3 id="profile-title" className="text-lg font-semibold text-white">Perfil</h3>
              <p className="mt-0.5 text-sm text-slate-500">Datos declarados por la cuenta FlyPath.</p>
            </div>
          </div>
          <dl className="grid gap-px bg-white/[0.07] sm:grid-cols-2">
            {[
              ["Idioma", getProfileLabel(profile.preferredLanguage, PROFILE_LANGUAGE_LABELS)],
              ["Zona horaria", profile.timezone ?? "Sin datos"],
              ["Etapa formativa", getProfileLabel(profile.trainingStage, PROFILE_TRAINING_STAGE_LABELS)],
              ["Objetivo profesional", getProfileLabel(profile.careerGoal, PROFILE_CAREER_GOAL_LABELS)],
            ].map(([label, value]) => (
              <div key={label} className="min-h-20 bg-[#0d192a] px-5 py-4">
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="mt-1 text-sm font-medium text-slate-200">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="aerocomms-title" className="rounded-lg border border-white/[0.08] bg-[#0d192a]">
          <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
            <CircleGauge className="h-5 w-5 text-[#d6ae4f]" aria-hidden />
            <div>
              <h3 id="aerocomms-title" className="text-lg font-semibold text-white">Resumen AeroComms</h3>
              <p className="mt-0.5 text-sm text-slate-500">Progreso sincronizado disponible para la cuenta.</p>
            </div>
          </div>
          <dl className="grid gap-px bg-white/[0.07] sm:grid-cols-2 xl:grid-cols-3">
            {[
              ["Estado", getWarhomeAeroCommsLabel(aerocomms.status)],
              ["Sesiones", String(aerocomms.sessionCount)],
              ["Sesiones puntuadas", String(aerocomms.scoredSessionCount)],
              ["Ejercicios completados", String(aerocomms.completedExerciseCount)],
              ["Misiones completadas", String(aerocomms.completedMissionCount)],
              ["Racha", `${aerocomms.streakDays} días`],
              ["Última actividad", formatWarhomeUserDetailDate(aerocomms.lastActivityAt)],
              ["Importación legacy", formatWarhomeUserDetailDate(aerocomms.legacyImportedAt)],
              ["Último reset", formatWarhomeUserDetailDate(aerocomms.resetAt)],
            ].map(([label, value]) => (
              <div key={label} className="min-h-20 bg-[#0d192a] px-5 py-4">
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="mt-1 text-sm font-medium text-slate-200">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section aria-labelledby="sessions-title" className="mt-8 overflow-hidden rounded-lg border border-white/[0.08] bg-[#0d192a]">
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-6">
          <RadioTower className="h-5 w-5 text-[#d6ae4f]" aria-hidden />
          <div>
            <h3 id="sessions-title" className="text-lg font-semibold text-white">Actividad reciente</h3>
            <p className="mt-0.5 text-sm text-slate-500">Últimas sesiones de AeroComms registradas.</p>
          </div>
        </div>
        {recentSessions.length ? (
          <ol className="divide-y divide-white/[0.07]">
            {recentSessions.map((session, index) => (
              <li key={`${session.occurredAt}-${index}`} className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                <div>
                  <p className="font-medium text-slate-100">{session.label}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {session.levelId ? LEVEL_LABELS[session.levelId] : "Nivel sin datos"}
                    {session.score !== null ? ` · Puntuación: ${session.score}` : " · Sin puntuación"}
                  </p>
                </div>
                <time className="shrink-0 text-sm text-slate-500">{formatWarhomeUserDetailDate(session.occurredAt)}</time>
              </li>
            ))}
          </ol>
        ) : (
          <div className="flex min-h-44 flex-col items-center justify-center px-6 py-10 text-center">
            <Clock3 className="h-5 w-5 text-[#e3bc62]" aria-hidden />
            <h4 className="mt-3 text-base font-semibold text-white">Sin sesiones registradas</h4>
            <p className="mt-1 text-sm text-slate-500">La actividad de AeroComms aparecerá aquí cuando exista progreso sincronizado.</p>
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-labelledby="lead-title" className="rounded-lg border border-white/[0.08] bg-[#0d192a]">
          <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
            <CheckCircle2 className="h-5 w-5 text-[#d6ae4f]" aria-hidden />
            <div>
              <h3 id="lead-title" className="text-lg font-semibold text-white">Lead comercial</h3>
              <p className="mt-0.5 text-sm text-slate-500">Relación comercial existente, si la hay.</p>
            </div>
          </div>
          {lead ? (
            <div className="px-5 py-5">
              <p className="text-sm text-slate-300">Existe un lead comercial vinculado a esta cuenta.</p>
              <Link href={`/warhome/leads/${lead.id}`} className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-[#d6ae4f]/35 px-3 text-sm font-medium text-[#e3bc62] transition hover:bg-[#d6ae4f]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ae4f]/35">
                Ver lead comercial
              </Link>
            </div>
          ) : <p className="px-5 py-10 text-center text-sm text-slate-500">Sin lead comercial</p>}
        </section>

        <section aria-labelledby="marketing-title" className="rounded-lg border border-white/[0.08] bg-[#0d192a]">
          <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
            <Mail className="h-5 w-5 text-[#d6ae4f]" aria-hidden />
            <div>
              <h3 id="marketing-title" className="text-lg font-semibold text-white">Marketing</h3>
              <p className="mt-0.5 text-sm text-slate-500">Consentimiento separado de la cuenta.</p>
            </div>
          </div>
          {marketing.status === "not_applicable" ? <p className="px-5 py-10 text-center text-sm text-slate-500">No aplicable sin lead comercial</p> : marketing.subscriptions.length ? (
            <ul className="divide-y divide-white/[0.07]">
              {marketing.subscriptions.map((subscription) => (
                <li key={subscription.listKey} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-slate-100">{SUBSCRIPTION_LIST_LABELS[subscription.listKey] ?? "Lista de marketing"}</p>
                    <span className={`rounded border px-2 py-1 text-xs font-medium ${statusClasses(subscription.status)}`}>{SUBSCRIPTION_STATUS_LABELS[subscription.status]}</span>
                  </div>
                  {subscription.statusChangedAt ? <p className="mt-2 text-xs text-slate-500">{getSubscriptionDateLabel(subscription.status)}: {formatWarhomeUserDetailDate(subscription.statusChangedAt)}</p> : <p className="mt-2 text-xs text-slate-500">Sin fecha de estado registrada</p>}
                </li>
              ))}
            </ul>
          ) : <p className="px-5 py-10 text-center text-sm text-slate-500">Sin suscripciones registradas</p>}
        </section>
      </div>

      <section aria-labelledby="purchases-title" className="mt-8 rounded-lg border border-white/[0.08] bg-[#0d192a] px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <ShoppingBag className="mt-0.5 h-5 w-5 shrink-0 text-[#d6ae4f]" aria-hidden />
          <div>
            <h3 id="purchases-title" className="text-lg font-semibold text-white">Compras y accesos</h3>
            <p className="mt-1 text-sm text-slate-500">Disponible cuando se implemente Pagos y entitlements.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
