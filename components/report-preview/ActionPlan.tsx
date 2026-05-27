import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";
import { EditorialImage } from "./EditorialImage";
import { REPORT_PREVIEW_IMAGES } from "./report-preview-assets";

type ActionPlanProps = {
  snapshot: ReportSnapshotV1;
};

const PHASES = [
  { key: "sevenDays", label: "7 días", subtitle: "Inmediato" },
  { key: "thirtyDays", label: "30 días", subtitle: "Consolidar" },
  { key: "ninetyDays", label: "90 días", subtitle: "Trimestre" },
] as const;

export function ActionPlan({ snapshot }: ActionPlanProps) {
  const { roadmap, readiness } = snapshot;

  return (
    <div>
      <h2 className="font-serif text-3xl font-medium tracking-tight text-[#0f1a33] sm:text-[2rem]">
        Plan de acción
      </h2>
      <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-600">
        Hoja de ruta por ventanas temporales, alineada con tu perfil y la comparación documental.
      </p>

      <div className="relative mt-12 hidden h-28 overflow-hidden sm:block">
        <EditorialImage
          src={REPORT_PREVIEW_IMAGES.actionAccent}
          alt="Formación aeronáutica"
          heightClass="h-full"
          overlay="light"
        />
      </div>

      <div className="relative mt-10 border-t border-[#0f1a33]/10 pt-10">
        <div
          className="absolute left-[7px] top-12 bottom-8 hidden w-px bg-gradient-to-b from-[#c9a454] via-[#c9a454]/30 to-transparent sm:block"
          aria-hidden
        />
        <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
          {PHASES.map(({ key, label, subtitle }, phaseIndex) => {
            const items = roadmap[key];
            return (
              <div key={key} className="relative sm:pl-0">
                <div className="flex items-start gap-4 sm:flex-col sm:gap-0">
                  <div
                    className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center sm:mb-5"
                    aria-hidden
                  >
                    <span className="h-2 w-2 rounded-full bg-[#c9a454]" />
                    {phaseIndex < PHASES.length - 1 ? (
                      <span className="absolute left-1/2 top-4 hidden h-full w-px -translate-x-1/2 bg-[#c9a454]/25 sm:hidden" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c9a454]">
                      {label}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
                    <ul className="mt-4 space-y-2.5">
                      {items.map((item) => (
                        <li key={item} className="text-xs leading-relaxed text-[#0f1a33]">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {readiness.proximosPasos.length > 0 ? (
        <div className="mt-14 border-t border-[#0f1a33]/10 pt-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Próximos pasos operativos
          </p>
          <ol className="mt-6 divide-y divide-[#0f1a33]/8">
            {readiness.proximosPasos.map((step, index) => (
              <li key={step} className="flex gap-5 py-4 first:pt-0">
                <span className="shrink-0 font-serif text-lg text-[#c9a454] tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-sm leading-relaxed text-slate-700">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
