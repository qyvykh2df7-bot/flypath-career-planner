import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getPrePplPurchaseConfirmationTemplate,
  PREPPL_PURCHASE_CONFIRMATION_TEMPLATE_KEY,
} from "./preppl-purchase-confirmation";

describe("Pre-PPL purchase confirmation template", () => {
  it("uses a safe canonical recovery link and never embeds a delivery token", () => {
    const template = getPrePplPurchaseConfirmationTemplate();
    expect(template.key).toBe(PREPPL_PURCHASE_CONFIRMATION_TEMPLATE_KEY);
    expect(template.recipient).toEqual({ kind: "order" });
    expect(template.html).toContain("https://www.flypath.es/pre-ppl/checkout/success");
    expect(template.text).toContain("https://www.flypath.es/pre-ppl/checkout/success");
    expect(template.html).not.toMatch(/token=|flypath_preppl_guide_delivery/i);
  });
});
