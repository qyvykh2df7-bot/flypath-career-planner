import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getFullSchoolProfileBySlug,
  type FullSchoolProfile,
  type SupabaseCostsRow,
  type SupabaseExtrasRow,
  type SupabaseModuleRow,
  type SupabaseProgramRow,
  type SupabaseRiskFlagRow,
  type SupabaseSourceRow,
} from "@/lib/schoolQueries";
import {
  extrasStatusLabel,
  formatAdvertisedPriceLabel,
  reliabilityLabel,
  riskLevelLabel,
  routeTypeRawLabel,
} from "@/lib/schoolMapper";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const RISK_LEVEL_PILL_STYLES: Record<string, string> = {
  low: "border-emerald-300/60 bg-emerald-50 text-emerald-700",
  medium: "border-amber-300/60 bg-amber-50 text-amber-700",
  high: "border-orange-300/60 bg-orange-50 text-orange-700",
  critical: "border-red-300/60 bg-red-50 text-red-700",
};

function riskLevelPillClass(level: string | null | undefined): string {
  if (!level) return "border-slate-300/60 bg-slate-100 text-slate-600";
  return RISK_LEVEL_PILL_STYLES[level] ?? "border-slate-300/60 bg-slate-100 text-slate-600";
}

function fallback(value: string | null | undefined): string {
  if (value == null || value === "") return "—";
  return value;
}

function formatNumberOrFallback(
  value: number | null | undefined,
  suffix?: string,
  pendingLabel = "Pendiente de validar",
): string {
  if (value == null) return pendingLabel;
  if (suffix) return `${value} ${suffix}`;
  return String(value);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-2 text-sm last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-[12px] font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="break-words text-right text-[13px] text-slate-800 sm:max-w-[60%]">{value}</dd>
    </div>
  );
}

function SectionHeader({
  letter,
  title,
  subtitle,
}: {
  letter: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-4 flex items-baseline gap-3">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#c9a454]/55 bg-[#c9a454]/15 text-sm font-bold text-[#7b5e1f]">
        {letter}
      </span>
      <div>
        <h2 className="text-lg font-bold text-[#0f1a33] sm:text-xl">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p> : null}
      </div>
    </header>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {children}
    </section>
  );
}

export default async function SchoolSupabaseDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let profile: FullSchoolProfile | null = null;
  let errorMessage: string | null = null;

  try {
    profile = await getFullSchoolProfileBySlug(slug);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Error desconocido";
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <BackToList />
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            <strong className="block text-red-800">Error loading school</strong>
            <span className="mt-1 block">{errorMessage}</span>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    notFound();
  }

  const {
    school,
    programs,
    costsByProgramId,
    extrasByProgramId,
    modulesByProgramId,
    riskFlags,
    sources,
  } = profile;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <BackToList />

        <header className="mb-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="relative h-[78px] overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-br from-[#0a1228] via-[#132447] to-[#1f3066]"
            />
            <div
              aria-hidden="true"
              className="absolute -right-12 -top-14 h-44 w-44 rounded-full bg-[#c9a454]/18 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#c9a454]/55 to-transparent"
            />
            <div className="relative flex h-full items-center gap-3 px-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f2ddaa]/85">
                Página temporal · MVP Supabase
              </p>
            </div>
          </div>
          <div className="px-6 py-5">
            <h1 className="text-2xl font-bold text-[#0f1a33] sm:text-3xl">{school.name}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {fallback(school.city)}
              {school.country ? `, ${school.country}` : ""}
              {school.main_base ? <> · Base {school.main_base}</> : null}
            </p>
            <p className="mt-2 text-[12px] text-slate-500">
              slug: <code className="font-mono text-slate-700">{school.slug}</code> · status:{" "}
              <code className="font-mono text-slate-700">{school.status ?? "—"}</code> · data_status:{" "}
              <code className="font-mono text-slate-700">{school.data_status ?? "—"}</code>
            </p>
          </div>
        </header>

        <SectionCard>
          <SectionHeader letter="A" title="Datos generales" />
          <dl>
            <DataRow label="Nombre" value={fallback(school.name)} />
            <DataRow label="Slug" value={<code className="font-mono">{school.slug}</code>} />
            <DataRow label="País" value={fallback(school.country)} />
            <DataRow label="Ciudad" value={fallback(school.city)} />
            <DataRow label="Base principal" value={fallback(school.main_base)} />
            <DataRow label="Otras bases" value={fallback(school.other_bases)} />
            <DataRow
              label="Web oficial"
              value={
                school.website_url ? (
                  <a
                    href={school.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#7b5e1f] underline-offset-2 hover:underline"
                  >
                    {school.website_url}
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <DataRow label="data_status" value={fallback(school.data_status)} />
            <DataRow label="Última actualización" value={formatDate(school.last_updated_at)} />
          </dl>
        </SectionCard>

        <SectionCard>
          <SectionHeader
            letter="B"
            title="Programas"
            subtitle={
              programs.length === 0
                ? "Sin programas activos en Supabase."
                : `${programs.length} programa${programs.length === 1 ? "" : "s"} activo${programs.length === 1 ? "" : "s"}.`
            }
          />
          {programs.length === 0 ? (
            <p className="text-sm text-slate-500">No hay programas activos para esta escuela.</p>
          ) : (
            <div className="space-y-4">
              {programs.map((program) => (
                <ProgramCard
                  key={program.program_id}
                  program={program}
                  costs={costsByProgramId[program.program_id] ?? null}
                  extras={extrasByProgramId[program.program_id] ?? null}
                  modules={modulesByProgramId[program.program_id] ?? []}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard>
          <SectionHeader
            letter="F"
            title="Puntos a validar"
            subtitle={
              riskFlags.length === 0
                ? "Sin risk flags activos."
                : `${riskFlags.length} punto${riskFlags.length === 1 ? "" : "s"} a confirmar con la escuela.`
            }
          />
          {riskFlags.length === 0 ? (
            <p className="text-sm text-slate-500">
              No se han registrado risk flags activos para esta escuela todavía.
            </p>
          ) : (
            <ul className="space-y-3">
              {riskFlags.map((risk) => (
                <RiskFlagItem key={risk.risk_id} risk={risk} />
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard>
          <SectionHeader
            letter="G"
            title="Fuentes"
            subtitle={
              sources.length === 0
                ? "Sin fuentes registradas todavía."
                : `${sources.length} fuente${sources.length === 1 ? "" : "s"} consultada${sources.length === 1 ? "" : "s"}.`
            }
          />
          {sources.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aún no se han añadido fuentes para esta escuela.
            </p>
          ) : (
            <ul className="space-y-3">
              {sources.map((source) => (
                <SourceItem key={source.source_id} source={source} />
              ))}
            </ul>
          )}
        </SectionCard>

        <p className="mt-2 text-xs text-slate-500">
          Página temporal de validación. Cuando confirmes que el contenido es correcto,
          integramos estas mismas queries en la ficha real (<code>/schools/[slug]</code>).
        </p>
      </div>
    </main>
  );
}

function BackToList() {
  return (
    <div className="mb-5">
      <Link
        href="/schools-supabase"
        className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 transition hover:border-[#c9a454]/55 hover:text-[#0f1a33]"
      >
        <span aria-hidden>←</span> Volver al listado Supabase
      </Link>
    </div>
  );
}

function ProgramCard({
  program,
  costs,
  extras,
  modules,
}: {
  program: SupabaseProgramRow;
  costs: SupabaseCostsRow | null;
  extras: SupabaseExtrasRow | null;
  modules: SupabaseModuleRow[];
}) {
  const isModular = program.route_type === "modular" || modules.length > 0;
  const advertisedLabel = formatAdvertisedPriceLabel(program.advertised_price_eur);
  const realLabel = formatAdvertisedPriceLabel(program.estimated_real_cost_eur);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[15px] font-bold text-[#0f1a33]">
          {fallback(program.program_name)}
          {program.is_main_program ? (
            <span className="ml-2 rounded-full border border-[#c9a454]/55 bg-[#c9a454]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#7b5e1f]">
              Principal
            </span>
          ) : null}
        </h3>
        <span className="rounded-full border border-slate-300/60 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700">
          {routeTypeRawLabel(program.route_type)}
        </span>
      </div>

      <dl className="rounded-xl bg-white p-4">
        <DataRow label="Categoría" value={fallback(program.program_category)} />
        <DataRow label="Precio anunciado" value={<span className="font-semibold text-[#7b5e1f]">{advertisedLabel}</span>} />
        <DataRow label="Coste real estimado FlyPath" value={<span className="font-semibold text-[#7b5e1f]">{realLabel}</span>} />
        <DataRow
          label="Duración"
          value={
            program.duration_months == null
              ? "—"
              : `${program.duration_months} ${program.duration_months === 1 ? "mes" : "meses"}`
          }
        />
        <DataRow label="Horas de vuelo" value={formatNumberOrFallback(program.flight_hours, "h", "—")} />
        <DataRow label="Horas de teoría" value={formatNumberOrFallback(program.theory_hours, "h", "—")} />
        <DataRow label="Idioma" value={fallback(program.language)} />
        <DataRow label="Bases" value={fallback(program.bases)} />
        <DataRow label="Flota" value={fallback(program.fleet)} />
        <DataRow label="Simuladores" value={fallback(program.simulators)} />
        <DataRow label="Clase 1 / médico requerido" value={fallback(program.medical_required)} />
        <DataRow label="Inglés requerido" value={fallback(program.english_required)} />
      </dl>

      <div className="mt-4">
        <SubSectionHeader letter="C" title="Costes y pagos" />
        {costs ? (
          <CostsBlock costs={costs} />
        ) : (
          <p className="rounded-xl bg-white p-4 text-sm text-slate-500">
            No hay datos de costes para este programa todavía.
          </p>
        )}
      </div>

      {isModular ? (
        <div className="mt-4">
          <SubSectionHeader
            letter="D"
            title="Operación y ruta · módulos"
            subtitle={
              modules.length === 0
                ? "Programa modular sin módulos cargados todavía."
                : `${modules.length} módulo${modules.length === 1 ? "" : "s"} en Supabase.`
            }
          />
          {modules.length === 0 ? (
            <p className="rounded-xl bg-white p-4 text-sm text-slate-500">
              No hay módulos cargados todavía para este programa modular.
            </p>
          ) : (
            <ModulesTable modules={modules} />
          )}
        </div>
      ) : null}

      <div className="mt-4">
        <SubSectionHeader letter="E" title="Extras" subtitle="Solo extras comparables (no incluye PPL/IR/CPL/UPRT/MCC/PBN ni módulos formativos)." />
        {extras ? (
          <ExtrasBlock extras={extras} />
        ) : (
          <p className="rounded-xl bg-white p-4 text-sm text-slate-500">
            No hay datos de extras para este programa todavía.
          </p>
        )}
      </div>
    </div>
  );
}

function SubSectionHeader({
  letter,
  title,
  subtitle,
}: {
  letter: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-2 flex items-baseline gap-2">
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-[11px] font-bold text-slate-700">
        {letter}
      </span>
      <div>
        <h4 className="text-[13px] font-semibold uppercase tracking-wide text-[#0f1a33]">{title}</h4>
        {subtitle ? <p className="text-[12px] text-slate-500">{subtitle}</p> : null}
      </div>
    </header>
  );
}

function CostsBlock({ costs }: { costs: SupabaseCostsRow }) {
  const depositLabel = formatAdvertisedPriceLabel(costs.deposit_or_enrollment_fee_eur);
  return (
    <dl className="rounded-xl bg-white p-4">
      <DataRow
        label="Contrato disponible antes de pagar"
        value={extrasStatusLabel(costs.contract_available_before_payment)}
      />
      <DataRow
        label="Política de reembolso"
        value={extrasStatusLabel(costs.refund_policy_available)}
      />
      {costs.refund_policy_summary ? (
        <DataRow label="Resumen reembolso" value={costs.refund_policy_summary} />
      ) : null}
      <DataRow
        label="Calendario de pagos"
        value={extrasStatusLabel(costs.payment_schedule_available)}
      />
      {costs.payment_schedule_summary ? (
        <DataRow label="Resumen calendario" value={costs.payment_schedule_summary} />
      ) : null}
      <DataRow label="Depósito / matrícula" value={<span className="font-semibold text-[#7b5e1f]">{depositLabel}</span>} />
      <DataRow label="Financiación disponible" value={extrasStatusLabel(costs.financing_available)} />
      {costs.financing_summary ? (
        <DataRow label="Resumen financiación" value={costs.financing_summary} />
      ) : null}
      <DataRow label="Año del precio" value={costs.price_year ?? "—"} />
      {costs.price_validity_notes ? (
        <DataRow label="Notas validez precio" value={costs.price_validity_notes} />
      ) : null}
    </dl>
  );
}

function ModulesTable({ modules }: { modules: SupabaseModuleRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white">
      <table className="w-full text-left text-[13px]">
        <thead className="bg-slate-100/70 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Módulo</th>
            <th className="px-3 py-2">Precio</th>
            <th className="px-3 py-2">Notas</th>
            <th className="px-3 py-2">Requerido</th>
          </tr>
        </thead>
        <tbody>
          {modules.map((m) => (
            <tr key={m.module_id} className="border-t border-slate-100">
              <td className="px-3 py-2 text-slate-500">{m.module_order ?? "—"}</td>
              <td className="px-3 py-2 font-medium text-slate-800">{fallback(m.module_name)}</td>
              <td className="px-3 py-2 font-semibold text-[#7b5e1f]">
                {formatAdvertisedPriceLabel(m.price_eur)}
              </td>
              <td className="px-3 py-2 text-slate-700">{fallback(m.price_notes)}</td>
              <td className="px-3 py-2 text-slate-700">
                {m.is_required_for_route === true
                  ? "Sí"
                  : m.is_required_for_route === false
                    ? "No"
                    : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const EXTRAS_FIELDS_VIEW: { key: keyof SupabaseExtrasRow; notesKey: keyof SupabaseExtrasRow; label: string }[] = [
  { key: "exam_fees_status", notesKey: "exam_fees_notes", label: "Tasas de examen" },
  { key: "skill_tests_status", notesKey: "skill_tests_notes", label: "Skill tests" },
  { key: "materials_status", notesKey: "materials_notes", label: "Material formativo" },
  { key: "uniform_status", notesKey: "uniform_notes", label: "Uniforme" },
  { key: "headset_status", notesKey: "headset_notes", label: "Headset" },
  { key: "ipad_status", notesKey: "ipad_notes", label: "iPad" },
  { key: "accommodation_status", notesKey: "accommodation_notes", label: "Alojamiento" },
  { key: "transport_status", notesKey: "transport_notes", label: "Transporte" },
  { key: "medical_status", notesKey: "medical_notes", label: "Reconocimiento médico (Clase 1)" },
  { key: "insurance_status", notesKey: "insurance_notes", label: "Seguro" },
];

function ExtrasBlock({ extras }: { extras: SupabaseExtrasRow }) {
  return (
    <div className="rounded-xl bg-white p-4">
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {EXTRAS_FIELDS_VIEW.map(({ key, notesKey, label }) => {
          const status = extras[key] as string | null;
          const notes = extras[notesKey] as string | null;
          return (
            <li
              key={String(key)}
              className="flex flex-col gap-0.5 rounded-lg border border-slate-100 px-3 py-2"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {label}
                </span>
                <span className="text-[12px] font-semibold text-slate-800">
                  {extrasStatusLabel(status)}
                </span>
              </div>
              {notes ? <p className="text-[12px] text-slate-600">{notes}</p> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RiskFlagItem({ risk }: { risk: SupabaseRiskFlagRow }) {
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex flex-wrap items-baseline gap-2">
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${riskLevelPillClass(
            risk.risk_level,
          )}`}
        >
          {riskLevelLabel(risk.risk_level)}
        </span>
        {risk.risk_category ? (
          <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
            {risk.risk_category}
          </span>
        ) : null}
        <h4 className="text-[14px] font-bold text-[#0f1a33]">{fallback(risk.risk_title)}</h4>
      </div>
      {risk.risk_text ? (
        <p className="text-[13px] leading-relaxed text-slate-700">{risk.risk_text}</p>
      ) : null}
      {risk.question_to_school ? (
        <p className="mt-2 rounded-lg border border-[#c9a454]/35 bg-[#fff7e3] p-3 text-[13px] text-[#5a431a]">
          <span className="font-semibold">Qué preguntar: </span>
          {risk.question_to_school}
        </p>
      ) : null}
      {risk.source_url ? (
        <p className="mt-2 text-[12px] text-slate-500">
          Fuente:{" "}
          <a
            href={risk.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#7b5e1f] underline-offset-2 hover:underline"
          >
            {risk.source_url}
          </a>
        </p>
      ) : null}
    </li>
  );
}

function SourceItem({ source }: { source: SupabaseSourceRow }) {
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-[14px] font-semibold text-[#0f1a33]">
          {fallback(source.source_title)}
        </h4>
        <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
          Fiabilidad: {reliabilityLabel(source.reliability)}
        </span>
      </div>
      {source.source_url ? (
        <p className="mt-1 break-all text-[12px]">
          <a
            href={source.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#7b5e1f] underline-offset-2 hover:underline"
          >
            {source.source_url}
          </a>
        </p>
      ) : null}
      <p className="mt-1 text-[12px] text-slate-500">
        Consultada: {formatDate(source.accessed_at)}
        {source.published_date ? ` · Publicada: ${formatDate(source.published_date)}` : null}
      </p>
      {source.notes ? <p className="mt-1 text-[12px] text-slate-600">{source.notes}</p> : null}
    </li>
  );
}
