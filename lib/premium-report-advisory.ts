import type {
  ReportSnapshotSchoolSummaryItem,
  ReportSnapshotV1,
} from "@/lib/reporting/types/report-snapshot";

export const PREMIUM_SCHOOLS_PER_PAGE = 3;
/** Máximo de escuelas por página en el grid ejecutivo de validación (2 columnas). */
export const PREMIUM_VALIDATION_SCHOOLS_PER_PAGE = 4;

export type AdvisoryBlock = {
  title: string;
  schoolName: string;
  reasons: string[];
};

export type ComparativeAdvisory = {
  mostSolid: AdvisoryBlock | null;
  bestPrice: AdvisoryBlock | null;
  bestSecurity: AdvisoryBlock | null;
  needsValidation: AdvisoryBlock | null;
};

export type SchoolValidationBlock = {
  schoolName: string;
  asks: string[];
  shortItems: string[];
};

export type InformedDecisionAdvisory = {
  avoid: string[];
  thisWeek: string[];
  practicalDecision: string;
};

function verificationRank(estado: string): number {
  if (estado === "verificado") return 4;
  if (estado === "parcialmente_verificado") return 3;
  if (estado === "pendiente") return 2;
  return 1;
}

function solidityScore(school: ReportSnapshotSchoolSummaryItem): number {
  return verificationRank(school.estadoVerificacion) * 20 - school.pendientes.length * 4;
}

function securityScore(school: ReportSnapshotSchoolSummaryItem): number {
  return verificationRank(school.estadoVerificacion) * 15 - school.pendientes.length * 5;
}

function pickSchool(
  items: ReportSnapshotSchoolSummaryItem[],
  selector: (school: ReportSnapshotSchoolSummaryItem) => number,
  mode: "max" | "min" = "max",
): ReportSnapshotSchoolSummaryItem | null {
  if (items.length === 0) return null;
  return [...items].sort((a, b) =>
    mode === "max" ? selector(b) - selector(a) : selector(a) - selector(b),
  )[0];
}

function pickCheapest(items: ReportSnapshotSchoolSummaryItem[]): ReportSnapshotSchoolSummaryItem | null {
  const priced = items.filter((s) => s.precioAnunciado > 0);
  if (priced.length === 0) return items[0] ?? null;
  return pickSchool(priced, (s) => s.precioAnunciado, "min");
}

function resolveMostSolidSchool(
  items: ReportSnapshotSchoolSummaryItem[],
  bestSchoolName: string | null,
): ReportSnapshotSchoolSummaryItem | null {
  if (bestSchoolName) {
    const named = items.find((s) => s.nombre === bestSchoolName);
    if (named) return named;
  }
  return pickSchool(items, solidityScore, "max");
}

function relativePendingLead(school: ReportSnapshotSchoolSummaryItem, others: ReportSnapshotSchoolSummaryItem[]): boolean {
  if (others.length === 0) return school.pendientes.length === 0;
  const minPending = Math.min(...others.map((s) => s.pendientes.length));
  return school.pendientes.length <= minPending;
}

function buildSolidReasons(
  school: ReportSnapshotSchoolSummaryItem,
  others: ReportSnapshotSchoolSummaryItem[],
): string[] {
  const reasons: string[] = [];
  const bestVerification = Math.max(...others.map((s) => verificationRank(s.estadoVerificacion)));

  if (verificationRank(school.estadoVerificacion) >= bestVerification) {
    reasons.push("mejor validación documental");
  }
  if (relativePendingLead(school, others.filter((s) => s.id !== school.id))) {
    reasons.push("menos incertidumbre financiera");
  }
  reasons.push("mejor posición global para este perfil");
  return reasons.slice(0, 3);
}

function buildPriceReasons(
  school: ReportSnapshotSchoolSummaryItem,
  others: ReportSnapshotSchoolSummaryItem[],
): string[] {
  const reasons: string[] = [];
  const priced = others.filter((s) => s.precioAnunciado > 0);
  if (priced.length > 0 && school.precioAnunciado === Math.min(...priced.map((s) => s.precioAnunciado))) {
    reasons.push("menor coste total");
  }
  reasons.push("menor inversión inicial");
  if (
    school.pendientes.some((p) => /calendario|reembolso|tasas|coste|contrato|mcc|skill/i.test(p)) ||
    school.estadoVerificacion !== "verificado"
  ) {
    reasons.push("advertencias importantes");
  } else {
    reasons.push("menor barrera de entrada con validación previa recomendada");
  }
  return reasons.slice(0, 3);
}

function buildSecurityReasons(
  school: ReportSnapshotSchoolSummaryItem,
  others: ReportSnapshotSchoolSummaryItem[],
): string[] {
  const reasons: string[] = [];
  if (school.estadoVerificacion === "verificado") {
    reasons.push("documentación más sólida");
  } else if (
    verificationRank(school.estadoVerificacion) >=
    Math.max(...others.map((s) => verificationRank(s.estadoVerificacion)))
  ) {
    reasons.push("documentación relativamente más sólida");
  } else {
    reasons.push("documentación más sólida entre las opciones comparadas");
  }
  if (school.pendientes.length <= Math.min(...others.map((s) => s.pendientes.length))) {
    reasons.push("costes más verificados");
  }
  reasons.push("menos variables pendientes");
  return reasons.slice(0, 3);
}

function buildValidationReasons(
  school: ReportSnapshotSchoolSummaryItem,
  others: ReportSnapshotSchoolSummaryItem[],
): string[] {
  const reasons: string[] = [];
  if (school.estadoVerificacion !== "verificado" || school.pendientes.length > 0) {
    reasons.push("documentación pendiente");
  }
  const costPending = school.pendientes.some((p) =>
    /coste|precio|tasas|skill|alojamiento|mcc|uprt/i.test(p),
  );
  if (costPending || school.estadoVerificacion !== "verificado") {
    reasons.push("costes sin verificar");
  }
  if (school.pendientes.length >= Math.max(...others.map((s) => s.pendientes.length), 1)) {
    reasons.push("incertidumbre superior al resto");
  }
  return reasons.length > 0 ? reasons.slice(0, 3) : ["requiere confirmación adicional antes de pagar"];
}

export function buildComparativeAdvisory(snapshot: ReportSnapshotV1): ComparativeAdvisory {
  const items = snapshot.schoolsSummary.items;
  if (items.length === 0) {
    return { mostSolid: null, bestPrice: null, bestSecurity: null, needsValidation: null };
  }

  const mostSolidSchool = resolveMostSolidSchool(items, snapshot.schoolsSummary.bestSchoolName);
  const bestPriceSchool = pickCheapest(items);
  const bestSecuritySchool = pickSchool(items, securityScore, "max");
  const needsValidationSchool = pickSchool(items, (s) => s.pendientes.length * 10 - verificationRank(s.estadoVerificacion), "max");

  const toBlock = (
    title: string,
    school: ReportSnapshotSchoolSummaryItem | null,
    reasons: string[],
  ): AdvisoryBlock | null => {
    if (!school) return null;
    return { title, schoolName: school.nombre, reasons };
  };

  return {
    mostSolid: toBlock("Escuela más sólida", mostSolidSchool, buildSolidReasons(mostSolidSchool!, items)),
    bestPrice: toBlock("Mejor opción si priorizas precio", bestPriceSchool, buildPriceReasons(bestPriceSchool!, items)),
    bestSecurity: toBlock(
      "Mejor opción si priorizas seguridad",
      bestSecuritySchool,
      buildSecurityReasons(bestSecuritySchool!, items),
    ),
    needsValidation: toBlock(
      "Escuela que requiere más validación",
      needsValidationSchool,
      buildValidationReasons(needsValidationSchool!, items),
    ),
  };
}

export function pendienteToValidationAsk(pendiente: string): string {
  const lower = pendiente.toLowerCase();
  if (lower.includes("mcc") || lower.includes("joc")) {
    return "Confirmar si MCC/JOC está incluido y en qué modalidad";
  }
  if (lower.includes("calendario")) return "Confirmar calendario de pagos por escrito";
  if (lower.includes("reembolso")) return "Solicitar política de reembolso detallada";
  if (lower.includes("contrato") || lower.includes("condiciones")) {
    return "Exigir contrato y condiciones antes de cualquier pago";
  }
  if (lower.includes("tasas") || lower.includes("examen")) return "Solicitar desglose de tasas de examen";
  if (lower.includes("skill")) return "Confirmar costes de skill tests y repeticiones";
  if (lower.includes("alojamiento")) return "Confirmar alojamiento y extras habitacionales";
  if (lower.includes("uprt")) return "Confirmar Advanced UPRT incluido o presupuestado";
  if (lower.includes("flota")) return "Solicitar detalle de flota y disponibilidad";
  if (lower.includes("mantenimiento")) return "Confirmar mantenimiento y disponibilidad operativa";
  if (lower.includes("ratio")) return "Confirmar ratio alumno/avión real";
  if (lower.includes("alumnos")) return "Solicitar contacto con alumnos actuales o antiguos";
  if (lower.includes("empleo") || lower.includes("apoyo")) {
    return "Pedir por escrito alcance real de career support";
  }
  if (lower.includes("precio") || lower.includes("coste")) {
    return "Confirmar costes finales y condiciones por escrito";
  }
  return `Confirmar por escrito: ${pendiente}`;
}

export function pendienteToShortLabel(pendiente: string): string {
  const lower = pendiente.toLowerCase();
  if (lower.includes("mcc") || lower.includes("joc")) return "MCC/JOC";
  if (lower.includes("uprt")) return "UPRT";
  if (lower.includes("tasas") || lower.includes("examen")) return "Tasas";
  if (lower.includes("skill")) return "Skill tests";
  if (lower.includes("alojamiento")) return "Alojamiento";
  if (lower.includes("reembolso")) return "Reembolso";
  if (lower.includes("calendario")) return "Calendario pagos";
  if (lower.includes("contrato") || lower.includes("condiciones")) return "Contrato";
  if (lower.includes("coste") || lower.includes("precio")) return "Costes";
  if (lower.includes("flota")) return "Flota";
  if (lower.includes("mantenimiento") || lower.includes("disponibilidad")) return "Disponibilidad";
  if (lower.includes("ratio")) return "Ratio alumno/avión";
  if (lower.includes("alumnos")) return "Referencias alumnos";
  if (lower.includes("empleo") || lower.includes("apoyo")) return "Career support";
  const trimmed = pendiente.trim();
  return trimmed.length > 22 ? `${trimmed.slice(0, 20)}…` : trimmed;
}

export function buildSchoolValidationShortItems(school: ReportSnapshotSchoolSummaryItem): string[] {
  const items = school.pendientes.map(pendienteToShortLabel);
  if (school.estadoVerificacion !== "verificado" && !items.some((i) => /coste/i.test(i))) {
    items.push("Costes");
  }
  if (school.pendientes.some((p) => /reembolso/i.test(p)) && !items.includes("Reembolso")) {
    items.push("Reembolso");
  }
  if (school.pendientes.some((p) => /calendario/i.test(p)) && !items.includes("Calendario pagos")) {
    items.push("Calendario pagos");
  }
  return [...new Set(items)].slice(0, 5);
}

export function buildSchoolValidationAsks(school: ReportSnapshotSchoolSummaryItem): string[] {
  const asks = school.pendientes.map(pendienteToValidationAsk);
  if (school.estadoVerificacion !== "verificado") {
    asks.push("Solicitar confirmación documental de costes y condiciones");
  }
  if (school.pendientes.some((p) => /reembolso/i.test(p)) && !asks.some((a) => /reembolso/i.test(a))) {
    asks.push("Solicitar política de reembolso");
  }
  if (school.pendientes.some((p) => /calendario/i.test(p)) && !asks.some((a) => /calendario/i.test(a))) {
    asks.push("Confirmar calendario de pagos");
  }
  return [...new Set(asks)].slice(0, 5);
}

export function buildValidationBlocks(snapshot: ReportSnapshotV1): SchoolValidationBlock[] {
  return snapshot.schoolsSummary.items.map((school) => ({
    schoolName: school.nombre,
    asks: buildSchoolValidationAsks(school),
    shortItems: buildSchoolValidationShortItems(school),
  }));
}

/** Grid de validación: siempre 2 columnas equilibradas. */
export function resolveValidationGridColumns(_schoolCountOnPage: number): number {
  return 2;
}

export function chunkValidationBlocks(blocks: SchoolValidationBlock[]): SchoolValidationBlock[][] {
  if (blocks.length <= PREMIUM_VALIDATION_SCHOOLS_PER_PAGE) return [blocks];
  return chunkItems(blocks, PREMIUM_VALIDATION_SCHOOLS_PER_PAGE);
}

function formatListSpanish(items: string[]): string {
  const unique = [...new Set(items.filter(Boolean))];
  if (unique.length === 0) return "";
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} y ${unique[1]}`;
  return `${unique.slice(0, -1).join(", ")} y ${unique[unique.length - 1]}`;
}

function collectPendingThemes(snapshot: ReportSnapshotV1) {
  const pendientes = snapshot.schoolsSummary.items.flatMap((s) => s.pendientes);
  const lower = pendientes.map((p) => p.toLowerCase());
  return {
    contract: lower.some((p) => /contrato|condiciones/.test(p)),
    reembolso: lower.some((p) => /reembolso/.test(p)),
    calendario: lower.some((p) => /calendario/.test(p)),
    tasas: lower.some((p) => /tasas|examen/.test(p)),
    extras:
      lower.some((p) => /extras|skill|coste|precio/.test(p)) ||
      snapshot.schoolsSummary.items.some((s) => s.estadoVerificacion !== "verificado"),
    modulos: lower.some((p) => /mcc|joc|uprt|skill/.test(p)),
    alojamiento: lower.some((p) => /alojamiento/.test(p)),
  };
}

export function buildValidationPriorityMessage(snapshot: ReportSnapshotV1): string {
  const themes = collectPendingThemes(snapshot);

  const first: string[] = [];
  if (themes.contract) first.push("contrato");
  if (themes.reembolso) first.push("reembolso");
  if (themes.calendario) first.push("calendario de pagos");

  const second: string[] = [];
  if (themes.tasas) second.push("tasas");
  if (themes.extras) second.push("extras");
  if (themes.modulos) second.push("módulos no confirmados");
  if (themes.alojamiento) second.push("alojamiento");

  const sentences: string[] = [];
  if (first.length > 0) {
    sentences.push(`Primero confirma ${formatListSpanish(first)}.`);
  }
  if (second.length > 0) {
    sentences.push(`Después valida ${formatListSpanish(second)}.`);
  }

  if (sentences.length === 0) {
    return "Confirma contrato, calendario de pagos y coste final por escrito antes de transferir matrícula.";
  }
  return sentences.join(" ");
}

export function buildPracticalDecisionMessage(snapshot: ReportSnapshotV1): string {
  const themes = collectPendingThemes(snapshot);
  const blockers: string[] = [];

  if (themes.contract || hasContractGap(snapshot)) blockers.push("contrato");
  if (themes.reembolso) blockers.push("reembolso");
  if (themes.calendario || hasCalendarGap(snapshot)) blockers.push("calendario de pagos");
  blockers.push("coste final");

  const needsValidation =
    !snapshot.readiness.shouldPayNow ||
    snapshot.schoolsSummary.items.some(
      (s) => s.estadoVerificacion !== "verificado" || s.pendientes.length > 0,
    );

  if (needsValidation) {
    return `Avanzaríamos con validación, pero no transferiríamos matrícula hasta tener ${formatListSpanish(blockers)} por escrito.`;
  }

  return "Con la documentación validada, el siguiente paso sería formalizar la opción preferida sin precipitar el primer pago.";
}

export function chunkItems<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function hasContractGap(snapshot: ReportSnapshotV1): boolean {
  return snapshot.schoolsSummary.items.some((s) =>
    s.pendientes.some((p) => /contrato|condiciones/i.test(p)),
  );
}

function hasCalendarGap(snapshot: ReportSnapshotV1): boolean {
  return snapshot.schoolsSummary.items.some((s) => s.pendientes.some((p) => /calendario/i.test(p)));
}

function hasModuleGap(snapshot: ReportSnapshotV1): boolean {
  return snapshot.schoolsSummary.items.some((s) =>
    s.pendientes.some((p) => /mcc|joc|uprt|skill|tasas/i.test(p)),
  );
}

function hasPriceOnlySignal(snapshot: ReportSnapshotV1): boolean {
  const items = snapshot.schoolsSummary.items.filter((s) => s.precioAnunciado > 0);
  if (items.length < 2) return false;
  const sorted = [...items].sort((a, b) => a.precioAnunciado - b.precioAnunciado);
  const gap = sorted[sorted.length - 1].precioAnunciado - sorted[0].precioAnunciado;
  const docSpread = new Set(items.map((s) => s.estadoVerificacion)).size > 1;
  return gap > 5000 && docSpread;
}

export function buildInformedDecisionAdvisory(snapshot: ReportSnapshotV1): InformedDecisionAdvisory {
  const avoid: string[] = [];

  if (hasContractGap(snapshot) || snapshot.readiness.shouldPayNow === false) {
    avoid.push("pagar matrícula sin contrato");
  }
  if (hasModuleGap(snapshot)) {
    avoid.push("asumir que ciertos módulos están incluidos");
  }
  if (hasCalendarGap(snapshot) || snapshot.costs.summary.brechaFinanciacion > 0) {
    avoid.push("transferir depósitos sin calendario de pagos");
  }
  if (hasPriceOnlySignal(snapshot)) {
    avoid.push("tomar la decisión únicamente por precio");
  }
  if (snapshot.risks.items.some((r) => /documental/i.test(r.label) && (r.nivel === "Alto" || r.nivel === "Crítico"))) {
    avoid.push("cerrar plaza sin validar documentación pendiente");
  }

  const thisWeek = [
    ...snapshot.readiness.proximosPasos.slice(0, 2),
    ...snapshot.roadmap.sevenDays.slice(0, 2),
    ...snapshot.risks.items
      .filter((r) => r.nivel === "Alto" || r.nivel === "Crítico")
      .map((r) => r.accion)
      .slice(0, 1),
  ]
    .map((s) => s.trim())
    .filter(Boolean);

  const uniqueWeek = [...new Set(thisWeek)].slice(0, 4);
  while (uniqueWeek.length < 4 && snapshot.roadmap.thirtyDays[uniqueWeek.length]) {
    const extra = snapshot.roadmap.thirtyDays[uniqueWeek.length]?.trim();
    if (extra && !uniqueWeek.includes(extra)) uniqueWeek.push(extra);
  }

  return {
    avoid: [...new Set(avoid)].slice(0, 5),
    thisWeek: uniqueWeek.length > 0 ? uniqueWeek : snapshot.readiness.proximosPasos.slice(0, 4),
    practicalDecision: buildPracticalDecisionMessage(snapshot),
  };
}
