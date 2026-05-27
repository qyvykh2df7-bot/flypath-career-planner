"use client";

import Image from "next/image";
import { useState } from "react";
import { schoolBannerSrc } from "./report-preview-assets";

type SchoolBannerProps = {
  programa: string;
  schoolName: string;
};

/** Banner sutil por escuela: imagen de ruta o gradiente aviation. */
export function SchoolBanner({ programa, schoolName }: SchoolBannerProps) {
  const src = schoolBannerSrc(programa);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className="relative h-20 w-full overflow-hidden"
        role="img"
        aria-label={`${schoolName} — aviación`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f1a33] via-[#1e2d4a] to-[#2a3f66]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,164,84,0.2),transparent_55%)]" />
      </div>
    );
  }

  return (
    <div className="relative h-20 w-full overflow-hidden">
      <Image
        src={src}
        alt=""
        fill
        className="object-cover opacity-90"
        sizes="400px"
        onError={() => setFailed(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a33]/50 to-transparent" />
    </div>
  );
}
