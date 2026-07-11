"use client";

import { useState } from "react";
import Image from "next/image";
import { getMissionLevelImage, LEVELS, type AtcLevelId } from "@/lib/aerocomms/atcSim";

type MissionLevelImageProps = {
  level: AtcLevelId;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  fallback?: React.ReactNode;
  sizes?: string;
  preload?: boolean;
};

export default function MissionLevelImage({
  level,
  alt,
  className,
  style,
  fallback = null,
  sizes = "(max-width: 1023px) 100vw, 185px",
  preload = false,
}: MissionLevelImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <>{fallback}</>;
  }

  return (
    <Image
      src={getMissionLevelImage(level)}
      alt={alt ?? `${LEVELS[level].label} mission`}
      fill
      sizes={sizes}
      preload={preload}
      className={className}
      style={{
        objectFit: "cover",
        objectPosition: "center",
        ...style,
      }}
      onError={() => setFailed(true)}
    />
  );
}
