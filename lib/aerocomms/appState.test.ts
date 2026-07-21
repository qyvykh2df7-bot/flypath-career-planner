import { describe, expect, it, vi } from "vitest";

vi.mock("client-only", () => ({}));

import { hydrateStoredAeroCommsState } from "./appState";

describe("AeroComms local state hydration", () => {
  it("discards the retired local subscription flag instead of accepting a browser Pro override", () => {
    const state = hydrateStoredAeroCommsState({
      onboarded: true,
      name: "Pilot",
      subscription: "pro",
    });

    expect(state).not.toBeNull();
    expect(state).not.toHaveProperty("subscription");
    expect(state?.onboarded).toBe(true);
  });

  it("rejects non-object browser values safely", () => {
    expect(hydrateStoredAeroCommsState(null)).toBeNull();
    expect(hydrateStoredAeroCommsState([])).toBeNull();
    expect(hydrateStoredAeroCommsState("not state")).toBeNull();
  });
});
