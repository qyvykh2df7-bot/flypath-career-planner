import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";
import { FlyPathInsight } from "./FlyPathInsight";
import { SchoolBanner } from "./SchoolBanner";
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
      <h2 className="font-serif text-3xl font-medium tracking-tight text-[#0f1a33] sm:text-[2rem]">
        Escuelas comparadas
      </h2>

      <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-b border-[#0f1a33]/10 pb-8">
        {[
          { label: "Total", value: String(schoolsSummary.total) },
          { label: "Verificadas", value: String(schoolsSummary.verifiedCount) },
          { label: "Pendientes", value: String(schoolsSummary.pendingCount) },
        ].map((stat) => (
          <div key={stat.label}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {stat.label}
            </p>
            <p className="mt-1 font-serif text-2xl text-[#0f1a33]">{stat.value}</p>
          </div>
        ))}
      </div>

      {schoolsSummary.bestSchoolName ? (
        <p className="mt-8 text-sm text-slate-700">
          <span className="font-medium text-[#0f1a33]">Mejor viable (documentación): </span>
          {schoolsSummary.bestSchoolName}
        </p>
      ) : null}

      <FlyPathInsight className="mt-8">
        {schoolsInsightMessage(
          schoolsSummary.verifiedCount,
          schoolsSummary.total,
          schoolsSummary.bestSchoolName,
        )}
      </FlyPathInsight>

      <div className="mt-12 grid gap-8 sm:grid-cols-2">
        {schoolsSummary.items.map((school) => {
          const action = schoolRecommendedAction(school, schoolsSummary.bestSchoolName);
          const location = [school.ciudad, school.pais].filter(Boolean).join(" · ");

          return (
            <article key={school.id} className="overflow-hidden border-t-2 border-[#0f1a33]/10">
              <SchoolBanner programa={school.programa} schoolName={school.nombre} />
              <div className="pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-serif text-lg leading-tight text-[#0f1a33]">{school.nombre}</h3>
                    <p className="mt-1.5 text-xs text-slate-600">
                      {location || school.pais} · {programaLabel(school.programa)}
                    </p>
                  </div>
                  <p className="shrink-0 font-serif text-lg tabular-nums text-[#0f1a33]">
                    {formatEuro(school.precioAnunciado)}
                  </p>
                </div>

                <dl className="mt-5 space-y-4 text-xs">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Verificación
                    </dt>
                    <dd className="mt-1 capitalize text-[#0f1a33]">
                      {verificacionLabel(school.estadoVerificacion)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Pendientes principales
                    </dt>
                    <dd className="mt-1 text-slate-700">
                      {school.pendientes.length > 0 ? (
                        <ul className="mt-1 space-y-1">
                          {school.pendientes.slice(0, 4).map((pending) => (
                            <li key={pending} className="flex gap-2">
                              <span className="text-[#c9a454]" aria-hidden>
                                ·
                              </span>
                              <span>{pending}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-emerald-800">Documentación base completa.</span>
                      )}
                    </dd>
                  </div>
                  {action ? (
                    <div className="border-t border-[#0f1a33]/8 pt-4">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a6520]">
                        Acción recomendada
                      </dt>
                      <dd className="mt-1.5 leading-relaxed text-slate-700">{action}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            </article>
          );
        })}
      </div>

      {schoolsSummary.items.length === 0 ? (
        <p className="mt-8 text-sm text-slate-600">
          No hay escuelas en el comparador. Añade al menos dos opciones para un análisis útil.
        </p>
      ) : null}
    </div>
  );
}
