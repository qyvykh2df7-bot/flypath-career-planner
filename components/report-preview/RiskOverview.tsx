import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  FileWarning,
  Languages,
  Megaphone,
  Stethoscope,
} from "lucide-react";
import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";
import { SectionTitle } from "./report-preview-layouts";
import {
  riskIconKey,
  type RiskIconKey,
  riskLevelBadgeClass,
  riskLevelTone,
} from "./report-preview-utils";

type RiskOverviewProps = {
  snapshot: ReportSnapshotV1;
};

const RISK_ICONS: Record<RiskIconKey, LucideIcon> = {
  medical: Stethoscope,
  financial: DollarSign,
  english: Languages,
  document: FileWarning,
  marketing: Megaphone,
  timing: Clock,
  default: AlertTriangle,
};

export function RiskOverview({ snapshot }: RiskOverviewProps) {
  const { risks } = snapshot;

  return (
    <div>
      <SectionTitle>Mapa de riesgos</SectionTitle>
      <p className="mb-10 text-sm text-slate-600">
        Nivel de riesgo global ·{" "}
        <span className="inline-flex rounded-sm bg-[#0f1a33] px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-[#faf8f4]">
          {risks.highestLevel}
        </span>
      </p>

      <div className="grid gap-x-10 gap-y-0 sm:grid-cols-2">
        {risks.items.map((risk) => {
          const tone = riskLevelTone(risk.nivel);
          const Icon = RISK_ICONS[riskIconKey(risk.label)];

          return (
            <div
              key={risk.label}
              className="grid grid-cols-[auto_1fr] gap-3 border-t border-[#0f1a33]/10 py-5"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full ${tone.bg}`}
              >
                <Icon className={`h-4 w-4 stroke-[1.5] ${tone.text}`} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[#0f1a33]">{risk.label}</h3>
                  <span
                    className={`rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${riskLevelBadgeClass(risk.nivel)}`}
                  >
                    {risk.nivel}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-2">
                  {risk.explicacion}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
