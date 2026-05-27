"use client";

import { ListTodo } from "lucide-react";
import type { RecommendedFollowUpTask } from "@/lib/study-planner/teacher-follow-up";
import { plannerListCard } from "@/lib/study-planner/planner-ui";

type RecommendedTasksBlockProps = {
  tasks: RecommendedFollowUpTask[];
};

export function RecommendedTasksBlock({ tasks }: RecommendedTasksBlockProps) {
  if (tasks.length === 0) return null;

  return (
    <section className="space-y-2">
      <h3 className="text-[14px] font-semibold text-[#0f1a33]">Tareas recomendadas</h3>
      <ul className="space-y-1.5">
        {tasks.map((task) => (
          <li
            key={task.id}
            className={`${plannerListCard} flex items-start gap-2 py-2.5`}
          >
            <ListTodo className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
            <span className="text-[13px] font-medium leading-snug text-[#0f1a33]">
              {task.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
