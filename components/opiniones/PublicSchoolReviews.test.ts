import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  getVerifiedReviewCountLabel,
  shouldShowWouldChooseAgain,
} from "./PublicSchoolReviews";

const source = readFileSync(resolve(process.cwd(), "components/opiniones/PublicSchoolReviews.tsx"), "utf8");

describe("PublicSchoolReviews presentation", () => {
  it("uses verified-review copy with correct singular and plural forms", () => {
    expect(getVerifiedReviewCountLabel(1)).toBe("1 opinión verificada");
    expect(getVerifiedReviewCountLabel(4)).toBe("4 opiniones verificadas");
  });

  it("only shows the would-choose-again percentage from three verified reviews", () => {
    expect(shouldShowWouldChooseAgain(1, 100)).toBe(false);
    expect(shouldShowWouldChooseAgain(2, 50)).toBe(false);
    expect(shouldShowWouldChooseAgain(3, 67)).toBe(true);
    expect(shouldShowWouldChooseAgain(4, null)).toBe(false);
  });

  it("does not render the general score distribution and keeps responsive review sections separated", () => {
    expect(source).not.toContain("Distribución general");
    expect(source).not.toContain("Object.entries(data.aggregates.distribution)");
    expect(source).toContain("sm:divide-x sm:divide-y-0");
  });
});
