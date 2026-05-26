"use client";

import {
  normalizePlannedSessionStartTime,
  PLANNED_SESSION_START_TIME_OPTIONS,
} from "@/lib/study-planner/planned-session-time-options";

type PlannedSessionTimeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
};

export function PlannedSessionTimeSelect({
  value,
  onChange,
  className,
  id,
}: PlannedSessionTimeSelectProps) {
  const selectValue = normalizePlannedSessionStartTime(value);

  return (
    <select
      id={id}
      value={selectValue}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      {PLANNED_SESSION_START_TIME_OPTIONS.map((time) => (
        <option key={time} value={time}>
          {time}
        </option>
      ))}
    </select>
  );
}
