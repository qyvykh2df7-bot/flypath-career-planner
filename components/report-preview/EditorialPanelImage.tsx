"use client";

import Image from "next/image";
import { useState } from "react";
import type { PlaceholderVariant } from "./report-preview-assets";

type EditorialPanelImageProps = {
  src: string;
  alt: string;
  priority?: boolean;
  caption?: string;
  /** Overlay más suave para no restar legibilidad al contenido adyacente */
  treatment?: "default" | "soft";
  placeholderVariant?: PlaceholderVariant;
};

const PLACEHOLDER_GRADIENTS: Record<PlaceholderVariant, string> = {
  horizon: "from-[#0a1020] via-[#1a2d4a] to-[#243b5c]",
  slate: "from-[#121820] via-[#1e2836] to-[#2a3544]",
  dusk: "from-[#1a1528] via-[#2d2240] to-[#3d3050]",
  gold: "from-[#1a1408] via-[#2a2210] to-[#3d3218]",
  navy: "from-[#060a14] via-[#0f1a33] to-[#1a2844]",
  warm: "from-[#1a1814] via-[#2a241c] to-[#3a3228]",
};

/** Panel lateral full-height — overlay editorial y placeholder único por sección. */
export function EditorialPanelImage({
  src,
  alt,
  priority = false,
  caption,
  treatment = "default",
  placeholderVariant = "navy",
}: EditorialPanelImageProps) {
  const [failed, setFailed] = useState(false);
  const gradient = PLACEHOLDER_GRADIENTS[placeholderVariant];

  if (failed) {
    return (
      <div className="relative h-full min-h-[20rem] w-full" role="img" aria-label={alt}>
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-14deg, transparent, transparent 10px, rgba(201,164,84,0.06) 10px, rgba(201,164,84,0.06) 11px)",
          }}
        />
        {caption ? (
          <p className="absolute bottom-6 left-6 text-[10px] uppercase tracking-[0.28em] text-white/35">
            {caption}
          </p>
        ) : null}
      </div>
    );
  }

  const overlayR =
    treatment === "soft"
      ? "from-[#0a0f1a]/35 via-[#0a0f1a]/12 to-transparent"
      : "from-[#0a0f1a]/50 via-[#0a0f1a]/20 to-transparent";
  const overlayT =
    treatment === "soft"
      ? "from-[#0a0f1a]/45 via-transparent to-[#0a0f1a]/8"
      : "from-[#0a0f1a]/60 via-transparent to-[#0a0f1a]/10";

  return (
    <div className="relative h-full min-h-[20rem] w-full">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 1200px) 45vw, 480px"
        priority={priority}
        onError={() => setFailed(true)}
      />
      <div className={`absolute inset-0 bg-gradient-to-r ${overlayR}`} />
      <div className={`absolute inset-0 bg-gradient-to-t ${overlayT}`} />
      {caption ? (
        <p className="absolute bottom-6 left-6 z-10 text-[10px] font-medium uppercase tracking-[0.28em] text-white/45">
          {caption}
        </p>
      ) : null}
    </div>
  );
}
