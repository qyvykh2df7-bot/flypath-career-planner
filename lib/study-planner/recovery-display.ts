import type { RecoveryPlanStep } from "./types";

function clip(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const slice = t.slice(0, max).trim();
  const lastSpace = slice.lastIndexOf(" ");
  const base = lastSpace > max * 0.55 ? slice.slice(0, lastSpace) : slice;
  return `${base}…`;
}

/** Título corto para escaneo (solo presentación; no altera el plan generado). */
function shortenStepTitle(title: string): string {
  const rules: [RegExp, string][] = [
    [/^Reduce temporalmente/i, "Cierra a 2 asignaturas"],
    [/^Haz un simulacro/i, "Simulacro + dudas"],
    [/^Planifica 3 sesiones/i, "3 sesiones realistas"],
    [/^Limpia primero los repasos/i, "Repasos atrasados primero"],
    [/^Resuelve dudas acumuladas/i, "Dudas acumuladas"],
    [/^Baja el objetivo semanal/i, "Objetivo semanal realista"],
    [/^Programa descanso/i, "Descanso y menos carga"],
    [/^Empieza con una asignatura y una acción/i, "Una asignatura, una acción"],
    [/^Tienes repasos atrasados/i, "Repasos atrasados"],
    [/^Tienes dudas o temas/i, "Dudas sin cerrar"],
    [/^Empieza con una sesión corta/i, "Sesión corta hoy o mañana"],
    [/^Has tocado varias asignaturas/i, "Reduce foco esta semana"],
    [/^Tu media de simulacros/i, "Repaso dirigido"],
    [/^Planifica al menos una sesión/i, "Planifica en calendario"],
    [/^Esta semana: máximo/i, "2-3 bloques en calendario"],
  ];
  for (const [pattern, short] of rules) {
    if (pattern.test(title)) return short;
  }
  return clip(title, 48);
}

/** Descripción compacta (primera frase o recorte). */
function shortenStepDescription(description: string): string {
  const first = description.split(/(?<=[.!?])\s+/)[0]?.trim() ?? description;
  return clip(first, 110);
}

export function formatRecoveryStepForDisplay(step: RecoveryPlanStep): {
  title: string;
  description: string;
} {
  return {
    title: shortenStepTitle(step.title),
    description: shortenStepDescription(step.description),
  };
}

/** Resumen del plan (ya viene práctico desde recovery-plan-preview). */
export function formatRecoverySummaryForDisplay(summary: string): string {
  return summary.trim();
}
