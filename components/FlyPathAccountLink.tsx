"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getFlyPathAccountNavigation } from "@/lib/auth/account-navigation";
import { initializeFlyPathAuthState } from "@/lib/auth/client";
import type { FlyPathClientAuthState } from "@/lib/auth/types";

const initialState: FlyPathClientAuthState = { status: "loading" };

export function FlyPathAccountLink() {
  const [state, setState] = useState<FlyPathClientAuthState>(initialState);

  useEffect(() => initializeFlyPathAuthState(setState), []);

  const navigation = getFlyPathAccountNavigation(state);

  return (
    <Link
      href={navigation.href}
      className="inline-flex min-h-9 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] px-3 text-sm font-medium text-white transition-colors hover:border-white/24 hover:bg-white/[0.14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a454]/55 sm:px-3.5"
      aria-label={navigation.label}
    >
      {navigation.label}
    </Link>
  );
}
