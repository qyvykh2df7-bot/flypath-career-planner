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
import { riskIconKey, type RiskIconKey, riskLevelTone } from "./report-preview-utils";

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
      <h2 className="font-serif text-3xl font-medium tracking-tight text-[#0f1a33] sm:text-[2rem]">
        Mapa de riesgos
      </h2>
      <p className="mt-4 text-sm text-slate-600">
        Nivel global del escenario:{" "}
        <span className="font-medium text-[#0f1a33]">{risks.highestLevel}</span>
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {risks.items.map((risk, index) => {
          const tone = riskLevelTone(risk.nivel);
          const iconKey = riskIconKey(risk.label);
          const Icon = RISK_ICONS[iconKey];
          const isFeatured = index === 0 || risk.nivel === "Alto" || risk.nivel === "Crítico";

          return (
            <div
              key={risk.label}
              className={`border-t border-[#0f1a33]/10 pt-5 ${
                isFeatured ? "sm:col-span-2 sm:grid sm:grid-cols-[auto_1fr] sm:gap-6 sm:border-t-2 sm:pt-6" : ""
              }`}
            >
              <div
                className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full ${tone.bg} ${isFeatured ? "sm:mb-0 sm:h-11 sm:w-11" : ""}`}
              >
                <Icon className={`h-4 w-4 stroke-[1.5] ${tone.text} ${isFeatured ? "sm:h-5 sm:w-5" : ""}`} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                  <h3
                    className={`font-medium leading-tight text-[#0f1a33] ${isFeatured ? "font-serif text-lg" : "text-sm"}`}
                  >
                    {risk.label}
                  </h3>
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${tone.text}`}>
                    {risk.nivel}
                  </span>
                </div>
                <p
                  className={`mt-2 leading-relaxed text-slate-700 ${isFeatured ? "text-sm" : "text-xs line-clamp-2"}`}
                >
                  {risk.explicacion}
                </p>
                <p className="mt-2.5 text-xs leading-snug text-slate-600">
                  <span className="font-medium text-slate-800">Acción · </span>
                  {risk.accion}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
