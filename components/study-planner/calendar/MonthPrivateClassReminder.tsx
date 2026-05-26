"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { PlannedStudySession } from "@/lib/study-planner/types";
import {
  buildMonthPrivateClassReminderCopy,
  CARLOS_INSTRUCTOR_AVATAR_PATH,
  CARLOS_INSTRUCTOR_NAME,
  getMonthPrivateClassSessions,
} from "@/lib/study-planner/month-private-class-reminder";

type MonthPrivateClassReminderProps = {
  plannedSessions: PlannedStudySession[];
  visibleMonthStart: string;
};

function CarlosAvatar() {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed) {
    return (
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8eef8] text-[15px] font-semibold text-[#3b6ea8] ring-2 ring-white"
        aria-hidden
      >
        C
      </span>
    );
  }

  return (
    <Image
      src={CARLOS_INSTRUCTOR_AVATAR_PATH}
      alt={CARLOS_INSTRUCTOR_NAME}
      width={40}
      height={40}
      className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white"
      onError={() => setImageFailed(true)}
    />
  );
}

export function MonthPrivateClassReminder({
  plannedSessions,
  visibleMonthStart,
}: MonthPrivateClassReminderProps) {
  const classSessions = useMemo(
    () => getMonthPrivateClassSessions(plannedSessions, visibleMonthStart),
    [plannedSessions, visibleMonthStart],
  );

  const copy = useMemo(
    () => buildMonthPrivateClassReminderCopy(classSessions),
    [classSessions],
  );

  if (!copy) return null;

  return (
    <aside
      className="flex gap-3 rounded-xl border border-[#c9a454]/20 bg-gradient-to-r from-[#f8fafc] via-white to-[#fffdf8] px-3 py-2.5 shadow-[0_4px_18px_-14px_rgba(15,26,51,0.12)] ring-1 ring-slate-200/40 sm:items-center sm:px-3.5"
      aria-label={copy.title}
    >
      <CarlosAvatar />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-snug text-[#0f1a33]">{copy.title}</p>
        <p className="mt-0.5 text-[12px] leading-snug text-slate-600">{copy.body}</p>
      </div>
    </aside>
  );
}
