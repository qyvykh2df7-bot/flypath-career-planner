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

export function AtplPlannerMockup() {
  const subjects = [
    { name: "Air Law", pct: 72 },
    { name: "Meteo", pct: 45 },
    { name: "Nav", pct: 58 },
  ];
  const weekDays = ["L", "M", "X", "J", "V"];

  return (
    <MockupShell label="Vista previa ATPL Planner">
      <div className="flex h-full flex-col text-white">
        <div
          className="mb-2 flex items-center justify-between rounded-lg px-2.5 py-1.5"
          style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}
        >
          <span className="text-[10px] font-semibold">ATPL Planner</span>
          <span className="text-[8px]" style={{ color: GOLD }}>
            Objetivo 12h/sem
          </span>
        </div>

        <div className="mb-2 flex gap-1">
          {weekDays.map((d, i) => (
            <div
              key={d}
              className="flex flex-1 flex-col items-center rounded py-1"
              style={{
                backgroundColor: i === 2 ? "rgba(214,174,79,0.2)" : PANEL,
                border: i === 2 ? "1px solid rgba(214,174,79,0.35)" : `1px solid ${BORDER}`,
              }}
            >
              <span className="text-[7px] text-white/50">{d}</span>
              <span
                className="mt-0.5 h-3 w-full max-w-[14px] rounded-sm"
                style={{
                  backgroundColor: i === 2 ? GOLD : "rgba(255,255,255,0.15)",
                  opacity: i === 2 ? 1 : 0.6 + i * 0.08,
                }}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-1 flex-col gap-1">
          {subjects.map((s) => (
            <div
              key={s.name}
              className="rounded-md px-2 py-1"
              style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-medium">{s.name}</span>
                <span className="text-[8px] font-semibold" style={{ color: GOLD }}>
                  {s.pct}%
                </span>
              </div>
              <div className="mt-1 h-1 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${s.pct}%`, backgroundColor: GOLD }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </MockupShell>
  );
}
