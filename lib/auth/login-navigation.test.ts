import { describe, expect, it } from "vitest";

import {
  createFlyPathLoginVerifyHref,
  DEFAULT_FLYPATH_LOGIN_DESTINATION,
  getSafeFlyPathLoginNext,
} from "./login-navigation";

describe("FlyPath login navigation", () => {
  it("conserva destinos internos permitidos y descarta query strings", () => {
    expect(getSafeFlyPathLoginNext("/aerocomms?campaign=summer")).toBe("/aerocomms");
    expect(getSafeFlyPathLoginNext("/schools")).toBe("/schools");
  });

  it.each([
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "/%2F%2Fexample.com",
    "javascript:alert(1)",
    "/warhome",
    "/schools/unknown",
    undefined,
    ["/schools"],
  ])("rechaza next no seguro: %s", (value) => {
    expect(getSafeFlyPathLoginNext(value)).toBe(DEFAULT_FLYPATH_LOGIN_DESTINATION);
  });

  it("construye una navegación de verificación con next saneado", () => {
    expect(createFlyPathLoginVerifyHref("/career-planner")).toBe(
      "/login/verify?next=%2Fcareer-planner",
    );
    expect(createFlyPathLoginVerifyHref("https://example.com")).toBe("/login/verify?next=%2F");
  });
});
