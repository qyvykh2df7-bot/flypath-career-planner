import { normalizeFlyPathProfileName } from "@/lib/account/profile-name";

export type AeroCommsAccountNamePrompt =
  | { kind: "resolve_conflict"; localName: string; accountName: string }
  | { kind: "save_local_name"; localName: string }
  | null;

export type AeroCommsAccountNameResolution = {
  displayedName: string;
  prompt: AeroCommsAccountNamePrompt;
};

function localNameCandidate(
  value: string,
  isCurrentWorkspace: boolean,
  hasLocalOnboardingName: boolean,
): string | null {
  if (!isCurrentWorkspace || !hasLocalOnboardingName) return null;
  return normalizeFlyPathProfileName(value);
}

/**
 * Keeps anonymous onboarding local-first while making profiles.full_name the
 * authenticated display authority. A local name is only ever a proposal.
 */
export function resolveAeroCommsAccountName(input: {
  localName: string;
  authenticated: boolean;
  accountName: string | null;
  isCurrentWorkspace: boolean;
  hasLocalOnboardingName: boolean;
}): AeroCommsAccountNameResolution {
  const localName = normalizeFlyPathProfileName(input.localName) ?? "Pilot";
  if (!input.authenticated) return { displayedName: localName, prompt: null };

  const candidate = localNameCandidate(
    localName,
    input.isCurrentWorkspace,
    input.hasLocalOnboardingName,
  );
  const accountName = input.accountName ? normalizeFlyPathProfileName(input.accountName) : null;

  if (accountName) {
    return {
      displayedName: accountName,
      prompt: candidate && candidate !== accountName
        ? { kind: "resolve_conflict", localName: candidate, accountName }
        : null,
    };
  }

  return {
    displayedName: localName,
    prompt: candidate ? { kind: "save_local_name", localName: candidate } : null,
  };
}
