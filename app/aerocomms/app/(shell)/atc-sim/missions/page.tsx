"use client";

// AeroComms — Mission Library fallback route.
//
// The primary Missions experience now lives on the /atc-sim home screen
// (header + Next Mission + Mission Library in a single scroll). This route
// is kept only as a safe landing target for direct links, the mission
// detail page's "not found" / "locked" redirects, and its own back button.

import { useRouter } from "next/navigation";
import MissionLibrary from "@/components/aerocomms/app/atc-sim/MissionLibrary";

export default function MissionLibraryFallbackPage() {
  const router = useRouter();

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-x-hidden lg:h-auto lg:mx-auto lg:max-w-3xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 20% 8%, rgba(96,165,250,0.05), transparent 32%), radial-gradient(circle at 80% 18%, rgba(250,204,21,0.05), transparent 28%)",
        }}
      />

      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 pb-3">
        <button
          onClick={() => router.push("/aerocomms/app/atc-sim")}
          aria-label="Back"
          className="flex shrink-0 items-center justify-center rounded-full"
          style={{
            width: 36,
            height: 36,
            background: "rgba(15,23,42,0.70)",
            color: "rgba(248,250,252,0.9)",
          }}
        >
          <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 850,
              lineHeight: 1.1,
              color: "#FFFFFF",
            }}
          >
            Missions
          </h1>
          <p
            style={{
              marginTop: 4,
              fontSize: 13.5,
              fontWeight: 500,
              color: "rgba(226,232,240,0.72)",
            }}
          >
            Structured scenarios by level
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-2 pr-1">
        <MissionLibrary />
      </div>
    </div>
  );
}
