import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getSupabaseSchoolEntries: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/schoolMapper", () => ({ getSupabaseSchoolEntries: mocks.getSupabaseSchoolEntries }));

import {
  getPublicSupabaseSchoolCatalog,
  toPublicSchoolEntry,
} from "./public-school-catalog";

const PUBLIC_ENTRY = {
  id: "es-test",
  slug: "test-school",
  name: "Escuela de prueba",
  routeType: "integrated" as const,
  country: "España",
  city: "Madrid",
  baseAirport: "LEMD",
  atoName: "Escuela de prueba",
  shortDescription: "Descripción pública",
  dataStatus: "verified" as const,
  lastUpdatedAt: "2026-07-19",
  dataConfidence: "high" as const,
  advertisedPriceEUR: 10,
  flypathEstimatedRealCostEUR: 20,
  depositOrEnrollmentFeeEUR: 0,
  paymentScheduleSummary: "",
  refundPolicySummary: "",
  contractAvailableBeforePayment: "unknown" as const,
  financingAvailable: "unknown" as const,
  mccJocIncluded: "unknown" as const,
  advancedUprtIncluded: "unknown" as const,
  examFeesIncluded: "unknown" as const,
  skillTestsIncluded: "unknown" as const,
  trainingMaterialsIncluded: "unknown" as const,
  accommodationIncluded: "unknown" as const,
  fleetSummary: "",
  aircraftAvailability: "unknown" as const,
  languageOfInstruction: "",
  programDurationMonths: 0,
  class1Requirement: "",
  jobSupportSummary: "",
  employmentClaimsType: "unknown" as const,
  scores: {
    documentTransparency: 0,
    costClarity: 0,
    financialRisk: 0,
    commercialRisk: 0,
    operationalSolidity: 0,
    dataConfidenceScore: 0,
  },
  redFlags: [],
  pendingData: [],
  keyQuestions: [],
};

describe("public school catalogue boundary", () => {
  it("elimina la decisión editorial de exclusión antes de serializar una escuela", () => {
    const entry = toPublicSchoolEntry({
      ...PUBLIC_ENTRY,
      excludedFromPublicComparator: false,
    });

    expect(entry).toMatchObject({ id: "es-test", name: "Escuela de prueba" });
    expect(entry).not.toHaveProperty("excludedFromPublicComparator");
    expect(entry).not.toHaveProperty("comparatorExclusionNote");
    expect(entry).not.toHaveProperty("internal_notes");
    expect(entry).not.toHaveProperty("school_entry_snapshot");
  });

  it("filtra las entradas excluidas antes de devolver el catálogo público", async () => {
    mocks.getSupabaseSchoolEntries.mockResolvedValue([
      { ...PUBLIC_ENTRY, excludedFromPublicComparator: false },
      { ...PUBLIC_ENTRY, id: "es-internal", slug: "internal", excludedFromPublicComparator: true },
    ]);

    await expect(getPublicSupabaseSchoolCatalog()).resolves.toEqual([PUBLIC_ENTRY]);
  });

  it("mantiene las consultas editoriales fuera de los módulos de navegador", () => {
    const root = process.cwd();
    const clientSource = readFileSync(
      path.join(root, "lib/schools/comparatorSchoolsSource.ts"),
      "utf8",
    );
    const querySource = readFileSync(path.join(root, "lib/schoolQueries.ts"), "utf8");

    expect(clientSource).not.toMatch(/schoolMapper|schoolQueries|public-school-catalog/);
    expect(querySource).toContain('import "server-only"');
    expect(querySource).toContain('getSupabaseAdmin');
  });

  it("mantiene el fallback local sin notas internas de exclusión", () => {
    const source = readFileSync(
      path.join(process.cwd(), "lib/schools/schoolsSpain.ts"),
      "utf8",
    );

    expect(source).not.toContain("comparatorExclusionNote");
  });
});
