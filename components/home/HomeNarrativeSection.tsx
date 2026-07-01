import Image from "next/image";

const NARRATIVE_IMAGE = "/schools-hero-planning.jpg";

export function HomeNarrativeSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[73.75rem] px-6 pb-12 pt-12 lg:px-8 lg:pb-14 lg:pt-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-10 xl:gap-14">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B8923F]">
              La decisión real
            </p>
            <h2 className="mt-3 text-[1.65rem] font-semibold leading-[1.2] tracking-tight text-[#071224] sm:text-[2rem] lg:text-[2.2rem] lg:leading-[1.18]">
              Antes de elegir escuela, alguien debería enseñarte lo que nadie te cuenta.
            </h2>
            <p className="mt-5 text-[16px] leading-[1.75] text-[#374151] sm:text-[17px]">
              La matrícula no es lo único que vas a pagar. También importan los extras, las
              condiciones, el calendario de pagos, el reembolso, tu Class 1, tu inglés, tu tiempo
              disponible y la ruta que realmente encaja contigo.
            </p>
            <blockquote className="mt-8 border-l-[3px] border-[#D6AE4F] pl-6">
              <p className="text-[1.15rem] font-semibold leading-snug text-[#071224] sm:text-[1.25rem]">
                FlyPath nace para ayudarte a decidir antes de comprometer dinero.
              </p>
            </blockquote>
          </div>

          <figure className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(7,18,36,0.14)] ring-1 ring-[#071224]/[0.08] sm:aspect-[5/4] lg:aspect-[4/5] lg:min-h-[420px]">
              <Image
                src={NARRATIVE_IMAGE}
                alt="Planificación de ruta y decisión de formación en aviación"
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover object-center"
                priority
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-tr from-[#071224]/50 via-[#071224]/15 to-[#D6AE4F]/10"
              />
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#071224]/40 to-transparent"
              />
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}
