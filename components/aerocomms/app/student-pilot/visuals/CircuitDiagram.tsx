"use client";

// AeroComms — CircuitDiagram (Student Pilot Alpha, Batch 2B).
//
// A simplified rectangular circuit schematic for runway 24 left-hand circuit.
// NOT a real geo-referenced map — intentionally schematic.
//
// Ownership boundary (from Student Pilot blueprint v2):
//   ✓ Teaches: circuit shape, positions (upwind/crosswind/downwind/base/final),
//              sequencing, traffic, extend-downwind, orbit, touch-and-go/full-stop
//              INTENTION only.
//   ✗ Does NOT formally teach: continue approach, landing/go-around clearance
//              mechanics (those belong in Approach & Landing / Module 7).
//
// Progressive difficulty via props:
//   - Add traffic aircraft, change highlightedLeg, enable showOrbitMarker/
//     showExtendPath, hide labels, mark legs selectable.

import type {
  CircuitAircraft,
  CircuitDiagramPreset,
  CircuitDirection,
  CircuitIntention,
  CircuitLeg,
} from "@/lib/aerocomms/studentPilotVisuals";
import { CIRCUIT_DIAGRAM_PRESETS } from "@/lib/aerocomms/studentPilotVisuals";

/* ─── Props ────────────────────────────────────────────────────────────────── */

export interface CircuitDiagramProps {
  /** Load a named preset. Direct props override preset values. */
  presetId?: string;
  runway?: string;
  circuitDirection?: CircuitDirection;
  aircraft?: CircuitAircraft[];
  highlightedLeg?: CircuitLeg;
  /** Which leg or path is "active" (drawn brighter). */
  activeLeg?: CircuitLeg;
  showLabels?: boolean;
  showTraffic?: boolean;
  showDirectionArrows?: boolean;
  /** Draw an extended-downwind path beyond the normal base turn point. */
  showExtendPath?: boolean;
  /** Draw an orbit (360°) marker on the current aircraft position. */
  showOrbitMarker?: boolean;
  /** Touch-and-go or full-stop intention label. */
  intention?: CircuitIntention;
  /**
   * Leg IDs to hide (for progressive difficulty — hide labels on
   * crosswind/base when they should be inferred, not told).
   */
  hiddenEntityIds?: string[];
  /**
   * Leg IDs that can be tapped by the student.
   * Exercise renderer decides if selection is correct.
   */
  selectableEntityIds?: string[];
  onEntitySelect?: (entityId: string) => void;
  compact?: boolean;
  className?: string;
}

/* ─── ViewBox and layout constants ──────────────────────────────────────────
 * Circuit viewed from above. Runway 24 runs left→right, threshold at right.
 * Left-hand circuit: upwind right→left (away from viewer),
 *   then turns left for crosswind/downwind/base/final.
 *
 * ViewBox 320 × 240.
 *
 * Key co-ordinates:
 *   Runway strip:   x 50–270, y 175–190  (bottom area, threshold at right)
 *   Upwind leg:     extends right from threshold towards x~270
 *   Crosswind leg:  turns upward from upwind end
 *   Downwind leg:   runs right→left (parallel to runway, high up), x 270→50
 *   Base leg:       turns down from downwind left end
 *   Final:          runs right→threshold (bottom)
 */
const VB = { w: 320, h: 240 };

// Runway strip — slightly wider than circuit legs for visual hierarchy
const RWY = {
  x1: 50, x2: 270,
  y: 182, halfW: 8,
  thresholdX: 270,  // active threshold (24-end, right side)
  inactiveX: 50,    // 06 end (left)
};

// Circuit box corners (left-hand circuit around runway 24)
const CIRCUIT = {
  // The rectangular circuit path:
  // threshold (RWY.thresholdX, RWY.y) →
  //   upwind  right end (RWY.thresholdX+14, RWY.y)  ... short upwind stub only
  //   actually upwind goes away (to the right of the threshold in real terms)
  //   but we model it schematically:
  upwindEnd:   { x: 280, y: RWY.y },         // just past threshold
  crosswindEnd:{ x: 280, y: 38  },           // top-right
  downwindEnd: { x: 38,  y: 38  },           // top-left
  baseEnd:     { x: 38,  y: RWY.y },         // bottom-left
  // final runs from baseEnd back to threshold along y=RWY.y
};

/* ─── Leg geometry ──────────────────────────────────────────────────────────
 * Each leg is defined as a straight line segment.
 * legProgress 0→1 maps linearly along the segment.
 */
interface LegGeometry {
  x1: number; y1: number;
  x2: number; y2: number;
  /** Natural heading along the leg (degrees, 0=north) — used for aircraft rotation. */
  heading: number;
  /** SVG mid-point for label placement. */
  labelX: number;
  labelY: number;
  /** Offset direction for label so it doesn't overlap the line. */
  labelOffsetX: number;
  labelOffsetY: number;
}

const LEG_GEOMETRY: Record<CircuitLeg, LegGeometry> = {
  upwind: {
    x1: RWY.thresholdX, y1: RWY.y,
    x2: CIRCUIT.upwindEnd.x, y2: CIRCUIT.upwindEnd.y,
    heading: 90,
    labelX: (RWY.thresholdX + CIRCUIT.upwindEnd.x) / 2,
    labelY: RWY.y - 16,
    labelOffsetX: 0, labelOffsetY: -2,
  },
  crosswind: {
    x1: CIRCUIT.upwindEnd.x,  y1: CIRCUIT.upwindEnd.y,
    x2: CIRCUIT.crosswindEnd.x, y2: CIRCUIT.crosswindEnd.y,
    heading: 0,
    labelX: CIRCUIT.crosswindEnd.x + 8,
    labelY: (CIRCUIT.upwindEnd.y + CIRCUIT.crosswindEnd.y) / 2,
    labelOffsetX: 7, labelOffsetY: 0,
  },
  downwind: {
    x1: CIRCUIT.crosswindEnd.x, y1: CIRCUIT.crosswindEnd.y,
    x2: CIRCUIT.downwindEnd.x,  y2: CIRCUIT.downwindEnd.y,
    heading: 270,
    labelX: (CIRCUIT.crosswindEnd.x + CIRCUIT.downwindEnd.x) / 2,
    labelY: CIRCUIT.crosswindEnd.y - 9,
    labelOffsetX: 0, labelOffsetY: -3,
  },
  base: {
    x1: CIRCUIT.downwindEnd.x, y1: CIRCUIT.downwindEnd.y,
    x2: CIRCUIT.baseEnd.x,     y2: CIRCUIT.baseEnd.y,
    heading: 180,
    labelX: CIRCUIT.downwindEnd.x - 8,
    labelY: (CIRCUIT.downwindEnd.y + CIRCUIT.baseEnd.y) / 2,
    labelOffsetX: -7, labelOffsetY: 0,
  },
  final: {
    x1: CIRCUIT.baseEnd.x, y1: CIRCUIT.baseEnd.y,
    x2: RWY.thresholdX - 2, y2: RWY.y,
    heading: 90,
    labelX: (CIRCUIT.baseEnd.x + RWY.thresholdX) / 2 - 6,
    labelY: RWY.y + 14,
    labelOffsetX: 0, labelOffsetY: 6,
  },
};

/* ─── Colour palette ─────────────────────────────────────────────────────── */

const C = {
  // Palette aligned with BrindaleAerodromeChart for a coherent "chart premium"
  // look: medium dark-blue ground, visible runway, legible circuit legs/labels.
  bg:          "#16243A",     // chart background (medium dark blue, not black)
  ground:      "#13203250",   // subtle band over bg, keeps depth without darkening
  runway:      "#4A5A6A",     // chart runway fill
  runwayEdge:  "#33414F",
  runwayStroke:"#8AAFC0",     // chart runway stroke
  centreline:  "#D8EEF8",     // chart centreline (bright)
  thresholdBar:"#A9C4D6",
  thresholdActive:"#FACC15",
  thresholdDim:"#6E8CA4",
  designatorBg:"rgba(10,20,34,0.78)",
  legDefault:  "#5E8AAE",     // normal circuit leg — clearly visible on chart bg
  legHL:       "#FDE047",     // highlighted leg (bright green)
  legActive:   "rgba(52,210,123,0.4)",
  legMuted:    "#2C4258",
  dirArrow:    "#9FC6E2",     // brighter direction arrows
  ownShip:     "#FDE047",
  traffic:     "#F59E0B",
  extendPath:  "#38BDF8",
  orbitRing:   "#38BDF8",
  label:       "#AFC8DA",     // muted-but-legible label
  labelHL:     "#46E089",
  labelTraffic:"#F59E0B",
  intentionBg: { "touch-and-go": "#2A2208", "full-stop": "#2A1A06", "none": "transparent" },
  intentionText:{ "touch-and-go": "#FACC15", "full-stop": "#F59E0B", "none": "transparent" },
} as const;

/* ─── Helpers ────────────────────────────────────────────────────────────────*/

/** Interpolate a position along a leg at fractional progress 0→1. */
function interpolateLeg(leg: CircuitLeg, progress: number): { x: number; y: number } {
  const g = LEG_GEOMETRY[leg];
  const t = Math.max(0, Math.min(1, progress ?? 0.5));
  return {
    x: g.x1 + (g.x2 - g.x1) * t,
    y: g.y1 + (g.y2 - g.y1) * t,
  };
}

const AC_PATH = "M 0,-7 C 1,-6 1.5,-4 1.5,-2 L 8,2 L 6.5,4 L 1.5,2 L 1,5 L 3,6.5 L 3,7.5 L 0,6.5 L -3,7.5 L -3,6.5 L -1,5 L -1.5,2 L -6.5,4 L -8,2 L -1.5,-2 C -1.5,-4 -1,-6 0,-7 Z";

/** Schematic threshold bars perpendicular to runway axis (horizontal runway). */
function ThresholdBarsHorizontal({
  nearX,
  y,
  halfW,
  active,
  side,
}: {
  nearX: number;
  y: number;
  halfW: number;
  active: boolean;
  side: "start" | "end";
}) {
  const barCol = active ? C.thresholdActive : C.thresholdDim;
  const count = 5;
  const gap = 2.2;
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const offset = 6 + i * gap;
        const x = side === "end" ? nearX - offset : nearX + offset;
        return (
          <line
            key={i}
            x1={x}
            y1={y - halfW + 2}
            x2={x}
            y2={y + halfW - 2}
            stroke={barCol}
            strokeWidth={1.1}
            opacity={active ? 0.85 : 0.45}
          />
        );
      })}
    </g>
  );
}

/** Runway surface with centreline, threshold markings, and integrated designator. */
function CircuitRunwaySurface({
  runway,
  showLabels,
  hideDesignator,
  compact,
}: {
  runway: string;
  showLabels: boolean;
  hideDesignator: boolean;
  compact: boolean;
}) {
  const rwyW = RWY.x2 - RWY.x1;
  const designatorX = RWY.thresholdX - 14;

  return (
    <g>
      {/* Edge shadow */}
      <rect
        x={RWY.x1 - 1}
        y={RWY.y - RWY.halfW - 1}
        width={rwyW + 2}
        height={RWY.halfW * 2 + 2}
        fill={C.runwayEdge}
        rx={0.5}
      />
      {/* Runway surface */}
      <rect
        x={RWY.x1}
        y={RWY.y - RWY.halfW}
        width={rwyW}
        height={RWY.halfW * 2}
        fill={C.runway}
        stroke={C.runwayStroke}
        strokeWidth={1}
      />

      {/* Dashed centreline */}
      <line
        x1={RWY.x1 + 16}
        y1={RWY.y}
        x2={RWY.x2 - 28}
        y2={RWY.y}
        stroke={C.centreline}
        strokeWidth={1}
        strokeDasharray="5 4"
        opacity={0.9}
      />

      {/* Inactive threshold (06) */}
      <ThresholdBarsHorizontal
        nearX={RWY.inactiveX}
        y={RWY.y}
        halfW={RWY.halfW}
        active={false}
        side="start"
      />

      {/* Active threshold (24) */}
      <ThresholdBarsHorizontal
        nearX={RWY.thresholdX}
        y={RWY.y}
        halfW={RWY.halfW}
        active
        side="end"
      />

      {/* Integrated designator on runway surface */}
      {showLabels && !hideDesignator && (
        <g>
          <rect
            x={designatorX - (compact ? 8 : 9)}
            y={RWY.y - (compact ? 5 : 6)}
            width={compact ? 16 : 18}
            height={compact ? 10 : 11}
            rx={1.5}
            fill={C.designatorBg}
          />
          <text
            x={designatorX}
            y={RWY.y + (compact ? 2 : 2.5)}
            textAnchor="middle"
            fill={C.thresholdActive}
            fontSize={compact ? 7.5 : 8.5}
            fontFamily="monospace"
            fontWeight="bold"
          >
            {runway}
          </text>
        </g>
      )}
    </g>
  );
}

/* ─── Circuit leg line component ────────────────────────────────────────────*/

interface LegLineProps {
  leg: CircuitLeg;
  highlighted: boolean;
  active: boolean;
  hidden: boolean;
  selectable: boolean;
  onSelect?: () => void;
  showArrows?: boolean;
}

function LegLine({ leg, highlighted, active, hidden, selectable, onSelect, showArrows }: LegLineProps) {
  if (hidden) return null;
  const g = LEG_GEOMETRY[leg];
  const stroke = highlighted ? C.legHL : C.legDefault;
  const sw = highlighted ? 2.5 : 1.5;
  const mx = (g.x1 + g.x2) / 2;
  const my = (g.y1 + g.y2) / 2;

  return (
    <g>
      {/* Hit area for selectable legs */}
      {selectable && (
        <line
          x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}
          stroke="transparent" strokeWidth={18}
          style={{ cursor: "pointer" }}
          onClick={() => onSelect?.()}
        />
      )}
      <line
        x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}
        stroke={stroke} strokeWidth={sw}
        strokeLinecap="round"
      />
      {/* Active path highlight */}
      {active && (
        <line
          x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}
          stroke={C.legHL} strokeWidth={sw + 4} opacity={0.12}
          strokeLinecap="round"
        />
      )}
      {/* Direction arrow on leg */}
      {showArrows && (() => {
        const dx = g.x2 - g.x1;
        const dy = g.y2 - g.y1;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const col = highlighted ? C.legHL : C.dirArrow;
        return (
          <g transform={`translate(${mx},${my}) rotate(${angle})`}>
            <path
              d="M -4,3 L 3,0 L -4,-3"
              fill="none"
              stroke={col}
              strokeWidth={highlighted ? 1.2 : 0.9}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );
      })()}
    </g>
  );
}

/* ─── Aircraft glyph ─────────────────────────────────────────────────────── */

interface CircuitAcGlyphProps {
  ac: CircuitAircraft;
  showLabels: boolean;
  selectable: boolean;
  onSelect?: () => void;
}

function CircuitAcGlyph({ ac, showLabels, selectable, onSelect }: CircuitAcGlyphProps) {
  const pos = interpolateLeg(ac.leg, ac.legProgress ?? 0.5);
  const heading = LEG_GEOMETRY[ac.leg].heading;
  const color = ac.isTraffic ? C.traffic : C.ownShip;
  const scale = 0.75;

  // Sequence badge position (above aircraft)
  const seqY = pos.y - 12;

  return (
    <g
      transform={`translate(${pos.x},${pos.y})`}
      onClick={selectable ? onSelect : undefined}
      style={{ cursor: selectable ? "pointer" : undefined }}
    >
      {selectable && <circle cx={0} cy={0} r={14} fill="transparent" />}
      {ac.isOwnShip && (
        <circle cx={0} cy={0} r={10 * scale} fill={color} opacity={0.12} />
      )}
      <g transform={`rotate(${heading})`}>
        <path
          d={AC_PATH}
          transform={`scale(${scale})`}
          fill={color}
          fillOpacity={0.8}
          stroke={color}
          strokeWidth={0.6 / scale}
          strokeLinejoin="round"
        />
      </g>
      {/* Sequence number badge */}
      {ac.sequence !== undefined && (
        <g transform={`translate(0,${-10 * scale - 5})`}>
          <circle cx={0} cy={0} r={4.5} fill={color} opacity={0.15} />
          <text x={0} y={1.8} textAnchor="middle" fill={color} fontSize={5} fontFamily="monospace" fontWeight="bold">
            {ac.sequence}
          </text>
        </g>
      )}
      {/* Label */}
      {showLabels && ac.label && (
        <text
          x={10 * scale + 3}
          y={2}
          fill={color}
          fontSize={5.5}
          fontFamily="monospace"
          opacity={0.9}
          textAnchor="start"
        >
          {ac.label}
        </text>
      )}
      {/* Traffic-in-sight indicator */}
      {ac.trafficInSight && (
        <text x={0} y={seqY} textAnchor="middle" fill={color} fontSize={4.5} fontFamily="monospace">
          TIS
        </text>
      )}
    </g>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export function CircuitDiagram({
  presetId,
  runway: propRunway,
  circuitDirection: propDirection,
  aircraft: propAircraft,
  highlightedLeg: propHL,
  activeLeg: propActive,
  showLabels: propShowLabels,
  showTraffic: propShowTraffic,
  showDirectionArrows: propShowArrows,
  showExtendPath: propExtend,
  showOrbitMarker: propOrbit,
  intention: propIntention,
  hiddenEntityIds = [],
  selectableEntityIds = [],
  onEntitySelect,
  compact = false,
  className = "",
}: CircuitDiagramProps) {
  const preset: Partial<CircuitDiagramPreset> = presetId
    ? (CIRCUIT_DIAGRAM_PRESETS[presetId] ?? {})
    : {};

  const runway            = propRunway          ?? preset.runway           ?? "24";
  const direction         = propDirection       ?? preset.direction        ?? "left";
  const aircraft          = propAircraft        ?? preset.aircraft         ?? [];
  const highlightedLeg    = propHL              ?? preset.highlightedLeg;
  const activeLeg         = propActive;
  const showLabels        = propShowLabels      ?? preset.showLabels       ?? true;
  const showTraffic       = propShowTraffic     ?? true;
  const showDirectionArrows = propShowArrows    ?? preset.showDirectionArrows ?? true;
  const showExtendPath    = propExtend          ?? preset.showExtendPath   ?? false;
  const showOrbitMarker   = propOrbit           ?? preset.showOrbitMarker  ?? false;
  const intention         = propIntention       ?? preset.intention        ?? "none";

  const isHidden    = (id: string) => hiddenEntityIds.includes(id);
  const isSelectable = (id: string) => selectableEntityIds.includes(id);

  const ALL_LEGS: CircuitLeg[] = ["upwind", "crosswind", "downwind", "base", "final"];

  // Own ship position for orbit / extend reference
  const ownShip = aircraft.find((ac) => ac.isOwnShip);
  const ownPos = ownShip ? interpolateLeg(ownShip.leg, ownShip.legProgress ?? 0.5) : null;

  // Downwind leg extend path: continues past the normal base-turn point
  const extendEndX = CIRCUIT.downwindEnd.x - 32;
  const extendEndY = CIRCUIT.downwindEnd.y;

  const intentionLabel: Record<CircuitIntention, string> = {
    "touch-and-go": "T&G",
    "full-stop":    "FULL STOP",
    "none":         "",
  };

  return (
    <div className={`w-full ${className}`}>
      {/* ── Intention badge ─────────────────────────────── */}
      {intention !== "none" && (
        <div className="mb-1.5 flex justify-center">
          <span
            className="rounded-full px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest"
            style={{
              background: C.intentionBg[intention],
              color: C.intentionText[intention],
              boxShadow: `0 0 0 1px ${C.intentionText[intention]}40`,
            }}
          >
            {intentionLabel[intention]}
          </span>
        </div>
      )}

      {/* ── SVG circuit ─────────────────────────────────── */}
      <svg
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        className="w-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={`Runway ${runway} ${direction}-hand circuit diagram`}
      >
        {/* Background */}
        <rect width={VB.w} height={VB.h} fill={C.bg} />

        {/* Ground area */}
        <rect x={0} y={RWY.y - RWY.halfW - 6} width={VB.w} height={VB.h - (RWY.y - RWY.halfW - 6)} fill={C.ground} />

        {/* ── Runway strip (visual anchor) ──────────────── */}
        <CircuitRunwaySurface
          runway={runway}
          showLabels={showLabels}
          hideDesignator={isHidden("runway-label")}
          compact={compact}
        />

        {/* ── Circuit legs ──────────────────────────────── */}
        {ALL_LEGS.map((leg) => (
          <LegLine
            key={leg}
            leg={leg}
            highlighted={leg === highlightedLeg}
            active={leg === activeLeg}
            hidden={isHidden(leg)}
            selectable={isSelectable(leg)}
            onSelect={() => onEntitySelect?.(leg)}
            showArrows={showDirectionArrows}
          />
        ))}

        {/* ── Corner turn indicators (small arcs at corners) ─ */}
        {/* Upwind → Crosswind (top-right) */}
        <path
          d={`M ${CIRCUIT.upwindEnd.x},${CIRCUIT.upwindEnd.y - 12} A 12,12 0 0,0 ${CIRCUIT.upwindEnd.x - 12},${CIRCUIT.upwindEnd.y - 12 - 0}`}
          fill="none" stroke={C.legDefault} strokeWidth={1.5} strokeLinecap="round"
        />
        {/* Downwind → Base (top-left) */}
        <path
          d={`M ${CIRCUIT.downwindEnd.x + 12},${CIRCUIT.downwindEnd.y} A 12,12 0 0,0 ${CIRCUIT.downwindEnd.x + 12 - 12},${CIRCUIT.downwindEnd.y + 12}`}
          fill="none" stroke={C.legDefault} strokeWidth={1.5} strokeLinecap="round"
        />
        {/* Base → Final (bottom-left) */}
        <path
          d={`M ${CIRCUIT.baseEnd.x},${CIRCUIT.baseEnd.y - 12} A 12,12 0 0,1 ${CIRCUIT.baseEnd.x + 12},${CIRCUIT.baseEnd.y}`}
          fill="none" stroke={C.legDefault} strokeWidth={1.5} strokeLinecap="round"
        />

        {/* ── Leg labels ────────────────────────────────── */}
        {showLabels && ALL_LEGS.map((leg) => {
          if (isHidden(`${leg}-label`)) return null;
          const g = LEG_GEOMETRY[leg];
          const isHL = leg === highlightedLeg;
          return (
            <text
              key={`label-${leg}`}
              x={g.labelX + g.labelOffsetX}
              y={g.labelY + g.labelOffsetY}
              textAnchor="middle"
              fill={isHL ? C.labelHL : C.label}
              fontSize={compact ? 8 : 9.5}
              fontFamily="monospace"
              fontWeight={isHL ? "bold" : 600}
            >
              {leg.toUpperCase()}
            </text>
          );
        })}

        {/* ── Extend-downwind path ─────────────────────── */}
        {showExtendPath && (
          <g opacity={0.8}>
            <defs>
              <marker id="arrow-extend" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 Z" fill={C.extendPath} />
              </marker>
            </defs>
            <line
              x1={CIRCUIT.downwindEnd.x} y1={CIRCUIT.downwindEnd.y}
              x2={extendEndX} y2={extendEndY}
              stroke={C.extendPath}
              strokeWidth={1.5}
              strokeDasharray="5 4"
              markerEnd="url(#arrow-extend)"
            />
            {showLabels && (
              <text
                x={(CIRCUIT.downwindEnd.x + extendEndX) / 2}
                y={CIRCUIT.downwindEnd.y - 6}
                textAnchor="middle"
                fill={C.extendPath}
                fontSize={5.5}
                fontFamily="monospace"
              >
                EXTEND
              </text>
            )}
          </g>
        )}

        {/* ── Orbit marker on own-ship position ────────── */}
        {showOrbitMarker && ownPos && (
          <g opacity={0.7}>
            <circle
              cx={ownPos.x} cy={ownPos.y} r={16}
              fill="none"
              stroke={C.orbitRing}
              strokeWidth={1.2}
              strokeDasharray="4 3"
            />
            {showLabels && (
              <text
                x={ownPos.x + 20} y={ownPos.y + 2}
                fill={C.orbitRing}
                fontSize={5.5}
                fontFamily="monospace"
              >
                ORBIT
              </text>
            )}
          </g>
        )}

        {/* ── Aircraft ──────────────────────────────────── */}
        {aircraft.map((ac) => {
          if (ac.isTraffic && !showTraffic) return null;
          return (
            <CircuitAcGlyph
              key={ac.id}
              ac={ac}
              showLabels={showLabels}
              selectable={isSelectable(ac.id)}
              onSelect={() => onEntitySelect?.(ac.id)}
            />
          );
        })}

        {/* ── Direction label ───────────────────────────── */}
        {showLabels && !compact && (
          <text
            x={14} y={14}
            fill={C.label}
            fontSize={6}
            fontFamily="monospace"
          >
            {direction === "left" ? "LH" : "RH"}
          </text>
        )}
      </svg>
    </div>
  );
}
