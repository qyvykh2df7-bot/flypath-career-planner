import type { PlannedStudySession } from "@/lib/study-planner/types";
import { formatBankAreaLabel } from "@/lib/study-planner/atpl-bank-areas";

type SessionBankAreaLineProps = {
  session: PlannedStudySession;
  className?: string;
};

/** Línea secundaria bajo el chip Banco en tarjetas del calendario. */
export function SessionBankAreaLine({ session, className = "" }: SessionBankAreaLineProps) {
  if (session.type !== "question_bank" || !session.bankArea) return null;
  const label = formatBankAreaLabel(session.bankArea);
  return (
    <p
      className={`truncate text-[11px] leading-tight text-slate-500 ${className}`.trim()}
      title={label}
    >
      {label}
    </p>
  );
}
