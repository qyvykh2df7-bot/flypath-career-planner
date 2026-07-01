import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HomePrimaryCta({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#D6AE4F] px-6 py-3.5 text-[14px] font-bold tracking-tight text-[#071224] transition duration-200 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/45 sm:px-7 sm:text-[15px] ${className}`}
    >
      {children}
      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
    </Link>
  );
}

export function HomeSecondaryCta({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-[14px] border border-white/25 bg-white/5 px-6 py-3.5 text-[14px] font-semibold text-white transition duration-200 hover:border-white/45 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:px-7 sm:text-[15px] ${className}`}
    >
      {children}
    </Link>
  );
}

export function HomeTextCta({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#071224] transition hover:text-[#B8923F] ${className}`}
    >
      {children}
      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
    </Link>
  );
}
