import Link from "next/link";
import {
  BarChart3,
  Bot,
  FileStack,
  LayoutDashboard,
  ListTodo,
  Megaphone,
  Mail,
  NotebookPen,
  Package,
  Settings,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { WarhomeNavigationIcon, WarhomeNavigationItem } from "@/lib/warhome/navigation";

const NAVIGATION_ICONS: Record<WarhomeNavigationIcon, LucideIcon> = {
  summary: LayoutDashboard,
  leads: UsersRound,
  users: UserRound,
  emails: Mail,
  notes: NotebookPen,
  settings: Settings,
  analytics: BarChart3,
  products: Package,
  content: FileStack,
  campaigns: Megaphone,
  agents: Bot,
  tasks: ListTodo,
};

type WarhomeNavItemProps = {
  item: WarhomeNavigationItem;
  active: boolean;
};

const itemClasses =
  "group flex min-h-11 items-center gap-3 rounded-lg border px-3 text-sm font-medium transition lg:px-3.5";

export function WarhomeNavItem({ item, active }: WarhomeNavItemProps) {
  const Icon = NAVIGATION_ICONS[item.icon];
  const content = (
    <>
      <Icon
        className={`h-[18px] w-[18px] shrink-0 ${active ? "text-[#e3bc62]" : "text-slate-400"}`}
        aria-hidden
      />
      <span className="hidden min-w-0 flex-1 truncate lg:block">{item.label}</span>
      {item.availability !== "available" ? (
        <span className="hidden rounded border border-white/8 bg-white/[0.035] px-1.5 py-0.5 text-[10px] font-medium text-slate-500 xl:inline-flex">
          Próximamente
        </span>
      ) : null}
    </>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        title={item.label}
        aria-current={active ? "page" : undefined}
        className={`${itemClasses} ${
          active
            ? "border-[#d6ae4f]/45 bg-[#d6ae4f]/10 text-white shadow-[inset_3px_0_0_#d6ae4f]"
            : "border-transparent text-slate-300 hover:border-white/8 hover:bg-white/[0.035] hover:text-white"
        }`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      title={`${item.label} · Próximamente`}
      aria-disabled="true"
      className={`${itemClasses} cursor-not-allowed border-transparent text-slate-500`}
    >
      {content}
    </div>
  );
}
