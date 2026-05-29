import Link from "next/link";
import type { ParentsReportMock } from "./parents-report-mock";
import { SectionTitle } from "@/components/report-preview/report-preview-layouts";

type ParentsReportPageThreeProps = {
  data: ParentsReportMock;
};

export function ParentsReportPageThree({ data }: ParentsReportPageThreeProps) {
  return (
    <div className="w-full [&_header]:mb-4">
      <SectionTitle>Nuestra recomendación</SectionTitle>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a6520]">Resumen ejecutivo</p>
          <p className="mt-2.5 font-serif text-[1rem] leading-snug text-[#0f1a33]">{data.executiveSummary}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a6520]">Siguiente paso recomendado</p>
          <p className="mt-2.5 text-[1rem] leading-snug text-[#334155]">{data.nextStep}</p>
        </div>
      </div>

      <div className="mt-7 bg-[#0f1a33] px-7 py-5 sm:px-9 sm:py-6">
        <p className="font-serif text-lg leading-snug text-[#faf8f4]">Mentoría familiar FlyPath</p>
        <p className="mt-2 max-w-2xl text-sm leading-snug text-[#faf8f4]/80">
          Una conversación con un piloto profesional ayuda a la familia a entender costes reales, riesgos,
          documentación y preguntas clave antes de firmar o transferir dinero a una escuela.
        </p>
        <Link
          href="/mentorias"
          className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-sm bg-[#c9a454] px-8 py-2.5 text-sm font-semibold text-[#0f1a33] shadow-[0_2px_12px_rgba(201,164,84,0.35)] transition-opacity hover:opacity-95"
        >
          Hablar con un piloto profesional
        </Link>
        <p className="mt-4 max-w-2xl text-sm leading-snug text-[#faf8f4]/75">
          FlyPath no vende plazas en escuelas.
          <br />
          Ayuda a las familias a tomar una decisión antes de comprometer grandes cantidades de dinero.
        </p>
      </div>
    </div>
  );
}
