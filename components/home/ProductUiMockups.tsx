import type { ReactNode } from "react";

const GOLD = "#D6AE4F";
const NAVY = "#071224";
const PANEL = "#0B1730";
const BORDER = "rgba(255,255,255,0.10)";

function MockupShell({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div
      className="w-full overflow-hidden rounded-[20px] border border-[rgba(7,18,36,0.10)] bg-[#071224] shadow-[0_12px_36px_rgba(7,18,36,0.08)]"
      role="img"
      aria-label={label}
    >
      <div className="aspect-[16/10] min-h-[168px] w-full p-3 sm:p-3.5">{children}</div>
    </div>
  );
}

export function CareerPlannerMockup() {
  const steps = ["Perfil", "Ruta", "Coste", "Escuela"];
  const blocks = [
    { label: "Perfil", w: "72%" },
    { label: "Presupuesto", w: "58%" },
    { label: "Ruta recomendada", w: "88%", highlight: true },
    { label: "Próximo paso", w: "64%" },
  ];

  return (
    <MockupShell label="Vista previa Career Planner">
      <div className="flex h-full flex-col text-white">
        <div
          className="mb-2.5 flex items-center justify-between rounded-lg px-2.5 py-1.5"
          style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}
        >
          <span className="text-[10px] font-semibold tracking-wide">Career Planner</span>
          <span
            className="rounded px-1.5 py-0.5 text-[8px] font-medium"
            style={{ backgroundColor: "rgba(214,174,79,0.2)", color: GOLD }}
          >
            En curso
          </span>
        </div>

        <div className="mb-2 flex items-center gap-1">
          {steps.map((step, i) => (
            <div key={step} className="flex min-w-0 flex-1 items-center gap-1">
              <span
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[7px] font-bold"
                style={{
                  backgroundColor: i <= 2 ? GOLD : "rgba(255,255,255,0.12)",
                  color: i <= 2 ? NAVY : "rgba(255,255,255,0.5)",
                }}
              >
                {i + 1}
              </span>
              <span className="truncate text-[7px] text-white/70">{step}</span>
              {i < steps.length - 1 ? (
                <span className="h-px flex-1 bg-white/15" aria-hidden />
              ) : null}
            </div>
          ))}
        </div>

        <div className="grid flex-1 grid-cols-2 gap-1.5">
          {blocks.map((b) => (
            <div
              key={b.label}
              className="rounded-md px-2 py-1.5"
              style={{
                backgroundColor: b.highlight ? "rgba(214,174,79,0.12)" : PANEL,
                border: `1px solid ${b.highlight ? "rgba(214,174,79,0.35)" : BORDER}`,
              }}
            >
              <p className="text-[7px] font-medium text-white/55">{b.label}</p>
              <div
                className="mt-1 h-1 rounded-full bg-white/10"
                style={{ width: b.w }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: "100%",
                    backgroundColor: b.highlight ? GOLD : "rgba(255,255,255,0.25)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </MockupShell>
  );
}

export function SchoolsComparatorMockup() {
  const rows = [
    { name: "Escuela A", price: "78k", inc: "Alto", risk: "Bajo", rating: "4.2", highlight: false },
    { name: "Escuela B", price: "92k", inc: "Medio", risk: "Medio", rating: "4.6", highlight: true },
    { name: "Escuela C", price: "85k", inc: "Alto", risk: "Bajo", rating: "4.0", highlight: false },
  ];

  return (
    <MockupShell label="Vista previa Comparador de escuelas">
      <div className="flex h-full flex-col text-white">
        <div
          className="mb-2 flex items-center justify-between rounded-lg px-2.5 py-1.5"
          style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}
        >
          <span className="text-[10px] font-semibold">Comparador</span>
          <span className="text-[8px] text-white/45">3 escuelas</span>
        </div>

        <div
          className="mb-1 grid grid-cols-[1.2fr_repeat(4,1fr)] gap-1 px-1 text-[7px] font-medium uppercase tracking-wider text-white/40"
        >
          <span />
          <span className="text-center">Precio</span>
          <span className="text-center">Incl.</span>
          <span className="text-center">Riesgo</span>
          <span className="text-center">Rating</span>
        </div>

        <div className="flex flex-1 flex-col gap-1 overflow-hidden">
          {rows.map((row) => (
            <div
              key={row.name}
              className="grid grid-cols-[1.2fr_repeat(4,1fr)] items-center gap-1 rounded-md px-1.5 py-1"
              style={{
                backgroundColor: row.highlight ? "rgba(214,174,79,0.14)" : PANEL,
                border: row.highlight
                  ? "1px solid rgba(214,174,79,0.4)"
                  : `1px solid ${BORDER}`,
              }}
            >
              <span className="truncate text-[8px] font-medium">{row.name}</span>
              <span className="text-center text-[8px] text-white/80">{row.price}</span>
              <span className="text-center text-[8px] text-white/65">{row.inc}</span>
              <span
                className="mx-auto rounded px-1 text-[7px]"
                style={{
                  backgroundColor:
                    row.risk === "Bajo"
                      ? "rgba(214,174,79,0.25)"
                      : "rgba(255,255,255,0.08)",
                  color: row.risk === "Bajo" ? GOLD : "rgba(255,255,255,0.6)",
                }}
              >
                {row.risk}
              </span>
              <span
                className="text-center text-[8px] font-semibold"
                style={{ color: row.highlight ? GOLD : "white" }}
              >
                {row.rating}
              </span>
            </div>
          ))}
        </div>
      </div>
    </MockupShell>
  );
}

function ShowcaseMockupFrame({
  children,
  label,
  className = "",
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto flex w-full max-w-[220px] items-center justify-center ${className}`}
      role="img"
      aria-label={label}
    >
      {children}
    </div>
  );
}

export function HomeResourceGuideMockup({
  title,
  subtitle,
  tone = "navy",
}: {
  title: string;
  subtitle: string;
  tone?: "navy" | "sky";
}) {
  const cover =
    tone === "sky"
      ? "from-[#1a3a5c] via-[#0f2844] to-[#071827]"
      : "from-[#0f1a33] via-[#071827] to-[#06111f]";

  return (
    <ShowcaseMockupFrame label={`Vista previa guía ${title}`}>
      <div className="relative w-full max-w-[168px]">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[#D6AE4F]/20 via-transparent to-[#071224]/10 blur-xl"
        />
        <div
          className={`relative aspect-[3/4] w-full overflow-hidden rounded-r-xl rounded-l-sm bg-gradient-to-br ${cover} shadow-[0_20px_44px_rgba(7,18,36,0.22)] ring-1 ring-[#071224]/10`}
        >
          <div className="absolute inset-y-0 left-0 w-[10%] bg-black/25" aria-hidden />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(214,174,79,0.12),transparent_55%)]" aria-hidden />
          <div className="relative flex h-full flex-col justify-end p-4 pl-6">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#f2ddaa]/90">
              FlyPath
            </p>
            <p className="mt-2 text-[13px] font-semibold leading-tight text-white">{title}</p>
            <p className="mt-1 text-[9px] leading-snug text-white/65">{subtitle}</p>
            <div className="mt-3 h-1 w-8 rounded-full bg-[#D6AE4F]/70" aria-hidden />
          </div>
        </div>
      </div>
    </ShowcaseMockupFrame>
  );
}

export function HomeResourceMobileMockup({ appName }: { appName: string }) {
  return (
    <ShowcaseMockupFrame label={`Vista previa app ${appName}`}>
      <div className="relative w-full max-w-[148px]">
        <div className="relative aspect-[9/19] w-full overflow-hidden rounded-[1.75rem] border border-[#071224]/15 bg-[#071224] p-1.5 shadow-[0_22px_48px_rgba(7,18,36,0.2)] ring-1 ring-white/10">
          <div className="flex h-full flex-col overflow-hidden rounded-[1.35rem] bg-gradient-to-b from-[#0b1730] to-[#06111f]">
            <div className="border-b border-white/10 px-3 py-2">
              <p className="text-[8px] font-semibold text-[#f2ddaa]">{appName}</p>
            </div>
            <div className="flex-1 space-y-2 p-3">
              <div className="rounded-lg border border-[#D6AE4F]/25 bg-[#D6AE4F]/10 px-2 py-2">
                <p className="text-[7px] font-medium text-[#f2ddaa]">ATC Scenario</p>
                <p className="mt-1 text-[6px] leading-relaxed text-white/55">
                  Cleared for takeoff runway 09
                </p>
              </div>
              <div className="rounded-lg bg-white/[0.06] px-2 py-2">
                <p className="text-[6px] text-white/45">Your readback</p>
                <div className="mt-1.5 h-1.5 w-3/4 rounded-full bg-white/15" />
                <div className="mt-1 h-1.5 w-1/2 rounded-full bg-white/10" />
              </div>
              <div className="mx-auto mt-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#D6AE4F]/20 ring-1 ring-[#D6AE4F]/35">
                <span className="h-2 w-2 rounded-full bg-[#D6AE4F]" aria-hidden />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ShowcaseMockupFrame>
  );
}

export function HomeResourceMentorshipMockup() {
  return (
    <ShowcaseMockupFrame label="Vista previa Mentoría 1 a 1">
      <div className="relative w-full max-w-[200px]">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#D6AE4F]/25 bg-gradient-to-br from-[#071224] to-[#0b1730] p-4 shadow-[0_22px_48px_rgba(7,18,36,0.24)]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D6AE4F]/50 to-transparent"
          />
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D6AE4F]/35 bg-[#D6AE4F]/12">
            <span className="text-[11px] font-semibold text-[#f2ddaa]">1:1</span>
          </div>
          <p className="mt-3 text-[12px] font-semibold leading-snug text-white">Sesión personalizada</p>
          <p className="mt-1 text-[9px] leading-relaxed text-white/60">
            Dudas, ruta y próximos pasos con un piloto.
          </p>
          <div className="mt-3 flex gap-1.5">
            <span className="h-1.5 flex-1 rounded-full bg-[#D6AE4F]/70" aria-hidden />
            <span className="h-1.5 w-6 rounded-full bg-white/15" aria-hidden />
          </div>
        </div>
      </div>
    </ShowcaseMockupFrame>
  );
}
