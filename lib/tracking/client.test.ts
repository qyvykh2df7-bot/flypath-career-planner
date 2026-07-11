import { afterEach, describe, expect, it, vi } from "vitest";

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
    key: () => null,
    get length() {
      return values.size;
    },
  } as Storage;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("trackEventOncePerSession", () => {
  it("permite reintentar form_started tras un fallo y marca solo tras aceptación", async () => {
    const localStorage = createStorage();
    const sessionStorage = createStorage();
    localStorage.setItem("flypath_analytics_consent", "granted");
    vi.stubGlobal("window", {
      localStorage,
      sessionStorage,
      location: {
        href: "https://flypath.test/",
        origin: "https://flypath.test",
        pathname: "/",
      },
    });
    vi.stubGlobal("document", { referrer: "" });
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.resetModules();

    const { trackEventOncePerSession } = await import("./client");
    trackEventOncePerSession("form_started", { form_id: "home_newsletter" });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => {
      expect(sessionStorage.length).toBe(2);
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    trackEventOncePerSession("form_started", { form_id: "home_newsletter" });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => {
      expect(sessionStorage.length).toBe(3);
    });

    trackEventOncePerSession("form_started", { form_id: "home_newsletter" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
