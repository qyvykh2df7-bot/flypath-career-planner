import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("client-only", () => ({}));
vi.mock("./actions", () => ({ bootstrapFlyPathIdentityAfterOtp: vi.fn() }));

import {
  getLoginOtpRecoveryHref,
  initialLoginOtpVerifyFormState,
  isLoginOtpVerifySubmitting,
  loginOtpVerifyFormReducer,
} from "./LoginOtpVerifyForm";

describe("LoginOtpVerifyForm", () => {
  it("pide solicitar un nuevo código cuando no existe email pendiente", () => {
    expect(loginOtpVerifyFormReducer(initialLoginOtpVerifyFormState, { type: "email_missing" })).toEqual({
      status: "missing",
      message: "Solicita un nuevo código para continuar.",
    });
  });

  it("conserva el next seguro al volver a solicitar un código tras perder el email pendiente", () => {
    expect(getLoginOtpRecoveryHref("/account")).toBe("/login?next=%2Faccount");
  });

  it.each(["https://example.com", "//example.com", "/warhome", undefined])(
    "descarta next no seguro al volver a solicitar un código: %s",
    (nextPath) => {
      expect(getLoginOtpRecoveryHref(nextPath)).toBe("/login?next=%2F");
    },
  );

  it("habilita la verificación cuando recupera el email pendiente", () => {
    expect(loginOtpVerifyFormReducer(initialLoginOtpVerifyFormState, { type: "email_loaded" })).toEqual({
      status: "idle",
      message: null,
    });
  });

  it("pasa de loading a success tras una verificación correcta", () => {
    const loadingState = loginOtpVerifyFormReducer(initialLoginOtpVerifyFormState, {
      type: "verification_started",
    });

    expect(loginOtpVerifyFormReducer(loadingState, { type: "verification_succeeded" })).toEqual({
      status: "success",
      message: null,
    });
  });

  it("muestra un error genérico cuando la verificación falla", () => {
    const loadingState = loginOtpVerifyFormReducer(initialLoginOtpVerifyFormState, {
      type: "verification_started",
    });

    expect(
      loginOtpVerifyFormReducer(loadingState, {
        type: "verification_failed",
        message: "No hemos podido verificar el código. Inténtalo de nuevo.",
      }),
    ).toEqual({
      status: "error",
      message: "No hemos podido verificar el código. Inténtalo de nuevo.",
    });
    expect(isLoginOtpVerifySubmitting(loadingState)).toBe(true);
  });

  it("redirige solo después de limpiar el email temporal y sanear next", () => {
    const source = readFileSync(
      resolve(process.cwd(), "app/login/verify/LoginOtpVerifyForm.tsx"),
      "utf8",
    );

    expect(source).toContain("clearPendingFlyPathOtpEmail()");
    expect(source).toContain("router.replace(getSafeFlyPathLoginNext(nextPath))");
  });
});
