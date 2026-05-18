"use client";

import type { ErrorLogItem, ErrorLogStatus } from "@/lib/study-planner/types";
import { groupErrorLogByStatus } from "@/lib/study-planner/calculations";
import { ERROR_LOG_STATUS_LABELS, getErrorLogTypeLabel } from "@/lib/study-planner/labels";
import { getSubjectById } from "@/lib/study-planner/subjects";

type ErrorLogListProps = {
  errorLogItems: ErrorLogItem[];
  onSetStatus: (errorId: string, status: ErrorLogStatus) => void;
  onDelete: (errorId: string) => void;
};

function statusBadgeClass(status: ErrorLogStatus): string {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-900 ring-amber-200/70";
    case "reviewed":
      return "bg-[#e8eef8] text-[#0f1a33] ring-[#0f1a33]/12";
    case "resolved":
      return "bg-slate-50 text-slate-600 ring-slate-200/80";
  }
}

function ErrorCard({
  item,
  onSetStatus,
  onDelete,
}: {
  item: ErrorLogItem;
  onSetStatus: (id: string, status: ErrorLogStatus) => void;
  onDelete: (id: string) => void;
}) {
  const subjectName = getSubjectById(item.subjectId)?.name ?? item.subjectId;

  return (
    <li
      className={`rounded-lg border p-3 shadow-sm ring-1 ${
        item.status === "pending"
          ? "border-amber-200/70 bg-amber-50/30 ring-amber-100/60"
          : item.status === "resolved"
            ? "border-slate-200/80 bg-slate-50/50 ring-slate-100/80"
            : "border-slate-200/90 bg-white ring-slate-100/80"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-[#0f1a33]">{item.topic}</p>
          <p className="mt-0.5 text-[13px] text-slate-600">
            {subjectName} · {item.date}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${statusBadgeClass(item.status)}`}
        >
          {ERROR_LOG_STATUS_LABELS[item.status]}
        </span>
      </div>

      <p className="mt-2 text-[12px] font-medium text-slate-500">{getErrorLogTypeLabel(item.type)}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-slate-700">{item.description}</p>
      {item.correctiveAction ? (
        <p className="mt-2 text-[13px] text-slate-600">
          <span className="font-semibold text-slate-500">Acción correctiva:</span> {item.correctiveAction}
        </p>
      ) : null}
      {item.notes ? (
        <p className="mt-2 text-[13px] text-slate-500">
          <span className="font-semibold">Notas:</span> {item.notes}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.status === "pending" ? (
          <>
            <ActionButton label="Marcar revisado" onClick={() => onSetStatus(item.id, "reviewed")} />
            <ActionButton
              label="Marcar resuelto"
              variant="primary"
              onClick={() => onSetStatus(item.id, "resolved")}
            />
          </>
        ) : null}
        {item.status === "reviewed" ? (
          <>
            <ActionButton
              label="Marcar resuelto"
              variant="primary"
              onClick={() => onSetStatus(item.id, "resolved")}
            />
            <ActionButton label="Reabrir" onClick={() => onSetStatus(item.id, "pending")} />
          </>
        ) : null}
        {item.status === "resolved" ? (
          <ActionButton label="Reabrir" onClick={() => onSetStatus(item.id, "pending")} />
        ) : null}
        <ActionButton label="Eliminar" variant="danger" onClick={() => onDelete(item.id)} />
      </div>
    </li>
  );
}

function ActionButton({
  label,
  onClick,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  variant?: "default" | "primary" | "danger";
}) {
  const styles =
    variant === "primary"
      ? "border-[#c9a454] bg-[#c9a454] text-[#0f1a33]"
      : variant === "danger"
        ? "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:text-red-700"
        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1.5 text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40 ${styles}`}
    >
      {label}
    </button>
  );
}

function ErrorSection({
  title,
  items,
  emptyMessage,
  onSetStatus,
  onDelete,
  tone = "default",
}: {
  title: string;
  items: ErrorLogItem[];
  emptyMessage?: string;
  onSetStatus: (id: string, status: ErrorLogStatus) => void;
  onDelete: (id: string) => void;
  tone?: "default" | "pending";
}) {
  return (
    <section className="space-y-3">
      <h4
        className={`text-[14px] font-semibold ${tone === "pending" ? "text-amber-900" : "text-[#0f1a33]"}`}
      >
        {title}
        <span className="ml-2 text-[13px] font-medium text-slate-500">({items.length})</span>
      </h4>
      {items.length === 0 ? (
        emptyMessage ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-4 text-[13px] text-slate-500">
            {emptyMessage}
          </p>
        ) : null
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <ErrorCard key={item.id} item={item} onSetStatus={onSetStatus} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function ErrorLogList({ errorLogItems, onSetStatus, onDelete }: ErrorLogListProps) {
  const groups = groupErrorLogByStatus(errorLogItems);

  if (errorLogItems.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-[14px] font-medium text-slate-600">
        <p>
          Todavía no has registrado errores. Cuando falles una pregunta o detectes un patrón, anótalo aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ErrorSection
        title="Pendientes"
        items={groups.pending}
        emptyMessage="No tienes errores pendientes."
        onSetStatus={onSetStatus}
        onDelete={onDelete}
        tone="pending"
      />
      <ErrorSection
        title="Revisados"
        items={groups.reviewed}
        emptyMessage="No hay errores en revisión."
        onSetStatus={onSetStatus}
        onDelete={onDelete}
      />
      <ErrorSection
        title="Resueltos"
        items={groups.resolved}
        emptyMessage="Aún no has marcado errores como resueltos."
        onSetStatus={onSetStatus}
        onDelete={onDelete}
      />
    </div>
  );
}
