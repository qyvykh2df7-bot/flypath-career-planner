import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";

export default function AssessmentPrepPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f7fb] text-[#0f1a33]">
      <FlyPathPlatformHeader pageTitle="Assessment Prep" currentModuleId="assessment" />
      <main>
        <section className="border-b border-slate-200/70 bg-gradient-to-b from-white to-[#f8fafc] py-12 sm:py-14">
          <div className="mx-auto max-w-3xl px-6 lg:px-10">
            <span className="inline-flex rounded-full border border-[#c9a454]/35 bg-[#fff8e8] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
              En desarrollo
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#0f1a33] sm:text-4xl">
              Assessment Prep
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-600 sm:text-base">
              Estamos construyendo herramientas para preparar entrevistas de aerolínea, tests
              psicotécnicos, dinámicas de grupo y fases de selección de escuelas. El objetivo es que
              practiques con estructura, no a última hora.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-500">
              Mientras tanto, una mentoría te ayuda a revisar tu caso con calma y el blog recoge
              criterio sobre rutas, costes y decisiones de formación.
            </p>
          </div>
        </section>

        <section className="py-9 sm:py-11">
          <div className="mx-auto max-w-3xl px-6 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Prepárate para selección
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/mentorias"
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl border border-[#c9a454] bg-[#c9a454] px-8 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:min-w-[200px] sm:flex-none"
              >
                Ver mentorías
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
              <Link
                href="/blog"
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-8 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#c9a454]/45 hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35 sm:min-w-[200px] sm:flex-none"
              >
                Explorar el blog
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
