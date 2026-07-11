"use client";

// AeroComms — RouteOverlay (Student Pilot Alpha).
// Renders a taxi / flight route as an SVG polyline with directional arrows.
// Must be placed as a child inside HomeAerodromeMap (composited inside the SVG).

import { BRINDALE_ROUTES, type RouteWaypoint } from "@/lib/aerocomms/studentPilotVisuals";

export interface RouteOverlayProps {
  /** ID of a named route in BRINDALE_ROUTES. */
  routeId?: string;
  /** Direct waypoint list — takes precedence over routeId. */
  waypoints?: RouteWaypoint[];
  /** Draw directional chevron arrows along each segment. Default: true. */
  showArrows?: boolean;
  /** 0-based index of the active (current) segment. Mutes future segments. */
  activeSegmentIndex?: number;
  /** Stroke colour. Defaults to green accent. */
  color?: string;
  /** Opacity for the full overlay. */
  opacity?: number;
}

export function RouteOverlay({
  routeId,
  waypoints: propWaypoints,
  showArrows = true,
  activeSegmentIndex,
  color = "#FACC15",
  opacity = 0.85,
}: RouteOverlayProps) {
  const waypoints =
    propWaypoints ??
    (routeId ? BRINDALE_ROUTES[routeId]?.waypoints : undefined) ??
    [];

  if (waypoints.length < 2) return null;

  const pts = waypoints.map((w) => `${w.pos.x},${w.pos.y}`).join(" ");

  return (
    <g opacity={opacity}>
      {/* ── Full route polyline ─────────────────────────── */}
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Segment directional arrows ───────────────────── */}
      {showArrows &&
        waypoints.slice(0, -1).map((wp, i) => {
          const next = waypoints[i + 1];
          const mx = (wp.pos.x + next.pos.x) / 2;
          const my = (wp.pos.y + next.pos.y) / 2;
          const dx = next.pos.x - wp.pos.x;
          const dy = next.pos.y - wp.pos.y;
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          const dimmed =
            activeSegmentIndex !== undefined && i > activeSegmentIndex;
          return (
            <g
              key={i}
              transform={`translate(${mx},${my}) rotate(${angle})`}
              opacity={dimmed ? 0.3 : 1}
            >
              {/* Chevron pointing in direction of travel */}
              <path
                d="M -3.5,3 L 2.5,0 L -3.5,-3"
                fill="none"
                stroke={color}
                strokeWidth={1.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        })}

      {/* ── Start marker (filled circle) ─────────────────── */}
      <circle
        cx={waypoints[0].pos.x}
        cy={waypoints[0].pos.y}
        r={3.5}
        fill={color}
      />

      {/* ── End marker (open diamond) ────────────────────── */}
      {(() => {
        const end = waypoints[waypoints.length - 1].pos;
        return (
          <g transform={`translate(${end.x},${end.y})`}>
            <rect
              x={-3} y={-3} width={6} height={6}
              transform="rotate(45)"
              fill="none"
              stroke={color}
              strokeWidth={1.5}
            />
          </g>
        );
      })()}

      {/* ── Waypoint labels (optional, non-start/end) ────── */}
      {waypoints.slice(1, -1).map((wp, i) =>
        wp.label ? (
          <text
            key={i}
            x={wp.pos.x + 4}
            y={wp.pos.y - 3}
            fill={color}
            fontSize={5}
            fontFamily="monospace"
            opacity={0.8}
          >
            {wp.label}
          </text>
        ) : null,
      )}
    </g>
  );
}
