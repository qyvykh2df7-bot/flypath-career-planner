"use client";

import { useState } from "react";
import { getMissionLevelImage, LEVELS, type AtcLevelId } from "@/lib/aerocomms/atcSim";

type MissionLevelImageProps = {
  level: AtcLevelId;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  fallback?: React.ReactNode;
};

export default function MissionLevelImage({
  level,
  alt,
  className,
  style,
  fallback = null,
}: MissionLevelImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={getMissionLevelImage(level)}
      alt={alt ?? `${LEVELS[level].label} mission`}
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
