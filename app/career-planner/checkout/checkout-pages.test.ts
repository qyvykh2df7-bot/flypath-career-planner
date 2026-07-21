import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const success = readFileSync(resolve(process.cwd(), "app/career-planner/checkout/success/page.tsx"), "utf8");
const cancel = readFileSync(resolve(process.cwd(), "app/career-planner/checkout/cancel/page.tsx"), "utf8");
const confirmationModal = readFileSync(resolve(process.cwd(), "components/career-planner/CareerPlannerCheckoutConfirmationModal.tsx"), "utf8");

describe("Career Planner Checkout return pages", () => {
  it("does not treat a success redirect as payment confirmation, delivery or access", () => {
    expect(success).toContain("CareerPlannerCheckoutConfirmationModal");
    expect(confirmationModal).toContain("Estamos verificando tu pago");
    expect(confirmationModal).toContain("/api/commerce/checkout/status");
    expect(success).not.toMatch(/entitlement|payment.*succeed/i);
  });

  it("keeps cancellation informational and free of payment or grant writes", () => {
    expect(cancel).toContain("No se realizó el pago");
    expect(cancel).not.toMatch(/fetch\(|payment|entitlement|grant/i);
  });
});
