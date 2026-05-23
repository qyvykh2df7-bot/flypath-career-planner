"use client";

import { useState } from "react";
import type { ReviewItem } from "@/lib/study-planner/types";
import {
  REVIEW_STATUS_LABELS,
  formatReviewIntervalDays,
  getReviewStatus,
  groupReviewItemsByStatus,
} from "@/lib/study-planner/calculations";
import { getSubjectById } from "@/lib/study-planner/subjects";

type ReviewItemsListProps = {
  reviewItems: ReviewItem[];
  onComplete: (reviewId: string) => void;
  onReschedule: (reviewId: string, days: number) => void;
  onDelete: (reviewId: string) => void;
  emptyPendingMessage?: string;
};

const RESCHEDULE_OPTIONS = [
  { days: 1, label: "+1 día" },
  { days: 3, label: "+3 días" },
  { days: 7, label: "+7 días" },
  { days: 14, label: "+14 días" },
];

function statusBadgeClass(status: ReturnType<typeof getReviewStatus>): string {
  switch (status) {
    case "overdue":
      return "bg-amber-50 text-amber-900 ring-amber-200/70";
    case "completed":
      return "bg-slate-50 text-slate-600 ring-slate-200/80";
    default:
      return "bg-[#e8eef8] text-[#0f1a33] ring-[#0f1a33]/12";
  }
}

function ReviewCard({
  item,
  onComplete,
  onReschedule,
  onDelete,
}: {
  item: ReviewItem;
  onComplete: (id: string) => void;
  onReschedule: (id: string, days: number) => void;
  onDelete: (id: string) => void;
}) {
  const [showReschedule, setShowReschedule] = useState(false);
  const status = getReviewStatus(item);
  const subjectName = getSubjectById(item.subjectId)?.name ?? item.subjectId;
  const isCompleted = status === "completed";

  return (
    <li
      className={`rounded-lg border p-3 shadow-sm ring-1 ${
        status === "overdue"
          ? "border-amber-200/80 bg-amber-50/40 ring-amber-100/80"
          : isCompleted
            ? "border-slate-200/80 bg-slate-50/60 ring-slate-100/80"
            : "border-slate-200/90 bg-white ring-slate-100/80"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-[#0f1a33]">{item.topic}</p>
          <p className="mt-0.5 text-[13px] text-slate-600">{subjectName}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[12px] font-semibold ring-1 ${statusBadgeClass(status)}`}
        >
          {REVIEW_STATUS_LABELS[status]}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
        <div>
          <dt className="text-slate-500">Fecha objetivo</dt>
          <dd className="font-medium text-slate-700">{item.dueDate}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Intervalo</dt>
          <dd className="font-medium text-slate-700">{formatReviewIntervalDays(item.intervalDays)}</dd>
        </div>
        {item.completedAt ? (
          <div className="col-span-2">
            <dt className="text-slate-500">Completado</dt>
            <dd className="font-medium text-slate-700">{item.completedAt}</dd>
          </div>
        ) : null}
        {item.notes ? (
          <div className="col-span-2">
            <dt className="text-slate-500">Notas</dt>
            <dd className="mt-0.5 text-slate-700">{item.notes}</dd>
          </div>
        ) : null}
      </dl>

      {!isCompleted ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <ActionButton label="Completar" variant="primary" onClick={() => onComplete(item.id)} />
          <ActionButton
            label="Reprogramar"
            onClick={() => setShowReschedule((v) => !v)}
          />
          <ActionButton label="Eliminar" variant="danger" onClick={() => onDelete(item.id)} />
        </div>
      ) : (
        <div className="mt-3">
          <ActionButton label="Eliminar" variant="danger" onClick={() => onDelete(item.id)} />
        </div>
      )}

      {showReschedule && !isCompleted ? (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
          <span className="w-full text-[13px] font-medium text-slate-500">Nueva fecha desde hoy:</span>
          {RESCHEDULE_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              type="button"
              onClick={() => {
                onReschedule(item.id, opt.days);
                setShowReschedule(false);
              }}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-semibold text-slate-700 transition hover:border-[#c9a454]/40 hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40"
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
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

function ReviewSection({
  title,
  items,
  emptyMessage,
  onComplete,
  onReschedule,
  onDelete,
  tone = "default",
}: {
  title: string;
  items: ReviewItem[];
  emptyMessage?: string;
  onComplete: (id: string) => void;
  onReschedule: (id: string, days: number) => void;
  onDelete: (id: string) => void;
  tone?: "default" | "overdue" | "today";
}) {
  const titleClass =
    tone === "overdue"
      ? "text-amber-900"
      : tone === "today"
        ? "text-[#0f1a33]"
        : "text-[#0f1a33]";

  return (
    <section className="space-y-3">
      <h4 className={`text-[14px] font-semibold ${titleClass}`}>
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
            <ReviewCard
              key={item.id}
              item={item}
              onComplete={onComplete}
              onReschedule={onReschedule}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export function ReviewItemsList({
  reviewItems,
  onComplete,
  onReschedule,
  onDelete,
  emptyPendingMessage,
}: ReviewItemsListProps) {
  const groups = groupReviewItemsByStatus(reviewItems);
  const hasAny =
    groups.today.length +
      groups.overdue.length +
      groups.upcoming.length +
      groups.completed.length >
    0;
  const pendingCount = groups.today.length + groups.overdue.length + groups.upcoming.length;

  if (!hasAny) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-[14px] font-medium text-slate-600">
        <p>
          {emptyPendingMessage ??
            "Todavía no tienes repasos programados. Crea el primero arriba."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pendingCount === 0 && emptyPendingMessage ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-4 text-[13px] text-slate-500">
          {emptyPendingMessage}
        </p>
      ) : null}
      <ReviewSection
        title="Repasos de hoy"
        items={groups.today}
        emptyMessage="No tienes repasos programados para hoy."
        onComplete={onComplete}
        onReschedule={onReschedule}
        onDelete={onDelete}
        tone="today"
      />
      <ReviewSection
        title="Atrasados"
        items={groups.overdue}
        emptyMessage="No tienes repasos atrasados."
        onComplete={onComplete}
        onReschedule={onReschedule}
        onDelete={onDelete}
        tone="overdue"
      />
      <ReviewSection
        title="Próximos"
        items={groups.upcoming}
        emptyMessage="No hay repasos futuros programados."
        onComplete={onComplete}
        onReschedule={onReschedule}
        onDelete={onDelete}
      />

      {groups.completed.length > 0 ? (
        <details className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
          <summary className="cursor-pointer text-[14px] font-semibold text-slate-700">
            Completados ({groups.completed.length})
          </summary>
          <ul className="mt-4 space-y-3">
            {groups.completed.map((item) => (
              <ReviewCard
                key={item.id}
                item={item}
                onComplete={onComplete}
                onReschedule={onReschedule}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
