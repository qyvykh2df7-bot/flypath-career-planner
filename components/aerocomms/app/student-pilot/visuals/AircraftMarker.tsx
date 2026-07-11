"use client";

// AeroComms — AircraftMarker (Student Pilot Alpha).
// Renders a simple top-down aircraft symbol at a map position with optional heading.
// Must be placed as a child inside HomeAerodromeMap (composited inside the SVG).
// The base symbol points NORTH (−y direction in SVG). Rotate by heading degrees clockwise.

import type { MapPos } from "@/lib/aerocomms/studentPilotVisuals";

export interface AircraftMarkerProps {
  /** Position in the map's SVG coordinate space. */
  pos: MapPos;
  /** Heading in degrees (0 = north, 90 = east). Default: 0 (pointing north). */
  heading?: number;
  /** Visual variant. Ground aircraft slightly smaller. Default: "ground". */
  variant?: "ground" | "airborne";
  /** Highlight / selected state. */
  active?: boolean;
  /** Optional text label shown beside the marker. */
  label?: string;
  /** Label placement relative to marker. Default: "right". */
  labelPosition?: "above" | "below" | "right" | "left";
  /** Size variant. Default: "md". Use "overview" for full-map placement (~18% smaller). */
  size?: "overview" | "sm" | "md" | "lg";
}

const SIZES = { overview: 0.82, sm: 0.7, md: 1.0, lg: 1.4 } as const;

/** Top-down aircraft path pointing NORTH (−y).
 *  Composed of fuselage body + two swept wings. All units relative to origin.
 *  Scale factor applied via transform. */
const AIRCRAFT_PATH = "M 0,-7 C 1,-6 1.5,-4 1.5,-2 L 8,2 L 6.5,4 L 1.5,2 L 1,5 L 3,6.5 L 3,7.5 L 0,6.5 L -3,7.5 L -3,6.5 L -1,5 L -1.5,2 L -6.5,4 L -8,2 L -1.5,-2 C -1.5,-4 -1,-6 0,-7 Z";

export function AircraftMarker({
  pos,
  heading = 0,
  variant = "ground",
  active = false,
  label,
  labelPosition = "right",
  size = "md",
}: AircraftMarkerProps) {
  const scale = SIZES[size] * (variant === "ground" ? 0.9 : 1.0);
  const color = active ? "#FACC15" : "#38BDF8";
  const fillOpacity = variant === "airborne" ? 0.9 : 0.75;

  // Label offset based on position
  const labelOffset = {
    right:  { x: 10 * scale + 4, y: 2 },
    left:   { x: -(10 * scale + 4), y: 2 },
    above:  { x: 0, y: -(10 * scale + 4) },
    below:  { x: 0, y: 10 * scale + 8 },
  }[labelPosition];

  return (
    <g transform={`translate(${pos.x},${pos.y})`}>
      {/* ── Aircraft symbol — rotate by heading ──────────── */}
      <g transform={`rotate(${heading})`}>
        {/* Soft glow ring for active state */}
        {active && (
          <circle cx={0} cy={0} r={11 * scale} fill={color} opacity={0.12} />
        )}
        {/* Aircraft body */}
        <path
          d={AIRCRAFT_PATH}
          transform={`scale(${scale})`}
          fill={color}
          fillOpacity={fillOpacity}
          stroke={color}
          strokeWidth={0.5 / scale}
          strokeLinejoin="round"
        />
        {/* Nose dot */}
        <circle cx={0} cy={-7 * scale} r={1 * scale} fill={color} />
      </g>

      {/* ── Optional label ───────────────────────────────── */}
      {label && (
        <text
          x={labelOffset.x}
          y={labelOffset.y}
          textAnchor={labelPosition === "left" ? "end" : "start"}
          fill={color}
          fontSize={5.5}
          fontFamily="monospace"
          opacity={0.9}
        >
          {label}
        </text>
      )}
    </g>
  );
}
