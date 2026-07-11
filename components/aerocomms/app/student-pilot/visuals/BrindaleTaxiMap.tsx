"use client";

// AeroComms — BrindaleTaxiMap (Student Pilot Alpha, Taxi & Ground Movement).
// Stand-alone SVG renderer for Brindale Taxi Map v2 geometry.
// viewBox 300 × 500, portrait / mobile-first.
//
// Crossing rule:
//   Only B1–C1 (x=118) and B2–C2 (x=178) corridors traverse the runway.
//   Both are bidirectional; active direction belongs to the route/instruction.
//   A1 is a departure holding point on Alfa — NOT a runway entry.
//
// This component is a pure renderer. It knows nothing about correct answers
// or exercise logic. All interactive state is passed in via props.

import { TAXI_MAP_V2 } from "@/lib/aerocomms/studentPilotVisuals";
import type { TaxiCorridorId } from "@/lib/aerocomms/studentPilotVisuals";

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export interface TrafficMarker {
  nodeId: string;
  label?: string;
  /** Cardinal direction of travel — used to orient the arrow icon. */
  direction?: "n" | "s" | "e" | "w";
}

export interface BrindaleTaxiMapProps {
  /** Zoom preset. "focused" zooms into the corridor area. Default: "overview". */
  view?: "overview" | "focused";
  /** Which subregion to show when view="focused". Default: "b1-c1". */
  focusArea?: "b1-c1" | "b2-c2" | "d1";
  /** Segment IDs to highlight as the current route (green). */
  activeSegmentIds?: string[];
  /** Segment IDs the learner has selected (cyan). */
  selectedSegmentIds?: string[];
  /** Segment IDs that are tappable in this exercise step. */
  selectableSegmentIds?: string[];
  /** Per-segment feedback status after Check. */
  segmentStatuses?: Record<string, "correct" | "incorrect" | "warning">;
  /** Show a clearance-limit flag at this node. */
  clearanceLimitNodeId?: string;
  /** Show a hold-position bar at this node. */
  holdNodeId?: string;
  /** Node IDs that are tappable (for node-selection exercises). */
  selectableNodeIds?: string[];
  /** Corridors with explicit ATC authorisation (green solid). */
  authorizedCorridorIds?: TaxiCorridorId[];
  /** Corridors explicitly blocked / unauthorised (red). */
  blockedCorridorIds?: TaxiCorridorId[];
  /** Own-ship node ID. */
  aircraftNodeId?: string;
  /** Secondary traffic markers. */
  traffic?: TrafficMarker[];
  /** Called when a selectable segment is tapped. */
  onSegmentSelect?: (id: string) => void;
  /** Called when a selectable node is tapped. */
  onNodeSelect?: (id: string) => void;
  /** Show taxiway / node labels. Default: true. */
  showLabels?: boolean;
  /** Extra classes on the outer div. */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Colour tokens
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bg:              "#243244", // chart surface — medium blue-grey, clearly above app navy
  chartBorder:     "#556A7E", // outer map edge
  apronFill:       "#314157",
  apronStroke:     "#5E758C",
  trainingFill:    "#2A3848",
  rwyFill:         "#465365", // runway surface
  rwyStroke:       "#6E8094",
  rwyCl:           "#D8E2EC", // runway centreline (dashed, near-white)
  rwyMark:         "#F0F4F8", // threshold bars + designators
  twyLine:         "#5A687A", // taxiway base stroke
  twyCl:           "#FDE047", // luminous yellow centreline
  standFill:       "#364558",
  standStroke:     "#6E8498",
  connStub:        "#5A687A",
  hpAmber:         "#FBBF24",
  hpAmberDim:      "#D97706",
  junctionCyan:    "#38BDF8",
  corrBase:        "#788898",
  corrAuth:        "#EAB308", // slightly deeper green for lighter bg
  corrBlocked:     "#DC2626",
  active:          "#EAB308",
  activeGlow:      "rgba(22,163,74,0.32)",
  selected:        "#0EA5E9", // slightly deeper cyan
  correct:         "#EAB308",
  incorrect:       "#DC2626",
  warning:         "#D97706",
  ownShip:         "#EAB308",
  trafficMark:     "#D97706",
  clLimit:         "#D97706",
  holdRed:         "#DC2626",
  labelMuted:      "#A8B8C8", // secondary — light grey, not dark
  labelVis:        "#C8D4E0", // stands
  labelBright:     "#F8FAFC", // primary — near white
  apronLabel:      "#B8C8D8",
  pillBg:          "rgba(12,20,32,0.82)",
  pillHpBg:        "rgba(28,18,4,0.88)",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Geometry constants (all in 300 × 500 viewBox space)
// ─────────────────────────────────────────────────────────────────────────────

// Runway 06/24 — gentle diagonal (~10° slope).
// Center y: 222 at x=15 (06 end), 204 at x=285 (24 end). halfWidth = 10.
// Polygon corners: TL, TR, BR, BL.
const RWY_POLY = "15,212 285,194 285,214 15,232";

// At x=118: runway center y ≈ 215, so bottom edge ≈ 225, top edge ≈ 205.
// At x=178: runway center y ≈ 211, so bottom edge ≈ 221, top edge ≈ 201.
const B1C1_RWY_BOTTOM = 225; // y where B1–C1 corridor exits the runway (south side)
const B1C1_RWY_TOP    = 205; // y where B1–C1 corridor exits the runway (north side)
const B2C2_RWY_BOTTOM = 221;
const B2C2_RWY_TOP    = 201;

// Focused viewBox presets (zoom into the crossing area).
const FOCUSED_VB: Record<string, string> = {
  "b1-c1": "55 90 185 185",
  "b2-c2": "110 90 185 185",
  "d1":    "20 240 150 110",
};

// Stand x-positions on main apron (Stands 1–6)
const STAND_X = [82, 106, 130, 154, 178, 202];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function ptsStr(pairs: [number, number][]): string {
  return pairs.map(([x, y]) => `${x},${y}`).join(" ");
}

function segPath(points: Array<{ x: number; y: number }>): string {
  return `M ${points.map((p) => `${p.x} ${p.y}`).join(" L ")}`;
}

function getNodePos(id: string): { x: number; y: number } | undefined {
  return TAXI_MAP_V2.nodes[id]?.pos;
}

/** Rounded label capsule for readable mobile typography. */
function LabelCapsule({
  x,
  y,
  text,
  fontSize,
  fill = C.labelBright,
  anchor = "middle",
  pillFill = C.pillBg,
  bold = true,
  guideTo,
  pillOpacity = 1,
}: {
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fill?: string;
  anchor?: "start" | "middle" | "end";
  pillFill?: string;
  bold?: boolean;
  /** Optional anchor point on the map — draws a short dashed leader line. */
  guideTo?: { x: number; y: number };
  pillOpacity?: number;
}) {
  const padX = fontSize * 0.55;
  const padY = fontSize * 0.38;
  const textW = text.length * fontSize * 0.58;
  const pillW = textW + padX * 2;
  const pillH = fontSize + padY * 2;
  let pillX = x - pillW / 2;
  if (anchor === "start") pillX = x - padX;
  if (anchor === "end") pillX = x - pillW + padX;
  const pillY = y - fontSize - padY + 1;
  const pillCx = pillX + pillW / 2;
  const pillCy = pillY + pillH / 2;
  return (
    <g>
      {guideTo && (
        <line
          x1={pillCx}
          y1={pillCy}
          x2={guideTo.x}
          y2={guideTo.y}
          stroke={C.labelMuted}
          strokeWidth={0.75}
          strokeDasharray="2,2"
          opacity={0.5}
        />
      )}
      <rect
        x={pillX}
        y={pillY}
        width={pillW}
        height={pillH}
        rx={pillH / 2}
        fill={pillFill}
        fillOpacity={pillOpacity}
      />
      <text
        x={x}
        y={y}
        fill={fill}
        fontSize={fontSize}
        fontWeight={bold ? "bold" : "normal"}
        textAnchor={anchor}
      >
        {text}
      </text>
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function BrindaleTaxiMap({
  view = "overview",
  focusArea = "b1-c1",
  activeSegmentIds = [],
  selectedSegmentIds = [],
  selectableSegmentIds = [],
  segmentStatuses = {},
  clearanceLimitNodeId,
  holdNodeId,
  selectableNodeIds = [],
  authorizedCorridorIds = [],
  blockedCorridorIds = [],
  aircraftNodeId,
  traffic = [],
  onSegmentSelect,
  onNodeSelect,
  showLabels = true,
  className = "",
}: BrindaleTaxiMapProps) {
  const isFocused = view === "focused";
  const fs = {
    twy:     isFocused ? 10.5 : 9,
    hp:      isFocused ? 11   : 9.5,
    hpOp:    isFocused ? 10   : 9,   // D1 junction
    apron:   isFocused ? 9.5  : 8.5,
    stand:   isFocused ? 8.5  : 7.5,
    rwy:     isFocused ? 10   : 9,
    corr:    isFocused ? 10   : 8,
  };
  const corridorW = isFocused ? 4 : 2.75;
  const twyW = { alfa: isFocused ? 9 : 8, bravo: isFocused ? 8 : 7, delta: isFocused ? 7 : 6 };

  const viewBox =
    view === "focused"
      ? (FOCUSED_VB[focusArea] ?? FOCUSED_VB["b1-c1"])
      : "0 0 300 500";

  /** Corridor name labels — overview only when corridor has active state; focused always for target area. */
  function showCorridorLabel(cid: TaxiCorridorId): boolean {
    if (isFocused) {
      if (focusArea === "b1-c1" && cid === "b1-c1") return true;
      if (focusArea === "b2-c2" && cid === "b2-c2") return true;
      return false;
    }
    const segId = cid === "b1-c1" ? "seg-cross-b1c1" : "seg-cross-b2c2";
    return (
      authorizedCorridorIds.includes(cid) ||
      blockedCorridorIds.includes(cid) ||
      activeSegmentIds.includes(segId) ||
      selectedSegmentIds.includes(segId) ||
      segmentStatuses[segId] != null
    );
  }

  // ── Segment visual state ────────────────────────────────────────────────

  function segStatusColor(id: string): string | null {
    if (segmentStatuses[id] === "correct")   return C.correct;
    if (segmentStatuses[id] === "incorrect") return C.incorrect;
    if (segmentStatuses[id] === "warning")   return C.warning;
    if (activeSegmentIds.includes(id))       return C.active;
    if (selectedSegmentIds.includes(id))     return C.selected;
    return null;
  }

  // ── Corridor visual state ───────────────────────────────────────────────

  function corridorStroke(cid: TaxiCorridorId): string {
    const segId = cid === "b1-c1" ? "seg-cross-b1c1" : "seg-cross-b2c2";
    const sc = segStatusColor(segId);
    if (sc) return sc;
    if (authorizedCorridorIds.includes(cid)) return C.corrAuth;
    if (blockedCorridorIds.includes(cid))    return C.corrBlocked;
    return C.corrBase;
  }

  function corridorDash(cid: TaxiCorridorId): string | undefined {
    const segId = cid === "b1-c1" ? "seg-cross-b1c1" : "seg-cross-b2c2";
    if (
      authorizedCorridorIds.includes(cid) ||
      activeSegmentIds.includes(segId) ||
      selectedSegmentIds.includes(segId) ||
      segmentStatuses[segId] === "correct"
    ) return undefined;
    if (blockedCorridorIds.includes(cid)) return "3,2";
    return "5,4";
  }

  function corridorGlow(cid: TaxiCorridorId): boolean {
    const segId = cid === "b1-c1" ? "seg-cross-b1c1" : "seg-cross-b2c2";
    return (
      authorizedCorridorIds.includes(cid) ||
      activeSegmentIds.includes(segId) ||
      segmentStatuses[segId] === "correct"
    );
  }

  // ── Render a single interactive segment overlay ─────────────────────────

  function renderSegmentOverlay(segId: string) {
    // Corridors are rendered separately in their own layer.
    if (segId === "seg-cross-b1c1" || segId === "seg-cross-b2c2") return null;
    const seg = TAXI_MAP_V2.segments[segId];
    if (!seg) return null;
    const d = segPath(seg.points);
    const color = segStatusColor(segId);
    const isSelectable = selectableSegmentIds.includes(segId);
    if (!color && !isSelectable) return null;

    return (
      <g key={segId}>
        {color && (
          <>
            {/* Glow halo */}
            <path d={d} fill="none" stroke={C.activeGlow} strokeWidth={isFocused ? 12 : 10} strokeLinecap="round" />
            {/* Coloured line */}
            <path d={d} fill="none" stroke={color} strokeWidth={isFocused ? 4 : 3.5} strokeLinecap="round" />
          </>
        )}
        {isSelectable && !color && (
          /* Dashed selectable indicator */
          <path
            d={d}
            fill="none"
            stroke={C.selected}
            strokeWidth={2}
            strokeDasharray="5,4"
            strokeLinecap="round"
            opacity={0.6}
          />
        )}
        {/* Invisible wide touch target */}
        {isSelectable && (
          <path
            d={d}
            fill="none"
            stroke="transparent"
            strokeWidth={24}
            strokeLinecap="round"
            style={{ cursor: "pointer" }}
            onClick={() => onSegmentSelect?.(segId)}
          />
        )}
      </g>
    );
  }

  // Collect all segment IDs that need an overlay
  const overlaySegIds = [
    ...new Set([
      ...selectableSegmentIds,
      ...activeSegmentIds,
      ...selectedSegmentIds,
      ...Object.keys(segmentStatuses),
    ]),
  ];

  // Clearance-limit flag
  const clPos = clearanceLimitNodeId ? getNodePos(clearanceLimitNodeId) : undefined;
  // Hold-position bar
  const holdPos = holdNodeId ? getNodePos(holdNodeId) : undefined;
  // Own-ship
  const shipPos = aircraftNodeId ? getNodePos(aircraftNodeId) : undefined;

  return (
    <div className={`relative w-full leading-none ${className}`}>
      <svg
        viewBox={viewBox}
        width="100%"
        style={{ display: "block", minHeight: isFocused ? 220 : 340 }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* ── L0: Background ───────────────────────────────────────────── */}
        <rect width={300} height={500} fill={C.bg} stroke={C.chartBorder} strokeWidth={1} />

        {/* ── L1: Aprons ───────────────────────────────────────────────── */}
        {/* Secondary apron */}
        <rect x={52} y={22} width={185} height={65} fill={C.apronFill} stroke={C.apronStroke} strokeWidth={1.25} rx={2} />
        {/* Training area (east portion of secondary apron) */}
        <rect x={192} y={24} width={43} height={61} fill={C.trainingFill} stroke={C.apronStroke} strokeWidth={1} rx={1} />
        {/* Main apron */}
        <rect x={52} y={332} width={185} height={72} fill={C.apronFill} stroke={C.apronStroke} strokeWidth={1.25} rx={2} />

        {/* ── L2: Stand rectangles ─────────────────────────────────────── */}
        {/* Main apron stands 1–6 */}
        {STAND_X.map((x, i) => (
          <rect key={i} x={x - 10} y={340} width={20} height={24}
            fill={C.standFill} stroke={C.standStroke} strokeWidth={1} rx={1} />
        ))}
        {/* Secondary apron stands 7–8 */}
        <rect x={85}  y={32} width={20} height={22} fill={C.standFill} stroke={C.standStroke} strokeWidth={1} rx={1} />
        <rect x={138} y={32} width={20} height={22} fill={C.standFill} stroke={C.standStroke} strokeWidth={1} rx={1} />

        {/* ── L3: Taxiway base lines ────────────────────────────────────── */}
        {/* Alfa (y=300, south network, east–west) */}
        <line x1={20}  y1={300} x2={272} y2={300} stroke={C.twyLine} strokeWidth={twyW.alfa} strokeLinecap="round" />
        <line x1={20}  y1={300} x2={272} y2={300} stroke={C.twyCl}   strokeWidth={1.25} strokeDasharray="6,4" />
        {/* Bravo (y=258, south of runway, east–west — does NOT cross runway) */}
        <line x1={52}  y1={258} x2={242} y2={258} stroke={C.twyLine} strokeWidth={twyW.bravo} strokeLinecap="round" />
        <line x1={52}  y1={258} x2={242} y2={258} stroke={C.twyCl}   strokeWidth={1.25} strokeDasharray="6,4" />
        {/* Charlie (y=120, north of runway, east–west — does NOT cross runway) */}
        <line x1={52}  y1={120} x2={242} y2={120} stroke={C.twyLine} strokeWidth={twyW.bravo} strokeLinecap="round" />
        <line x1={52}  y1={120} x2={242} y2={120} stroke={C.twyCl}   strokeWidth={1.25} strokeDasharray="6,4" />
        {/* Delta (x=65, south alternative: Alfa→D1→Bravo, does NOT cross runway) */}
        <polyline points={ptsStr([[65, 300], [65, 279], [65, 258]])}
          fill="none" stroke={C.twyLine} strokeWidth={twyW.delta} strokeLinecap="round" />
        <polyline points={ptsStr([[65, 300], [65, 279], [65, 258]])}
          fill="none" stroke={C.twyCl}   strokeWidth={1.1} strokeDasharray="5,4" />

        {/* ── L4: Stand / apron connector stubs ────────────────────────── */}
        {/* Main apron stubs: apron top (y=332) → Alfa (y=300) */}
        {STAND_X.map((x, i) => (
          <line key={i} x1={x} y1={332} x2={x} y2={300} stroke={C.connStub} strokeWidth={3} />
        ))}
        {/* Secondary apron stubs: apron bottom (y=87) → Charlie (y=120) */}
        <line x1={95}  y1={87} x2={95}  y2={120} stroke={C.connStub} strokeWidth={3} />
        <line x1={148} y1={87} x2={148} y2={120} stroke={C.connStub} strokeWidth={3} />
        <line x1={200} y1={87} x2={200} y2={120} stroke={C.connStub} strokeWidth={2.5} />

        {/* ── L5: Runway 06/24 ─────────────────────────────────────────── */}
        {/* Surface polygon — gentle diagonal */}
        <polygon points={RWY_POLY} fill={C.rwyFill} stroke={C.rwyStroke} strokeWidth={1.75} />
        {/* Centreline (dashed) */}
        <line x1={15} y1={222} x2={285} y2={204}
          stroke={C.rwyCl} strokeWidth={1.5} strokeDasharray="10,7" />
        {/* Threshold bars 06 (left end) */}
        <line x1={18} y1={213} x2={18} y2={231} stroke={C.rwyMark} strokeWidth={2.5} />
        <line x1={24} y1={213} x2={24} y2={231} stroke={C.rwyMark} strokeWidth={2.5} />
        <line x1={30} y1={213} x2={30} y2={231} stroke={C.rwyMark} strokeWidth={2.5} />
        {/* Threshold bars 24 (right end) */}
        <line x1={270} y1={195} x2={270} y2={213} stroke={C.rwyMark} strokeWidth={2.5} />
        <line x1={276} y1={195} x2={276} y2={213} stroke={C.rwyMark} strokeWidth={2.5} />
        <line x1={282} y1={195} x2={282} y2={213} stroke={C.rwyMark} strokeWidth={2.5} />

        {/* ── L6: Active / selected segment overlays ───────────────────── */}
        <g>{overlaySegIds.map((id) => renderSegmentOverlay(id))}</g>

        {/* ── L7: Crossing corridors (drawn over runway) ───────────────── */}
        {/* Only B1–C1 and B2–C2 are allowed to traverse the runway. */}
        {(["b1-c1", "b2-c2"] as TaxiCorridorId[]).map((cid) => {
          const x      = cid === "b1-c1" ? 118 : 178;
          const segId  = cid === "b1-c1" ? "seg-cross-b1c1" : "seg-cross-b2c2";
          const stroke = corridorStroke(cid);
          const dash   = corridorDash(cid);
          const glow   = corridorGlow(cid);
          const isSel  = selectableSegmentIds.includes(segId);
          const rwyBot = cid === "b1-c1" ? B1C1_RWY_BOTTOM : B2C2_RWY_BOTTOM;
          const rwyTop = cid === "b1-c1" ? B1C1_RWY_TOP    : B2C2_RWY_TOP;
          return (
            <g key={cid}>
              {/* Glow halo when authorised or active */}
              {glow && (
                <line x1={x} y1={258} x2={x} y2={120}
                  stroke={C.activeGlow} strokeWidth={isFocused ? 14 : 11} />
              )}
              {/* Full corridor line from B (y=258) through runway to C (y=120) */}
              <line
                x1={x} y1={258} x2={x} y2={120}
                stroke={stroke}
                strokeWidth={corridorW}
                strokeDasharray={dash}
                strokeLinecap="round"
              />
              {/* Tick marks at runway edge crossings — indicate this is a crossing */}
              <line x1={x - 6} y1={rwyBot} x2={x + 6} y2={rwyBot}
                stroke={stroke} strokeWidth={2.5} />
              <line x1={x - 6} y1={rwyTop} x2={x + 6} y2={rwyTop}
                stroke={stroke} strokeWidth={2.5} />
              {/* Touch target */}
              {isSel && (
                <line x1={x} y1={258} x2={x} y2={120}
                  stroke="transparent" strokeWidth={24}
                  strokeLinecap="round"
                  style={{ cursor: "pointer" }}
                  onClick={() => onSegmentSelect?.(segId)}
                />
              )}
            </g>
          );
        })}

        {/* ── L8: Holding-point markers ─────────────────────────────────── */}
        {/* A1 — vertical bar on Alfa (departure holding, NOT runway entry) */}
        <line x1={260} y1={293} x2={260} y2={307} stroke={C.hpAmber}    strokeWidth={isFocused ? 4.5 : 4} strokeLinecap="round" />
        <line x1={255} y1={293} x2={255} y2={307} stroke={C.hpAmberDim} strokeWidth={2} strokeLinecap="round" />
        {/* B1 — diamond on Bravo south side */}
        <polygon points={ptsStr([[118, 252], [124, 258], [118, 264], [112, 258]])}
          fill={C.hpAmber} fillOpacity={0.18} stroke={C.hpAmber} strokeWidth={isFocused ? 2.5 : 2.25} />
        {/* B2 — diamond on Bravo */}
        <polygon points={ptsStr([[178, 252], [184, 258], [178, 264], [172, 258]])}
          fill={C.hpAmber} fillOpacity={0.18} stroke={C.hpAmber} strokeWidth={isFocused ? 2.5 : 2.25} />
        {/* C1 — diamond on Charlie north side */}
        <polygon points={ptsStr([[118, 114], [124, 120], [118, 126], [112, 120]])}
          fill={C.hpAmber} fillOpacity={0.18} stroke={C.hpAmber} strokeWidth={isFocused ? 2.5 : 2.25} />
        {/* C2 — diamond on Charlie */}
        <polygon points={ptsStr([[178, 114], [184, 120], [178, 126], [172, 120]])}
          fill={C.hpAmber} fillOpacity={0.18} stroke={C.hpAmber} strokeWidth={isFocused ? 2.5 : 2.25} />
        {/* D1 — junction circle (not HP) */}
        <circle cx={65} cy={279} r={isFocused ? 5.5 : 5} fill={C.junctionCyan} fillOpacity={0.12} stroke={C.junctionCyan} strokeWidth={2.25} />

        {/* ── L9: Special state markers ─────────────────────────────────── */}
        {/* Clearance-limit flag */}
        {clPos && (
          <g>
            <line x1={clPos.x} y1={clPos.y - 10} x2={clPos.x} y2={clPos.y - 22}
              stroke={C.clLimit} strokeWidth={1.5} />
            <polygon
              points={ptsStr([[clPos.x, clPos.y - 22], [clPos.x + 10, clPos.y - 18], [clPos.x, clPos.y - 14]])}
              fill={C.clLimit}
            />
          </g>
        )}
        {/* Hold-position bar */}
        {holdPos && (
          <line
            x1={holdPos.x - 11} y1={holdPos.y}
            x2={holdPos.x + 11} y2={holdPos.y}
            stroke={C.holdRed} strokeWidth={isFocused ? 4 : 3.5} strokeLinecap="round"
          />
        )}

        {/* ── L10: Aircraft markers ─────────────────────────────────────── */}
        {/* Own-ship */}
        {shipPos && (
          <g>
            <circle cx={shipPos.x} cy={shipPos.y} r={isFocused ? 9 : 8} fill={C.ownShip} fillOpacity={0.2} />
            <polygon
              points={ptsStr([
                [shipPos.x, shipPos.y - (isFocused ? 8 : 7)],
                [shipPos.x + (isFocused ? 6 : 5), shipPos.y + (isFocused ? 6 : 5)],
                [shipPos.x - (isFocused ? 6 : 5), shipPos.y + (isFocused ? 6 : 5)],
              ])}
              fill={C.ownShip}
            />
          </g>
        )}
        {/* Traffic */}
        {traffic.map((t, i) => {
          const pos = getNodePos(t.nodeId);
          if (!pos) return null;
          return (
            <g key={i}>
              <circle cx={pos.x} cy={pos.y} r={isFocused ? 9 : 8} fill={C.trafficMark} fillOpacity={0.2} />
              <polygon
                points={ptsStr([
                  [pos.x, pos.y - (isFocused ? 8 : 7)],
                  [pos.x + (isFocused ? 6 : 5), pos.y + (isFocused ? 6 : 5)],
                  [pos.x - (isFocused ? 6 : 5), pos.y + (isFocused ? 6 : 5)],
                ])}
                fill={C.trafficMark}
              />
              {t.label && (
                <text x={pos.x} y={pos.y - 12} fill={C.trafficMark}
                  fontSize={isFocused ? 8 : 7} fontWeight="bold" textAnchor="middle">{t.label}</text>
              )}
            </g>
          );
        })}

        {/* ── L11: Selectable node rings ────────────────────────────────── */}
        {selectableNodeIds.map((nid) => {
          const pos = getNodePos(nid);
          if (!pos) return null;
          return (
            <circle key={nid} cx={pos.x} cy={pos.y} r={13}
              fill="transparent"
              stroke={C.selected}
              strokeWidth={1.5}
              strokeDasharray="3,2"
              style={{ cursor: "pointer" }}
              onClick={() => onNodeSelect?.(nid)}
            />
          );
        })}

        {/* ── L12: Labels (view-aware hierarchy) ─────────────────────────── */}
        {showLabels && (
          <g>
            {/* Runway designators — always visible, secondary to taxiways */}
            <text x={8} y={228} fill={C.rwyMark} fontSize={fs.rwy} fontWeight="bold">06</text>
            <text x={280} y={206} fill={C.rwyMark} fontSize={fs.rwy} fontWeight="bold" textAnchor="start">24</text>

            {/* ── Primary: taxiway names with capsules ── */}
            {/* Alfa — centred on horizontal taxiway (y=300), guide down to mid-span */}
            <LabelCapsule
              x={150}
              y={286}
              text="Alfa"
              fontSize={fs.twy - 0.5}
              anchor="middle"
              pillOpacity={0.72}
              guideTo={{ x: 150, y: 300 }}
            />
            <LabelCapsule x={228} y={245} text="Bravo"   fontSize={fs.twy} anchor="end" />
            <LabelCapsule x={228} y={107} text="Charlie" fontSize={fs.twy} anchor="end" />
            {/* Delta — left of vertical branch (x=65), guide to mid-ramal */}
            <LabelCapsule
              x={42}
              y={272}
              text="Delta"
              fontSize={fs.twy - 0.5}
              anchor="end"
              pillOpacity={0.72}
              guideTo={{ x: 65, y: 272 }}
            />

            {/* ── Operational points: HP + D1 ── */}
            <LabelCapsule x={260} y={286} text="A1" fill={C.hpAmber} fontSize={fs.hp} pillFill={C.pillHpBg} />
            <LabelCapsule x={118} y={238} text="B1" fill={C.hpAmber} fontSize={fs.hp} pillFill={C.pillHpBg} />
            <LabelCapsule x={178} y={238} text="B2" fill={C.hpAmber} fontSize={fs.hp} pillFill={C.pillHpBg} />
            <LabelCapsule x={118} y={106} text="C1" fill={C.hpAmber} fontSize={fs.hp} pillFill={C.pillHpBg} />
            <LabelCapsule x={178} y={106} text="C2" fill={C.hpAmber} fontSize={fs.hp} pillFill={C.pillHpBg} />
            <LabelCapsule x={88}  y={258} text="D1" fill={C.junctionCyan} fontSize={fs.hpOp} pillFill={C.pillBg} guideTo={{ x: 65, y: 279 }} />

            {/* Corridor names — only when state or focused detail requires them */}
            {showCorridorLabel("b1-c1") && (
              <LabelCapsule
                x={118}
                y={188}
                text="B1–C1"
                fill={corridorStroke("b1-c1")}
                fontSize={fs.corr}
                pillFill={C.pillBg}
              />
            )}
            {showCorridorLabel("b2-c2") && (
              <LabelCapsule
                x={178}
                y={188}
                text="B2–C2"
                fill={corridorStroke("b2-c2")}
                fontSize={fs.corr}
                pillFill={C.pillBg}
              />
            )}

            {/* ── Apron section titles ── */}
            <LabelCapsule
              x={140}
              y={415}
              text="MAIN APRON"
              fill={C.apronLabel}
              fontSize={fs.apron}
              pillFill="rgba(12,20,32,0.55)"
              bold={false}
            />
            <LabelCapsule
              x={140}
              y={16}
              text="SECONDARY APRON"
              fill={C.apronLabel}
              fontSize={fs.apron}
              pillFill="rgba(12,20,32,0.55)"
              bold={false}
            />

            {/* ── Stand labels (secondary, always legible) ── */}
            {STAND_X.map((x, i) => (
              <text key={i} x={x} y={356} fill={C.labelVis} fontSize={fs.stand} fontWeight="600" textAnchor="middle">
                S{i + 1}
              </text>
            ))}
            <text x={95}  y={47} fill={C.labelVis} fontSize={fs.stand} fontWeight="600" textAnchor="middle">S7</text>
            <text x={148} y={47} fill={C.labelVis} fontSize={fs.stand} fontWeight="600" textAnchor="middle">S8</text>
          </g>
        )}
      </svg>
    </div>
  );
}
