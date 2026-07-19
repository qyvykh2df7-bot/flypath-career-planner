"use server";

import { revalidatePath } from "next/cache";
import { moderateWarhomeReview } from "@/lib/warhome/reviews";

export async function moderateWarhomeReviewAction(
  reviewId: string,
  expectedStatus: string,
  targetStatus: string,
  formData: FormData,
): Promise<void> {
  await moderateWarhomeReview(reviewId, {
    expectedStatus,
    targetStatus,
    reason: formData.get("reason"),
    internalNote: formData.get("internalNote"),
  });
  revalidatePath("/warhome/reviews");
  revalidatePath(`/warhome/reviews/${reviewId}`);
}
