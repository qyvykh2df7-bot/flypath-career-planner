import { getSupabaseSchoolEntries } from "@/lib/schoolMapper";
import { schoolsSpainDataset } from "@/lib/schools/schoolsSpain";
import {
  runSupabaseParityAudit,
  statusBadgeClass,
  statusLabel,
  type ParityAuditReport,
} from "@/lib/schools/supabaseParityAudit";

export const dynamic = "force-dynamic";

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-[#0f1a33]">{value}</p>
      {hint ? <p className="mt-1 text-[13px] text-slate-600">{hint}</p> : null}
    </div>
  );
}

function AuditContent({ report }: { report: ParityAuditReport }) {
  const okCount = report.schools.filter((s) => s.status === "ok").length;
  const diffCount = report.schools.filter((s) => s.status === "differences").length;

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="schoolsSpain.ts" value={report.localTotal} />
        <SummaryCard label="Supabase (mapeado)" value={report.supabaseTotal} />
        <SummaryCard
          label="Emparejadas"
          value={report.matchedSlugCount}
          hint={`legacy id: ${report.matchedByLegacyIdCount} · slug: ${report.matchedBySlugCount} · alias: ${report.matchedByAliasCount} · Solo local: ${report.onlyInLocalSlugs.length} · Solo Supabase: ${report.onlyInSupabaseSlugs.length}`}
        />
        <SummaryCard
          label="Paridad aproximada"
          value={`${report.parityPercent}%`}
          hint={`OK: ${okCount} · Con diferencias: ${diffCount}`}
        />
      </section>

      {(report.onlyInLocalSlugs.length > 0 || report.onlyInSupabaseSlugs.length > 0) && (
        <section className="grid gap-4 lg:grid-cols-2">
          {report.onlyInLocalSlugs.length > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm">
              <p className="font-semibold text-amber-900">Solo en schoolsSpain.ts</p>
              <p className="mt-2 font-mono text-[12px] leading-relaxed text-amber-950">
                {report.onlyInLocalSlugs.join(", ")}
              </p>
            </div>
          ) : null}
          {report.onlyInSupabaseSlugs.length > 0 ? (
            <div className="rounded-2xl border border-violet-200 bg-violet-50/80 p-4 text-sm">
              <p className="font-semibold text-violet-900">Solo en Supabase</p>
              <p className="mt-2 font-mono text-[12px] leading-relaxed text-violet-950">
                {report.onlyInSupabaseSlugs.join(", ")}
              </p>
            </div>
          ) : null}
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0f1a33]">Campos más problemáticos</h2>
        <p className="mt-1 text-sm text-slate-600">
          Ordenados por frecuencia de diferencias entre escuelas comparables.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2 font-semibold">Campo</th>
                <th className="px-3 py-2 font-semibold">Diferencias</th>
                <th className="px-3 py-2 font-semibold">Ausente en Supabase</th>
              </tr>
            </thead>
            <tbody>
              {report.problematicFields.slice(0, 20).map((row) => (
                <tr key={row.field} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-mono text-[12px]">{row.field}</td>
                  <td className="px-3 py-2 tabular-nums">{row.diffCount}</td>
                  <td className="px-3 py-2 tabular-nums">{row.missingInSupabaseCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 className="text-lg font-semibold text-[#0f1a33]">Detalle por escuela</h2>
          <p className="mt-1 text-sm text-slate-600">
            Generado {new Date(report.generatedAt).toLocaleString("es-ES")}. Expande una fila para ver
            campos distintos y arrays.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th className="px-3 py-2 font-semibold">slug</th>
                <th className="px-3 py-2 font-semibold">name</th>
                <th className="px-3 py-2 font-semibold">estado</th>
                <th className="px-3 py-2 font-semibold">iguales</th>
                <th className="px-3 py-2 font-semibold">distintos</th>
                <th className="px-3 py-2 font-semibold">faltan en Supabase</th>
                <th className="px-3 py-2 font-semibold">observaciones</th>
              </tr>
            </thead>
            <tbody>
              {report.schools.map((row) => (
                <SchoolDetailRow key={row.slug} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function SchoolDetailRow({
  row,
}: {
  row: ParityAuditReport["schools"][number];
}) {
  const diffPreview = row.differentFields
    .filter((d) => d.status !== "equal")
    .slice(0, 2)
    .map((d) => d.field)
    .join(", ");

  return (
    <>
      <tr className="border-b border-slate-100 hover:bg-slate-50/60">
        <td className="whitespace-nowrap px-3 py-2 font-mono text-[12px]">{row.slug}</td>
        <td className="max-w-[180px] truncate px-3 py-2" title={row.name}>
          {row.name}
        </td>
        <td className="px-3 py-2">
          <span
            className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusBadgeClass(row.status)}`}
          >
            {statusLabel(row.status)}
          </span>
        </td>
        <td className="px-3 py-2 tabular-nums">{row.equalCount}</td>
        <td className="px-3 py-2 tabular-nums">{row.differentCount}</td>
        <td className="max-w-[200px] px-3 py-2 text-[12px] text-slate-600">
          {row.missingInSupabaseFields.length > 0
            ? row.missingInSupabaseFields.slice(0, 4).join(", ") +
              (row.missingInSupabaseFields.length > 4 ? "…" : "")
            : "—"}
        </td>
        <td className="max-w-[280px] px-3 py-2 text-[12px] text-slate-600">
          {row.observations[0] ?? diffPreview ?? "—"}
        </td>
      </tr>
      {row.status !== "ok" ? (
        <tr className="border-b border-slate-100 bg-slate-50/50">
          <td colSpan={7} className="px-4 py-3">
            <details className="text-[12px] text-slate-700">
              <summary className="cursor-pointer font-medium text-[#0f1a33]">
                Ver diferencias de {row.slug}
              </summary>
              {row.differentFields.filter((d) => d.status !== "equal").length > 0 ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[800px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-1 pr-3 text-left">campo</th>
                        <th className="py-1 pr-3 text-left">estado</th>
                        <th className="py-1 pr-3 text-left">schoolsSpain</th>
                        <th className="py-1 text-left">Supabase</th>
                      </tr>
                    </thead>
                    <tbody>
                      {row.differentFields
                        .filter((d) => d.status !== "equal")
                        .map((d) => (
                          <tr key={d.field} className="border-b border-slate-100/80 align-top">
                            <td className="py-1.5 pr-3 font-mono">{d.field}</td>
                            <td className="py-1.5 pr-3">{d.status}</td>
                            <td className="max-w-[320px] py-1.5 pr-3 break-words">
                              {typeof d.localValue === "object"
                                ? JSON.stringify(d.localValue)
                                : String(d.localValue ?? "(ausente)")}
                            </td>
                            <td className="max-w-[320px] py-1.5 break-words">
                              {typeof d.supabaseValue === "object"
                                ? JSON.stringify(d.supabaseValue)
                                : String(d.supabaseValue ?? "(ausente)")}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              {row.arrayDiffs.map((arr) =>
                arr.onlyInLocal.length > 0 ||
                arr.onlyInSupabase.length > 0 ||
                arr.localCount !== arr.supabaseCount ? (
                  <div key={arr.field} className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                    <p className="font-semibold text-[#0f1a33]">{arr.field}</p>
                    <p className="mt-1 text-slate-600">
                      local: {arr.localCount} · supabase: {arr.supabaseCount} · textos coincidentes:{" "}
                      {arr.matchingCount}
                    </p>
                    {arr.onlyInLocal.length > 0 ? (
                      <div className="mt-2">
                        <p className="font-medium text-amber-800">Solo en schoolsSpain.ts</p>
                        <ul className="mt-1 list-disc pl-5">
                          {arr.onlyInLocal.map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {arr.onlyInSupabase.length > 0 ? (
                      <div className="mt-2">
                        <p className="font-medium text-violet-800">Solo en Supabase</p>
                        <ul className="mt-1 list-disc pl-5">
                          {arr.onlyInSupabase.map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null,
              )}
            </details>
          </td>
        </tr>
      ) : null}
    </>
  );
}

export default async function SupabaseParityAuditPage() {
  let errorMessage: string | null = null;
  let report: ParityAuditReport | null = null;

  try {
    const supabaseEntries = await getSupabaseSchoolEntries();
    report = runSupabaseParityAudit(schoolsSpainDataset, supabaseEntries);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Error desconocido al cargar Supabase";
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-8 text-[#0f1a33] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1400px] space-y-8">
        <header className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a5a16]">
            Auditoría temporal · solo lectura
          </p>
          <h1 className="text-2xl font-bold sm:text-3xl">Paridad schoolsSpain.ts vs Supabase</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
            Compara <code className="rounded bg-white px-1">schoolsSpainDataset</code> con{" "}
            <code className="rounded bg-white px-1">getSupabaseSchoolEntries()</code> /{" "}
            <code className="rounded bg-white px-1">mapSupabaseProfileToSchoolEntry()</code>.
            No modifica el comparador en <code>/schools</code> ni ningún dataset.
          </p>
        </header>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">No se pudo ejecutar la auditoría contra Supabase</p>
            <p className="mt-2">{errorMessage}</p>
            <p className="mt-3 text-red-700">
              Comprueba <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en tu entorno local.
            </p>
          </div>
        ) : report ? (
          <AuditContent report={report} />
        ) : null}

        <p className="text-[12px] text-slate-500">
          Ruta temporal: eliminar <code>app/supabase-parity-audit</code> y{" "}
          <code>lib/schools/supabaseParityAudit.ts</code> cuando termine la migración.
        </p>
      </div>
    </main>
  );
}
