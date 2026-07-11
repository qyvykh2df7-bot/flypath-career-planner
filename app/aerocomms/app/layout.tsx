import type { Metadata, Viewport } from "next";
import "./aerocomms-app.css";
import { AppStateProvider } from "@/lib/aerocomms/appState";

/**
 * Scoped layout for the AeroComms app island (/aerocomms/app/**).
 *
 * Deliberately does NOT render <html>/<body> — this segment is nested inside
 * FlyPath's root layout (app/layout.tsx), which already provides those tags.
 * AppStateProvider and the AeroComms-specific styles are scoped to this
 * subtree only, so the rest of FlyPath is untouched.
 */
export const metadata: Metadata = {
  title: "AeroComms | FlyPath",
  description: "AI-powered aviation communications training app.",
};

// viewport-fit=cover lets env(safe-area-inset-bottom) resolve to the actual
// home-indicator inset on iPhone, enabling the bottom nav and session buttons
// to sit correctly above the home indicator instead of behind it.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function AeroCommsAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="aerocomms-app-root min-h-dvh antialiased">
      <AppStateProvider>{children}</AppStateProvider>
    </div>
  );
}
