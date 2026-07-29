import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { areInternalRoutesAvailable, internalRouteRobots } from "./internal-routes";

describe("internal route policy", () => {
  it("allows tooling only during local development and tests", () => {
    expect(areInternalRoutesAvailable({ NODE_ENV: "development" })).toBe(true);
    expect(areInternalRoutesAvailable({ NODE_ENV: "test" })).toBe(true);
    expect(areInternalRoutesAvailable({ NODE_ENV: "production", VERCEL_ENV: "preview" })).toBe(false);
    expect(areInternalRoutesAvailable({ NODE_ENV: "production" })).toBe(false);
  });

  it("uses noindex as a defense-in-depth metadata policy", () => {
    expect(internalRouteRobots).toEqual({ index: false, follow: false });
  });
});
