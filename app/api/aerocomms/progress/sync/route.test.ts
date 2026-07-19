import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  createServerClient: vi.fn(),
  persist: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.createServerClient }));
vi.mock("@/lib/aerocomms/persistence-server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/aerocomms/persistence-server")>();
  return { ...actual, persistAeroCommsProgress: mocks.persist };
});

import { POST } from "./route";

const validBody = {
  operationId: "6d9e4c3d-a148-44c6-a1d8-4d54f7c81c99",
  schemaVersion: 1,
  contentVersion: "2026.07",
  completedExerciseIds: [],
  missions: [],
  skillStats: [],
  sessions: [],
  summary: { accuracy: null, scoreSum: 0, sessionCount: 0, scoredSessionCount: 0, legacyStreakDays: 0, legacyLastActivityDate: null },
};

describe("POST /api/aerocomms/progress/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createServerClient.mockResolvedValue({ auth: { getUser: mocks.getUser } });
    mocks.getUser.mockResolvedValue({ data: { user: { id: "6d9e4c3d-a148-44c6-a1d8-4d54f7c81c99" } }, error: null });
    mocks.persist.mockResolvedValue({ schemaVersion: 1 });
  });

  it("uses only the server-authenticated user at the persistence boundary", async () => {
    const response = await POST(new Request("https://flypath.test/api/aerocomms/progress/sync", {
      method: "POST",
      headers: { origin: "https://flypath.test" },
      body: JSON.stringify(validBody),
    }));

    expect(response.status).toBe(200);
    expect(mocks.persist).toHaveBeenCalledWith("6d9e4c3d-a148-44c6-a1d8-4d54f7c81c99", validBody);
  });

  it("rejects missing sessions before calling the persistence boundary", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const response = await POST(new Request("https://flypath.test/api/aerocomms/progress/sync", {
      method: "POST",
      headers: { origin: "https://flypath.test" },
      body: JSON.stringify(validBody),
    }));

    expect(response.status).toBe(401);
    expect(mocks.persist).not.toHaveBeenCalled();
  });

  it("applies the body limit before parsing oversized JSON", async () => {
    const response = await POST(new Request("https://flypath.test/api/aerocomms/progress/sync", {
      method: "POST",
      headers: { "content-length": "999999", origin: "https://flypath.test" },
      body: "{}",
    }));

    expect(response.status).toBe(413);
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });

  it("rejects cross-origin writes before reading the request body", async () => {
    const response = await POST(new Request("https://flypath.test/api/aerocomms/progress/sync", {
      method: "POST",
      headers: { origin: "https://other.test" },
      body: JSON.stringify(validBody),
    }));

    expect(response.status).toBe(403);
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });
});
