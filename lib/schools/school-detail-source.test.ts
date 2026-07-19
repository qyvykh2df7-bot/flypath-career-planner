import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPublicSupabaseSchoolBySlug: vi.fn(),
  isSupabaseSchoolsEnabled: vi.fn(),
  getComparableSchoolBySlug: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/schools/public-school-catalog", () => ({
  getPublicSupabaseSchoolBySlug: mocks.getPublicSupabaseSchoolBySlug,
}));
vi.mock("@/lib/schools/schoolCatalogConfig", () => ({
  isSupabaseSchoolsEnabled: mocks.isSupabaseSchoolsEnabled,
}));
vi.mock("@/lib/schools/schoolUtils", () => ({
  getComparableSchoolBySlug: mocks.getComparableSchoolBySlug,
}));

import { loadComparableSchoolBySlug } from "./school-detail-source";

const LOCAL = { id: "es-local", slug: "local", name: "Local" };
const REMOTE = { id: "es-remote", slug: "local", name: "Remota" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getComparableSchoolBySlug.mockReturnValue(LOCAL);
});

describe("public school detail source", () => {
  it("conserva la ficha local si la fuente segura remota no está activa", async () => {
    mocks.isSupabaseSchoolsEnabled.mockReturnValue(false);

    await expect(loadComparableSchoolBySlug("local")).resolves.toEqual(LOCAL);
    expect(mocks.getPublicSupabaseSchoolBySlug).not.toHaveBeenCalled();
  });

  it("usa la entrada pública server-only cuando la fuente remota está activa", async () => {
    mocks.isSupabaseSchoolsEnabled.mockReturnValue(true);
    mocks.getPublicSupabaseSchoolBySlug.mockResolvedValue(REMOTE);

    await expect(loadComparableSchoolBySlug("local")).resolves.toEqual(REMOTE);
  });

  it("mantiene la ficha local cuando la lectura remota falla", async () => {
    mocks.isSupabaseSchoolsEnabled.mockReturnValue(true);
    mocks.getPublicSupabaseSchoolBySlug.mockRejectedValue(new Error("private source failure"));

    await expect(loadComparableSchoolBySlug("local")).resolves.toEqual(LOCAL);
  });
});
