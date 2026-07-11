import BottomNav from "@/components/aerocomms/app/BottomNav";
import DesktopNav from "@/components/aerocomms/app/DesktopNav";

/**
 * Responsive app shell (desktop-web-layout).
 *
 * Below `lg` (1024px): pixel-for-pixel the original mobile shell — fixed `h-dvh`
 * viewport, `overflow-hidden` outer frame, each page manages its own internal
 * scroll region, bottom tab bar, `max-w-md` centered column. This is the
 * approved mobile design and must not change.
 *
 * `lg` and above: a normal scrolling web document instead of a fixed-viewport
 * "app frame" — DesktopNav replaces BottomNav, the width constraint is lifted so
 * pages can use the full desktop canvas, and the shell/main switch from a fixed
 * height + internal scroll to natural document flow (each page's own `lg:`
 * overrides drop their internal `overflow-y-auto`/`h-full` scroll-box behavior
 * to match — see Today/Train/Missions/Progress/Profile page components).
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#07111F] text-white lg:h-auto lg:min-h-dvh lg:overflow-visible">
      <DesktopNav />
      <main className="min-h-0 flex-1 overflow-hidden px-4 pb-24 pt-6 lg:min-h-0 lg:flex-none lg:overflow-visible lg:px-8 lg:pb-16 lg:pt-8">
        <div className="mx-auto h-full w-full max-w-md lg:h-auto lg:max-w-[1360px]">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
