"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PaywallContent } from "@/components/aerocomms/app/PaywallContent";

export default function PaywallPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutNotice = searchParams.get("checkout") === "processing"
    ? "processing"
    : searchParams.get("checkout") === "cancelled"
      ? "cancelled"
      : null;

  return (
    <main className="flex min-h-dvh flex-col bg-[#07111F] px-6 pb-8 pt-6">
      <PaywallContent onClose={() => router.back()} checkoutNotice={checkoutNotice} />
    </main>
  );
}
