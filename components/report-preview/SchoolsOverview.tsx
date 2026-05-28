import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";
import { FlyPathProductTextLink } from "./FlyPathProductCta";
import { SectionTitle } from "./report-preview-layouts";
import { FlyPathInsight } from "./FlyPathInsight";
import {
  formatEuro,
  programaLabel,
  schoolRecommendedAction,
  schoolsInsightMessage,
  verificacionLabel,
} from "./report-preview-utils";

type SchoolsOverviewProps = {
  snapshot: ReportSnapshotV1;
};

export function SchoolsOverview({ snapshot }: SchoolsOverviewProps) {
  const { schoolsSummary } = snapshot;

  return (
    <div>
      <SectionTitle>Comparativa documental</SectionTitle>

      {schoolsSummary.total > 0 ? (
        <p className="mb-4">
          <FlyPathProductTextLink href="/schools">Ver comparativa completa en FlyPath</FlyPathProductTextLink>
        </p>
      ) : null}

      <p className="mb-5 text-sm font-medium text-[#0f1a33]">
        {schoolsSummary.verifiedCount}/{schoolsSummary.total} verificadas
        {schoolsSummary.bestSchoolName ? (
          <span className="font-normal text-slate-600">
            {" "}
            · Líder: {schoolsSummary.bestSchoolName}
          </span>
        ) : null}
      </p>

      <div className="space-y-7">
        {schoolsSummary.items.map((school) => {
          const action = schoolRecommendedAction(school, schoolsSummary.bestSchoolName);
          const location = [school.ciudad, school.pais].filter(Boolean).join(" · ");

          return (
            <article key={school.id} className="border-t-2 border-[#0f1a33]/15 pt-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif text-lg leading-tight text-[#0f1a33]">{school.nombre}</h3>
                <p className="shrink-0 font-serif text-xl tabular-nums text-[#0f1a33]">
                  {formatEuro(school.precioAnunciado)}
                </p>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {location} · {programaLabel(school.programa)}
              </p>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <p>
                  <span className="text-[10px] uppercase tracking-[0.1em] text-slate-500">
                    Verificación ·{" "}
                  </span>
                  <span className="font-medium capitalize text-[#0f1a33]">
                    {verificacionLabel(school.estadoVerificacion)}
                  </span>
                </p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                <span className="font-semibold text-[#0f1a33]">Pendientes · </span>
                {school.pendientes.length > 0
                  ? school.pendientes.slice(0, 3).join(" · ")
                  : "Documentación base completa"}
              </p>
              {action ? (
                <p className="mt-2 text-xs leading-snug text-[#8a6520] line-clamp-2">{action}</p>
              ) : null}
            </article>
          );
        })}
      </div>

      <FlyPathInsight className="mt-8">
        {schoolsInsightMessage(
          schoolsSummary.verifiedCount,
          schoolsSummary.total,
          schoolsSummary.bestSchoolName,
        )}
      </FlyPathInsight>

      {schoolsSummary.items.length === 0 ? (
        <p className="mt-6 text-sm text-slate-600">Añade al menos dos escuelas al comparador.</p>
      ) : null}
    </div>
  );
}
