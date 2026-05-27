"use client";

import Image from "next/image";
import { useState } from "react";

type FlyPathWordmarkProps = {
  variant?: "navy" | "gold" | "on-dark";
  className?: string;
};

/** Wordmark FlyPath: imagen si existe; texto editorial si falla. */
export function FlyPathWordmark({ variant = "navy", className = "" }: FlyPathWordmarkProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const logoSrc =
    variant === "gold" || variant === "on-dark"
      ? "/flypath-logo-white.png"
      : "/flypath-logo.png";

  if (imgFailed) {
    return (
      <div className={`flex items-baseline gap-2 ${className}`}>
        <span
          className={`font-serif text-2xl font-medium tracking-tight ${
            variant === "on-dark" || variant === "gold" ? "text-[#faf8f4]" : "text-[#0f1a33]"
          }`}
        >
          Fly
          <span className="text-[#c9a454]">Path</span>
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative h-9 w-[120px] shrink-0 sm:h-10 sm:w-[132px]">
        <Image
          src={logoSrc}
          alt="FlyPath"
          width={264}
          height={80}
          className="h-full w-auto max-w-full object-contain object-left"
          priority
          onError={() => setImgFailed(true)}
        />
      </div>
    </div>
  );
}
