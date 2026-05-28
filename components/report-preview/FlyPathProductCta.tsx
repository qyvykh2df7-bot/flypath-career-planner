"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useReportPreviewExport } from "./report-preview-export-context";

type FlyPathProductCtaProps = {
  href: string | null;
  children: ReactNode;
  className?: string;
};

const PRIMARY_CLASSES =
  "inline-block rounded-sm bg-[#c9a454] px-5 py-2.5 text-sm font-semibold text-[#0f1a33] shadow-[0_2px_12px_rgba(201,164,84,0.35)] transition-opacity hover:opacity-95";

const DISABLED_CLASSES =
  "inline-block cursor-not-allowed rounded-sm bg-[#c9a454]/50 px-5 py-2.5 text-sm font-semibold text-[#0f1a33]/70";

function resolveExportHref(href: string, origin: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.startsWith("/")) return `${origin.replace(/\/$/, "")}${href}`;
  return href;
}

/** CTA dorado con href interno; desactivado si no hay ruta en catálogo. */
export function FlyPathProductCta({ href, children, className = "" }: FlyPathProductCtaProps) {
  const { enabled: exportMode, origin } = useReportPreviewExport();

  if (!href) {
    return <span className={`${DISABLED_CLASSES} ${className}`}>{children}</span>;
  }

  if (exportMode) {
    return (
      <a href={resolveExportHref(href, origin)} className={`${PRIMARY_CLASSES} ${className}`}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={`${PRIMARY_CLASSES} ${className}`}>
      {children}
    </Link>
  );
}

type FlyPathProductTextLinkProps = {
  href: string | null;
  children: ReactNode;
};

/** Enlace secundario para apoyos complementarios. */
export function FlyPathProductTextLink({ href, children }: FlyPathProductTextLinkProps) {
  const { enabled: exportMode, origin } = useReportPreviewExport();

  if (!href) {
    return <span className="text-xs text-slate-400">{children}</span>;
  }

  const className =
    "text-xs text-[#0f1a33] underline decoration-[#c9a454]/60 underline-offset-2 hover:decoration-[#c9a454]";

  if (exportMode) {
    return (
      <a href={resolveExportHref(href, origin)} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
