import { Plus } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "¿Qué es AeroComms?",
    a: "Es el entrenamiento de comunicaciones ATC de FlyPath: listening, readbacks, fraseología y escenarios guiados de forma progresiva.",
  },
  {
    q: "¿Necesito tener PPL para usarlo?",
    a: "No necesariamente. Puedes empezar desde una base guiada y avanzar poco a poco, incluso antes de tu primera experiencia de radio.",
  },
  {
    q: "¿Está en español o en inglés?",
    a: "La app funciona en inglés. La interfaz puede estar adaptada para usuarios hispanohablantes, pero la fraseología, los ejemplos de radio, los ejercicios de listening y los escenarios se trabajan en inglés aeronáutico.",
  },
  {
    q: "¿Es para pilotos con experiencia?",
    a: "Está pensado sobre todo para futuros pilotos y student pilots, pero también sirve para reforzar confianza y estructura en radio.",
  },
  {
    q: "¿Es una app independiente?",
    a: "AeroComms forma parte del ecosistema FlyPath. Su formato y disponibilidad dependerán de la fase del producto.",
  },
  {
    q: "¿Sustituye a un instructor?",
    a: "No. Es una herramienta de práctica y preparación. No sustituye instrucción oficial ni entrenamiento real con instructor.",
  },
] as const;

export function AeroCommsFaq() {
  return (
    <section className="border-t border-[rgba(15,23,42,0.05)] bg-[#f8f8f6]">
      <div className="mx-auto w-full max-w-[880px] px-6 py-14 sm:px-8 lg:px-10 lg:py-16 xl:max-w-[1040px] 2xl:max-w-[1120px] 2xl:py-14">
        <div className="w-full rounded-[28px] border border-[rgba(15,23,42,0.06)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.04)] lg:p-10 xl:px-12 2xl:p-12">
          <div className="text-center">
            <span className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.08)] bg-[#f8f8f6] px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#071224]">
              FAQs
            </span>
            <h2 className="mt-5 text-balance text-[1.85rem] font-semibold leading-[1.14] tracking-tight text-[#071224] sm:text-[2.25rem] xl:text-[2.5rem] 2xl:text-[44px] 2xl:leading-[1.05]">
              Preguntas{" "}
              <span className="font-serif italic text-[#071224]">frecuentes</span> sobre AeroComms.
            </h2>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            {FAQ_ITEMS.map((item, index) => (
              <details
                key={item.q}
                open={index === 0}
                className="group rounded-[16px] bg-[#f8f8f6] px-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
                  <span className="text-[15px] font-semibold leading-snug text-[#071224] xl:text-[17px]">
                    {item.q}
                  </span>
                  <Plus
                    className="h-4 w-4 shrink-0 text-[#9CA3AF] transition-transform duration-200 group-open:rotate-45"
                    aria-hidden
                  />
                </summary>
                <p className="pb-4 text-[14px] leading-relaxed text-[#4B5563] xl:text-[16px] xl:leading-[1.65]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
