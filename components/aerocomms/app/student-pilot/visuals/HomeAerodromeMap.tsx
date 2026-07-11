"use client";

// AeroComms — Brindale aerodrome schematic map (Student Pilot Alpha).
// SVG-based, data-driven, dark cockpit style. No bitmap, no final artwork.
// Accepts SVG children so RouteOverlay and AircraftMarker can be composed inside.

import type React from "react";
import { BRINDALE_MAP_LAYOUT } from "@/lib/aerocomms/studentPilotVisuals";

export interface HomeAerodromeMapProps {
  /** Highlight specific aerodrome entities (stands, taxiways, holding points, exits). */
  highlightedEntityIds?: string[];
  /** Designator of the active runway. Defaults to "24". */
  activeRunway?: string;
  /** Show taxiway, stand and threshold labels. */
  showLabels?: boolean;
  /** Show VFR reporting points (November, South Bridge). */
  showReportingPoints?: boolean;
  /** Compact mode — smaller labels, reduced density. */
  compact?: boolean;
  /** Extra CSS classes on the outer SVG element. */
  className?: string;
  /** SVG children — place RouteOverlay and AircraftMarker here. */
  children?: React.ReactNode;
}

const M = BRINDALE_MAP_LAYOUT;

// ── Colour tokens ──────────────────────────────────────────────────────────
const C = {
  bg:           "#07111F",
  apron:        "#0C2034",
  apronStroke:  "#1A3854",
  runway:       "#0E2238",
  runwayStroke: "#234060",
  taxiway:      "#2A5070",   // taxiway line stroke
  connector:    "#243D58",   // stand stub stroke
  stand:        "#0E2236",
  standStroke:  "#2A4A68",
  hpDim:        "#9A6010",   // holding-point bar, default
  hpBright:     "#D97706",   // holding-point bar, highlighted
  hpLabelDim:   "#8B6018",
  hpLabelBright:"#D97706",
  exitDim:      "#1A3048",
  exitStroke:   "#2A5070",
  exitHL:       "#FACC15",
  activeRwy:    "#FACC15",
  inactiveRwy:  "#345878",
  labelMuted:   "#3D5878",
  labelDim:     "#4A6882",
  labelVis:     "#5A7898",
  rpCircle:     "#286080",
  rpCircleHL:   "#38BDF8",
  rpLabel:      "#3A7090",
  rpLabelHL:    "#38BDF8",
  icao:         "#243850",
  north:        "#2A5070",
  centreline:   "#2A4568",
} as const;

function isHL(id: string, ids: string[]) { return ids.includes(id); }

export function HomeAerodromeMap({
  highlightedEntityIds = [],
  activeRunway = "24",
  showLabels = true,
  showReportingPoints = false,
  compact = false,
  className = "",
  children,
}: HomeAerodromeMapProps) {
  const { viewBox: vb, runway: rwy, apron, taxiways: twy, standConnectors } = M;
  const ep = M.entityPositions;
  const hl = (id: string) => isHL(id, highlightedEntityIds);

  return (
    <svg
      viewBox={`0 0 ${vb.w} ${vb.h}`}
      className={`w-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Brindale Aerodrome XBRD — schematic map"
    >
      {/* ── Background ─────────────────────────────────────── */}
      <rect width={vb.w} height={vb.h} fill={C.bg} />

      {/* ── Apron surface ───────────────────────────────────── */}
      <rect
        x={apron.x} y={apron.y}
        width={apron.w} height={apron.h}
        fill={C.apron} stroke={C.apronStroke} strokeWidth={0.75}
      />

      {/* ── Stand-to-Alfa connector stubs ───────────────────── */}
      {standConnectors.map((c, i) => (
        <line
          key={i}
          x1={c.x} y1={c.y1} x2={c.x} y2={c.y2}
          stroke={C.connector} strokeWidth={2.5}
        />
      ))}

      {/* ── Taxiway Alfa ───────────────────────────────────── */}
      <line
        x1={twy.alfa.x1} y1={twy.alfa.y1} x2={twy.alfa.x2} y2={twy.alfa.y2}
        stroke={C.taxiway} strokeWidth={3}
      />

      {/* ── Taxiway Bravo ──────────────────────────────────── */}
      <line
        x1={twy.bravo.x1} y1={twy.bravo.y1} x2={twy.bravo.x2} y2={twy.bravo.y2}
        stroke={C.taxiway} strokeWidth={3}
      />

      {/* ── Taxiway Charlie ────────────────────────────────── */}
      <line
        x1={twy.charlie.x1} y1={twy.charlie.y1} x2={twy.charlie.x2} y2={twy.charlie.y2}
        stroke={C.taxiway} strokeWidth={3}
      />

      {/* ── Runway ─────────────────────────────────────────── */}
      <rect
        x={rwy.x1} y={rwy.y - rwy.halfW}
        width={rwy.x2 - rwy.x1} height={rwy.halfW * 2}
        fill={C.runway} stroke={C.runwayStroke} strokeWidth={0.75}
      />

      {/* Runway centreline */}
      <line
        x1={rwy.x1 + 24} y1={rwy.y} x2={rwy.x2 - 24} y2={rwy.y}
        stroke={C.centreline} strokeWidth={0.75} strokeDasharray="8 8"
      />

      {/* Active runway 24 end — green accent */}
      {activeRunway === "24" && (
        <rect
          x={rwy.x2 - 4} y={rwy.y - rwy.halfW}
          width={4} height={rwy.halfW * 2}
          fill={C.activeRwy} opacity={0.75}
        />
      )}
      {/* 06 end indicator */}
      <rect
        x={rwy.x1} y={rwy.y - rwy.halfW}
        width={4} height={rwy.halfW * 2}
        fill={C.inactiveRwy} opacity={0.4}
      />

      {/* ── Stands ─────────────────────────────────────────── */}
      {(["stand-1","stand-2","stand-3","stand-4","stand-5","stand-6"] as const).map((id) => {
        const { pos, label } = ep[id];
        const active = hl(id);
        return (
          <g key={id}>
            <rect
              x={pos.x - 9} y={pos.y - 7}
              width={18} height={14}
              rx={1.5}
              fill={active ? "#0F2B1A" : C.stand}
              stroke={active ? C.activeRwy : C.standStroke}
              strokeWidth={active ? 1.5 : 1}
            />
            {showLabels && (
              <text
                x={pos.x} y={pos.y + 2.5}
                textAnchor="middle"
                fill={active ? C.activeRwy : C.labelVis}
                fontSize={6.5}
                fontFamily="monospace"
              >
                {label}
              </text>
            )}
          </g>
        );
      })}

      {/* ── Holding point A1 — dashed bar across Alfa ────── */}
      {(() => {
        const { pos } = ep["hp-a1"];
        const active = hl("hp-a1");
        const col = active ? C.hpBright : C.hpDim;
        const lcol = active ? C.hpLabelBright : C.hpLabelDim;
        return (
          <g key="hp-a1">
            <line
              x1={pos.x} y1={twy.alfa.y1 - 5}
              x2={pos.x} y2={twy.alfa.y1 + 5}
              stroke={col} strokeWidth={2} strokeDasharray="2 1.5"
            />
            {showLabels && (
              <text
                x={pos.x + 4} y={twy.alfa.y1 - 4}
                fill={lcol} fontSize={6} fontFamily="monospace"
              >
                A1
              </text>
            )}
          </g>
        );
      })()}

      {/* ── Holding point B1 — dashed bar across Bravo ────── */}
      {(() => {
        const { pos } = ep["hp-b1"];
        const active = hl("hp-b1");
        const col = active ? C.hpBright : C.hpDim;
        const lcol = active ? C.hpLabelBright : C.hpLabelDim;
        return (
          <g key="hp-b1">
            <line
              x1={twy.bravo.x1 - 5} y1={pos.y}
              x2={twy.bravo.x1 + 5} y2={pos.y}
              stroke={col} strokeWidth={2} strokeDasharray="2 1.5"
            />
            {showLabels && (
              <text
                x={twy.bravo.x1 + 8} y={pos.y + 2}
                fill={lcol} fontSize={6} fontFamily="monospace"
              >
                B1
              </text>
            )}
          </g>
        );
      })()}

      {/* ── Runway exits ────────────────────────────────────── */}
      {(["exit-bravo", "exit-charlie"] as const).map((id) => {
        const { pos } = ep[id];
        const active = hl(id);
        return (
          <circle
            key={id}
            cx={pos.x} cy={pos.y} r={3}
            fill={active ? C.exitHL : C.exitDim}
            stroke={active ? C.exitHL : C.exitStroke}
            strokeWidth={1}
            opacity={active ? 1 : 0.85}
          />
        );
      })}

      {/* ── Runway designators ──────────────────────────────── */}
      {showLabels && (
        <>
          <text
            x={rwy.x1 + 10} y={rwy.y + 2.5}
            textAnchor="middle"
            fill={C.labelDim}
            fontSize={7} fontFamily="monospace" fontWeight="bold"
          >
            06
          </text>
          <text
            x={rwy.x2 - 10} y={rwy.y + 2.5}
            textAnchor="middle"
            fill={activeRunway === "24" ? C.activeRwy : C.labelDim}
            fontSize={7} fontFamily="monospace" fontWeight="bold"
          >
            24
          </text>
        </>
      )}

      {/* ── Taxiway name labels ─────────────────────────────── */}
      {showLabels && !compact && (
        <>
          <text x={24} y={88} fill={C.labelMuted} fontSize={6.5} fontFamily="monospace">
            Alfa
          </text>
          <text x={163} y={97} textAnchor="middle" fill={C.labelMuted} fontSize={6} fontFamily="monospace">
            Bravo
          </text>
          <text x={284} y={97} textAnchor="end" fill={C.labelMuted} fontSize={6} fontFamily="monospace">
            Charlie
          </text>
        </>
      )}

      {/* ── North indicator ─────────────────────────────────── */}
      {!compact && (
        <g transform="translate(306,18)">
          <line x1={0} y1={6} x2={0} y2={-6} stroke={C.north} strokeWidth={1} />
          <path d="M -2.5,1 L 0,-6 L 2.5,1" fill={C.north} />
          <text x={0} y={12} textAnchor="middle" fill={C.north} fontSize={5} fontFamily="sans-serif">
            N
          </text>
        </g>
      )}

      {/* ── ICAO code watermark ─────────────────────────────── */}
      <text
        x={6} y={vb.h - 4}
        fill={C.icao} fontSize={5.5} fontFamily="monospace"
      >
        XBRD
      </text>

      {/* ── VFR Reporting points (optional) ─────────────────── */}
      {showReportingPoints && (
        <>
          {(["rp-november", "rp-south-bridge"] as const).map((id) => {
            const { pos, label } = ep[id];
            const active = hl(id);
            const col = active ? C.rpCircleHL : C.rpCircle;
            const lcol = active ? C.rpLabelHL : C.rpLabel;
            const isNov = id === "rp-november";
            return (
              <g key={id}>
                <circle cx={pos.x} cy={pos.y} r={4.5} fill="none" stroke={col} strokeWidth={1.25} />
                <circle cx={pos.x} cy={pos.y} r={1.75} fill={col} />
                <text
                  x={isNov ? pos.x + 8 : pos.x - 8}
                  y={pos.y + 2}
                  textAnchor={isNov ? "start" : "end"}
                  fill={lcol}
                  fontSize={6}
                  fontFamily="sans-serif"
                >
                  {compact ? (isNov ? "N" : "SB") : label}
                </text>
              </g>
            );
          })}
        </>
      )}

      {/* ── Composed children (RouteOverlay, AircraftMarker) ─ */}
      {children}
    </svg>
  );
}
