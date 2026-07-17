import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("client-only", () => ({}));

import {
  clearPendingFlyPathOtpEmail,
  getPendingFlyPathOtpEmail,
  savePendingFlyPathOtpEmail,
} from "./pending-otp";

function createStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

afterEach(() => {
  clearPendingFlyPathOtpEmail();
  vi.unstubAllGlobals();
});

describe("pending FlyPath OTP email", () => {
  it("recupera el email normalizado durante una recarga de la misma pestaña", () => {
    vi.stubGlobal("window", { sessionStorage: createStorage() });

    savePendingFlyPathOtpEmail(" PILOT@EXAMPLE.COM ");

    expect(getPendingFlyPathOtpEmail()).toBe("pilot@example.com");
  });

  it("no inventa un email cuando se entra directamente sin estado previo", () => {
    vi.stubGlobal("window", { sessionStorage: createStorage() });

    expect(getPendingFlyPathOtpEmail()).toBeNull();
  });

  it("mantiene la navegación actual cuando sessionStorage está restringido", () => {
    vi.stubGlobal("window", {
      get sessionStorage() {
        throw new Error("Storage unavailable");
      },
    });

    savePendingFlyPathOtpEmail("pilot@example.com");

    expect(getPendingFlyPathOtpEmail()).toBe("pilot@example.com");
  });
});
