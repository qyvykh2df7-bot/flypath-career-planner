"use client";

import { ChevronRight } from "lucide-react";
import type { AttentionItem } from "@/lib/study-planner/calculations";

type AttentionListProps = {
  items: AttentionItem[];
  onSelectSubject?: (subjectId: string) => void;
};

export function AttentionList({ items, onSelectSubject }: AttentionListProps) {
  if (items.length === 0) return null;

  const visible = items.slice(0, 2);

  return (
    <section className="space-y-1">
      <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400">
        Atención
      </p>
      <ul className="space-y-0">
        {visible.map((item) => {
          const Tag = onSelectSubject ? "button" : "li";
          return (
            <Tag
              key={item.subjectId}
              type={onSelectSubject ? "button" : undefined}
              onClick={onSelectSubject ? () => onSelectSubject(item.subjectId) : undefined}
              className={`group flex w-full items-center gap-2.5 border-b border-slate-200/60 py-2 text-left last:border-0 ${
                onSelectSubject ? "transition hover:opacity-80" : ""
              }`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  item.priority === "high" ? "bg-red-400" : "bg-amber-400"
                }`}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="text-[13px] font-medium text-[#0f1a33]">{item.subjectName}</span>
                <span className="text-slate-400"> — </span>
                <span className="text-[13px] text-slate-500">{item.reason}</span>
              </span>
              {onSelectSubject ? (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:text-slate-500"
                  aria-hidden
                />
              ) : null}
            </Tag>
          );
        })}
      </ul>
    </section>
  );
}
