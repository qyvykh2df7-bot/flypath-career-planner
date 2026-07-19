import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getPublicSupabaseSchoolCatalog: vi.fn() }));

vi.mock("@/lib/schools/public-school-catalog", () => ({
  getPublicSupabaseSchoolCatalog: mocks.getPublicSupabaseSchoolCatalog,
}));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/schools/catalog", () => {
  it("devuelve únicamente el catálogo público cerrado", async () => {
    mocks.getPublicSupabaseSchoolCatalog.mockResolvedValue([
      { id: "es-test", slug: "test", name: "Escuela de prueba" },
    ]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("s-maxage=300");
    await expect(response.json()).resolves.toEqual({
      schools: [{ id: "es-test", slug: "test", name: "Escuela de prueba" }],
    });
  });

  it("mantiene los fallos de servidor genéricos", async () => {
    mocks.getPublicSupabaseSchoolCatalog.mockRejectedValue(
      new Error("internal_notes could not be queried"),
    );

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "No hemos podido cargar el catálogo de escuelas.",
    });
  });
});
