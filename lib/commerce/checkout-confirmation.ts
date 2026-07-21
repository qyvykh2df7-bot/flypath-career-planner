export type CareerPlannerCheckoutPresentationStatus = "verifying" | "confirmed" | "failed" | "expired" | "delayed";

export function parseCareerPlannerCheckoutPresentationStatus(
  value: unknown,
): Exclude<CareerPlannerCheckoutPresentationStatus, "delayed"> | null {
  return value === "verifying" || value === "confirmed" || value === "failed" || value === "expired"
    ? value
    : null;
}

export function canCloseCareerPlannerCheckoutConfirmation(
  status: CareerPlannerCheckoutPresentationStatus,
): boolean {
  return status !== "verifying";
}

export function shouldPollCareerPlannerCheckoutConfirmation(
  status: CareerPlannerCheckoutPresentationStatus,
  pollCount: number,
  maxPolls: number,
): boolean {
  return status === "verifying" && pollCount < maxPolls;
}
