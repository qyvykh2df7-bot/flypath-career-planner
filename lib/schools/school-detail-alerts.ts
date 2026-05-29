/** Convierte textos largos de riesgo en alertas cortas y escaneables. */
export function normalizeFlyPathAlert(text: string): string {
  const raw = text.trim().replace(/^[-–•]\s*/, "");
  if (!raw) return raw;

  const lower = raw.toLowerCase();

  if (/precio.*pendiente|pendiente de actualización|basado en curso 2023/i.test(lower)) {
    return "Precio pendiente de actualización.";
  }
  if (/tasas.*no incluid|exámenes oficiales no incluid|tasas oficiales/i.test(lower)) {
    return "Tasas oficiales no incluidas.";
  }
  if (/expedición de licencia|gastos de expedición/i.test(lower)) {
    return "Coste de expedición de licencia no incluido.";
  }
  if (/reembolso|reserva solo reembolsable/i.test(lower)) {
    return "Reembolso limitado o condicionado.";
  }
  if (/mínimo de alumnos/i.test(lower)) {
    return "Curso sujeto a mínimo de alumnos.";
  }
  if (/contrato completo|confirmar contrato/i.test(lower)) {
    return "Confirmar contrato completo antes de pagar.";
  }
  if (/calendario de pagos.*no publicado|depósito.*no publicado/i.test(lower)) {
    return "Calendario de pagos o depósito no publicados.";
  }
  if (/no comparar económicamente|presupuesto oficial/i.test(lower)) {
    return "Solicitar presupuesto oficial antes de comparar.";
  }
  if (/precio no publicado|precios no publicados/i.test(lower)) {
    return "Precio no publicado en abierto.";
  }

  if (raw.length <= 88) {
    return raw.endsWith(".") || raw.endsWith("?") ? raw : `${raw}.`;
  }

  const slice = raw.slice(0, 85);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > 40 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trim()}…`;
}

export function buildFlyPathAlertsFromSources(sources: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const source of sources) {
    const alert = normalizeFlyPathAlert(source);
    if (!alert || seen.has(alert)) continue;
    seen.add(alert);
    out.push(alert);
  }
  return out;
}
