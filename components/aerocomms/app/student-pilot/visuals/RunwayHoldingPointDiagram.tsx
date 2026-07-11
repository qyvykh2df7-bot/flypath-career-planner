"use client";

// AeroComms — RunwayHoldingPointDiagram (Student Pilot Alpha, Batch 2B).
//
// A dedicated close-up SVG schematic showing one holding point and the adjacent
// runway. Intentionally separate from HomeAerodromeMap — different viewBox,
// different level of detail.
//
// Progressive difficulty is built into the props API:
//   - start simple (own aircraft, runway clear, all labels)
//   - increase complexity by adding traffic, changing runwayState, hiding labels,
//     marking entities selectable for future exercise renderers
//
// Does NOT decide correct answers — that lives in the exercise renderer.

import type {
  DiagramAircraft,
  HpDiagramPreset,
  InstructionState,
  RunwayState,
} from "@/lib/aerocomms/studentPilotVisuals";
import { HP_DIAGRAM_PRESETS } from "@/lib/aerocomms/studentPilotVisuals";

/* ─── Props ────────────────────────────────────────────────────────────────── */

export interface RunwayHoldingPointDiagramProps {
  /** Load a named preset from HP_DIAGRAM_PRESETS instead of specifying every prop. */
  presetId?: string;
  /** Active runway designator (e.g. "24"). */
  runway?: string;
  /** Holding point to display (e.g. "hp-a1"). */
  holdingPointId?: string;
  /** Aircraft to render: own-ship and/or traffic. */
  aircraft?: DiagramAircraft[];
  /** Runway surface state — drives colour coding. */
  runwayState?: RunwayState;
  /** Current instruction displayed as a badge above the diagram. */
  instructionState?: InstructionState;
  /** Show entity labels (runway designator, holding point name, etc.). */
  showLabels?: boolean;
  /** Show safe / danger zone shading. */
  showSafetyZones?: boolean;
  /** Entity IDs to visually highlight with a green accent ring. */
  highlightedEntityIds?: string[];
  /**
   * Entity IDs to hide. Useful for progressive difficulty
   * (e.g. hide the holding point label for advanced exercises).
   */
  hiddenEntityIds?: string[];
  /**
   * Entity IDs that can be tapped by the student.
   * Enlarges hit area — exercise renderer decides if the tap is correct.
   */
  selectableEntityIds?: string[];
  /** Called when a selectable entity is tapped. */
  onEntitySelect?: (entityId: string) => void;
  /** Compact mode — slightly reduced padding and font sizes. */
  compact?: boolean;
  className?: string;
}

/* ─── Colour palette (matches AeroComms cockpit style) ─────────────────────── */

const C = {
  bg:           "#07111F",
  ground:       "#0A1828",
  groundStroke: "#162030",
  runway:       "#101E34",
  runwayEdge:   "#162840",
  runwayStroke: "#2E5580",
  centreline:   "#4A6882",
  thresholdBar: "#5A7898",
  thresholdActive:"#FACC15",
  thresholdDim: "#2A4060",
  designatorBg: "rgba(7,17,31,0.72)",
  taxiway:      "#2A5070",
  hpBar:        "#9A6010",
  hpBarHL:      "#D97706",
  hpLabel:      "#8B6018",
  hpLabelHL:    "#D97706",
  // Zone fills
  safeZone:     "rgba(250,204,21,0.07)",
  safeZoneEdge: "rgba(250,204,21,0.18)",
  dangerZone:   "rgba(220,38,38,0.08)",
  dangerZoneEdge:"rgba(220,38,38,0.2)",
  // Runway state accents
  rwyAccentClear:     "rgba(250,204,21,0.15)",
  rwyAccentOccupied:  "rgba(245,158,11,0.18)",
  rwyAccentFinal:     "rgba(245,158,11,0.18)",
  rwyAccentLineUp:    "rgba(250,204,21,0.22)",
  rwyAccentCross:     "rgba(250,204,21,0.22)",
  rwyAccentStop:      "rgba(220,38,38,0.25)",
  rwyStroke:          "#234060",
  // Aircraft
  ownShip:   "#FACC15",
  traffic:   "#F59E0B",
  // Final approach arrow
  finalArrow: "#F59E0B",
  finalArrowDim: "#3A3010",
  label:     "#5A7898",
  labelHL:   "#FACC15",
  // Instruction badge
  badgeClear:    { bg: "#2A2208", text: "#FACC15", ring: "rgba(250,204,21,0.3)" },
  badgeHold:     { bg: "#2A1A06", text: "#D97706", ring: "rgba(217,119,6,0.3)" },
  badgeLineUp:   { bg: "#2A2208", text: "#FACC15", ring: "rgba(250,204,21,0.3)" },
  badgeStop:     { bg: "#2A0A0A", text: "#F87171", ring: "rgba(248,113,113,0.3)" },
} as const;

/* ─── ViewBox layout constants ───────────────────────────────────────────────
 * Layout (280 × 180):
 *   Ground / taxiway enters from the left (west).
 *   Runway runs vertically — threshold at bottom (runway 24 = south threshold).
 *   Holding point bar sits just left of the runway edge.
 *
 *   Y-axis: small y = top (north), large y = bottom (south).
 *   The schematic is intentionally oriented threshold-down so the student
 *   sees the runway ahead as they would from a cockpit approaching the holding point.
 */
const VB = { w: 280, h: 180 };

// Runway strip — vertical, centre x=180, half-width 14
const RWY = { cx: 180, halfW: 14, top: 10, bot: VB.h - 10 };

// Holding point — vertical bar at x=160 (HP bar crosses the taxiway just
// before the runway edge at x=166).
const HP = { x: 160, barTop: 72, barBot: 108 };

// Taxiway entry from the left — visually narrower than runway
const TWY = { x1: 10, x2: HP.x + 4, y: 90, strokeWidth: 2.5 };

// Final approach arrow — comes from the right, downward
const FINAL_ARROW = {
  startX: VB.w - 10,
  startY: 30,
  endX: RWY.cx,
  endY: RWY.bot - 20,
};

/* ─── Helpers ────────────────────────────────────────────────────────────────*/

/** Resolve aircraft SVG position from logical DiagramAircraft.position */
function resolveAircraftPos(ac: DiagramAircraft): { x: number; y: number; heading: number } {
  if (ac.position === "custom" && ac.customPos) {
    return { x: ac.customPos.x, y: ac.customPos.y, heading: ac.heading ?? 0 };
  }
  switch (ac.position) {
    case "before-hp":
      return { x: TWY.x2 - 28, y: TWY.y, heading: 90 };
    case "at-hp":
      return { x: HP.x - 2, y: TWY.y, heading: 90 };
    case "on-runway":
      return { x: RWY.cx, y: (RWY.top + RWY.bot) / 2, heading: 180 };
    case "on-final":
      return { x: FINAL_ARROW.startX - 16, y: FINAL_ARROW.startY + 10, heading: 180 };
    case "departing":
      return { x: RWY.cx, y: RWY.top + 20, heading: 0 };
    default:
      return { x: 50, y: 90, heading: 90 };
  }
}

/** Resolve the runway overlay fill colour from state */
function runwayFill(state: RunwayState): string {
  switch (state) {
    case "clear":             return C.rwyAccentClear;
    case "occupied":          return C.rwyAccentOccupied;
    case "traffic-on-final":  return C.rwyAccentFinal;
    case "line-up-authorized": return C.rwyAccentLineUp;
    case "crossing-authorized": return C.rwyAccentCross;
    case "stop":              return C.rwyAccentStop;
  }
}

const INSTRUCTION_LABELS: Record<InstructionState, string | null> = {
  "none":              null,
  "hold-short":        "HOLD SHORT",
  "line-up-wait":      "LINE UP AND WAIT",
  "cleared-takeoff":   "CLEARED TAKEOFF",
  "cleared-cross":     "CLEARED TO CROSS",
  "cleared-land":      "CLEARED TO LAND",
  "go-around":         "GO AROUND",
};

function instructionBadgeStyle(state: InstructionState) {
  switch (state) {
    case "hold-short":
    case "none":
      return C.badgeHold;
    case "line-up-wait":
    case "cleared-cross":
    case "cleared-land":
    case "cleared-takeoff":
      return C.badgeClear;
    case "go-around":
      return C.badgeStop;
    default:
      return C.badgeStop;
  }
}

/** Schematic threshold bars — lightweight stripes near a runway end. */
function ThresholdBars({
  cross,
  halfSpan,
  active,
  side,
}: {
  cross: number;
  halfSpan: number;
  active: boolean;
  side: "start" | "end";
}) {
  const barCol = active ? C.thresholdActive : C.thresholdDim;
  const count = 5;
  const gap = 2.2;
  const barLen = halfSpan * 2 - 4;

  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const offset = 6 + i * gap;
        const y =
          side === "end"
            ? RWY.bot - offset
            : RWY.top + offset;
        return (
          <rect
            key={i}
            x={cross - halfSpan + 2}
            y={y}
            width={barLen}
            height={1.1}
            fill={barCol}
            opacity={active ? 0.85 : 0.45}
          />
        );
      })}
    </g>
  );
}

/** Runway surface, centreline, threshold markings, and integrated designator. */
function RunwaySurface({
  runway,
  runwayState,
  showLabels,
  hideDesignator,
  compact,
}: {
  runway: string;
  runwayState: RunwayState;
  showLabels: boolean;
  hideDesignator: boolean;
  compact: boolean;
}) {
  const activeThreshold =
    runwayState === "clear" ||
    runwayState === "line-up-authorized" ||
    runwayState === "crossing-authorized";
  const designatorActive = activeThreshold;
  const designatorY = RWY.bot - 20;

  return (
    <g>
      {/* Runway edge shadow — separates runway from ground */}
      <rect
        x={RWY.cx - RWY.halfW - 1}
        y={RWY.top - 1}
        width={RWY.halfW * 2 + 2}
        height={RWY.bot - RWY.top + 2}
        fill={C.runwayEdge}
        rx={0.5}
      />
      {/* Runway surface */}
      <rect
        x={RWY.cx - RWY.halfW}
        y={RWY.top}
        width={RWY.halfW * 2}
        height={RWY.bot - RWY.top}
        fill={C.runway}
        stroke={C.runwayStroke}
        strokeWidth={1}
      />

      {/* Runway state tint */}
      <rect
        x={RWY.cx - RWY.halfW + 1}
        y={RWY.top + 1}
        width={RWY.halfW * 2 - 2}
        height={RWY.bot - RWY.top - 2}
        fill={runwayFill(runwayState)}
      />

      {/* Dashed centreline — full axis, inset from ends */}
      <line
        x1={RWY.cx}
        y1={RWY.top + 10}
        x2={RWY.cx}
        y2={RWY.bot - 28}
        stroke={C.centreline}
        strokeWidth={1}
        strokeDasharray="5 4"
        opacity={0.9}
      />

      {/* Inactive threshold (06 / far end) */}
      <ThresholdBars
        cross={RWY.cx}
        halfSpan={RWY.halfW}
        active={false}
        side="start"
      />

      {/* Active threshold bars (24) */}
      <ThresholdBars
        cross={RWY.cx}
        halfSpan={RWY.halfW}
        active={activeThreshold}
        side="end"
      />

      {/* Integrated runway designator on surface */}
      {showLabels && !hideDesignator && (
        <g>
          <rect
            x={RWY.cx - (compact ? 9 : 10)}
            y={designatorY - (compact ? 7 : 8)}
            width={compact ? 18 : 20}
            height={compact ? 10 : 11}
            rx={1.5}
            fill={C.designatorBg}
          />
          <text
            x={RWY.cx}
            y={designatorY}
            textAnchor="middle"
            fill={designatorActive ? C.thresholdActive : C.label}
            fontSize={compact ? 8 : 9}
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

/* ─── Top-down aircraft shape (reused from AircraftMarker path) ─────────────*/
const AC_PATH = "M 0,-7 C 1,-6 1.5,-4 1.5,-2 L 8,2 L 6.5,4 L 1.5,2 L 1,5 L 3,6.5 L 3,7.5 L 0,6.5 L -3,7.5 L -3,6.5 L -1,5 L -1.5,2 L -6.5,4 L -8,2 L -1.5,-2 C -1.5,-4 -1,-6 0,-7 Z";

interface AcGlyphProps {
  x: number;
  y: number;
  heading: number;
  color: string;
  scale?: number;
  active?: boolean;
  label?: string;
  labelAbove?: boolean;
  selectable?: boolean;
  onSelect?: () => void;
}

function AcGlyph({ x, y, heading, color, scale = 0.85, active = false, label, labelAbove, selectable, onSelect }: AcGlyphProps) {
  return (
    <g
      transform={`translate(${x},${y})`}
      onClick={selectable ? onSelect : undefined}
      style={{ cursor: selectable ? "pointer" : undefined }}
    >
      {/* Enlarged hit area for future exercise interaction */}
      {selectable && (
        <circle cx={0} cy={0} r={16} fill="transparent" />
      )}
      {active && (
        <circle cx={0} cy={0} r={11 * scale} fill={color} opacity={0.12} />
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
      {label && (
        <text
          x={10 * scale + 3}
          y={labelAbove ? -(10 * scale + 3) : 2}
          fill={color}
          fontSize={6}
          fontFamily="monospace"
          opacity={0.9}
          textAnchor="start"
        >
          {label}
        </text>
      )}
    </g>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export function RunwayHoldingPointDiagram({
  presetId,
  runway: propRunway,
  holdingPointId: propHp,
  aircraft: propAircraft,
  runwayState: propRwyState,
  instructionState: propInstruction,
  showLabels: propShowLabels,
  showSafetyZones: propSafetyZones,
  highlightedEntityIds = [],
  hiddenEntityIds = [],
  selectableEntityIds = [],
  onEntitySelect,
  compact = false,
  className = "",
}: RunwayHoldingPointDiagramProps) {
  // Merge preset with direct props (direct props win)
  const preset: Partial<HpDiagramPreset> = presetId ? (HP_DIAGRAM_PRESETS[presetId] ?? {}) : {};

  const runway         = propRunway         ?? preset.runway          ?? "24";
  const holdingPointId = propHp             ?? preset.holdingPointId  ?? "hp-a1";
  const aircraft       = propAircraft       ?? preset.aircraft        ?? [];
  const runwayState    = propRwyState       ?? preset.runwayState     ?? "clear";
  const instructionState = propInstruction  ?? preset.instructionState ?? "none";
  const showLabels     = propShowLabels     ?? preset.showLabels      ?? true;
  const showSafetyZones = propSafetyZones   ?? preset.showSafetyZones ?? true;

  const hpLabel = holdingPointId === "hp-b1" ? "B1" : "A1";
  const isHL = (id: string) => highlightedEntityIds.includes(id);
  const isHidden = (id: string) => hiddenEntityIds.includes(id);
  const isSelectable = (id: string) => selectableEntityIds.includes(id);

  const instrLabel = INSTRUCTION_LABELS[instructionState];
  const instrStyle = instructionBadgeStyle(instructionState);

  const hasFinalTraffic = aircraft.some((ac) => ac.position === "on-final");
  const hasRunwayOccupied = aircraft.some((ac) => ac.position === "on-runway");

  return (
    <div className={`w-full ${className}`}>
      {/* ── Instruction badge ──────────────────────────────── */}
      {instrLabel && (
        <div className="mb-1.5 flex justify-center">
          <span
            className="rounded-full px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest"
            style={{
              background: instrStyle.bg,
              color: instrStyle.text,
              boxShadow: `0 0 0 1px ${instrStyle.ring}`,
            }}
          >
            {instrLabel}
          </span>
        </div>
      )}

      {/* ── SVG diagram ────────────────────────────────────── */}
      <svg
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        className="w-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={`Runway ${runway} holding point diagram`}
      >
        {/* Background */}
        <rect width={VB.w} height={VB.h} fill={C.bg} />

        {/* Ground surface */}
        <rect x={0} y={TWY.y - 18} width={VB.w} height={36}
          fill={C.ground} />

        {/* Taxiway line — narrower than runway */}
        <line x1={TWY.x1} y1={TWY.y} x2={TWY.x2} y2={TWY.y}
          stroke={C.taxiway} strokeWidth={TWY.strokeWidth} />

        {/* ── Safe / danger zone shading ─────────────────── */}
        {showSafetyZones && (
          <>
            {/* Safe zone: taxiway side of holding point */}
            <rect
              x={0} y={TWY.y - 18}
              width={HP.x + 2} height={36}
              fill={C.safeZone}
            />
            {/* Danger zone: runway side of holding point */}
            <rect
              x={HP.x + 2} y={0}
              width={VB.w - HP.x - 2} height={VB.h}
              fill={runwayState === "clear" || runwayState === "line-up-authorized" || runwayState === "crossing-authorized"
                ? "transparent" : C.dangerZone}
            />
          </>
        )}

        {/* ── Runway strip ───────────────────────────────── */}
        <RunwaySurface
          runway={runway}
          runwayState={runwayState}
          showLabels={showLabels}
          hideDesignator={isHidden("runway-label")}
          compact={compact}
        />

        {/* ── Holding point bar ──────────────────────────── */}
        {!isHidden(holdingPointId) && (
          <line
            x1={HP.x}
            y1={HP.barTop}
            x2={HP.x}
            y2={HP.barBot}
            stroke={isHL(holdingPointId) ? C.hpBarHL : C.hpBar}
            strokeWidth={isHL(holdingPointId) ? 2.5 : 2}
            strokeDasharray="3 2"
          />
        )}

        {/* Optional selectable hit zone for holding point */}
        {isSelectable(holdingPointId) && (
          <rect
            x={HP.x - 8} y={HP.barTop}
            width={16} height={HP.barBot - HP.barTop}
            fill="transparent"
            style={{ cursor: "pointer" }}
            onClick={() => onEntitySelect?.(holdingPointId)}
          />
        )}

        {/* ── Holding point label ────────────────────────── */}
        {showLabels && !isHidden(`${holdingPointId}-label`) && (
          <text
            x={HP.x - 6}
            y={HP.barTop - 4}
            fill={isHL(holdingPointId) ? C.hpLabelHL : C.hpLabel}
            fontSize={compact ? 7 : 8}
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="middle"
          >
            {hpLabel}
          </text>
        )}

        {/* ── Final approach arrow ───────────────────────── */}
        {(hasFinalTraffic || runwayState === "traffic-on-final") && (
          <g opacity={0.85}>
            <defs>
              <marker id="arrow-final" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 Z" fill={C.finalArrow} />
              </marker>
            </defs>
            {/* Curved approach path from right */}
            <path
              d={`M ${FINAL_ARROW.startX},${FINAL_ARROW.startY} Q ${RWY.cx + 40},${RWY.bot - 60} ${RWY.cx},${RWY.bot - 26}`}
              fill="none"
              stroke={C.finalArrow}
              strokeWidth={1.5}
              strokeDasharray="5 3"
              markerEnd="url(#arrow-final)"
            />
            {showLabels && (
              <text
                x={FINAL_ARROW.startX - 4}
                y={FINAL_ARROW.startY - 4}
                textAnchor="end"
                fill={C.finalArrow}
                fontSize={6}
                fontFamily="monospace"
              >
                FINAL
              </text>
            )}
          </g>
        )}

        {/* ── Aircraft ───────────────────────────────────── */}
        {aircraft.map((ac) => {
          const resolved = resolveAircraftPos(ac);
          const color = ac.isTraffic ? C.traffic : C.ownShip;
          return (
            <AcGlyph
              key={ac.id}
              x={resolved.x}
              y={resolved.y}
              heading={resolved.heading}
              color={color}
              active={ac.isOwnShip}
              label={showLabels ? (ac.label ?? undefined) : undefined}
              selectable={isSelectable(ac.id)}
              onSelect={() => onEntitySelect?.(ac.id)}
            />
          );
        })}

        {/* ── Runway occupancy label ─────────────────────── */}
        {showLabels && hasRunwayOccupied && (
          <text
            x={RWY.cx}
            y={(RWY.top + RWY.bot) / 2 + 14}
            textAnchor="middle"
            fill="#F59E0B"
            fontSize={5.5}
            fontFamily="monospace"
          >
            OCCUPIED
          </text>
        )}

        {/* ── North indicator ────────────────────────────── */}
        {!compact && (
          <g transform="translate(14,14)">
            <line x1={0} y1={6} x2={0} y2={-6} stroke={C.label} strokeWidth={1} />
            <path d="M -2,1 L 0,-6 L 2,1" fill={C.label} />
            <text x={0} y={12} textAnchor="middle" fill={C.label} fontSize={5} fontFamily="sans-serif">N</text>
          </g>
        )}
      </svg>
    </div>
  );
}
