import { createDemoReportSnapshot } from "@/lib/reporting/mocks/demo-report-snapshot";

/**
 * Render fijo para capturar /public/premium-report-preview.png.
 * Usa datos demo reales del informe premium (no mockup genérico).
 * Ruta interna: /premium-report-thumb
 */
export function PremiumReportPreviewCapture() {
  const snapshot = createDemoReportSnapshot();
  const route = snapshot.routeRecommendation.recommended;
  const bestSchool = snapshot.schoolsSummary.bestSchoolName ?? "Escuela candidata";
  const schools = snapshot.schoolsSummary.items.slice(0, 2);

  return (
    <div
      id="premium-report-preview-capture"
      className="w-[360px] overflow-hidden rounded-lg border border-[#c9a454]/35 bg-[#fffdf8] text-[#0f1a33] shadow-[0_20px_50px_rgba(15,26,51,0.2)]"
    >
      <div className="bg-gradient-to-br from-[#071226] via-[#0f1a33] to-[#152547] px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#f2ddaa]">
            Informe premium FlyPath
          </p>
          <span className="rounded-full border border-[#c9a454]/45 bg-[#c9a454]/15 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#f2ddaa]">
            Premium
          </span>
        </div>
        <p className="mt-2 text-[11px] font-semibold text-white">Informe premium de escuelas</p>
      </div>

      <div className="space-y-3 bg-gradient-to-b from-white to-[#fffbf5] p-3.5">
        <section className="rounded-lg border-2 border-[#c9a454]/50 bg-[#fff7e3] p-3">
          <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#7a5a16]">Veredicto FlyPath</p>
          <p className="mt-1.5 text-[11px] font-bold leading-snug text-[#0f1a33]">
            Opción más sólida: <span className="text-[#7a5a16]">{bestSchool}</span>
          </p>
          <p className="mt-1.5 text-[9px] leading-snug text-slate-600 line-clamp-2">
            Entre las escuelas comparadas, {bestSchool} aparece más sólida para validar primero.
          </p>
        </section>

        <section className="rounded-lg border border-slate-200/80 bg-white p-3">
          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">Tu ruta recomendada</p>
          <p className="mt-1 text-[11px] font-bold text-[#7a5a16]">Ruta: {route}</p>
        </section>

        <section>
          <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">
            Comparación directa
          </p>
          <div className="grid grid-cols-2 gap-2">
            {schools.map((school, index) => (
              <div
                key={school.id}
                className={`rounded-md p-2.5 ${
                  index === 0
                    ? "border-2 border-[#c9a454]/45 bg-white"
                    : "border border-slate-200 bg-white"
                }`}
              >
                <p className="text-[9px] font-bold leading-tight text-[#0f1a33] line-clamp-2">{school.nombre}</p>
                <p className="mt-1 text-[8px] text-slate-500">{school.ciudad}</p>
                <p className="mt-1.5 text-[8px] leading-snug text-slate-600 line-clamp-2">
                  {school.pendientes[0] ?? "Validar documentación"}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
