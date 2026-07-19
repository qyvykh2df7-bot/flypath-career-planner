import { describe, expect, it } from "vitest";

import { plannerSchoolReviewsHref } from "./planner-school-database";

describe("planner school review navigation", () => {
  it("uses the public review page school parameter", () => {
    expect(plannerSchoolReviewsHref("adventia-usal")).toBe("/opiniones-escuelas?school=adventia-usal");
    expect(plannerSchoolReviewsHref(null)).toBe("/opiniones-escuelas");
  });
});
