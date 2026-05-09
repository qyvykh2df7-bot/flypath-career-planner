"use client";

import {
  formatAdvertisedPriceLabel,
  getModularProgramGroupsFromProfile,
} from "@/lib/schoolMapper";
import type { FullSchoolProfile } from "@/lib/schoolQueries";
import type { SchoolEntry } from "@/types/schools";

type Props = {
  schoolA: SchoolEntry;
  schoolB: SchoolEntry;
  profileA?: FullSchoolProfile | null;
  profileB?: FullSchoolProfile | null;
};

const ROUTE_TYPE_LABEL: Record<SchoolEntry["routeType"], string> = {
  integrated: "Escuela integrada",
  modular: "Ruta modular",
  university_plus_license: "Universidad / Grado + licencia",
};

const AVAILABILITY_LABEL: Record<SchoolEntry["aircraftAvailability"], string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
  unknown: "Pendiente de validar",
};

const EMPLOYMENT_CLAIMS_LABEL: Record<SchoolEntry["employmentClaimsType"], string> = {
  none: "Sin promesas de empleo",
  vague: "Mensaje vago / no verificable",
  clear_non_guaranteed: "Apoyo claro · sin garantía",
  guaranteed_claimed: "Garantía declarada · validar",
  unknown: "Pendiente de validar",
};

const EUR_FORMATTER = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const MAX_LIST_ITEMS = 5;

/** Mapea cualquier enum tipo `yes / no / partial / optional / included / not_included / not_applicable / unknown`. */
function statusLabel(value: string | null | undefined): string {
  const v = (value ?? "").trim().toLowerCase();
  switch (v) {
    case "yes":
    case "included":
      return "Sí";
    case "no":
    case "not_included":
      return "No";
    case "partial":
      return "Parcial / confirmar";
    case "optional":
      return "Opcional";
    case "not_applicable":
      return "No aplica";
    case "unknown":
    case "":
      return "Pendiente de validar";
    default:
      return value ?? "Pendiente de validar";
  }
}

function freeTextOrPending(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  if (!v) return "Pendiente de validar";
  return v;
}

function formatBrecha(advertised: number, real: number): string {
  if (!(advertised > 0) || !(real > 0)) return "Pendiente de validar";
  const diff = real - advertised;
  if (diff > 0) return `+${EUR_FORMATTER.format(diff)} estimados sobre el precio publicado`;
  return "Sin brecha estimada";
}

function ratioOrPending(value: string | undefined): string {
  const v = (value ?? "").trim();
  if (!v) return "Pendiente de validar";
  return v;
}

function durationLabel(months: number): string {
  if (!months || months <= 0) return "Pendiente de validar";
  return months === 1 ? "1 mes" : `${months} meses`;
}

function requiredForRouteLabel(value: boolean | null | undefined): string {
  if (value === true) return "Sí";
  if (value === false) return "No";
  return "Pendiente de validar";
}

function ModulesPublishedBlock({ profile }: { profile?: FullSchoolProfile | null }) {
  const groups = getModularProgramGroupsFromProfile(profile);

  if (groups.length === 0) {
    return (
      <p className="text-[13px] italic leading-snug text-slate-600">
        No hay modulos publicados en Supabase para esta ruta.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.programId} className="rounded-lg border border-slate-200 bg-white p-2.5">
          <p className="text-[12px] font-semibold text-[#0f1a33]">{group.programName}</p>
          {group.modules.length === 0 ? (
            <p className="mt-1.5 text-[12px] italic leading-snug text-slate-500">
              Sin módulos cargados en modular_modules para este programa.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {group.modules.map((m) => (
                <li
                  key={m.module_id}
                  className="rounded-lg border border-slate-100 bg-slate-50/80 px-2 py-1.5 text-[12px]"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold text-[#0f1a33]">
                      <span className="tabular-nums text-slate-500">{m.module_order ?? "—"}.</span>{" "}
                      {m.module_name?.trim() || "Pendiente de validar"}
                    </span>
                    <span className="shrink-0 font-semibold text-[#7a5a16]">
                      {formatAdvertisedPriceLabel(m.price_eur)}
                    </span>
                  </div>
                  {m.price_notes?.trim() ? (
                    <p className="mt-1 text-[11px] leading-snug text-slate-600">{m.price_notes}</p>
                  ) : null}
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                    <span>Requerido: {requiredForRouteLabel(m.is_required_for_route)}</span>
                    {m.source_url?.trim() ? (
                      <a
                        href={m.source_url.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[#7a5a16] underline-offset-2 hover:underline"
                      >
                        Fuente
                      </a>
                    ) : null}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

/** Pinta una lista corta limitada a `MAX_LIST_ITEMS` con sufijo "+N más" si procede. */
function ListBlock({
  items,
  emptyText = "Sin datos registrados",
}: {
  items: string[];
  emptyText?: string;
}) {
  if (!items || items.length === 0) {
    return <p className="text-[13px] italic text-slate-500">{emptyText}</p>;
  }
  const visible = items.slice(0, MAX_LIST_ITEMS);
  const remaining = items.length - visible.length;
  return (
    <ul className="space-y-1.5 text-[13px] text-slate-700">
      {visible.map((item, idx) => (
        <li key={`${idx}-${item.slice(0, 24)}`} className="flex gap-2">
          <span aria-hidden className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a454]" />
          <span className="break-words leading-snug">{item}</span>
        </li>
      ))}
      {remaining > 0 ? (
        <li className="pl-3.5 text-[12px] font-medium text-[#7a5a16]">+{remaining} más</li>
      ) : null}
    </ul>
  );
}

function Row({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <p className="flex flex-wrap items-baseline gap-1.5 text-[13px] leading-snug">
      <span className="font-semibold text-slate-700">{label}:</span>{" "}
      <span
        className={`break-words ${
          emphasis ? "text-[15px] font-bold text-[#0f1a33]" : "text-slate-700"
        }`}
      >
        {value}
      </span>
    </p>
  );
}

function SectionBlock({
  letter,
  title,
  children,
  variant = "white",
}: {
  letter: string;
  title: string;
  children: React.ReactNode;
  variant?: "white" | "muted";
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200 p-2.5 ${
        variant === "muted" ? "bg-slate-50/70" : "bg-white"
      }`}
    >
      <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
        {letter}. {title}
      </p>
      <div className="mt-1.5 space-y-1.5">{children}</div>
    </section>
  );
}

function SchoolColumn({
  school,
  profile,
}: {
  school: SchoolEntry;
  profile?: FullSchoolProfile | null;
}) {
  const advertisedLabel = formatAdvertisedPriceLabel(school.advertisedPriceEUR);
  const realLabel = formatAdvertisedPriceLabel(school.flypathEstimatedRealCostEUR);
  const depositLabel = formatAdvertisedPriceLabel(school.depositOrEnrollmentFeeEUR);
  const brechaLabel = formatBrecha(
    school.advertisedPriceEUR,
    school.flypathEstimatedRealCostEUR,
  );

  return (
    <article className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="rounded-t-2xl border-b border-[#c9a454]/20 bg-gradient-to-r from-[#0f1a33] to-[#132240] p-4 text-white">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-xs font-semibold tracking-wide text-[#f2ddaa]">
            FP
          </span>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-lg font-bold leading-snug text-white lg:text-xl">
              {school.name}
            </p>
            <p className="mt-0.5 text-[13px] text-slate-300">
              {ROUTE_TYPE_LABEL[school.routeType]}
            </p>
            <p className="mt-0.5 text-[13px] text-slate-300">
              {school.city || "Pendiente de validar"}
              {school.baseAirport ? <> · Base {school.baseAirport}</> : null}
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <SectionBlock letter="A" title="Resumen general" variant="muted">
          <Row label="Nombre" value={school.name} />
          <Row label="Ciudad" value={freeTextOrPending(school.city)} />
          <Row label="Base" value={freeTextOrPending(school.baseAirport)} />
          <Row label="Tipo de ruta" value={ROUTE_TYPE_LABEL[school.routeType]} />
          <Row label="Duración" value={durationLabel(school.programDurationMonths)} />
          <Row label="Idioma" value={freeTextOrPending(school.languageOfInstruction)} />
          <Row label="Requisito Class 1" value={freeTextOrPending(school.class1Requirement)} />
        </SectionBlock>

        <SectionBlock letter="B" title="Costes">
          <Row label="Precio publicado" value={advertisedLabel} emphasis />
          <Row label="Coste estimado FlyPath" value={realLabel} emphasis />
          <Row label="Brecha FlyPath" value={brechaLabel} />
          <Row label="Depósito / matrícula" value={depositLabel} />
          <Row label="Financiación" value={statusLabel(school.financingAvailable)} />
          <Row
            label="Calendario de pagos"
            value={freeTextOrPending(school.paymentScheduleSummary)}
          />
          <Row
            label="Política de reembolso"
            value={freeTextOrPending(school.refundPolicySummary)}
          />
        </SectionBlock>

        <SectionBlock letter="C" title="Transparencia y riesgo" variant="muted">
          <Row
            label="Contrato antes de pagar"
            value={statusLabel(school.contractAvailableBeforePayment)}
          />
          <div className="pt-1">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
              Red flags ({school.redFlags.length})
            </p>
            <div className="mt-1">
              <ListBlock items={school.redFlags} emptyText="Sin red flags registrados" />
            </div>
          </div>
          <div className="pt-1">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
              Datos pendientes ({school.pendingData.length})
            </p>
            <div className="mt-1">
              <ListBlock items={school.pendingData} emptyText="Sin datos pendientes registrados" />
            </div>
          </div>
          <div className="pt-1">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
              Preguntas clave ({school.keyQuestions.length})
            </p>
            <div className="mt-1">
              <ListBlock
                items={school.keyQuestions}
                emptyText="Sin preguntas registradas todavía"
              />
            </div>
          </div>
        </SectionBlock>

        <SectionBlock letter="D" title="Extras incluidos">
          <Row label="Tasas de examen" value={statusLabel(school.examFeesIncluded)} />
          <Row label="Skill tests" value={statusLabel(school.skillTestsIncluded)} />
          <Row label="Materiales" value={statusLabel(school.trainingMaterialsIncluded)} />
          <Row label="Alojamiento" value={statusLabel(school.accommodationIncluded)} />
        </SectionBlock>

        <SectionBlock letter="E" title="Operación" variant="muted">
          <div className="mb-3 rounded-lg border border-[#c9a454]/25 bg-[#fffdf8] p-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
              B. Operación y ruta · módulos publicados
            </p>
            <div className="mt-2">
              <ModulesPublishedBlock profile={profile} />
            </div>
          </div>
          <Row label="Flota" value={freeTextOrPending(school.fleetSummary)} />
          <Row
            label="Disponibilidad de avión"
            value={AVAILABILITY_LABEL[school.aircraftAvailability]}
          />
          <Row
            label="Ratio alumno / avión"
            value={ratioOrPending(school.studentAircraftRatio)}
          />
          <Row
            label="Ratio instructor / alumno"
            value={ratioOrPending(school.instructorStudentRatio)}
          />
        </SectionBlock>

        <SectionBlock letter="F" title="Empleabilidad">
          <Row
            label="Apoyo a empleo"
            value={freeTextOrPending(school.jobSupportSummary)}
          />
          <Row
            label="Tipo de promesa"
            value={EMPLOYMENT_CLAIMS_LABEL[school.employmentClaimsType]}
          />
        </SectionBlock>
      </div>
    </article>
  );
}

export function SupabaseDetailedComparison({
  schoolA,
  schoolB,
  profileA,
  profileB,
}: Props) {
  return (
    <section className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a5a16]">
          Análisis comparativo · Supabase
        </p>
        <h2 className="text-lg font-semibold text-[#0f1a33]">Comparación detallada FlyPath</h2>
        <p className="text-[15px] text-slate-600">
          Vista MVP que replica la estructura del comparador real, alimentada con datos
          dinámicos de <code>SchoolEntry</code> y módulos desde <code>modular_modules</code>{" "}
          (Supabase). Sin lógica hardcoded por escuela.
        </p>
      </header>

      <div className="grid items-stretch gap-3.5 lg:grid-cols-2">
        <SchoolColumn school={schoolA} profile={profileA} />
        <SchoolColumn school={schoolB} profile={profileB} />
      </div>

      <p className="text-[12px] text-slate-500">
        Pendiente de portar: lectura FlyPath cualitativa, fuentes (G), QA premium y CTA Career
        Planner. Los módulos no se muestran como extras; solo en esta sección de operación.
      </p>
    </section>
  );
}
