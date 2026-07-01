const STUDENT_SEES = [
  "Precio anunciado",
  "Promesas comerciales",
  "Plazas limitadas",
  "Financiación sin contexto",
] as const;

const FLYPATH_CHECKS = [
  "Coste real",
  "Contrato y reembolso",
  "Extras incluidos",
  "Ruta adecuada a tu perfil",
  "Riesgos antes de pagar",
] as const;

export function TrustBlock() {
  return (
    <section className="border-t border-[#071224]/[0.06] bg-[#f8fafc]">
      <div className="mx-auto max-w-[73.75rem] px-6 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start lg:gap-12">
          <div className="max-w-xl lg:pt-2">
            <h2 className="text-2xl font-semibold tracking-tight text-[#071224] sm:text-[1.85rem]">
              Por qué existe FlyPath
            </h2>
            <p className="mt-5 text-[1.15rem] font-semibold leading-[1.45] tracking-tight text-[#071224] sm:text-[1.3rem] lg:text-[1.4rem]">
              Porque muchos futuros pilotos no necesitan más publicidad. Necesitan criterio antes de
              firmar.
            </p>
            <p className="mt-5 text-[15px] font-medium leading-relaxed text-[#374151] sm:text-[16px]">
              No somos una escuela. No vendemos matrículas. No cobramos comisión por recomendarte una
              ruta.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="flex flex-col rounded-2xl border border-[#071224]/10 bg-[#071224] p-5 shadow-[0_14px_36px_rgba(7,18,36,0.12)] sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
                Publicidad
              </p>
              <h3 className="mt-2 text-[15px] font-semibold leading-snug text-white sm:text-[16px]">
                Lo que suele ver un alumno
              </h3>
              <ul className="mt-5 flex flex-1 flex-col gap-3">
                {STUDENT_SEES.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 border-b border-white/10 pb-3 text-[14px] leading-snug text-white/80 last:border-0 last:pb-0"
                  >
                    <span
                      aria-hidden
                      className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-white/35"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </article>

            <article className="flex flex-col rounded-2xl border border-[#D6AE4F]/35 bg-white p-5 shadow-[0_14px_36px_rgba(7,18,36,0.08)] ring-1 ring-[#D6AE4F]/15 sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B8923F]">
                Criterio
              </p>
              <h3 className="mt-2 text-[15px] font-semibold leading-snug text-[#071224] sm:text-[16px]">
                Lo que FlyPath te ayuda a mirar
              </h3>
              <ul className="mt-5 flex flex-1 flex-col gap-3">
                {FLYPATH_CHECKS.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 border-b border-[#071224]/[0.07] pb-3 text-[14px] font-medium leading-snug text-[#071224] last:border-0 last:pb-0"
                  >
                    <span
                      aria-hidden
                      className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#D6AE4F]"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
