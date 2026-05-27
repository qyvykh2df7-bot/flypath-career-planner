"use client";

import { useEffect, useState } from "react";
import type { StudySubject, TeacherFollowUpCategory, TeacherFollowUpComment } from "@/lib/study-planner/types";
import { createPlannerId, formatDateLocal, getTodayDateString } from "@/lib/study-planner/calculations";
import {
  FOLLOW_UP_CATEGORY_OPTIONS,
  FOLLOW_UP_CATEGORY_LABELS,
} from "@/lib/study-planner/teacher-follow-up";
import { plannerBtnPrimary, plannerFieldClass, plannerFieldLabel } from "@/lib/study-planner/planner-ui";

type FollowUpCommentFormProps = {
  subjects: StudySubject[];
  onAdd: (comment: TeacherFollowUpComment) => void;
  onAdded?: () => void;
};

export function FollowUpCommentForm({ subjects, onAdd, onAdded }: FollowUpCommentFormProps) {
  const today = getTodayDateString();
  const [date, setDate] = useState(today);
  const [subjectId, setSubjectId] = useState("");
  const [category, setCategory] = useState<TeacherFollowUpCategory>("general");
  const [comment, setComment] = useState("");
  const [nextTask, setNextTask] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (subjectId && !subjects.some((s) => s.id === subjectId)) {
      setSubjectId("");
    }
  }, [subjects, subjectId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);

    const trimmed = comment.trim();
    if (!trimmed) {
      setError("Escribe el comentario de seguimiento.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("Indica una fecha válida.");
      return;
    }

    onAdd({
      id: createPlannerId(),
      date,
      subjectId: subjectId || undefined,
      category,
      comment: trimmed,
      nextTask: nextTask.trim() || undefined,
      createdBy: "student",
    });

    setComment("");
    setNextTask("");
    setCategory("general");
    setSubjectId("");
    setDate(formatDateLocal(new Date()));
    setFeedback("Comentario guardado");
    window.setTimeout(() => setFeedback(null), 2500);
    onAdded?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t border-slate-200/50 pt-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-1">
          <span className={plannerFieldLabel}>Fecha</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={plannerFieldClass}
            required
          />
        </label>
        <label className="block sm:col-span-1">
          <span className={plannerFieldLabel}>Asignatura</span>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className={plannerFieldClass}
          >
            <option value="">Opcional</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className={plannerFieldLabel}>Tipo</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as TeacherFollowUpCategory)}
          className={plannerFieldClass}
        >
          {FOLLOW_UP_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {FOLLOW_UP_CATEGORY_LABELS[opt]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={plannerFieldLabel}>Comentario</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className={`${plannerFieldClass} min-h-[80px] resize-y`}
          placeholder="Qué has trabajado, feedback de clase, próximos pasos…"
          required
        />
      </label>

      <label className="block">
        <span className={plannerFieldLabel}>Próxima tarea</span>
        <input
          type="text"
          value={nextTask}
          onChange={(e) => setNextTask(e.target.value)}
          className={plannerFieldClass}
          placeholder="Opcional · ej. Repasar Meteorology"
        />
      </label>

      {error ? (
        <p className="text-[13px] font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {feedback ? (
        <p className="text-[13px] font-medium text-emerald-700" role="status">
          {feedback}
        </p>
      ) : null}

      <button type="submit" className={plannerBtnPrimary}>
        Guardar comentario
      </button>
    </form>
  );
}
