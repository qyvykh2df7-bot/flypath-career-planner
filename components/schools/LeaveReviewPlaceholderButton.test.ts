import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "components/schools/LeaveReviewPlaceholderButton.tsx"), "utf8");

describe("school detail review CTA", () => {
  it("navigates to the review form and only passes a slug for server resolution", () => {
    expect(source).toContain("/opiniones-escuelas?school=");
    expect(source).toContain("schoolSlug?: string");
    expect(source).not.toContain("getSupabaseAdmin");
  });
});
