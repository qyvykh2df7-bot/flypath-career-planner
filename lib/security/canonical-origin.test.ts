import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { CanonicalOriginError, getCanonicalOrigin, toCanonicalUrl } from "./canonical-origin";

describe("canonical origin", () => {
  it("uses a normalized explicit HTTPS origin outside local development", () => {
    expect(getCanonicalOrigin({ NODE_ENV: "production", FLYPATH_CANONICAL_ORIGIN: "https://flypath.example/" }))
      .toBe("https://flypath.example");
    expect(toCanonicalUrl("/confirm?token=opaque", { NODE_ENV: "production", FLYPATH_CANONICAL_ORIGIN: "https://flypath.example" }))
      .toBe("https://flypath.example/confirm?token=opaque");
  });

  it("fails closed for missing, HTTP and host-shaped production configuration", () => {
    expect(() => getCanonicalOrigin({ NODE_ENV: "production" })).toThrow(CanonicalOriginError);
    expect(() => getCanonicalOrigin({ NODE_ENV: "production", FLYPATH_CANONICAL_ORIGIN: "http://flypath.example" })).toThrow(CanonicalOriginError);
    expect(() => getCanonicalOrigin({ NODE_ENV: "production", FLYPATH_CANONICAL_ORIGIN: "https://flypath.example/path" })).toThrow(CanonicalOriginError);
  });

  it("allows localhost only in development and never derives an origin from a request host", () => {
    expect(getCanonicalOrigin({ NODE_ENV: "development" })).toBe("http://localhost:3000");
    expect(getCanonicalOrigin({ NODE_ENV: "development", FLYPATH_CANONICAL_ORIGIN: "http://localhost:4100" }))
      .toBe("http://localhost:4100");
    expect(() => getCanonicalOrigin({ NODE_ENV: "development", FLYPATH_CANONICAL_ORIGIN: "http://attacker.example" })).toThrow(CanonicalOriginError);
  });
});
