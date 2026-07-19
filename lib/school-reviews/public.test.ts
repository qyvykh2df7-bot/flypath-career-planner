import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "lib/school-reviews/public.ts"), "utf8");
const publicRoute = readFileSync(resolve(process.cwd(), "app/api/school-reviews/public/route.ts"), "utf8");
const batchRoute = readFileSync(resolve(process.cwd(), "app/api/school-reviews/summaries/route.ts"), "utf8");

describe("public school review reading contract", () => {
  it("uses approved reviews only and exposes a closed public select", () => {
    expect(source).toContain('eq("status", "approved")');
    expect(source).toContain("PUBLIC_REVIEW_SELECT");
    const select = source.match(/const PUBLIC_REVIEW_SELECT\s*=\s*\n\s*"([^"]+)"/)?.[1] ?? "";
    expect(select).not.toMatch(/author_email|author_email_hash|moderation_note|user_id/);
  });

  it("uses a batch endpoint for the comparator rather than one request per school", () => {
    expect(source).toContain("MAX_PUBLIC_SCHOOL_SUMMARIES");
    expect(source).toContain('.in("school_id", ids)');
    expect(batchRoute).toContain("getPublicSchoolReviewSummaries");
    expect(publicRoute).toContain("getPublicSchoolReviewPage");
  });

  it("keeps the interactive page free of demo review data", () => {
    const page = readFileSync(resolve(process.cwd(), "components/opiniones/OpinionesInteractiveContent.tsx"), "utf8");
    expect(page).toContain("PublicSchoolReviews");
    expect(page).not.toContain("DEMO_REVIEWS");
    expect(page).not.toContain("Vista previa de diseño");
  });
});
