import { HomePrimaryCta } from "@/components/home/HomeCta";

const SCHOOLS = [
  {
    name: "Escuela A",
    announced: 85_000,
    real: 101_000,
    gap: 16_000,
    highlight: false,
  },
  {
    name: "Escuela B",
    announced: 92_000,
    real: 96_000,
    gap: 4_000,
    highlight: true,
  },
] as const;

function euro(value: number): string {
  return `${value.toLocaleString("es-ES")} €`;
}

function CostBar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "announced" | "real";
}) {
  const width = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="font-medium text-white/65">{label}</span>
        <span className="font-semibold tabular-nums text-white">{euro(value)}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${
            tone === "announced" ? "bg-white/35" : "bg-[#D6AE4F]"
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export function HomeCostGapSection() {
  const maxCost = 105_000;

  return (
    <section className="bg-[#071224]">
      <div className="mx-auto max-w-[73.75rem] px-6 py-12 lg:px-8 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-12">
          <div>
            <h2 className="text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl">
              El precio anunciado no siempre es el coste real.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-300 sm:text-base">
              Dos escuelas pueden parecer parecidas en precio, pero cambiar mucho cuando comparas
              extras, tasas, skill tests, alojamiento, reembolsos y condiciones de pago.
            </p>
            <p className="mt-6 text-[15px] font-semibold leading-snug text-[#f2ddaa]">
              La escuela más barata no siempre es la opción más segura.
            </p>
            <div className="mt-7">
              <HomePrimaryCta href="/schools">Comparar escuelas</HomePrimaryCta>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {SCHOOLS.map((school) => (
              <article
                key={school.name}
                className={`rounded-2xl border p-4 sm:p-5 ${
                  school.highlight
                    ? "border-[#D6AE4F]/45 bg-white/[0.08] ring-1 ring-[#D6AE4F]/20"
                    : "border-white/12 bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-white">{school.name}</h3>
                  {school.highlight ? (
                    <span className="rounded-full border border-[#D6AE4F]/40 bg-[#D6AE4F]/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#f2ddaa]">
                      Menor brecha
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 space-y-3">
                  <CostBar
                    label="Precio anunciado"
                    value={school.announced}
                    max={maxCost}
                    tone="announced"
                  />
                  <CostBar
                    label="Coste real estimado"
                    value={school.real}
                    max={maxCost}
                    tone="real"
                  />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-white/55">
                    Brecha
                  </span>
                  <span
                    className={`text-[15px] font-bold tabular-nums ${
                      school.highlight ? "text-[#f2ddaa]" : "text-amber-200"
                    }`}
                  >
                    +{euro(school.gap)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
