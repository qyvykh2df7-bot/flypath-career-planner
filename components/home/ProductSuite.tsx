import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  AtplPlannerMockup,
  CareerPlannerMockup,
  SchoolsComparatorMockup,
} from "@/components/home/ProductUiMockups";

const TOOLS = [
  {
    mockup: CareerPlannerMockup,
    title: "Career Planner",
    description: "Define tu perfil, compara rutas y entiende costes antes de elegir escuela.",
    cta: "Empezar mi ruta",
    href: "/career-planner",
  },
  {
    mockup: SchoolsComparatorMockup,
    title: "Comparador de escuelas",
    description: "Precio real, incluidos y condiciones antes de pagar una matrícula.",
    cta: "Comparar escuelas",
    href: "/escuelas",
  },
  {
    mockup: AtplPlannerMockup,
    title: "ATPL Planner",
    description: "Organiza asignaturas, semanas y objetivos de estudio.",
    cta: "Abrir planner",
    href: "/atpl-planner",
  },
] as const;

export function ProductSuite() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[73.75rem] px-6 py-14 lg:px-8 lg:py-16">
        <header className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-[#071224] sm:text-3xl">
            Tus decisiones, en un solo lugar.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[#4B5563] sm:text-base">
            Planifica tu ruta, compara escuelas y organiza tu estudio con herramientas creadas para
            futuros pilotos.
          </p>
        </header>

        <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-8">
          {TOOLS.map((tool) => {
            const Mockup = tool.mockup;
            return (
              <article key={tool.title} className="flex flex-col">
                <Mockup />
                <h3 className="mt-5 text-[17px] font-semibold tracking-tight text-[#071224]">
                  {tool.title}
                </h3>
                <p className="mt-2 flex-1 text-[14px] leading-snug text-[#4B5563]">
                  {tool.description}
                </p>
                <Link
                  href={tool.href}
                  className="mt-4 inline-flex w-fit items-center gap-1.5 text-[14px] font-semibold text-[#071224] hover:text-[#B8923F]"
                >
                  {tool.cta}
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
