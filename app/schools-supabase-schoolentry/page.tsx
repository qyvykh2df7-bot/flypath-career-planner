import { getSupabaseSchoolEntries } from "@/lib/schoolMapper";
import type { SchoolEntry } from "@/types/schools";

export const dynamic = "force-dynamic";

export default async function SchoolsSupabaseSchoolEntryDebugPage() {
  let entries: SchoolEntry[] = [];
  let errorMessage: string | null = null;

  try {
    entries = await getSupabaseSchoolEntries();
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Error desconocido";
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-8 text-[#0f1a33] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1400px] space-y-4">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a5a16]">
            Debug temporal · SchoolEntry desde Supabase
          </p>
          <h1 className="mt-2 text-2xl font-bold">mapSupabaseProfileToSchoolEntry</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Tabla generada con <code className="rounded bg-slate-200/80 px-1">getSupabaseSchoolEntries()</code>.
            El comparador real (<code>/schools</code>) no usa esta ruta.
          </p>
        </header>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <strong className="block text-red-800">Error</strong>
            {errorMessage}
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            No hay entradas (0 escuelas activas o ningún perfil resoluble).
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-700">
              Escuelas convertidas: <strong>{entries.length}</strong>
            </p>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[960px] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">name</th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">slug</th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">routeType</th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
                      advertisedPriceEUR
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
                      flypathEstimatedRealCostEUR
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
                      redFlags
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
                      pendingData
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
                      keyQuestions
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
                      dataStatus
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
                      dataConfidenceScore
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                      <td className="max-w-[200px] truncate px-3 py-2 font-medium" title={e.name}>
                        {e.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-[12px]">{e.slug}</td>
                      <td className="whitespace-nowrap px-3 py-2">{e.routeType}</td>
                      <td className="whitespace-nowrap px-3 py-2 tabular-nums">{e.advertisedPriceEUR}</td>
                      <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                        {e.flypathEstimatedRealCostEUR}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 tabular-nums">{e.redFlags.length}</td>
                      <td className="whitespace-nowrap px-3 py-2 tabular-nums">{e.pendingData.length}</td>
                      <td className="whitespace-nowrap px-3 py-2 tabular-nums">{e.keyQuestions.length}</td>
                      <td className="whitespace-nowrap px-3 py-2">{e.dataStatus}</td>
                      <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                        {e.scores.dataConfidenceScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
