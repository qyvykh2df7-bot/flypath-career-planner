import Link from "next/link";
import { CalendarDays, Clapperboard, Library, Lightbulb } from "lucide-react";

const tabs = [
  { href: "/warhome/content", label: "Calendario", icon: CalendarDays },
  { href: "/warhome/content/ideas", label: "Banco de ideas", icon: Lightbulb },
  { href: "/warhome/content/library", label: "Biblioteca", icon: Library },
  { href: "/warhome/content/library/new", label: "Nueva pieza", icon: Clapperboard },
] as const;

export function ContentOsTabs({ active }: { active: "calendar" | "ideas" | "library" | "new" }) {
  const activeHref = {
    calendar: "/warhome/content",
    ideas: "/warhome/content/ideas",
    library: "/warhome/content/library",
    new: "/warhome/content/library/new",
  }[active];

  return (
    <nav
      aria-label="Secciones de Content OS"
      className="mt-7 flex gap-1 overflow-x-auto border-b border-white/[0.08]"
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const isActive = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium transition ${
              isActive
                ? "border-[#d6ae4f] text-white"
                : "border-transparent text-slate-500 hover:text-slate-200"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
