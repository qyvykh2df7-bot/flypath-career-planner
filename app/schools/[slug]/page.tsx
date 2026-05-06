import Link from "next/link";
import { notFound } from "next/navigation";
import { availabilityLabel, getSchoolBySlug, getPriceGap, routeTypeLabel } from "@/lib/schools/schoolUtils";

function euro(value: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function displayAdvertisedPrice(value: number): string {
  return value > 0 ? euro(value) : "No publicado";
}

function displayEstimatedPrice(value: number): string {
  return value > 0 ? euro(value) : "Pendiente";
}

function label(value: string): string {
  if (value === "yes") return "Sí";
  if (value === "no") return "No";
  if (value === "partial") return "Parcial";
  if (value === "optional") return "Opcional";
  return "No claro";
}

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const school = getSchoolBySlug(slug);
  if (!school) notFound();

  const priceGap = getPriceGap(school);
  const hasComparableCosts = Number.isFinite(priceGap);

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-6 text-[#0f1a33] sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto w-full max-w-[1100px] space-y-5">
        <section className="rounded-3xl border border-[#c9a454]/30 bg-[#0f1a33] p-5 text-white shadow-sm sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f2ddaa]">
            {routeTypeLabel(school.routeType)}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{school.name}</h1>
          <p className="mt-2 text-sm text-slate-200">
            {school.city}, {school.country} · Base {school.baseAirport} · ATO {school.atoName}
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Precio anunciado</p>
            <p className="mt-1 text-lg font-semibold text-[#0f1a33]">{displayAdvertisedPrice(school.advertisedPriceEUR)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Coste real estimado FlyPath</p>
            <p className="mt-1 text-lg font-semibold text-[#0f1a33]">{displayEstimatedPrice(school.flypathEstimatedRealCostEUR)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Brecha estimada</p>
            <p className="mt-1 text-lg font-semibold text-[#0f1a33]">{hasComparableCosts ? euro(priceGap) : "Pendiente"}</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#0f1a33]">Incluidos y condiciones</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>MCC/JOC: <span className="font-semibold">{label(school.mccJocIncluded)}</span></li>
              <li>Advanced UPRT: <span className="font-semibold">{label(school.advancedUprtIncluded)}</span></li>
              <li>Tasas: <span className="font-semibold">{label(school.examFeesIncluded)}</span></li>
              <li>Skill tests: <span className="font-semibold">{label(school.skillTestsIncluded)}</span></li>
              <li>Material: <span className="font-semibold">{label(school.trainingMaterialsIncluded)}</span></li>
              <li>Alojamiento: <span className="font-semibold">{label(school.accommodationIncluded)}</span></li>
              <li>Contrato antes de pagar: <span className="font-semibold">{label(school.contractAvailableBeforePayment)}</span></li>
            </ul>
            <p className="mt-3 text-sm text-slate-600">Pagos: {school.paymentScheduleSummary}</p>
            <p className="mt-1 text-sm text-slate-600">Reembolso: {school.refundPolicySummary}</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#0f1a33]">Operación y ruta</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>Duración programa: <span className="font-semibold">{school.programDurationMonths} meses</span></li>
              <li>Flota: <span className="font-semibold">{school.fleetSummary}</span></li>
              <li>Disponibilidad aeronaves: <span className="font-semibold">{availabilityLabel(school.aircraftAvailability)}</span></li>
              <li>Ratio alumno/avión: <span className="font-semibold">{school.studentAircraftRatio || "No disponible"}</span></li>
              <li>Ratio instructor/alumno: <span className="font-semibold">{school.instructorStudentRatio || "No disponible"}</span></li>
              <li>Idioma formación: <span className="font-semibold">{school.languageOfInstruction}</span></li>
              <li>Class 1: <span className="font-semibold">{school.class1Requirement}</span></li>
            </ul>
          </article>
        </section>

        {school.universityTrack ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#0f1a33]">Bloque universidad / grado + licencia</p>
            <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
              <p>Universidad: <span className="font-semibold">{school.universityTrack.universityName}</span></p>
              <p>Grado: <span className="font-semibold">{school.universityTrack.degreeName}</span></p>
              <p>ECTS: <span className="font-semibold">{school.universityTrack.ects}</span></p>
              <p>Duración académica: <span className="font-semibold">{school.universityTrack.academicDurationYears} años</span></p>
              <p>Coste académico: <span className="font-semibold">{euro(school.universityTrack.academicCostEUR)}</span></p>
              <p>Coste vuelo: <span className="font-semibold">{euro(school.universityTrack.flightCostEUR)}</span></p>
              <p>Coste total estimado: <span className="font-semibold">{euro(school.universityTrack.totalEstimatedCostEUR)}</span></p>
              <p>Policy Class 1: <span className="font-semibold">{school.universityTrack.class1FailurePolicy}</span></p>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-amber-900">Red flags</p>
            <ul className="mt-2 space-y-1 text-sm text-amber-900">
              {(school.redFlags.length ? school.redFlags : ["Sin alertas críticas registradas en esta versión."]).map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#0f1a33]">Datos pendientes y preguntas clave</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {school.pendingData.map((item) => <li key={item}>- {item}</li>)}
            </ul>
            <ul className="mt-3 space-y-1 text-sm text-slate-700">
              {school.keyQuestions.map((item) => <li key={item}>- {item}</li>)}
            </ul>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#0f1a33]">Opiniones verificadas FlyPath: próximamente</p>
          <p className="mt-1 text-sm text-slate-600">
            Estamos diseñando un sistema de reviews verificadas por fase de formación.
          </p>
        </section>

        <section className="rounded-2xl border border-[#c9a454]/30 bg-[#0f1a33] p-5 text-white">
          <p className="text-sm font-semibold text-[#f2ddaa]">Análisis avanzado FlyPath: próximamente</p>
          <p className="mt-1 text-sm text-slate-200">
            La versión avanzada incluirá histórico de datos, comparación extendida y alertas de riesgo.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/schools?add=${school.slug}`} className="inline-flex min-h-[40px] items-center rounded-xl bg-[#c9a454] px-4 py-2 text-sm font-semibold text-[#0f1a33]">
              Añadir a comparación
            </Link>
            <Link href="/schools?results=1" className="inline-flex min-h-[40px] items-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">
              Volver al comparador
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

