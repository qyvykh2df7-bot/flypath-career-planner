import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONTENT_OS_BRAND_PROFILE,
  parseContentOsBrandProfileForm,
} from "./content-os-brand-contract";

function validForm(): FormData {
  const data = new FormData();
  data.set("brandName", DEFAULT_CONTENT_OS_BRAND_PROFILE.brandName);
  data.set(
    "brandDescription",
    DEFAULT_CONTENT_OS_BRAND_PROFILE.brandDescription,
  );
  data.set("audiences", DEFAULT_CONTENT_OS_BRAND_PROFILE.audiences.join("\n"));
  data.set(
    "contentPillars",
    DEFAULT_CONTENT_OS_BRAND_PROFILE.contentPillars.join("\n"),
  );
  for (const objective of DEFAULT_CONTENT_OS_BRAND_PROFILE.objectives) {
    data.append("objectives", objective);
  }
  for (const [product, description] of Object.entries(
    DEFAULT_CONTENT_OS_BRAND_PROFILE.products,
  )) {
    data.set(`product_${product}`, description);
  }
  data.set("toneStyle", DEFAULT_CONTENT_OS_BRAND_PROFILE.toneStyle);
  data.set(
    "tonePersonality",
    DEFAULT_CONTENT_OS_BRAND_PROFILE.tonePersonality,
  );
  data.set(
    "toneCommunication",
    DEFAULT_CONTENT_OS_BRAND_PROFILE.toneCommunication,
  );
  data.set("toneAvoid", DEFAULT_CONTENT_OS_BRAND_PROFILE.toneAvoid);
  return data;
}

describe("Content OS Brand DNA contract", () => {
  it("acepta una configuración completa y elimina duplicados de listas", () => {
    const form = validForm();
    form.set("audiences", "Futuros pilotos\nFuturos pilotos\nPilotos jóvenes");
    const result = parseContentOsBrandProfileForm(form);
    expect(result?.audiences).toEqual(["Futuros pilotos", "Pilotos jóvenes"]);
    expect(result?.products.aerocomms).toContain("fraseología");
    expect(result?.objectives).toContain("conversion");
  });

  it("rechaza una identidad incompleta", () => {
    const form = validForm();
    form.delete("objectives");
    expect(parseContentOsBrandProfileForm(form)).toBeNull();
  });
});
