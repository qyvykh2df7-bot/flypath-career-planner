import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "components/schools/ComparisonResults.tsx"), "utf8");

describe("ComparisonResults public data presentation", () => {
  it("does not render the internal data-confidence summary", () => {
    expect(source).not.toContain("Confianza del dato");
    expect(source).not.toContain("Datos pendientes:");
    expect(source).not.toContain("confidenceLabel,");
  });

  it("keeps the concrete public confirmation markers in the comparison", () => {
    expect(source).toContain("Por confirmar");
    expect(source).toContain("Confirmar con la escuela");
  });
});
