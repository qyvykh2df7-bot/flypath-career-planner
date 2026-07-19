"use server";

import { revalidatePath } from "next/cache";
import { saveAuthenticatedFlyPathProfileName } from "@/lib/account/update-profile-name";

export type SaveAeroCommsAccountNameResult =
  | { status: "success"; fullName: string }
  | { status: "error" };

/** Explicitly promotes an AeroComms local name into the signed-in account. */
export async function saveAeroCommsAccountName(
  localName: string,
): Promise<SaveAeroCommsAccountNameResult> {
  const result = await saveAuthenticatedFlyPathProfileName(localName);
  if (result.status !== "success") return { status: "error" };

  revalidatePath("/account");
  revalidatePath("/aerocomms/app", "layout");
  return result;
}
