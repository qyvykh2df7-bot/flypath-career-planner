import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getUser: vi.fn(),
  reset: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.createServerClient }));
vi.mock("@/lib/aerocomms/persistence-server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/aerocomms/persistence-server")>();
  return { ...actual, resetAeroCommsProgress: mocks.reset };
});

import { POST } from "./route";

const operationId = "6d9e4c3d-a148-44c6-a1d8-4d54f7c81c99";
const accountId = "4d9e4c3d-a148-44c6-a1d8-4d54f7c81c99";

describe("POST /api/aerocomms/progress/reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createServerClient.mockResolvedValue({ auth: { getUser: mocks.getUser } });
    mocks.getUser.mockResolvedValue({ data: { user: { id: accountId } }, error: null });
    mocks.reset.mockResolvedValue({ schemaVersion: 1 });
  });

  it("uses the server-authenticated account and accepts only an operation ID", async () => {
    const response = await POST(new Request("https://flypath.test/api/aerocomms/progress/reset", {
      method: "POST",
      headers: { origin: "https://flypath.test" },
      body: JSON.stringify({ operationId }),
    }));

    expect(response.status).toBe(200);
    expect(mocks.reset).toHaveBeenCalledWith(accountId, operationId);
  });

  it("rejects client account fields before the persistence boundary", async () => {
    const response = await POST(new Request("https://flypath.test/api/aerocomms/progress/reset", {
      method: "POST",
      headers: { origin: "https://flypath.test" },
      body: JSON.stringify({ operationId, userId: "attacker" }),
    }));

    expect(response.status).toBe(400);
    expect(mocks.reset).not.toHaveBeenCalled();
  });

  it("rejects cross-origin requests before reading the body", async () => {
    const response = await POST(new Request("https://flypath.test/api/aerocomms/progress/reset", {
      method: "POST",
      headers: { origin: "https://other.test" },
      body: JSON.stringify({ operationId }),
    }));

    expect(response.status).toBe(403);
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });
});
