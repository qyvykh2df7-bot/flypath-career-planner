const PROBLEM_POINTS = [
  "Elegir por precio anunciado",
  "Pagar matrícula sin contrato claro",
  "No calcular extras, tasas o alojamiento",
  "Escoger integrada o modular sin mirar tu situación",
  "Empezar sin plan financiero, médico o de inglés",
] as const;

export function HomeProblemSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[73.75rem] px-6 py-12 lg:px-8 lg:py-14">
        <header className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B8923F]">
            Antes de empezar
          </p>
          <h2 className="mt-3 text-2xl font-semibold leading-snug tracking-tight text-[#071224] sm:text-[1.85rem] lg:text-[2.1rem]">
            Los errores caros casi siempre aparecen antes de empezar.
          </h2>
        </header>

        <ol className="mt-8 divide-y divide-[#071224]/[0.08] border-y border-[#071224]/[0.08]">
          {PROBLEM_POINTS.map((point, index) => (
            <li
              key={point}
              className="flex items-start gap-5 py-5 sm:gap-8 sm:py-6 lg:items-center"
            >
              <span className="inline-flex w-10 shrink-0 font-mono text-[13px] font-bold tabular-nums text-[#D6AE4F] sm:text-[14px]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="text-[16px] font-semibold leading-snug text-[#071224] sm:text-[17px] lg:text-[18px]">
                {point}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
