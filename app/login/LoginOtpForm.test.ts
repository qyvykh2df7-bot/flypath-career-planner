import { describe, expect, it, vi } from "vitest";

vi.mock("client-only", () => ({}));

import {
  initialLoginOtpFormState,
  isLoginOtpFormComplete,
  isLoginOtpFormSubmitting,
  loginOtpFormReducer,
} from "./LoginOtpForm";

describe("LoginOtpForm", () => {
  it("pasa de idle a loading al solicitar el código", () => {
    const loadingState = loginOtpFormReducer(initialLoginOtpFormState, {
      type: "request_started",
    });

    expect(loadingState).toEqual({ step: "request", status: "loading", message: null });
  });

  it("pasa de loading a la fase de verificación cuando el envío funciona", () => {
    const loadingState = loginOtpFormReducer(initialLoginOtpFormState, {
      type: "request_started",
    });
    const verifyState = loginOtpFormReducer(loadingState, { type: "request_succeeded" });

    expect(verifyState).toEqual({
      step: "verify",
      status: "idle",
      message: "Te hemos enviado un código de acceso. Revisa tu correo.",
    });
  });

  it("pasa de loading a success al verificar el código", () => {
    const verifyState = loginOtpFormReducer(initialLoginOtpFormState, {
      type: "request_succeeded",
    });
    const loadingState = loginOtpFormReducer(verifyState, { type: "verification_started" });
    const successState = loginOtpFormReducer(loadingState, { type: "verification_succeeded" });

    expect(successState).toEqual({
      step: "verify",
      status: "success",
      message: "Sesión iniciada correctamente.",
    });
  });

  it("pasa de loading a error cuando el código no se puede verificar", () => {
    const verifyState = loginOtpFormReducer(initialLoginOtpFormState, {
      type: "request_succeeded",
    });
    const loadingState = loginOtpFormReducer(verifyState, { type: "verification_started" });
    const errorState = loginOtpFormReducer(loadingState, {
      type: "verification_failed",
      message: "No hemos podido verificar el código. Inténtalo de nuevo.",
    });

    expect(errorState).toEqual({
      step: "verify",
      status: "error",
      message: "No hemos podido verificar el código. Inténtalo de nuevo.",
    });
  });

  it("bloquea el botón únicamente durante la operación y al completar", () => {
    const loadingState = loginOtpFormReducer(initialLoginOtpFormState, {
      type: "request_started",
    });
    const verifyState = loginOtpFormReducer(loadingState, { type: "request_succeeded" });
    const verifyingState = loginOtpFormReducer(verifyState, { type: "verification_started" });
    const completeState = loginOtpFormReducer(verifyingState, { type: "verification_succeeded" });

    expect(isLoginOtpFormSubmitting(initialLoginOtpFormState)).toBe(false);
    expect(isLoginOtpFormSubmitting(loadingState)).toBe(true);
    expect(isLoginOtpFormSubmitting(verifyingState)).toBe(true);
    expect(isLoginOtpFormSubmitting(completeState)).toBe(false);
    expect(isLoginOtpFormComplete(completeState)).toBe(true);
    expect(isLoginOtpFormComplete(verifyState)).toBe(false);
  });
});
