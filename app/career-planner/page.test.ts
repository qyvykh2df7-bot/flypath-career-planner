import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "app/career-planner/page.tsx"), "utf8");

describe("Career Planner fit presentation", () => {
  it("does not present profile fit as school-review stars", () => {
    expect(source).toContain("DashFitIndicator");
    expect(source).not.toContain("DashFitStars");
    expect(source).not.toContain("fill={i < filled ?");
  });
});
