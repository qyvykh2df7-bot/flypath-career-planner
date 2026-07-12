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

  it("persiste los inicios y aperturas de formularios una sola vez por sesión", async () => {
    const localStorage = createStorage();
    const sessionStorage = createStorage();
    localStorage.setItem("flypath_analytics_consent", "granted");
    vi.stubGlobal("window", {
      localStorage,
      sessionStorage,
      location: {
        href: "https://flypath.test/career-planner",
        origin: "https://flypath.test",
        pathname: "/career-planner",
      },
    });
    vi.stubGlobal("document", { referrer: "" });
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.resetModules();

    const { trackEventOncePerSession } = await import("./client");
    trackEventOncePerSession("form_started", { form_id: "career_planner_report" });
    trackEventOncePerSession("form_started", { form_id: "career_planner_report" });
    trackEventOncePerSession("popup_opened", { popup_id: "preppl_waitlist" });
    trackEventOncePerSession("popup_opened", { popup_id: "preppl_waitlist" });
    trackEventOncePerSession("form_started", { form_id: "preppl_waitlist" });
    trackEventOncePerSession("form_started", { form_id: "preppl_waitlist" });
    trackEventOncePerSession("popup_opened", { popup_id: "mentorship_support" });
    trackEventOncePerSession("popup_opened", { popup_id: "mentorship_support" });
    trackEventOncePerSession("form_started", { form_id: "mentorship_support" });
    trackEventOncePerSession("form_started", { form_id: "mentorship_support" });

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(5));

    const payloads = fetchMock.mock.calls.map(([, options]) =>
      JSON.parse((options as RequestInit).body as string),
    );
    expect(payloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event_name: "form_started",
          metadata: { form_id: "career_planner_report" },
        }),
        expect.objectContaining({
          event_name: "popup_opened",
          metadata: { popup_id: "preppl_waitlist" },
        }),
        expect.objectContaining({
          event_name: "form_started",
          metadata: { form_id: "preppl_waitlist" },
        }),
        expect.objectContaining({
          event_name: "popup_opened",
          metadata: { popup_id: "mentorship_support" },
        }),
        expect.objectContaining({
          event_name: "form_started",
          metadata: { form_id: "mentorship_support" },
        }),
      ]),
    );
  });
});

describe("trackCtaClicked", () => {
  it("envía una vez por clic real, con una clave nueva y sin bloquear ante un fallo", async () => {
    const localStorage = createStorage();
    const sessionStorage = createStorage();
    localStorage.setItem("flypath_analytics_consent", "granted");
    vi.stubGlobal("window", {
      localStorage,
      sessionStorage,
      location: {
        href: "https://flypath.test/schools",
        origin: "https://flypath.test",
        pathname: "/schools",
      },
    });
    vi.stubGlobal("document", { referrer: "" });
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.resetModules();

    const { createTrackingCtaMetadata, trackCtaClicked } = await import("./client");
    const metadata = createTrackingCtaMetadata("schools_comparator_open_career_planner", {
      school_count: 2,
    });
    expect(metadata).not.toBeNull();

    expect(() => trackCtaClicked(metadata!)).not.toThrow();
    expect(() => trackCtaClicked(metadata!)).not.toThrow();

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const payloads = fetchMock.mock.calls.map(([, options]) =>
      JSON.parse((options as RequestInit).body as string),
    );
    expect(payloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event_name: "cta_clicked",
          event_category: "engagement",
          metadata: {
            cta_id: "schools_comparator_open_career_planner",
            target: "career_planner",
            source_context: "schools_comparator",
            school_count: 2,
          },
        }),
      ]),
    );
    expect(payloads[0].idempotency_key).not.toBe(payloads[1].idempotency_key);
  });
});
