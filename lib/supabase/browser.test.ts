import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createBrowserClient: vi.fn(),
}));

vi.mock("client-only", () => ({}));
vi.mock("@supabase/ssr", () => ({ createBrowserClient: mocks.createBrowserClient }));

import { createSupabaseBrowserClient } from "./browser";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  mocks.createBrowserClient.mockReturnValue({ auth: {} });
});

describe("Supabase browser client", () => {
  it("reutiliza una única instancia de cliente en el navegador", () => {
    const firstClient = createSupabaseBrowserClient();
    const secondClient = createSupabaseBrowserClient();

    expect(secondClient).toBe(firstClient);
    expect(mocks.createBrowserClient).toHaveBeenCalledOnce();
    expect(mocks.createBrowserClient).toHaveBeenCalledWith(
      "https://project.supabase.co",
      "test-anon-key",
    );
  });
});
