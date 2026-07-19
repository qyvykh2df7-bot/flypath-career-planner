import { describe, expect, it } from "vitest";
import { resolveAeroCommsAccountName } from "./account-name";

describe("resolveAeroCommsAccountName", () => {
  it("keeps an anonymous onboarding name local", () => {
    expect(resolveAeroCommsAccountName({
      localName: "Paco", authenticated: false, accountName: null, isCurrentWorkspace: true, hasLocalOnboardingName: true,
    })).toEqual({ displayedName: "Paco", prompt: null });
  });

  it("shows the account name and asks before replacing it with a local conflict", () => {
    expect(resolveAeroCommsAccountName({
      localName: "Paco", authenticated: true, accountName: "Jorge", isCurrentWorkspace: true, hasLocalOnboardingName: true,
    })).toEqual({
      displayedName: "Jorge",
      prompt: { kind: "resolve_conflict", localName: "Paco", accountName: "Jorge" },
    });
  });

  it("recovers the account profile name in a browser with no local name", () => {
    expect(resolveAeroCommsAccountName({
      localName: "Pilot", authenticated: true, accountName: "Paco", isCurrentWorkspace: true, hasLocalOnboardingName: false,
    })).toEqual({ displayedName: "Paco", prompt: null });
  });

  it("offers to save a meaningful local name when the account has no name", () => {
    expect(resolveAeroCommsAccountName({
      localName: "Paco", authenticated: true, accountName: null, isCurrentWorkspace: true, hasLocalOnboardingName: true,
    })).toEqual({
      displayedName: "Paco",
      prompt: { kind: "save_local_name", localName: "Paco" },
    });
  });

  it("never carries a foreign account name into the current account", () => {
    expect(resolveAeroCommsAccountName({
      localName: "Paco", authenticated: true, accountName: "Bea", isCurrentWorkspace: false, hasLocalOnboardingName: true,
    })).toEqual({ displayedName: "Bea", prompt: null });
  });
});
