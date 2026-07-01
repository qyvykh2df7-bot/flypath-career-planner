import { CareerPlannerMockup } from "@/components/home/ProductUiMockups";

const ACCOMPANIMENT_POINTS = [
  "Entendemos tu punto de partida",
  "Calculamos una ruta realista",
  "Comparamos escuelas con criterios prácticos",
  "Detectamos riesgos antes de pagar",
  "Te damos un siguiente paso claro",
] as const;

export function HomeHowItWorksSection() {
  return (
    <section className="border-t border-[#071224]/[0.06] bg-[#f8fafc]">
      <div className="mx-auto max-w-[73.75rem] px-6 py-12 lg:px-8 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] lg:items-center lg:gap-12">
          <div>
            <h2 className="max-w-2xl text-2xl font-semibold leading-snug tracking-tight text-[#071224] sm:text-[1.85rem] lg:text-[2rem]">
              FlyPath no decide por ti. Te enseña a decidir mejor.
            </h2>

            <ul className="mt-8 space-y-0">
              {ACCOMPANIMENT_POINTS.map((point, index) => (
                <li
                  key={point}
                  className="flex items-start gap-4 border-b border-[#071224]/[0.07] py-5 last:border-b-0"
                >
                  <span
                    aria-hidden
                    className="mt-1.5 inline-flex h-2 w-2 shrink-0 rounded-full bg-[#D6AE4F]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-1 text-[16px] font-semibold leading-snug text-[#071224] sm:text-[17px]">
                      {point}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto w-full max-w-[340px] lg:max-w-none">
            <div className="[&>div]:shadow-[0_18px_44px_rgba(7,18,36,0.1)]">
              <CareerPlannerMockup />
            </div>
            <p className="mt-4 text-center text-[12px] leading-relaxed text-[#6B7280] lg:text-left">
              Un plan claro, adaptado a tu situación — no una recomendación genérica.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
