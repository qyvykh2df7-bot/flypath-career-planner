import Link from "next/link";
import { Plus } from "lucide-react";

export function ContentOsPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase text-[#d6ae4f]">PilotFeliu</p>
        <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">{title}</h1>
        <p className="mt-3 text-[15px] leading-7 text-slate-400">{description}</p>
      </div>
      {action ? (
        <Link
          href={action.href}
          className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg bg-[#d6ae4f] px-4 text-sm font-semibold text-[#091524] transition hover:bg-[#e3bc62]"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {action.label}
        </Link>
      ) : null}
    </section>
  );
}
