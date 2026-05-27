"use client";

import Image from "next/image";
import { useState } from "react";

type EditorialImageProps = {
  src: string;
  alt: string;
  className?: string;
  /** Altura del bloque visual */
  heightClass?: string;
  overlay?: "dark" | "light" | "none";
  priority?: boolean;
};

/** Imagen editorial con overlay y fallback a gradiente aviation (sin icono roto). */
export function EditorialImage({
  src,
  alt,
  className = "",
  heightClass = "h-48",
  overlay = "dark",
  priority = false,
}: EditorialImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`relative overflow-hidden ${heightClass} ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f1a33] via-[#1a2844] to-[#2a3a5c]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-12deg, transparent, transparent 8px, rgba(201,164,84,0.08) 8px, rgba(201,164,84,0.08) 9px)",
          }}
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${heightClass} ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 52rem) 100vw, 52rem"
        priority={priority}
        onError={() => setFailed(true)}
      />
      {overlay === "dark" ? (
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a]/85 via-[#0a0f1a]/35 to-[#0a0f1a]/15" />
      ) : null}
      {overlay === "light" ? (
        <div className="absolute inset-0 bg-gradient-to-t from-[#faf8f4]/90 via-[#faf8f4]/20 to-transparent" />
      ) : null}
    </div>
  );
}
