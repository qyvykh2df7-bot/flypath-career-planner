import { describe, expect, it, vi } from "vitest";

vi.mock("client-only", () => ({}));
import {
  initialLoginOtpFormState,
  isLoginOtpFormSubmitting,
  loginOtpFormReducer,
} from "./LoginOtpForm";

describe("LoginOtpForm", () => {
  it("pasa de idle a loading al enviar", () => {
    const loadingState = loginOtpFormReducer(initialLoginOtpFormState, { type: "submit" });

    expect(loadingState).toEqual({ status: "loading", message: null });
  });

  it("pasa de loading a success cuando el OTP se solicita correctamente", () => {
    const loadingState = loginOtpFormReducer(initialLoginOtpFormState, { type: "submit" });
    const successState = loginOtpFormReducer(loadingState, { type: "success" });

    expect(successState).toEqual({
      status: "success",
      message: "Te hemos enviado un código de acceso. Revisa tu correo.",
    });
  });

  it("pasa de loading a error cuando no se puede solicitar el OTP", () => {
    const loadingState = loginOtpFormReducer(initialLoginOtpFormState, { type: "submit" });
    const errorState = loginOtpFormReducer(loadingState, {
      type: "error",
      message: "No hemos podido enviar el código. Inténtalo de nuevo.",
    });

    expect(errorState).toEqual({
      status: "error",
      message: "No hemos podido enviar el código. Inténtalo de nuevo.",
    });
  });

  it("bloquea el botón únicamente mientras el envío está en curso", () => {
    const loadingState = loginOtpFormReducer(initialLoginOtpFormState, { type: "submit" });
    const successState = loginOtpFormReducer(loadingState, { type: "success" });

    expect(isLoginOtpFormSubmitting(initialLoginOtpFormState)).toBe(false);
    expect(isLoginOtpFormSubmitting(loadingState)).toBe(true);
    expect(isLoginOtpFormSubmitting(successState)).toBe(false);
  });
});
