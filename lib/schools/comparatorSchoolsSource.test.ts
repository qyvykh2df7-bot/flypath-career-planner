import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getComparableSchoolsSync,
  loadComparableSchoolsForComparator,
} from "./comparatorSchoolsSource";

const originalFlag = process.env.NEXT_PUBLIC_USE_SUPABASE_SCHOOLS;
const originalFetch = global.fetch;

afterEach(() => {
  process.env.NEXT_PUBLIC_USE_SUPABASE_SCHOOLS = originalFlag;
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("comparator school source", () => {
  it("usa el DTO público remoto y conserva el contrato esperado por el comparador", async () => {
    process.env.NEXT_PUBLIC_USE_SUPABASE_SCHOOLS = "true";
    const remote = getComparableSchoolsSync()[0]!;
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ schools: [remote] }), { status: 200 }),
    );

    await expect(loadComparableSchoolsForComparator()).resolves.toEqual([remote]);
    expect(global.fetch).toHaveBeenCalledWith("/api/schools/catalog", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  });

  it("vuelve al dataset local si el catálogo remoto falla o contiene campos no permitidos", async () => {
    process.env.NEXT_PUBLIC_USE_SUPABASE_SCHOOLS = "true";
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ schools: [{ id: "x", slug: "x", name: "X", routeType: "integrated", dataStatus: "verified", editorial_metadata: "private" }] }),
        { status: 200 },
      ),
    );

    await expect(loadComparableSchoolsForComparator()).resolves.toEqual(getComparableSchoolsSync());
    warning.mockRestore();
  });

  it("conserva el fallback local cuando la fuente remota no está activada", async () => {
    process.env.NEXT_PUBLIC_USE_SUPABASE_SCHOOLS = "false";
    global.fetch = vi.fn();

    await expect(loadComparableSchoolsForComparator()).resolves.toEqual(getComparableSchoolsSync());
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
