import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";
import { buildExecutiveReading } from "./executive-reading";
import { SectionTitle } from "./report-preview-layouts";

type ExecutiveSummaryProps = {
  snapshot: ReportSnapshotV1;
};

function InterpretationBlock({
  title,
  body,
  fullText = false,
}: {
  title: string;
  body: string;
  fullText?: boolean;
}) {
  return (
    <div className="border-t border-[#0f1a33]/10 pt-5 first:border-t-0 first:pt-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a454]">{title}</p>
      <p
        className={`mt-2 text-sm leading-snug text-slate-700 ${fullText ? "" : "line-clamp-2"}`}
      >
        {body}
      </p>
    </div>
  );
}

export function ExecutiveSummary({ snapshot }: ExecutiveSummaryProps) {
  const reading = buildExecutiveReading(snapshot);

  return (
    <div>
      <SectionTitle>Lectura ejecutiva</SectionTitle>

      <p className="font-serif text-xl leading-snug text-[#0f1a33] sm:text-2xl">{reading.headline}</p>

      <div className="mt-8 space-y-5">
        <InterpretationBlock title="Qué significa" body={reading.whatItMeans} fullText />
        <InterpretationBlock title="Qué evitar ahora" body={reading.whatToAvoid} />
        <InterpretationBlock title="Qué validar primero" body={reading.whatToValidate} />
      </div>
    </div>
  );
}
