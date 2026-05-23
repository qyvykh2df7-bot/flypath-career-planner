"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { CLASSES_BOOKING_PATH } from "./calendar-session-types";

type ClassBookingCtaProps = {
  /** Tarjeta del calendario: flecha y estilo compacto. */
  variant?: "card" | "panel";
  className?: string;
};

export function ClassBookingCta({ variant = "card", className = "" }: ClassBookingCtaProps) {
  const stopNav = (e: MouseEvent) => {
    e.stopPropagation();
  };

  const label = variant === "card" ? "Reservar clase →" : "Reservar clase";

  if (variant === "panel") {
    return (
      <Link
        href={CLASSES_BOOKING_PATH}
        onClick={stopNav}
        className={`mt-2 inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#3b6ea8]/30 bg-white px-3 text-[13px] font-semibold text-[#3b6ea8] hover:bg-[#eef2f8] ${className}`}
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={CLASSES_BOOKING_PATH}
      onClick={stopNav}
      className={`mt-1.5 inline-flex w-full items-center justify-center rounded-md border border-[#3b6ea8]/25 bg-[#eef2f8]/60 px-2 py-1 text-[11px] font-semibold text-[#3b6ea8] transition-colors hover:bg-[#eef2f8] ${className}`}
    >
      {label}
    </Link>
  );
}
