import {
  CareerPlannerMockup,
  SchoolsComparatorMockup,
} from "@/components/home/ProductUiMockups";
import { HomePrimaryCta } from "@/components/home/HomeCta";

const FEATURED_TOOLS = [
  {
    mockup: CareerPlannerMockup,
    title: "Career Planner",
    description:
      "Define tu perfil, entiende tu ruta y calcula el coste real antes de elegir escuela.",
    cta: "Empezar mi ruta",
    href: "/career-planner",
  },
  {
    mockup: SchoolsComparatorMockup,
    title: "Comparador de escuelas",
    description:
      "Compara precio anunciado, coste real, incluidos, contrato y riesgos antes de pagar.",
    cta: "Comparar escuelas",
    href: "/schools",
  },
] as const;

export function ProductSuite() {
  return (
    <section className="border-t border-[#071224]/[0.05] bg-gradient-to-b from-[#f8fafc] via-[#f8fafc] to-white">
      <div className="mx-auto max-w-[73.75rem] px-6 pb-12 pt-10 lg:px-8 lg:pb-14 lg:pt-12">
        <header className="max-w-3xl">
          <h2 className="text-2xl font-semibold leading-snug tracking-tight text-[#071224] sm:text-[1.75rem] lg:text-[2rem]">
            Herramientas para decidir mejor, no para venderte una escuela.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#4B5563] sm:text-base">
            Empieza por tu perfil, compara escuelas y convierte dudas en un plan más claro.
          </p>
        </header>

        <div className="mt-8 grid gap-7 lg:mt-10 lg:grid-cols-2 lg:gap-8">
          {FEATURED_TOOLS.map((tool) => {
            const Mockup = tool.mockup;
            return (
              <article key={tool.title} className="flex flex-col">
                <div className="[&>div]:min-h-[220px] [&>div]:shadow-[0_20px_48px_rgba(7,18,36,0.12)] sm:[&>div]:min-h-[250px] lg:[&>div]:min-h-[272px]">
                  <Mockup />
                </div>
                <h3 className="mt-3 text-[18px] font-semibold tracking-tight text-[#071224]">
                  {tool.title}
                </h3>
                <p className="mt-1 flex-1 text-[14px] leading-relaxed text-[#4B5563]">
                  {tool.description}
                </p>
                <div className="mt-3">
                  <HomePrimaryCta href={tool.href} className="w-full sm:w-auto">
                    {tool.cta}
                  </HomePrimaryCta>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
