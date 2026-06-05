import { describe, expect, it } from "vitest";
import { createDemoReportSnapshot } from "@/lib/reporting/mocks/demo-report-snapshot";
import {
  buildComparativeAdvisory,
  buildInformedDecisionAdvisory,
  buildPracticalDecisionMessage,
  buildSchoolValidationAsks,
  buildSchoolValidationShortItems,
  buildValidationBlocks,
  buildValidationPriorityMessage,
  chunkValidationBlocks,
  pendienteToShortLabel,
  resolveValidationGridColumns,
} from "@/lib/premium-report-advisory";

describe("premium-report-advisory", () => {
  it("builds comparative blocks from real school names", () => {
    const snapshot = createDemoReportSnapshot();
    const advisory = buildComparativeAdvisory(snapshot);
    expect(advisory.mostSolid?.schoolName).toBe("European Aviation Academy");
    expect(advisory.bestPrice?.reasons.length).toBeGreaterThan(0);
    expect(advisory.needsValidation?.schoolName).toBeTruthy();
  });

  it("builds school-specific validation asks", () => {
    const snapshot = createDemoReportSnapshot();
    const sky = snapshot.schoolsSummary.items.find((s) => s.nombre.includes("SkyPath"));
    expect(sky).toBeTruthy();
    const asks = buildSchoolValidationAsks(sky!);
    expect(asks.some((a) => /MCC|JOC/i.test(a))).toBe(true);
    expect(asks.some((a) => /reembolso/i.test(a))).toBe(true);
  });

  it("builds compact validation labels for executive grid", () => {
    expect(pendienteToShortLabel("MCC/JOC no confirmado")).toBe("MCC/JOC");
    expect(pendienteToShortLabel("Tasas de examen")).toBe("Tasas");

    const snapshot = createDemoReportSnapshot();
    const blocks = buildValidationBlocks(snapshot);
    expect(blocks.every((b) => b.shortItems.length > 0)).toBe(true);
    expect(blocks.some((b) => b.shortItems.includes("MCC/JOC"))).toBe(true);
  });

  it("chunks validation blocks for pagination", () => {
    const snapshot = createDemoReportSnapshot();
    const blocks = buildValidationBlocks(snapshot);
    const chunks = chunkValidationBlocks(blocks);
    expect(chunks.length).toBe(1);
    expect(resolveValidationGridColumns(blocks.length)).toBe(2);
  });

  it("builds informed decision content from snapshot signals", () => {
    const snapshot = createDemoReportSnapshot();
    const decision = buildInformedDecisionAdvisory(snapshot);
    expect(decision.avoid.length).toBeGreaterThan(0);
    expect(decision.thisWeek.length).toBeGreaterThan(0);
    expect(decision.practicalDecision.length).toBeGreaterThan(20);
    expect(decision.practicalDecision).toMatch(/validación|matrícula|documentación/i);
    expect("veredicto" in decision).toBe(false);
  });

  it("builds validation priority message from pending themes", () => {
    const snapshot = createDemoReportSnapshot();
    const message = buildValidationPriorityMessage(snapshot);
    expect(message).toMatch(/Primero confirma|Después valida|contrato|calendario/i);
  });

  it("builds practical decision without school ranking", () => {
    const snapshot = createDemoReportSnapshot();
    const message = buildPracticalDecisionMessage(snapshot);
    expect(message).not.toMatch(/European Aviation Academy|SkyPath|más sólida/i);
    expect(message).toMatch(/contrato|matrícula|validación/i);
  });

  it("uses professional comparative reason phrasing", () => {
    const snapshot = createDemoReportSnapshot();
    const advisory = buildComparativeAdvisory(snapshot);
    expect(advisory.mostSolid?.reasons).toContain("mejor posición global para este perfil");
    expect(advisory.needsValidation?.reasons.some((r) => /documentación pendiente|costes sin verificar/i.test(r))).toBe(
      true,
    );
  });

  it("resolves grid columns and short items for schools", () => {
    expect(resolveValidationGridColumns(5)).toBe(2);
    expect(resolveValidationGridColumns(4)).toBe(2);
    expect(buildSchoolValidationShortItems({
      id: "x",
      nombre: "Test",
      ciudad: "",
      pais: "",
      programa: "integrado",
      precioAnunciado: 0,
      estadoVerificacion: "no_verificado",
      pendientes: ["Contrato", "Costes finales"],
    } as never).length).toBeGreaterThan(0);
  });
});
