import { describe, expect, it, vi } from "vitest";
import type { SchoolEntry } from "@/types/schools";

vi.mock("server-only", () => ({}));

import { createSchoolDetailMetadata } from "./school-detail-metadata";

const SCHOOL = {
  slug: "european-flyers",
  name: "European Flyers",
  shortDescription: "Formación de piloto en España.",
} as SchoolEntry;

describe("school detail metadata", () => {
  it("uses public school data for the canonical, title and social URL", () => {
    const metadata = createSchoolDetailMetadata(SCHOOL);

    expect(metadata.title).toBe("European Flyers | Escuela de vuelo | FlyPath");
    expect(metadata.description).toBe("Formación de piloto en España.");
    expect(metadata.alternates?.canonical).toBe(
      "http://localhost:3000/schools/european-flyers",
    );
    expect(metadata.openGraph).toMatchObject({
      url: "http://localhost:3000/schools/european-flyers",
      siteName: "FlyPath",
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("marks unknown slugs as non-indexable", () => {
    expect(createSchoolDetailMetadata(undefined)).toEqual({
      robots: { index: false, follow: false },
      alternates: { canonical: null },
      openGraph: null,
      twitter: null,
    });
  });
});
