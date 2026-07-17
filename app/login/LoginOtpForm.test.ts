import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("client-only", () => ({}));

import {
  initialLoginOtpFormState,
  isLoginOtpFormSubmitting,
  loginOtpFormReducer,
} from "./LoginOtpForm";

describe("LoginOtpForm", () => {
  it("pasa de idle a loading al solicitar el código", () => {
    expect(loginOtpFormReducer(initialLoginOtpFormState, { type: "request_started" })).toEqual({
      status: "loading",
      message: null,
    });
  });

  it("pasa de loading a error cuando el envío no se puede completar", () => {
    const loadingState = loginOtpFormReducer(initialLoginOtpFormState, {
      type: "request_started",
    });

    expect(
      loginOtpFormReducer(loadingState, {
        type: "request_failed",
        message: "No hemos podido enviar el código. Inténtalo de nuevo.",
      }),
    ).toEqual({
      status: "error",
      message: "No hemos podido enviar el código. Inténtalo de nuevo.",
    });
  });

  it("bloquea el botón únicamente durante el envío", () => {
    const loadingState = loginOtpFormReducer(initialLoginOtpFormState, {
      type: "request_started",
    });

    expect(isLoginOtpFormSubmitting(initialLoginOtpFormState)).toBe(false);
    expect(isLoginOtpFormSubmitting(loadingState)).toBe(true);
  });

  it("guarda el email temporal y navega a la ruta de verificación", () => {
    const source = readFileSync(resolve(process.cwd(), "app/login/LoginOtpForm.tsx"), "utf8");

    expect(source).toContain("savePendingFlyPathOtpEmail(result.email)");
    expect(source).toContain("router.push(createFlyPathLoginVerifyHref(nextPath))");
  });
});
