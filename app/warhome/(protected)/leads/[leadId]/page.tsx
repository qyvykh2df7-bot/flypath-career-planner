import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CircleGauge,
  Mail,
  PackageOpen,
  RadioTower,
} from "lucide-react";
import { WarhomeLeadActivity } from "@/components/warhome/WarhomeLeadActivity";
import {
  getSafeWarhomeLeadsReturn,
  getWarhomeLeadDetail,
  parseWarhomeActivityPage,
  type WarhomeLeadInterestStatus,
  WARHOME_EMAIL_SUBSCRIPTION_LIST_LABELS,
  WarhomeLeadNotFoundError,
  WARHOME_EMAIL_SUBSCRIPTION_STATUS_LABELS,
} from "@/lib/warhome/lead-detail";
import {
  WARHOME_LEAD_SOURCE_LABELS,
  WARHOME_LEAD_STAGE_LABELS,
  WARHOME_LEAD_STATUS_LABELS,
} from "@/lib/warhome/leads";

type WarhomeLeadDetailPageProps = {
  params: Promise<{ leadId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const INTEREST_STATUS_LABELS: Record<WarhomeLeadInterestStatus, string> = {
  interested: "Interesado",
  waitlist: "Lista de espera",
  qualified: "Cualificado",
  customer: "Cliente",
  not_interested: "Sin interés",
  archived: "Archivado",
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getSubscriptionChangeSourceLabel(source: string | null): string | null {
  if (!source) return null;
  if (source === "unsubscribe_link") return "Enlace de baja";
  if (source === "resend_webhook") return "Resend";
  return source in WARHOME_LEAD_SOURCE_LABELS
    ? WARHOME_LEAD_SOURCE_LABELS[source as keyof typeof WARHOME_LEAD_SOURCE_LABELS]
    : null;
}

function getSubscriptionStatusDateLabel(
  status: "subscribed" | "unsubscribed" | "bounced" | "complained" | "blocked",
): string {
  return {
    subscribed: "Consentimiento",
    unsubscribed: "Baja",
    bounced: "Rebote",
    complained: "Queja",
    blocked: "Bloqueo",
  }[status];
}

function getSubscriptionEventLabel(
  eventType: "subscribed" | "resubscribed" | "unsubscribed" | "bounced" | "complained" | "blocked",
): string {
  return {
    subscribed: "Suscripción",
    resubscribed: "Nueva suscripción",
    unsubscribed: "Baja",
    bounced: "Rebote",
    complained: "Queja",
    blocked: "Bloqueo",
  }[eventType];
}

export default async function WarhomeLeadDetailPage({
  params,
  searchParams,
}: WarhomeLeadDetailPageProps) {
  const [{ leadId }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const returnTo = getSafeWarhomeLeadsReturn(resolvedSearchParams.return);
  const activityPage = parseWarhomeActivityPage(resolvedSearchParams.activity_page);

  try {
    const lead = await getWarhomeLeadDetail(leadId, { activityPage });

    return (
      <div className="mx-auto max-w-[1440px]">
        <Link
          href={returnTo}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ae4f]/35"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a Leads
        </Link>

        <section className="mt-5 border-b border-white/[0.08] pb-8">
          <p className="text-xs font-semibold uppercase text-[#d6ae4f]">Ficha de lead</p>
          <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
            {lead.fullName ?? "Sin nombre"}
          </h2>
          <p className="mt-2 inline-flex items-center gap-2 text-[15px] text-slate-300">
            <Mail className="h-4 w-4 text-slate-500" aria-hidden />
            {lead.email}
          </p>
        </section>

        <section aria-labelledby="lead-overview-title" className="mt-8">
          <h3 id="lead-overview-title" className="text-lg font-semibold text-white">Resumen</h3>
          <dl className="mt-4 grid gap-px overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 xl:grid-cols-3">
            {[
              ["Fuente", WARHOME_LEAD_SOURCE_LABELS[lead.latestSource]],
              ["Etapa", WARHOME_LEAD_STAGE_LABELS[lead.funnelStage]],
              ["Estado", WARHOME_LEAD_STATUS_LABELS[lead.status]],
              ["Fecha de alta", formatDate(lead.createdAt)],
              ["Última actualización", formatDate(lead.updatedAt)],
            ].map(([label, value]) => (
              <div key={label} className="min-h-20 bg-[#0d192a] px-4 py-4">
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="mt-1 text-sm font-medium text-slate-200">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section aria-labelledby="interests-title" className="rounded-lg border border-white/[0.08] bg-[#0d192a]">
            <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
              <PackageOpen className="h-5 w-5 text-[#d6ae4f]" aria-hidden />
              <h3 id="interests-title" className="text-lg font-semibold text-white">Intereses</h3>
            </div>
            {lead.interests.length ? (
              <ul className="divide-y divide-white/[0.07]">
                {lead.interests.map((interest) => (
                  <li key={interest.productId} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="font-medium text-slate-100">{interest.productName ?? "Producto sin nombre"}</p>
                      <span className="rounded border border-white/[0.08] px-2 py-1 text-xs text-slate-400">
                        {INTEREST_STATUS_LABELS[interest.status]}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Primero: {formatDate(interest.firstSeenAt)} · Último: {formatDate(interest.lastSeenAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-slate-500">Sin intereses registrados</p>
            )}
          </section>

          <section aria-labelledby="subscriptions-title" className="rounded-lg border border-white/[0.08] bg-[#0d192a]">
            <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
              <Mail className="h-5 w-5 text-[#d6ae4f]" aria-hidden />
              <div>
                <h3 id="subscriptions-title" className="text-lg font-semibold text-white">Suscripciones</h3>
                <p className="mt-0.5 text-xs text-slate-500">{lead.marketingSummary}</p>
              </div>
            </div>
            {lead.subscriptions.length ? (
              <ul className="divide-y divide-white/[0.07]">
                {lead.subscriptions.map((subscription) => (
                  <li key={subscription.listKey} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="font-medium text-slate-100">
                        {WARHOME_EMAIL_SUBSCRIPTION_LIST_LABELS[subscription.listKey] ?? "Lista de email"}
                      </p>
                      <span className="rounded border border-white/[0.08] px-2 py-1 text-xs text-slate-400">
                        {WARHOME_EMAIL_SUBSCRIPTION_STATUS_LABELS[subscription.status]}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Fuente: {WARHOME_LEAD_SOURCE_LABELS[subscription.source]}
                      {subscription.consentedAt ? ` · Consentimiento: ${formatDate(subscription.consentedAt)}` : ""}
                      {subscription.statusChangedAt
                        ? ` · ${getSubscriptionStatusDateLabel(subscription.status)}: ${formatDate(subscription.statusChangedAt)}`
                        : ""}
                    </p>
                    {subscription.lastChange ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Último cambio: {getSubscriptionEventLabel(subscription.lastChange.eventType)} · {formatDate(subscription.lastChange.occurredAt)}
                        {getSubscriptionChangeSourceLabel(subscription.lastChange.source)
                          ? ` · ${getSubscriptionChangeSourceLabel(subscription.lastChange.source)}`
                          : ""}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-slate-500">Sin suscripciones registradas</p>
            )}
          </section>
        </div>

        <section aria-labelledby="activity-title" className="mt-8 overflow-hidden rounded-lg border border-white/[0.08] bg-[#0d192a]">
          <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <RadioTower className="h-5 w-5 text-[#d6ae4f]" aria-hidden />
            <div>
              <h3 id="activity-title" className="text-lg font-semibold text-white">Actividad registrada</h3>
              <p className="mt-0.5 text-sm text-slate-500">Eventos vinculados por lead_id.</p>
            </div>
          </div>
          <WarhomeLeadActivity
            leadId={lead.id}
            returnTo={returnTo}
            activity={lead.activity}
            activityPage={lead.activityPage}
            activityTotal={lead.activityTotal}
            activityTotalPages={lead.activityTotalPages}
          />
        </section>
      </div>
    );
  } catch (error) {
    if (error instanceof WarhomeLeadNotFoundError) notFound();

    return (
      <div className="mx-auto max-w-[1440px]">
        <Link
          href={returnTo}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a Leads
        </Link>
        <section className="mt-5 flex min-h-72 flex-col items-center justify-center rounded-lg border border-white/[0.08] bg-[#0d192a] px-6 py-12 text-center">
          <CircleGauge className="h-7 w-7 text-[#d6ae4f]" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold text-white">No se ha podido cargar la ficha</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
            Inténtalo de nuevo más tarde. El acceso y los datos se mantienen protegidos.
          </p>
        </section>
      </div>
    );
  }
}
