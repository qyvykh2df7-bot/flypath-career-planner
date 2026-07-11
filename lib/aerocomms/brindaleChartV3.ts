// AeroComms — Brindale Aerodrome Chart v3 geometry data.
//
// ViewBox: 0 0 400 640  (portrait, mobile-first)
//
// LAYOUT (matches hand-drawn blueprint):
//
//   RWY 18/36  — vertical, left edge (x 52–78)
//   RWY 05/23  — diagonal lower-left → upper-right (the "V" arm)
//   Taxiway A  — vertical backbone alongside RWY 18/36 east side (x=91)
//                + short horizontal bottom connector to Charlie
//   Taxiway B  — short horizontal connector from Charlie to the Apron
//                + Apron north perimeter
//   Taxiway C  — diagonal taxiway PARALLEL to RWY 05/23 (SE side)
//   Taxiway D  — lower horizontal crossing taxiway (crosses RWY 05/23 at y≈380)
//   Taxiway E  — upper horizontal crossing taxiway (crosses RWY 05/23 at y≈250)
//
// Holding points:
//   A1         — before RWY 36 entry (bottom of backbone, V-vertex)
//   D1         — on backbone before RWY 18/36 at Delta level
//   E1         — on backbone before RWY 18/36 at Echo level
//   A3         — top of backbone before RWY 18 from north
//   C1         — before crossing RWY 05/23 via D (SE approach side)
//   C2         — before crossing RWY 05/23 via E (SE approach side)
//   C3         — top of Charlie near RWY 23 threshold

export interface ChartPoint { x: number; y: number; }

export type NodeKind =
  | "stand" | "holding-point" | "crossing-entry" | "crossing-exit"
  | "junction" | "threshold" | "v-vertex" | "apron-entry";

export interface ChartNode {
  id: string; pos: ChartPoint; kind: NodeKind; label?: string;
}

export interface ChartSegment {
  id: string; from: ChartPoint; to: ChartPoint;
  taxiway: string; kind: "taxiway" | "apron-perimeter" | "stand-connector";
}

export interface ChartRunway {
  id: string; designation: [string, string]; polygon: string;
  centerline: { x1: number; y1: number; x2: number; y2: number };
  thresholdLow: ChartPoint; thresholdHigh: ChartPoint; angle: number;
}

export interface ChartApron {
  id: string; label: string; polygon: string; standIds: string[];
}

export interface ChartHoldingPoint {
  id: string; nodeId: string; label: string; pos: ChartPoint; barAngle: number;
}

export interface ChartCrossing {
  id: string; label: string; hpNodeId: string; exitNodeId: string;
  runwayId: string; midPos: ChartPoint;
}

export interface ChartHotspot {
  id: string; label: string; pos: ChartPoint; cropId: ChartCropId;
}

export interface ChartRoute {
  id: string; label: string; segmentIds: string[]; description?: string;
}

export type ChartCropId =
  | "full-chart" | "apron" | "d-crossing" | "e-crossing"
  | "v-vertex" | "top-runway";

export interface ChartCropPreset {
  id: ChartCropId; label: string; viewBox: string;
}

export type ChartHighlightStatus =
  | "route" | "hold" | "crossing" | "give-way"
  | "backtrack" | "correct" | "incorrect" | "neutral";

export interface BrindaleChartV3 {
  runways: ChartRunway[];
  aprons: ChartApron[];
  nodes: ChartNode[];
  segments: ChartSegment[];
  holdingPoints: ChartHoldingPoint[];
  crossings: ChartCrossing[];
  hotspots: ChartHotspot[];
  routes: ChartRoute[];
  cropPresets: ChartCropPreset[];
}

function pt(x: number, y: number): ChartPoint { return { x, y }; }

// ── RWY 05/23 diagonal geometry ───────────────────────────────────────────────
// Centre: (100,558) → (348,56).  Δx=248, Δy=-502, len≈559.
// Perp SE unit ≈ (0.898, 0.444).  Half-width 12 → perp offset ≈ (11, 5).
//
// Taxiway Charlie centre offset 27 px SE of runway centre:
//   C start (05 end) : (100+24, 558+12) = (124, 570)
//   C end   (23 end) : (348+24,  56+12) = (372,  68)
//
// Diagonal centre at y-level (using Δy=502):
//   y=250 → t=(558-250)/502=0.614  → x=100+248*0.614=252   [Echo crossing]
//   y=380 → t=(558-380)/502=0.355  → x=100+248*0.355=188   [Delta crossing]
//   y=440 → t=(558-440)/502=0.234  → x=100+248*0.234=158   [Bravo entry]
//
// Charlie centre at y-level (Δy=502):
//   y=250 → t=(570-250)/502=0.637  → x=124+248*0.637=286
//   y=380 → t=(570-380)/502=0.379  → x=124+248*0.379=218
//   y=440 → t=(570-440)/502=0.259  → x=124+248*0.259=188
// ─────────────────────────────────────────────────────────────────────────────

export const BRINDALE_CHART_V3: BrindaleChartV3 = {

  // ── RUNWAYS ────────────────────────────────────────────────────────────────
  runways: [
    {
      id: "rwy-18-36",
      designation: ["18", "36"],
      polygon: "52,42 78,42 78,576 52,576",
      centerline: { x1: 65, y1: 48, x2: 65, y2: 570 },
      thresholdLow:  pt(65, 576),   // RWY 36 (south)
      thresholdHigh: pt(65,  42),   // RWY 18 (north)
      angle: 90,
    },
    {
      id: "rwy-05-23",
      designation: ["05", "23"],
      // NW-low, SE-low, SE-high, NW-high
      polygon: "88,552 112,564 360,62 336,50",
      centerline: { x1: 100, y1: 558, x2: 348, y2: 56 },
      thresholdLow:  pt(100, 558),  // RWY 05 (lower-left)
      thresholdHigh: pt(348,  56),  // RWY 23 (upper-right)
      angle: -64,
    },
  ],

  // ── APRONS ─────────────────────────────────────────────────────────────────
  aprons: [
    {
      id: "main-apron",
      label: "Apron",
      polygon: "222,440 393,440 393,580 222,580",
      standIds: ["s1","s2","s3","s4"],
    },
  ],

  // ── NODES ──────────────────────────────────────────────────────────────────
  nodes: [
    // Apron stands (inside apron, y=498)
    { id: "s1", pos: pt(243, 498), kind: "stand", label: "S1" },
    { id: "s2", pos: pt(281, 498), kind: "stand", label: "S2" },
    { id: "s3", pos: pt(319, 498), kind: "stand", label: "S3" },
    { id: "s4", pos: pt(357, 498), kind: "stand", label: "S4" },

    // Holding points — backbone (before RWY 18/36)
    { id: "hp-a3", pos: pt(91,  82),  kind: "holding-point", label: "A3" },
    { id: "hp-e1", pos: pt(91, 250),  kind: "holding-point", label: "E1" },
    { id: "hp-d1", pos: pt(91, 380),  kind: "holding-point", label: "D1" },
    { id: "hp-a1", pos: pt(91, 570),  kind: "holding-point", label: "A1" },

    // Crossing nodes — RWY 05/23 at Echo level (y=250)
    // Approach from east along Echo going west → hold at C2 (SE side), exit at xc-c2 (NW)
    { id: "hp-c2",  pos: pt(264, 250), kind: "crossing-entry", label: "C2" },
    { id: "xc-c2",  pos: pt(240, 250), kind: "crossing-exit"               },

    // Crossing nodes — RWY 05/23 at Delta level (y=380)
    { id: "hp-c1",  pos: pt(200, 380), kind: "crossing-entry", label: "C1" },
    { id: "xc-c1",  pos: pt(176, 380), kind: "crossing-exit"               },

    // Top of Charlie near RWY 23 threshold
    { id: "hp-c3",  pos: pt(370,  68), kind: "holding-point", label: "C3" },

    // Key junctions
    { id: "e-charlie",  pos: pt(286, 250), kind: "junction" },  // Echo meets Charlie
    { id: "d-charlie",  pos: pt(218, 380), kind: "junction" },  // Delta meets Charlie
    { id: "b-charlie",  pos: pt(188, 440), kind: "junction" },  // Bravo meets Charlie
    { id: "a-charlie",  pos: pt(124, 570), kind: "junction" },  // Alfa bottom meets Charlie
    { id: "apron-entry",pos: pt(222, 440), kind: "apron-entry" },

    // V-vertex
    { id: "v-vertex", pos: pt(100, 562), kind: "v-vertex" },
  ],

  // ── SEGMENTS ───────────────────────────────────────────────────────────────
  segments: [
    // ── ALFA (A) — vertical backbone alongside RWY 18/36, x=91 ───────────────
    { id: "a-north",   from: pt(91,  82), to: pt(91, 250), taxiway: "Alfa",    kind: "taxiway" },
    { id: "a-mid",     from: pt(91, 250), to: pt(91, 380), taxiway: "Alfa",    kind: "taxiway" },
    { id: "a-south",   from: pt(91, 380), to: pt(91, 570), taxiway: "Alfa",    kind: "taxiway" },
    // Bottom horizontal connector from backbone to Charlie start
    { id: "a-bottom",  from: pt(91, 570), to: pt(124, 570), taxiway: "Alfa",   kind: "taxiway" },

    // ── CHARLIE (C) — parallel taxiway to RWY 05/23 (diagonal), SE side ──────
    // Single diagonal line from bottom (near 05 threshold) to top (near 23 threshold)
    { id: "charlie",   from: pt(124, 570), to: pt(372,  68), taxiway: "Charlie", kind: "taxiway" },

    // ── DELTA (D) — lower horizontal crossing taxiway at y=380 ───────────────
    // West: backbone → NW side of runway (XC)
    { id: "d-west",    from: pt(91, 380), to: pt(176, 380), taxiway: "Delta",  kind: "taxiway" },
    // East: SE side of runway (HP-C1) → Charlie junction
    { id: "d-east",    from: pt(200, 380), to: pt(218, 380), taxiway: "Delta", kind: "taxiway" },

    // ── ECHO (E) — upper horizontal crossing taxiway at y=250 ────────────────
    // West: backbone → NW side of runway (XC)
    { id: "e-west",    from: pt(91, 250), to: pt(240, 250), taxiway: "Echo",   kind: "taxiway" },
    // East: SE side of runway (HP-C2) → Charlie junction
    { id: "e-east",    from: pt(264, 250), to: pt(286, 250), taxiway: "Echo",  kind: "taxiway" },

    // ── BRAVO (B) — connector from Charlie to Apron (horizontal, y=440) ──────
    // Short connector from Charlie at (188,440) to apron entry (222,440)
    { id: "b-connector", from: pt(188, 440), to: pt(222, 440), taxiway: "Bravo", kind: "taxiway"       },
    // Apron north perimeter
    { id: "b-apron",     from: pt(222, 440), to: pt(393, 440), taxiway: "Bravo", kind: "apron-perimeter" },

    // ── STAND CONNECTORS (Apron) ──────────────────────────────────────────────
    { id: "s1-stub", from: pt(243, 440), to: pt(243, 498), taxiway: "", kind: "stand-connector" },
    { id: "s2-stub", from: pt(281, 440), to: pt(281, 498), taxiway: "", kind: "stand-connector" },
    { id: "s3-stub", from: pt(319, 440), to: pt(319, 498), taxiway: "", kind: "stand-connector" },
    { id: "s4-stub", from: pt(357, 440), to: pt(357, 498), taxiway: "", kind: "stand-connector" },
  ],

  // ── HOLDING POINTS ─────────────────────────────────────────────────────────
  holdingPoints: [
    // Before RWY 18/36 — barAngle=90 (vertical bar; pilots approach horizontally from east)
    { id: "hp-a3", nodeId: "hp-a3", label: "A3", pos: pt(91,  82),  barAngle: 0  },
    { id: "hp-e1", nodeId: "hp-e1", label: "E1", pos: pt(91, 250),  barAngle: 90 },
    { id: "hp-d1", nodeId: "hp-d1", label: "D1", pos: pt(91, 380),  barAngle: 90 },
    // Before RWY 36 at V-vertex — barAngle=0 (horizontal bar; approach from south)
    { id: "hp-a1", nodeId: "hp-a1", label: "A1", pos: pt(91, 570),  barAngle: 0  },
    // Before crossing RWY 05/23 — barAngle=90 (vertical bar; horizontal approach)
    { id: "hp-c1", nodeId: "hp-c1", label: "C1", pos: pt(200, 380), barAngle: 90 },
    { id: "hp-c2", nodeId: "hp-c2", label: "C2", pos: pt(264, 250), barAngle: 90 },
    // End of Charlie near RWY 23 threshold — barAngle=-24 (perpendicular to Charlie)
    { id: "hp-c3", nodeId: "hp-c3", label: "C3", pos: pt(370,  68), barAngle: -24 },
  ],

  // ── CROSSINGS ──────────────────────────────────────────────────────────────
  crossings: [
    {
      id: "crossing-d",
      label: "Cross RWY 05/23 (Delta level)",
      hpNodeId:   "hp-c1",
      exitNodeId: "xc-c1",
      runwayId:   "rwy-05-23",
      midPos: pt(188, 380),
    },
    {
      id: "crossing-e",
      label: "Cross RWY 05/23 (Echo level)",
      hpNodeId:   "hp-c2",
      exitNodeId: "xc-c2",
      runwayId:   "rwy-05-23",
      midPos: pt(252, 250),
    },
  ],

  // ── HOTSPOTS ───────────────────────────────────────────────────────────────
  hotspots: [
    { id: "apron-exit",  label: "Apron Exit via Bravo", pos: pt(222, 440), cropId: "apron"      },
    { id: "d-crossing",  label: "RWY 05/23 (Delta)",    pos: pt(200, 380), cropId: "d-crossing" },
    { id: "e-crossing",  label: "RWY 05/23 (Echo)",     pos: pt(264, 250), cropId: "e-crossing" },
    { id: "v-vertex",    label: "V-Vertex Entry",        pos: pt(91,  570), cropId: "v-vertex"   },
  ],

  // ── NAMED ROUTES ───────────────────────────────────────────────────────────
  routes: [
    {
      id: "route-s2-d1-via-bravo-charlie-delta",
      label: "S2 → D1 via Bravo, Charlie, Delta",
      segmentIds: ["b-apron", "b-connector", "charlie", "d-east", "d-west"],
      description: "From Stand 2 → Bravo → Charlie → Delta → D1 holding point before RWY 18/36.",
    },
    {
      id: "route-s2-e1-via-bravo-charlie-echo",
      label: "S2 → E1 via Bravo, Charlie, Echo",
      segmentIds: ["b-apron", "b-connector", "charlie", "e-east", "e-west"],
      description: "From Stand 2 → Bravo → Charlie (northward) → Echo → E1 before RWY 18/36.",
    },
    {
      id: "route-s2-a1-via-bravo-charlie-alfa",
      label: "S2 → A1 via Bravo, Charlie, Alfa",
      segmentIds: ["b-apron", "b-connector", "charlie", "a-bottom", "a-south"],
      description: "South route via Alfa backbone to V-vertex, no runway crossing.",
    },
  ],

  // ── CROP PRESETS ───────────────────────────────────────────────────────────
  cropPresets: [
    { id: "full-chart",  label: "Full Chart",             viewBox: "0 0 400 640"    },
    { id: "apron",       label: "Apron & Bravo",          viewBox: "140 400 260 205" },
    { id: "d-crossing",  label: "RWY 05/23 (Delta)",      viewBox: "65 320 210 120"  },
    { id: "e-crossing",  label: "RWY 05/23 (Echo)",       viewBox: "65 195 255 115"  },
    { id: "v-vertex",    label: "V-Vertex / RWY Entry",   viewBox: "52 525 150 110"  },
    { id: "top-runway",  label: "RWY 18 / Top",           viewBox: "52 42 200 145"   },
  ],
};

export function getCropPreset(id: ChartCropId): ChartCropPreset {
  const preset = BRINDALE_CHART_V3.cropPresets.find((p) => p.id === id);
  return preset ?? BRINDALE_CHART_V3.cropPresets[0]!;
}

export function getNode(id: string): ChartNode | undefined {
  return BRINDALE_CHART_V3.nodes.find((n) => n.id === id);
}
