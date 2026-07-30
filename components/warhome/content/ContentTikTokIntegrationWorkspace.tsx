"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  Check,
  ExternalLink,
  Link2,
  LoaderCircle,
  RefreshCw,
  Trash2,
  Unplug,
} from "lucide-react";
import {
  disconnectContentOsTikTokAction,
  importContentOsTikTokUrlAction,
  reviewContentOsTikTokVideoAction,
  syncContentOsTikTokAction,
} from "@/app/warhome/(protected)/content/integrations/tiktok/actions";
import { CONTENT_OS_LIMITS, CONTENT_OS_OBJECTIVES } from "@/lib/warhome/content-os-contract";
import {
  CONTENT_OS_STRATEGY_PRODUCTS,
} from "@/lib/warhome/content-os-strategy-contract";
import {
  CONTENT_OS_TIKTOK_ANALYSIS_PILLARS,
  CONTENT_OS_TIKTOK_LIMITS,
  type ContentOsTikTokVideo,
  type ContentOsTikTokWorkspace,
} from "@/lib/warhome/content-os-tiktok-contract";
import {
  CONTENT_OS_OBJECTIVE_LABELS,
  CONTENT_OS_STRATEGY_PILLAR_LABELS,
  CONTENT_OS_STRATEGY_PRODUCT_LABELS,
} from "./ContentOsLabels";

const inputClass =
  "min-h-10 w-full rounded-lg border border-white/[0.09] bg-[#091524] px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-[#d6ae4f]/50 focus:ring-2 focus:ring-[#d6ae4f]/15";
const textareaClass = `${inputClass} py-2.5`;
const INITIAL_ACTION_STATE = {
  status: "idle" as const,
  message: null,
};

type ContentOsTikTokActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

function dateTime(value: string | null): string {
  if (!value) return "Nunca";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ActionMessage({ state }: { state: ContentOsTikTokActionState }) {
  return (
    <p
      aria-live="polite"
      className={`text-sm ${
        state.status === "error" ? "text-rose-300" : "text-emerald-300"
      }`}
    >
      {state.message}
    </p>
  );
}

function ActionButton({
  label,
  pendingLabel,
  tone = "primary",
}: {
  label: string;
  pendingLabel: string;
  tone?: "primary" | "secondary" | "danger";
}) {
  const { pending } = useFormStatus();
  const classes = {
    primary:
      "bg-[#d6ae4f] text-[#091524] hover:bg-[#e3bc62]",
    secondary:
      "border border-white/[0.12] bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]",
    danger:
      "border border-rose-400/20 bg-rose-400/[0.06] text-rose-200 hover:bg-rose-400/[0.1]",
  }[tone];
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60 ${classes}`}
    >
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
      ) : tone === "danger" ? (
        <Unplug className="h-4 w-4" aria-hidden />
      ) : (
        <RefreshCw className="h-4 w-4" aria-hidden />
      )}
      {pending ? pendingLabel : label}
    </button>
  );
}

function ConnectionPanel({
  workspace,
}: {
  workspace: ContentOsTikTokWorkspace;
}) {
  const [syncState, syncAction] = useActionState(
    syncContentOsTikTokAction,
    INITIAL_ACTION_STATE,
  );
  const [disconnectState, disconnectAction] = useActionState(
    disconnectContentOsTikTokAction,
    INITIAL_ACTION_STATE,
  );
  const connection = workspace.connection;

  return (
    <section className="rounded-lg border border-white/[0.08] bg-[#0d192a] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-[#d6ae4f]">
            Cuenta propia
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            {connection ? connection.displayName : "TikTok no conectado"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {connection
              ? `Última sincronización: ${dateTime(connection.lastSyncedAt)}`
              : "Conecta PilotFeliu para importar publicaciones públicas."}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
            connection
              ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300"
              : "border-white/[0.1] text-slate-400"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              connection ? "bg-emerald-400" : "bg-slate-600"
            }`}
          />
          {connection ? "Conectado" : "Sin conexión"}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {connection ? (
          <>
            <form action={syncAction}>
              <ActionButton
                label="Sincronizar ahora"
                pendingLabel="Sincronizando..."
              />
            </form>
            <form action={disconnectAction}>
              <ActionButton
                label="Desconectar"
                pendingLabel="Desconectando..."
                tone="danger"
              />
            </form>
          </>
        ) : (
          <a
            href="/api/warhome/content/integrations/tiktok/connect"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#d6ae4f] px-4 text-sm font-semibold text-[#091524] transition hover:bg-[#e3bc62]"
          >
            <Link2 className="h-4 w-4" aria-hidden />
            Conectar TikTok
          </a>
        )}
      </div>
      <div className="mt-3 grid gap-1">
        <ActionMessage state={syncState} />
        <ActionMessage state={disconnectState} />
      </div>
    </section>
  );
}

function ManualImportForm() {
  const [state, action] = useActionState(
    importContentOsTikTokUrlAction,
    INITIAL_ACTION_STATE,
  );
  return (
    <form
      action={action}
      className="rounded-lg border border-white/[0.08] bg-[#0d192a] p-5 sm:p-6"
    >
      <h2 className="text-base font-semibold text-white">
        Importar por URL
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Alternativa manual cuando una métrica no está disponible en la API.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">
            URL TikTok
          </span>
          <input
            type="url"
            name="shareUrl"
            placeholder="https://www.tiktok.com/@usuario/video/..."
            required
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">
            Fecha de publicación
          </span>
          <input type="date" name="publishedOn" required className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">
            Duración en segundos
          </span>
          <input
            type="number"
            name="durationSeconds"
            min={1}
            max={36_000}
            className={inputClass}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">
            Caption
          </span>
          <textarea
            name="caption"
            rows={4}
            maxLength={CONTENT_OS_TIKTOK_LIMITS.caption}
            className={textareaClass}
          />
        </label>
        {[
          ["views", "Visualizaciones"],
          ["likes", "Likes"],
          ["comments", "Comentarios"],
          ["shares", "Compartidos"],
          ["saves", "Guardados"],
        ].map(([name, label]) => (
          <label key={name} className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">
              {label}
            </span>
            <input
              type="number"
              name={name}
              min={0}
              max={CONTENT_OS_LIMITS.metricValue}
              className={inputClass}
            />
          </label>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <ActionMessage state={state} />
        <ActionButton label="Importar vídeo" pendingLabel="Importando..." />
      </div>
    </form>
  );
}

function ReviewCard({ video }: { video: ContentOsTikTokVideo }) {
  const confirmedAction = reviewContentOsTikTokVideoAction.bind(
    null,
    video.id,
    "confirmed",
  );
  const rejectedAction = reviewContentOsTikTokVideoAction.bind(
    null,
    video.id,
    "rejected",
  );
  const [confirmState, confirm] = useActionState(
    confirmedAction,
    INITIAL_ACTION_STATE,
  );
  const [rejectState, reject] = useActionState(
    rejectedAction,
    INITIAL_ACTION_STATE,
  );
  if (
    video.analysisStatus !== "pending_review" &&
    video.analysisStatus !== "rejected"
  ) {
    return null;
  }

  return (
    <form className="rounded-lg border border-white/[0.08] bg-[#0d192a] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-[#d6ae4f]">
            Revisión humana
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {dateTime(video.publishedAt)}
          </p>
        </div>
        <a
          href={video.shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white"
        >
          Abrir vídeo
          <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      </div>
      <div className="mt-5 grid gap-4">
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-400">
            Título interno
          </span>
          <input
            name="title"
            defaultValue={video.analysisTitle ?? ""}
            maxLength={CONTENT_OS_LIMITS.itemTitle}
            required
            className={inputClass}
          />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-400">
            Resumen
          </span>
          <textarea
            name="summary"
            defaultValue={video.analysisSummary ?? ""}
            maxLength={CONTENT_OS_LIMITS.itemSummary}
            rows={3}
            required
            className={textareaClass}
          />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-400">
            Hook
          </span>
          <textarea
            name="hook"
            defaultValue={video.analysisHook ?? ""}
            maxLength={CONTENT_OS_LIMITS.itemHook}
            rows={2}
            required
            className={textareaClass}
          />
        </label>
        <div className="grid gap-3 md:grid-cols-3">
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-400">
              Pilar
            </span>
            <select
              name="pillar"
              defaultValue={video.analysisPillar ?? ""}
              required
              className={inputClass}
            >
              {CONTENT_OS_TIKTOK_ANALYSIS_PILLARS.map((pillar) => (
                <option key={pillar} value={pillar}>
                  {CONTENT_OS_STRATEGY_PILLAR_LABELS[pillar]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-400">
              Objetivo
            </span>
            <select
              name="objective"
              defaultValue={video.analysisObjective ?? ""}
              required
              className={inputClass}
            >
              {CONTENT_OS_OBJECTIVES.map((objective) => (
                <option key={objective} value={objective}>
                  {CONTENT_OS_OBJECTIVE_LABELS[objective]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-400">
              Producto
            </span>
            <select
              name="relatedProduct"
              defaultValue={video.analysisRelatedProduct ?? ""}
              className={inputClass}
            >
              <option value="">Ninguno</option>
              {CONTENT_OS_STRATEGY_PRODUCTS.map((product) => (
                <option key={product} value={product}>
                  {CONTENT_OS_STRATEGY_PRODUCT_LABELS[product]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
        <div className="grid gap-1">
          <ActionMessage state={confirmState} />
          <ActionMessage state={rejectState} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            formAction={reject}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.12] px-4 text-sm font-semibold text-slate-300 hover:bg-white/[0.05]"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Rechazar
          </button>
          <button
            formAction={confirm}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#d6ae4f] px-4 text-sm font-semibold text-[#091524] hover:bg-[#e3bc62]"
          >
            <Check className="h-4 w-4" aria-hidden />
            Confirmar en biblioteca
          </button>
        </div>
      </div>
    </form>
  );
}

function MetricStrip({ video }: { video: ContentOsTikTokVideo }) {
  const values = [
    ["Views", video.views],
    ["Likes", video.likes],
    ["Comentarios", video.comments],
    ["Compartidos", video.shares],
    ["Guardados", video.saves],
  ] as const;
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
      {values.map(([label, value]) => (
        <span key={label}>
          {label}: {value === null ? "No disponible" : value.toLocaleString("es-ES")}
        </span>
      ))}
    </div>
  );
}

export function ContentTikTokIntegrationWorkspace({
  workspace,
  notice,
}: {
  workspace: ContentOsTikTokWorkspace;
  notice: string | null;
}) {
  const reviews = workspace.videos.filter(
    (video) =>
      video.analysisStatus === "pending_review" ||
      video.analysisStatus === "rejected",
  );
  const processing = workspace.videos.filter(
    (video) =>
      video.analysisStatus === "pending_analysis" ||
      video.analysisStatus === "failed",
  );
  const confirmed = workspace.videos.filter(
    (video) => video.analysisStatus === "confirmed",
  );

  return (
    <div className="mt-8 grid gap-6">
      {notice ? (
        <div
          role="status"
          className="rounded-lg border border-[#d6ae4f]/20 bg-[#d6ae4f]/[0.07] px-4 py-3 text-sm text-slate-200"
        >
          {notice}
        </div>
      ) : null}
      <ConnectionPanel workspace={workspace} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Análisis pendientes
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                La IA propone; tú editas, confirmas o rechazas.
              </p>
            </div>
            <span className="text-sm text-slate-400">
              {reviews.length} por revisar
            </span>
          </div>
          <div className="grid gap-4">
            {reviews.length ? (
              reviews.map((video) => (
                <div key={video.id}>
                  <ReviewCard video={video} />
                  <MetricStrip video={video} />
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-white/[0.1] px-5 py-10 text-center text-sm text-slate-500">
                No hay análisis pendientes de revisión.
              </div>
            )}
          </div>
        </section>
        <div className="grid content-start gap-6">
          <ManualImportForm />
          <section className="rounded-lg border border-white/[0.08] bg-[#0d192a] p-5">
            <h2 className="text-base font-semibold text-white">
              Estado de importación
            </h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Confirmados</dt>
                <dd className="font-semibold text-slate-200">
                  {confirmed.length}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Pendientes o con error</dt>
                <dd className="font-semibold text-slate-200">
                  {processing.length}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Total detectado</dt>
                <dd className="font-semibold text-slate-200">
                  {workspace.videos.length}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
