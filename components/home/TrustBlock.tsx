const TRUST_POINTS = [
  {
    title: "Criterio independiente",
    text: "Orientación pensada para decidir, no para venderte una escuela.",
  },
  {
    title: "Costes y riesgos visibles",
    text: "Coste real, condiciones, contratos y señales de riesgo antes de pagar.",
  },
  {
    title: "Ruta adaptada a tu situación",
    text: "Edad, presupuesto, tiempo disponible, inglés y objetivo profesional.",
  },
] as const;

export function TrustBlock() {
  return (
    <section className="bg-[#FAF9F6]">
      <div className="mx-auto max-w-[73.75rem] px-6 py-10 lg:px-8 lg:py-12">
        <header className="mx-auto max-w-3xl text-center">
          <h2 className="text-lg font-semibold tracking-tight text-[#071224] sm:text-xl">
            Por qué existe FlyPath
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-[1.2rem] font-semibold leading-[1.42] tracking-tight text-[#071224] sm:mt-6 sm:text-[1.35rem] sm:leading-[1.45]">
            No somos una escuela. No vendemos matrículas. No cobramos comisión por
            recomendarte una ruta.
          </p>

          <p className="mx-auto mt-4 max-w-lg text-[14px] leading-relaxed text-[#4B5563] sm:text-[15px]">
            FlyPath está pensado para ayudarte a comparar, planificar y decidir antes de
            comprometer dinero.
          </p>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-3 sm:items-stretch lg:mt-9 lg:gap-5">
          {TRUST_POINTS.map((point) => (
            <article
              key={point.title}
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-[rgba(7,18,36,0.07)] bg-white shadow-[0_4px_20px_rgba(7,18,36,0.04)]"
            >
              <div className="h-px shrink-0 bg-[#D6AE4F]/60" aria-hidden />
              <div className="flex flex-1 flex-col px-6 py-5 sm:px-6 sm:py-6">
                <h3 className="min-h-[2.5rem] text-[15px] font-semibold leading-snug tracking-tight text-[#071224]">
                  {point.title}
                </h3>
                <p className="mt-2 flex-1 text-[14px] leading-relaxed text-[#4B5563]">
                  {point.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
