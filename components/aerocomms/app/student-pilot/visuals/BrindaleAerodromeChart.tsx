"use client";

// AeroComms — BrindaleAerodromeChart (Student Pilot Alpha, Chart v3).
//
// Pure SVG renderer for Brindale Aerodrome Chart v3.
// No callbacks, no tappable segments, no exercise validation.
//
// Layout:
//   RWY 18/36  — vertical, left
//   RWY 05/23  — diagonal lower-left → upper-right
//   Taxiway A  — backbone alongside RWY 18/36 + bottom connector
//   Taxiway C  — parallel to RWY 05/23 (diagonal, SE side)
//   Taxiway D  — lower horizontal crossing (crosses 05/23)
//   Taxiway E  — upper horizontal crossing (crosses 05/23)
//   Taxiway B  — connector from Charlie to Apron
//
// ViewBox base: 0 0 400 640

import { BRINDALE_CHART_V3, getCropPreset } from "@/lib/aerocomms/brindaleChartV3";
import type {
  ChartCropId, ChartHighlightStatus, ChartNode, ChartSegment,
} from "@/lib/aerocomms/brindaleChartV3";

// ── Public types ──────────────────────────────────────────────────────────────

export interface ChartAircraftMarker {
  id: string;
  nodeId?: string;
  pos?: { x: number; y: number };
  heading?: number;
  label?: string;
}

export interface BrindaleAerodromeChartProps {
  crop?: ChartCropId;
  showLabels?: boolean;
  highlightedRouteIds?: string[];
  highlightedSegmentIds?: string[];
  highlightedNodeIds?: string[];
  status?: ChartHighlightStatus;
  aircraft?: ChartAircraftMarker[];
  className?: string;
}

// ── Colour tokens ──────────────────────────────────────────────────────────────

const C = {
  chartBg:     "#16243A",
  apronFill:   "#1A3A5C",   // dark blue — matches sketch blue aprons
  apronStroke: "#2E6090",
  rwyFill:     "#4A5A6A",
  rwyStroke:   "#8AAFC0",
  rwyCl:       "#D8EEF8",
  rwyMark:     "#F0F8FF",
  twyFill:     "#2E4A62",   // taxiway surface colour (darker than runway)
  twyStroke:   "#4A7090",
  twyCl:       "#E8C840",   // yellow centerline dashes
  standFill:   "#12243A",
  standStroke: "#3A6888",
  hpAmber:     "#FFC040",
  labelBright: "#EEF4FA",
  labelMuted:  "#8BAABF",
  labelApron:  "#7AB4D8",
  pillBg:      "rgba(8,16,30,0.90)",
  hlRoute:     "#EAB308",
  hlHold:      "#D97706",
  hlCrossing:  "#0EA5E9",
  hlGiveWay:   "#D97706",
  hlBacktrack: "#A855F7",
  hlCorrect:   "#EAB308",
  hlIncorrect: "#DC2626",
  ownShip:     "#FACC15",
  ownShipRing: "rgba(250,204,21,0.25)",
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

function statusColour(s: ChartHighlightStatus | undefined): string {
  switch (s) {
    case "route":     return C.hlRoute;
    case "hold":      return C.hlHold;
    case "crossing":  return C.hlCrossing;
    case "give-way":  return C.hlGiveWay;
    case "backtrack": return C.hlBacktrack;
    case "correct":   return C.hlCorrect;
    case "incorrect": return C.hlIncorrect;
    default:          return C.hlRoute;
  }
}

function segmentsForRoutes(routeIds: string[]): Set<string> {
  const set = new Set<string>();
  for (const r of BRINDALE_CHART_V3.routes) {
    if (routeIds.includes(r.id)) r.segmentIds.forEach((s) => set.add(s));
  }
  return set;
}

function nodePos(nodeId: string) {
  return BRINDALE_CHART_V3.nodes.find((n) => n.id === nodeId)?.pos;
}

// ── Layer: Background ──────────────────────────────────────────────────────────

function BgLayer() {
  return <rect x={0} y={0} width={400} height={640} fill={C.chartBg} />;
}

// ── Layer: Runways ─────────────────────────────────────────────────────────────

function RunwayLayer() {
  const r1836 = BRINDALE_CHART_V3.runways.find((r) => r.id === "rwy-18-36")!;
  const r0523 = BRINDALE_CHART_V3.runways.find((r) => r.id === "rwy-05-23")!;

  return (
    <g>
      {/* ── RWY 18/36 (vertical) ── */}
      <polygon points={r1836.polygon} fill={C.rwyFill} stroke={C.rwyStroke} strokeWidth={1} />
      {/* Centerline dashes */}
      <line x1={65} y1={54} x2={65} y2={566}
        stroke={C.rwyCl} strokeWidth={1.2} strokeDasharray="10 7" opacity={0.55} />
      {/* Threshold bars */}
      <line x1={52} y1={60}  x2={78} y2={60}  stroke={C.rwyMark} strokeWidth={4} strokeLinecap="round" />
      <line x1={52} y1={558} x2={78} y2={558} stroke={C.rwyMark} strokeWidth={4} strokeLinecap="round" />
      {/* Touchdown zone marks */}
      {[100, 120].map((y) => (
        <g key={y}>
          <line x1={52} y1={y} x2={62} y2={y}  stroke={C.rwyMark} strokeWidth={2} opacity={0.7} />
          <line x1={68} y1={y} x2={78} y2={y}  stroke={C.rwyMark} strokeWidth={2} opacity={0.7} />
          <line x1={52} y1={518+y-100} x2={62} y2={518+y-100} stroke={C.rwyMark} strokeWidth={2} opacity={0.7} />
          <line x1={68} y1={518+y-100} x2={78} y2={518+y-100} stroke={C.rwyMark} strokeWidth={2} opacity={0.7} />
        </g>
      ))}
      {/* Designator labels */}
      <text x={65} y={76}  textAnchor="middle" dominantBaseline="middle"
        fontSize={9.5} fontWeight="800" fill={C.rwyMark} fontFamily="system-ui,sans-serif">18</text>
      <text x={65} y={542} textAnchor="middle" dominantBaseline="middle"
        fontSize={9.5} fontWeight="800" fill={C.rwyMark} fontFamily="system-ui,sans-serif">36</text>

      {/* ── RWY 05/23 (diagonal) ── */}
      <polygon points={r0523.polygon} fill={C.rwyFill} stroke={C.rwyStroke} strokeWidth={1} />
      {/* Centerline dashes */}
      <line
        x1={r0523.centerline.x1} y1={r0523.centerline.y1}
        x2={r0523.centerline.x2} y2={r0523.centerline.y2}
        stroke={C.rwyCl} strokeWidth={1.2} strokeDasharray="10 7" opacity={0.55}
      />
      {/* Threshold bars (rotated) */}
      <g transform={`rotate(${r0523.angle}, 100, 558)`}>
        <line x1={88} y1={558} x2={112} y2={558} stroke={C.rwyMark} strokeWidth={4} strokeLinecap="round" />
      </g>
      <g transform={`rotate(${r0523.angle}, 348, 56)`}>
        <line x1={336} y1={56} x2={360} y2={56} stroke={C.rwyMark} strokeWidth={4} strokeLinecap="round" />
      </g>
      {/* Touchdown zone marks — rotated pairs */}
      {[80, 104].map((offset, i) => (
        <g key={i} transform={`rotate(${r0523.angle}, 100, 558)`}>
          <line x1={88} y1={558-offset} x2={96} y2={558-offset} stroke={C.rwyMark} strokeWidth={2} opacity={0.7} />
          <line x1={104} y1={558-offset} x2={112} y2={558-offset} stroke={C.rwyMark} strokeWidth={2} opacity={0.7} />
          <line x1={88} y1={56+offset} x2={96} y2={56+offset} stroke={C.rwyMark} strokeWidth={2} opacity={0.7} />
          <line x1={104} y1={56+offset} x2={112} y2={56+offset} stroke={C.rwyMark} strokeWidth={2} opacity={0.7} />
        </g>
      ))}
      {/* Designator labels (rotated) */}
      <text x={108} y={567} textAnchor="middle" dominantBaseline="middle"
        fontSize={8.5} fontWeight="800" fill={C.rwyMark} fontFamily="system-ui,sans-serif"
        transform={`rotate(${r0523.angle}, 108, 567)`}
      >05</text>
      <text x={340} y={62} textAnchor="middle" dominantBaseline="middle"
        fontSize={8.5} fontWeight="800" fill={C.rwyMark} fontFamily="system-ui,sans-serif"
        transform={`rotate(${r0523.angle}, 340, 62)`}
      >23</text>
    </g>
  );
}

// ── Layer: Apron ───────────────────────────────────────────────────────────────

function ApronLayer() {
  return (
    <g>
      {BRINDALE_CHART_V3.aprons.map((a) => (
        <polygon key={a.id} points={a.polygon} fill={C.apronFill} stroke={C.apronStroke} strokeWidth={1.5} />
      ))}
    </g>
  );
}

// ── Layer: Taxiways ────────────────────────────────────────────────────────────
//
// Charlie is a diagonal segment — handled identically to horizontal/vertical
// segments; SVG <line> naturally draws diagonal strokes.

function TaxiwayLayer({
  highlightedSegIds,
  status,
}: {
  highlightedSegIds: Set<string>;
  status: ChartHighlightStatus | undefined;
}) {
  const hlColor = statusColour(status);

  return (
    <g>
      {BRINDALE_CHART_V3.segments.map((seg: ChartSegment) => {
        const { from, to } = seg;
        const isHL    = highlightedSegIds.has(seg.id);
        const isStand = seg.kind === "stand-connector";
        const isPerim = seg.kind === "apron-perimeter";

        if (isStand) {
          return (
            <line key={seg.id}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={C.standStroke} strokeWidth={1.2} opacity={0.7}
            />
          );
        }

        const w = isHL ? 8 : isPerim ? 7 : 6.5;

        return (
          <g key={seg.id}>
            {/* Glow on highlight */}
            {isHL && (
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={hlColor} strokeWidth={18} opacity={0.18}
                strokeLinecap="round" />
            )}
            {/* Taxiway surface */}
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={isHL ? hlColor : C.twyStroke}
              strokeWidth={w}
              strokeLinecap={isPerim ? "square" : "round"}
            />
            {/* Yellow centerline dashes */}
            {!isHL && (
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={C.twyCl} strokeWidth={1.3}
                strokeDasharray="8 6" opacity={0.65}
                strokeLinecap="round"
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

// ── Layer: Stands ──────────────────────────────────────────────────────────────

function StandLayer({ showLabels }: { showLabels: boolean }) {
  return (
    <g>
      {BRINDALE_CHART_V3.nodes
        .filter((n: ChartNode) => n.kind === "stand")
        .map((s: ChartNode) => {
          const { x, y } = s.pos;
          return (
            <g key={s.id}>
              <rect x={x - 9} y={y - 7} width={18} height={14} rx={2}
                fill={C.standFill} stroke={C.standStroke} strokeWidth={1.2} />
              {showLabels && (
                <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                  fontSize={7} fontWeight="600" fill={C.labelMuted}
                  fontFamily="system-ui,sans-serif"
                >{s.label}</text>
              )}
            </g>
          );
        })}
    </g>
  );
}

// ── Layer: Crossing corridors (dashed line between HP and XC nodes) ────────────

function CrossingLayer({ highlightedNodeIds }: { highlightedNodeIds: Set<string> }) {
  return (
    <g>
      {BRINDALE_CHART_V3.crossings.map((c) => {
        const hp = nodePos(c.hpNodeId);
        const xc = nodePos(c.exitNodeId);
        if (!hp || !xc) return null;
        const isHL = highlightedNodeIds.has(c.hpNodeId);
        return (
          <line key={c.id}
            x1={hp.x} y1={hp.y} x2={xc.x} y2={xc.y}
            stroke={isHL ? C.hlCrossing : C.twyStroke}
            strokeWidth={isHL ? 5 : 3}
            strokeDasharray="5 3"
            opacity={isHL ? 0.95 : 0.55}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}

// ── Layer: Holding Points ──────────────────────────────────────────────────────

function HoldingPointLayer({
  highlightedNodeIds,
  showLabels,
}: {
  highlightedNodeIds: Set<string>;
  showLabels: boolean;
}) {
  return (
    <g>
      {BRINDALE_CHART_V3.holdingPoints.map((hp) => {
        const { x, y } = hp.pos;
        const isHL = highlightedNodeIds.has(hp.nodeId);
        const col  = isHL ? C.hlHold : C.hpAmber;
        const barLen = 14;
        const rad = (hp.barAngle * Math.PI) / 180;
        const dx  = Math.cos(rad) * barLen;
        const dy  = Math.sin(rad) * barLen;

        // Bar 1 (primary)
        const b1x1 = x - dx; const b1y1 = y - dy;
        const b1x2 = x + dx; const b1y2 = y + dy;

        // Bar 2 (inset, offset 4px along the taxiway approach direction)
        // For barAngle=90 (vertical bar), offset is in x. For barAngle=0, offset in y.
        const perpDx = -dy / barLen * 4;  // perpendicular to bar
        const perpDy =  dx / barLen * 4;
        const b2x1 = b1x1 + perpDx; const b2y1 = b1y1 + perpDy;
        const b2x2 = b1x2 + perpDx; const b2y2 = b1y2 + perpDy;

        // Label anchor: to the right for barAngle=90 (vertical bar), below for barAngle=0
        const isVertBar = Math.abs(dy) > Math.abs(dx);
        const labelX = isVertBar ? x + 14 : x;
        const labelY = isVertBar ? y       : y - 14;

        return (
          <g key={hp.id}>
            <line x1={b1x1} y1={b1y1} x2={b1x2} y2={b1y2}
              stroke={col} strokeWidth={isHL ? 4.5 : 3.5} strokeLinecap="round" />
            <line x1={b2x1} y1={b2y1} x2={b2x2} y2={b2y2}
              stroke={col} strokeWidth={2.5} strokeLinecap="round" opacity={0.55} />
            {showLabels && (
              <g>
                <rect
                  x={labelX - 1}
                  y={labelY - 8}
                  width={hp.label.length * 5.5 + 10}
                  height={14}
                  rx={3}
                  fill={C.pillBg}
                />
                <text
                  x={labelX + hp.label.length * 2.75 + 4}
                  y={labelY}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={8.5} fontWeight="700"
                  fill={isHL ? C.hlHold : C.hpAmber}
                  fontFamily="system-ui,sans-serif"
                >{hp.label}</text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

// ── Layer: Node highlights ─────────────────────────────────────────────────────

function NodeHighlightLayer({
  highlightedNodeIds,
  status,
}: {
  highlightedNodeIds: Set<string>;
  status: ChartHighlightStatus | undefined;
}) {
  if (highlightedNodeIds.size === 0) return null;
  const col = statusColour(status);
  return (
    <g>
      {BRINDALE_CHART_V3.nodes
        .filter((n: ChartNode) => highlightedNodeIds.has(n.id))
        .map((n: ChartNode) => (
          <g key={n.id}>
            <circle cx={n.pos.x} cy={n.pos.y} r={10} fill={col} opacity={0.16} />
            <circle cx={n.pos.x} cy={n.pos.y} r={5}  fill={col} opacity={0.92} />
          </g>
        ))}
    </g>
  );
}

// ── Layer: Aircraft ────────────────────────────────────────────────────────────

function AircraftLayer({ aircraft }: { aircraft: ChartAircraftMarker[] }) {
  if (aircraft.length === 0) return null;
  return (
    <g>
      {aircraft.map((ac) => {
        const pos = ac.pos ?? (ac.nodeId ? nodePos(ac.nodeId) : undefined);
        if (!pos) return null;
        const { x: cx, y: cy } = pos;
        const heading = ac.heading ?? 0;
        return (
          <g key={ac.id} transform={`translate(${cx},${cy}) rotate(${heading})`}>
            <circle r={11} fill={C.ownShipRing} />
            <polygon points="0,-10 7,8 0,4 -7,8"
              fill={C.ownShip} stroke="#0A1422" strokeWidth={0.8} />
            {ac.label && (
              <g transform={`rotate(${-heading})`}>
                <rect x={-18} y={13} width={36} height={13} rx={3} fill={C.pillBg} />
                <text x={0} y={19} textAnchor="middle" dominantBaseline="middle"
                  fontSize={7} fontWeight="700" fill={C.ownShip}
                  fontFamily="system-ui,sans-serif"
                >{ac.label}</text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

// ── Layer: Taxiway labels ──────────────────────────────────────────────────────

function TaxiwayLabels({ showLabels }: { showLabels: boolean }) {
  if (!showLabels) return null;

  const labels = [
    // Alfa backbone — label to the left of the backbone line
    { ch: "A", x:  80, y: 420,  anchor: "end",    rot: 0  },
    // Bravo — just above apron near connector
    { ch: "B", x: 200, y: 432,  anchor: "middle", rot: 0  },
    // Charlie — diagonal parallel taxiway, label along it, rotated
    { ch: "C", x: 265, y: 400,  anchor: "middle", rot: -64 },
    // Delta — lower horizontal
    { ch: "D", x: 133, y: 392,  anchor: "middle", rot: 0  },
    // Echo — upper horizontal
    { ch: "E", x: 165, y: 242,  anchor: "middle", rot: 0  },
  ];

  return (
    <g>
      {labels.map((l) => (
        <g key={l.ch} transform={`rotate(${l.rot}, ${l.x}, ${l.y})`}>
          <rect
            x={l.anchor === "end" ? l.x - 18 : l.x - 9}
            y={l.y - 9}
            width={18} height={18}
            rx={4}
            fill={C.pillBg} opacity={0.92}
          />
          <text x={l.x - (l.anchor === "end" ? 9 : 0)} y={l.y}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={10} fontWeight="800"
            fill={C.labelBright} fontFamily="system-ui,sans-serif"
          >{l.ch}</text>
        </g>
      ))}
    </g>
  );
}

// ── Layer: Apron label ─────────────────────────────────────────────────────────

function ApronLabel({ showLabels }: { showLabels: boolean }) {
  if (!showLabels) return null;
  return (
    <text x={308} y={525} textAnchor="middle" dominantBaseline="middle"
      fontSize={10} fontWeight="700"
      fill={C.labelApron} fontFamily="system-ui,sans-serif"
      letterSpacing="0.06em"
    >APRON</text>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function BrindaleAerodromeChart({
  crop,
  showLabels = true,
  highlightedRouteIds = [],
  highlightedSegmentIds = [],
  highlightedNodeIds = [],
  status,
  aircraft = [],
  className = "",
}: BrindaleAerodromeChartProps) {
  const cropPreset = getCropPreset(crop ?? "full-chart");
  const viewBox    = cropPreset.viewBox;

  const routeSegs = segmentsForRoutes(highlightedRouteIds);
  const allHL     = new Set<string>([...routeSegs, ...highlightedSegmentIds]);
  const hlNodes   = new Set<string>(highlightedNodeIds);

  return (
    <div className={`relative overflow-hidden ${className}`}
      style={{ background: C.chartBg }}>
      <svg
        viewBox={viewBox}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block" }}
        aria-label="Brindale Aerodrome Chart"
      >
        {/* Render order: bg → apron → taxiways → runways → crossings → stands → HPs → nodes → aircraft → labels */}
        <BgLayer />
        <ApronLayer />
        <TaxiwayLayer highlightedSegIds={allHL} status={status} />
        <RunwayLayer />
        <CrossingLayer highlightedNodeIds={hlNodes} />
        <StandLayer showLabels={showLabels} />
        <HoldingPointLayer highlightedNodeIds={hlNodes} showLabels={showLabels} />
        <NodeHighlightLayer highlightedNodeIds={hlNodes} status={status} />
        <AircraftLayer aircraft={aircraft} />
        <ApronLabel showLabels={showLabels} />
        <TaxiwayLabels showLabels={showLabels} />

        {/* Frame */}
        <rect x={0} y={0} width={400} height={640}
          fill="none" stroke="#2E4A62" strokeWidth={1.5} />
      </svg>
    </div>
  );
}
