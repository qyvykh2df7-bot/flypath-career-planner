"use server";

import { bootstrapFlyPathIdentity } from "@/lib/account/bootstrap";

export async function bootstrapFlyPathIdentityAfterOtp(): Promise<void> {
  await bootstrapFlyPathIdentity();
}
