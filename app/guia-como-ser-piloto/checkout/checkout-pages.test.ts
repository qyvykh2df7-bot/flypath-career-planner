import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const success = readFileSync(resolve(process.cwd(), "app/guia-como-ser-piloto/checkout/success/page.tsx"), "utf8");
const cancel = readFileSync(resolve(process.cwd(), "app/guia-como-ser-piloto/checkout/cancel/page.tsx"), "utf8");
const modal = readFileSync(resolve(process.cwd(), "components/guia/GuideCheckoutConfirmationModal.tsx"), "utf8");
const button = readFileSync(resolve(process.cwd(), "components/guia/GuideDigitalCheckoutButton.tsx"), "utf8");

describe("Cómo ser Piloto guide Checkout return pages", () => {
  it("verifies the guide server-side before offering a manual protected download", () => {
    expect(success).toContain("GuideCheckoutConfirmationModal");
    expect(modal).toContain("Estamos verificando tu pago");
    expect(modal).toContain("/api/commerce/guide/status");
    expect(modal).toContain("Descargar guía");
    expect(modal).not.toMatch(/payment.*succeed|entitlement/i);
  });

  it("keeps cancellation informational and makes the browser send only the closed guide key", () => {
    expect(cancel).toContain("No se realizó el pago");
    expect(cancel).not.toMatch(/fetch\(|payment|entitlement|grant/i);
    expect(button).toContain("productKey: COMO_SER_PILOTO_GUIDE_CHECKOUT_KEY");
    expect(button).not.toMatch(/amount|currency|priceId|userId/);
  });
});
