import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { HomeFooter } from "@/components/home/HomeFooter";
import { OpinionesInteractiveContent } from "@/components/opiniones/OpinionesInteractiveContent";
import { getComparableSchools } from "@/lib/schools/schoolUtils";

const VALIDATION_TOPICS: string[] = [
  "Coste final frente al precio anunciado",
  "Disponibilidad real de aviones",
  "Organización de la formación",
  "Calidad de instructores",
  "Claridad de contrato y reembolso",
  "Soporte administrativo",
  "Retrasos durante la formación",
  "Si el alumno volvería a elegir esa escuela",
];

const VERIFICATION_BULLETS: string[] = [
  "Alumno o antiguo alumno real",
  "Escuela y fase de formación identificadas",
  "Moderación antes de publicar",
  "Posibilidad de mostrar la opinión de forma anónima",
];

export default function OpinionesEscuelasPage() {
  /** Computed server-side — schoolUtils + schools dataset stay out of the client bundle */
  const schoolOptions = getComparableSchools()
    .map((s) => ({ value: s.slug, label: s.name }))
    .sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8fafc] text-[#0f1a33]">
      <FlyPathPlatformHeader
        pageTitle="Opiniones de escuelas"
        currentModuleId="opiniones"
      />

      <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto w-full max-w-[1100px] space-y-5">
          {/* Hero + school selector + result + modal — client island */}
          <OpinionesInteractiveContent schoolOptions={schoolOptions} />

          {/* CÓMO VERIFICAMOS LAS OPINIONES — fully static, server rendered */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-[#0f1a33]">
              Cómo verificamos las opiniones
            </h2>
            <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">
              Las opiniones no se publicarán automáticamente. FlyPath revisará que procedan de alumnos
              o antiguos alumnos reales antes de mostrarlas públicamente.
            </p>
            <ul className="mt-4 space-y-2 text-[15px] leading-snug text-slate-700">
              {VERIFICATION_BULLETS.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span
                    aria-hidden
                    className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a454]"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
                Qué se tendrá en cuenta
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {VALIDATION_TOPICS.map((item) => (
                  <li
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-medium leading-tight text-slate-700 shadow-[0_1px_0_rgba(15,26,51,0.02)]"
                  >
                    <span
                      aria-hidden
                      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a454]"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}
