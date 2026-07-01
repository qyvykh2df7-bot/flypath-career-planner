import { BookOpen, Headphones, Mic2, Plane } from "lucide-react";

const BENEFITS = [
  {
    icon: Headphones,
    title: "Escucha mejor.",
    body: "Entrena tu oído con instrucciones reales, números, indicativos y clearances.",
  },
  {
    icon: BookOpen,
    title: "Entiende con claridad.",
    body: "Aprende a procesar la información rápido, incluso bajo presión y con acentos reales.",
  },
  {
    icon: Mic2,
    title: "Responde con seguridad.",
    body: "Practica readbacks con feedback inmediato y explicaciones claras.",
  },
  {
    icon: Plane,
    title: "Aplica en situaciones reales.",
    body: "Escenarios guiados que simulan vuelos reales, paso a paso, como en la radio.",
  },
] as const;

export function AeroCommsValue() {
  return (
    <section className="border-t border-[rgba(15,23,42,0.05)] bg-[#f8f8f6]">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-16 sm:px-8 lg:px-10 lg:py-18 2xl:max-w-[1400px] 2xl:py-14">
        <div className="max-w-[520px] md:max-w-[600px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B8923F]">
            No es solo saber fraseología
          </p>
          <h2 className="mt-3 text-balance text-[1.85rem] font-semibold leading-[1.12] tracking-tight text-[#071224] sm:text-[2.15rem] lg:text-[2.35rem] xl:text-[2.5rem] 2xl:text-[52px] 2xl:leading-[1.05]">
            Es saber comunicarte cuando{" "}
            <span className="font-serif italic text-[#B8923F]">importa.</span>
          </h2>
          <p className="mt-4 max-w-[480px] text-[15px] leading-[1.7] text-[#4B5563] sm:text-[16px] xl:text-[18px] xl:leading-[1.65]">
            La radio no perdona. Entrena para que tu comunicación sea clara, natural y segura.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 md:gap-5 xl:mt-12 xl:grid-cols-4 xl:items-stretch xl:gap-6 2xl:mt-10 2xl:gap-7">
          {BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article
                key={benefit.title}
                className="flex min-h-[190px] flex-col rounded-[28px] border border-black/5 bg-white p-4 shadow-[0_8px_32px_rgba(15,23,42,0.04)] sm:p-5 xl:h-full xl:p-6 2xl:p-7"
              >
                <Icon
                  className="mb-5 h-10 w-10 shrink-0 text-[#071224]"
                  aria-hidden
                  strokeWidth={1.5}
                />
                <h3 className="text-[19px] font-semibold leading-tight text-[#071224] xl:text-[20px] 2xl:text-[18px]">
                  {benefit.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-500 xl:text-[16px] xl:leading-[1.65] 2xl:text-[16px] 2xl:leading-[1.6]">{benefit.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
