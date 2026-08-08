import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/leads/preppl-waitlist/route";

describe("Pre-PPL legacy waitlist route", () => {
  it("is closed and never captures new leads after the product launch", async () => {
    const response = await POST();
    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toEqual({
      error: "La lista de espera de Pre-PPL ya no está disponible.",
    });
  });
});
