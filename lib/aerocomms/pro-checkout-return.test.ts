import { describe, expect, it } from "vitest";

import {
  AEROCOMMS_PRO_CHECKOUT_RETURN_PATH,
  getAeroCommsProCheckoutReturnState,
} from "./pro-checkout-return";

describe("AeroComms Pro Checkout return state", () => {
  it("keeps an unrelated route parameter inactive", () => {
    expect(getAeroCommsProCheckoutReturnState(null, false)).toBe("inactive");
    expect(getAeroCommsProCheckoutReturnState("cancelled", true)).toBe("inactive");
  });

  it("keeps the purchase in verification until the server entitlement is active", () => {
    expect(getAeroCommsProCheckoutReturnState("processing", false)).toBe("verifying");
    expect(getAeroCommsProCheckoutReturnState("processing", true)).toBe("confirmed");
  });

  it("returns to the AeroComms dashboard rather than the commercial paywall", () => {
    expect(AEROCOMMS_PRO_CHECKOUT_RETURN_PATH).toBe("/aerocomms/app/today");
  });
});
