// AeroComms — Student Pilot Alpha visual scene data (Brindale / XBRD).
//
// Foundation batch: reusable, typed scene DATA only. No React components, no
// bitmap artwork, no animation. Visual renderers consume these definitions in a
// later batch. One fixed fictional home aerodrome powers taxi, circuit, arrival
// and parking visuals across every Student Pilot module.

import type { StudentPilotVisualType } from "./content";

/* ------------------------------------------------------------------ */
/* Aerodrome entities                                                  */
/* ------------------------------------------------------------------ */

export interface AerodromeStation {
  id: string;
  name: string;
  kind: "ground" | "tower";
}

export interface Stand {
  id: string;
  label: string;
}

export interface Taxiway {
  id: string;
  name: string;
  phonetic: string;
}

export interface HoldingPoint {
  id: string;
  name: string;
  /** Runway this holding point protects. */
  runway: string;
  /** Taxiway the holding point sits on. */
  via: string;
}

export interface RunwayExit {
  id: string;
  name: string;
  /** Rough position along the runway, for schematic placement only. */
  position: "mid" | "end";
}

export interface ReportingPoint {
  id: string;
  name: string;
  /** Phonetic designator used on the radio. */
  phonetic: string;
}

export interface RunwayConfig {
  designators: [string, string];
  /** Active runway used for Alpha training scenes. */
  activeDefault: string;
  circuit: "left" | "right";
}

export interface BrindaleAerodrome {
  name: string;
  icao: string;
  runway: RunwayConfig;
  stands: Stand[];
  taxiways: Taxiway[];
  holdingPoints: HoldingPoint[];
  exits: RunwayExit[];
  reportingPoints: ReportingPoint[];
  stations: AerodromeStation[];
}

/* ------------------------------------------------------------------ */
/* Brindale (XBRD) — the single fixed Student Pilot home aerodrome      */
/* ------------------------------------------------------------------ */

export const BRINDALE: BrindaleAerodrome = {
  name: "Brindale",
  icao: "XBRD",
  runway: {
    designators: ["06", "24"],
    activeDefault: "24",
    circuit: "left",
  },
  stands: [
    { id: "stand-1", label: "Stand 1" },
    { id: "stand-2", label: "Stand 2" },
    { id: "stand-3", label: "Stand 3" },
    { id: "stand-4", label: "Stand 4" },
    { id: "stand-5", label: "Stand 5" },
    { id: "stand-6", label: "Stand 6" },
  ],
  taxiways: [
    { id: "twy-alfa", name: "Alfa", phonetic: "Alfa" },
    { id: "twy-bravo", name: "Bravo", phonetic: "Bravo" },
    { id: "twy-charlie", name: "Charlie", phonetic: "Charlie" },
  ],
  holdingPoints: [
    { id: "hp-a1", name: "A1", runway: "24", via: "Alfa" },
    { id: "hp-b1", name: "B1", runway: "24", via: "Bravo" },
  ],
  exits: [
    { id: "exit-bravo", name: "Bravo", position: "mid" },
    { id: "exit-charlie", name: "Charlie", position: "end" },
  ],
  reportingPoints: [
    { id: "rp-november", name: "November", phonetic: "November" },
    { id: "rp-south-bridge", name: "South Bridge", phonetic: "South Bridge" },
  ],
  stations: [
    { id: "stn-ground", name: "Brindale Ground", kind: "ground" },
    { id: "stn-tower", name: "Brindale Tower", kind: "tower" },
  ],
};

/* ------------------------------------------------------------------ */
/* Reusable visual scenes                                              */
/* ------------------------------------------------------------------ */

/** A reusable, named visual configuration referenced by exercise metadata. */
export interface VisualScene {
  id: string;
  visualType: StudentPilotVisualType;
  label: string;
  description: string;
  /** Aerodrome entity ids the scene highlights (schematic references only). */
  nodes: string[];
}

export const STUDENT_PILOT_SCENES: Record<string, VisualScene> = {
  "scene-airport-overview": {
    id: "scene-airport-overview",
    visualType: "home-aerodrome-map",
    label: "Brindale overview",
    description: "Full aerodrome layout: runway 06/24, apron, stands, taxiways and holding points.",
    nodes: ["stand-1", "stand-2", "stand-3", "stand-4", "stand-5", "stand-6", "twy-alfa", "twy-bravo", "twy-charlie", "hp-a1", "hp-b1"],
  },
  "scene-taxi-stand-to-holding": {
    id: "scene-taxi-stand-to-holding",
    visualType: "route-overlay",
    label: "Stand to holding point",
    description: "Taxi route from a stand to holding point A1 via Alfa.",
    nodes: ["stand-3", "twy-alfa", "hp-a1"],
  },
  "scene-runway-entry": {
    id: "scene-runway-entry",
    visualType: "runway-holding-point",
    label: "Runway 24 entry",
    description: "Holding point A1 and runway 24 entry geometry.",
    nodes: ["hp-a1", "twy-alfa"],
  },
  "scene-circuit": {
    id: "scene-circuit",
    visualType: "circuit-diagram",
    label: "Runway 24 left-hand circuit",
    description: "Left-hand circuit for runway 24: upwind, crosswind, downwind, base, final.",
    nodes: [],
  },
  "scene-arrival-november": {
    id: "scene-arrival-november",
    visualType: "home-aerodrome-map",
    label: "Arrival from November",
    description: "Inbound from reporting point November to join the runway 24 circuit.",
    nodes: ["rp-november"],
  },
  "scene-arrival-south-bridge": {
    id: "scene-arrival-south-bridge",
    visualType: "home-aerodrome-map",
    label: "Arrival from South Bridge",
    description: "Inbound from reporting point South Bridge to join the runway 24 circuit.",
    nodes: ["rp-south-bridge"],
  },
  "scene-runway-exit-to-parking": {
    id: "scene-runway-exit-to-parking",
    visualType: "route-overlay",
    label: "Runway exit to parking",
    description: "Vacate via exit Bravo and taxi to a stand on the apron.",
    nodes: ["exit-bravo", "twy-bravo", "twy-alfa", "stand-3"],
  },
  "scene-atis-clearance": {
    id: "scene-atis-clearance",
    visualType: "atis-clearance-panel",
    label: "ATIS and local clearance",
    description: "ATIS information panel plus local/VFR departure clearance strip.",
    nodes: [],
  },
};

export function getScene(id: string): VisualScene | undefined {
  return STUDENT_PILOT_SCENES[id];
}

/* ------------------------------------------------------------------ */
/* Map coordinate types (Batch 2A)                                    */
/* ------------------------------------------------------------------ */

/** Normalized SVG coordinate inside the 320 × 200 Brindale schematic. */
export interface MapPos {
  x: number;
  y: number;
}

export interface RouteWaypoint {
  pos: MapPos;
  entityId?: string;
  label?: string;
}

export interface NamedRoute {
  id: string;
  label: string;
  waypoints: RouteWaypoint[];
}

/* ------------------------------------------------------------------ */
/* Brindale schematic layout  (viewBox 320 × 200)                     */
/* ------------------------------------------------------------------ */

export interface BrindaleMapLayout {
  viewBox: { w: number; h: number };
  runway: { x1: number; x2: number; y: number; halfW: number };
  apron: { x: number; y: number; w: number; h: number };
  taxiways: {
    alfa:    { x1: number; y1: number; x2: number; y2: number };
    bravo:   { x1: number; y1: number; x2: number; y2: number };
    charlie: { x1: number; y1: number; x2: number; y2: number };
  };
  standConnectors: Array<{ x: number; y1: number; y2: number }>;
  entityPositions: Record<string, { pos: MapPos; label: string }>;
}

export const BRINDALE_MAP_LAYOUT: BrindaleMapLayout = {
  viewBox: { w: 320, h: 200 },

  // Runway 06/24 — horizontal strip, center y=114, half-width 5
  runway: { x1: 20, x2: 300, y: 114, halfW: 5 },

  // Apron — north side of aerodrome, bottom edge at y=84
  apron: { x: 78, y: 28, w: 148, h: 56 },

  taxiways: {
    // Alfa: main parallel taxiway south of apron
    alfa:    { x1: 20,  y1: 91,  x2: 300, y2: 91  },
    // Bravo: mid-field link from apron bottom to runway
    bravo:   { x1: 160, y1: 84,  x2: 160, y2: 109 },
    // Charlie: short connector near 24-threshold end
    charlie: { x1: 278, y1: 91,  x2: 278, y2: 109 },
  },

  // Short stubs from apron bottom (y=84) to Alfa (y=91) at each stand x
  standConnectors: [
    { x: 92,  y1: 84, y2: 91 },
    { x: 110, y1: 84, y2: 91 },
    { x: 128, y1: 84, y2: 91 },
    { x: 148, y1: 84, y2: 91 },
    { x: 172, y1: 84, y2: 91 },
    { x: 194, y1: 84, y2: 91 },
  ],

  entityPositions: {
    // Stands (center positions inside apron)
    "stand-1": { pos: { x: 92,  y: 56 }, label: "S1" },
    "stand-2": { pos: { x: 110, y: 56 }, label: "S2" },
    "stand-3": { pos: { x: 128, y: 56 }, label: "S3" },
    "stand-4": { pos: { x: 148, y: 56 }, label: "S4" },
    "stand-5": { pos: { x: 172, y: 56 }, label: "S5" },
    "stand-6": { pos: { x: 194, y: 56 }, label: "S6" },
    // Holding points
    "hp-a1":   { pos: { x: 262, y: 91  }, label: "A1" },
    "hp-b1":   { pos: { x: 160, y: 100 }, label: "B1" },
    // Runway exits (junction with runway edge)
    "exit-bravo":   { pos: { x: 160, y: 109 }, label: "B"  },
    "exit-charlie": { pos: { x: 278, y: 109 }, label: "C"  },
    // Taxiway label anchor points
    "twy-alfa":    { pos: { x: 160, y: 91  }, label: "Alfa"    },
    "twy-bravo":   { pos: { x: 160, y: 100 }, label: "Bravo"   },
    "twy-charlie": { pos: { x: 278, y: 100 }, label: "Charlie" },
    // Reporting points (placed at map edge for schematic clarity)
    "rp-november":     { pos: { x: 28,  y: 12  }, label: "November"     },
    "rp-south-bridge": { pos: { x: 295, y: 184 }, label: "South Bridge" },
  },
};

/* ------------------------------------------------------------------ */
/* Named taxi/flight routes                                            */
/* ------------------------------------------------------------------ */

export const BRINDALE_ROUTES: Record<string, NamedRoute> = {
  "route-stand3-to-a1": {
    id: "route-stand3-to-a1",
    label: "Stand 3 → Holding Point A1 via Alfa",
    waypoints: [
      { pos: { x: 128, y: 56  }, entityId: "stand-3" },
      { pos: { x: 128, y: 91  }                       }, // join Alfa
      { pos: { x: 262, y: 91  }, entityId: "hp-a1"   },
    ],
  },
  "route-exit-bravo-to-stand3": {
    id: "route-exit-bravo-to-stand3",
    label: "Exit Bravo → Stand 3 via Alfa",
    waypoints: [
      { pos: { x: 160, y: 109 }, entityId: "exit-bravo" },
      { pos: { x: 160, y: 91  }                          }, // reach Alfa via Bravo
      { pos: { x: 128, y: 91  }                          }, // west along Alfa
      { pos: { x: 128, y: 56  }, entityId: "stand-3"    },
    ],
  },
};

/* ------------------------------------------------------------------ */
/* ATIS and clearance demo data                                        */
/* ------------------------------------------------------------------ */

export interface AtisInfo {
  informationLetter: string;
  runwayInUse: string;
  wind: string;
  qnh: string;
  visibility: string;
  tempDewpoint?: string;
}

export interface ClearanceInfo {
  callsign: string;
  squawk: string;
  departureDirection: string;
  altitudeRestriction: string;
  /** Optional next-contact frequency (e.g. Tower after taxi). Omit when not part of the clearance. */
  frequency?: string;
  /** Row label when frequency is shown. Defaults to "TWR Freq". */
  frequencyLabel?: string;
}

export const BRINDALE_DEMO_ATIS: AtisInfo = {
  informationLetter: "ALFA",
  runwayInUse: "24",
  wind: "220° / 10KT",
  qnh: "1013",
  visibility: "10KM+",
  tempDewpoint: "14 / 08°C",
};

export const BRINDALE_DEMO_CLEARANCE: ClearanceInfo = {
  callsign: "G-ABCD",
  squawk: "7621",
  departureDirection: "NORTH",
  altitudeRestriction: "NOT ABOVE 1,500 FT",
};

/* ------------------------------------------------------------------ */
/* Batch 2B — Runway / Holding Point diagram types                    */
/* ------------------------------------------------------------------ */

/**
 * Runway state drives the visual safety colouring of the runway surface.
 * "clear"               — runway is empty, green accent safe zone
 * "occupied"            — aircraft/obstacle on runway, amber warning
 * "traffic-on-final"    — approaching traffic visible, amber
 * "line-up-authorized"  — cleared to line up, green
 * "crossing-authorized" — cleared to cross, green
 * "stop"                — hold position / abort, red
 */
export type RunwayState =
  | "clear"
  | "occupied"
  | "traffic-on-final"
  | "line-up-authorized"
  | "crossing-authorized"
  | "stop";

/** A single aircraft shown in a diagram (own-ship or traffic). */
export interface DiagramAircraft {
  id: string;
  /** Where the aircraft is in this diagram's local coordinate space. */
  position: "before-hp" | "at-hp" | "on-runway" | "on-final" | "departing" | "custom";
  /** Custom SVG coordinate when position === "custom". */
  customPos?: MapPos;
  /** Heading in degrees (0=north, 90=east). */
  heading?: number;
  /** Callsign or short label. */
  label?: string;
  /** Whether this is the student's own-ship. */
  isOwnShip?: boolean;
  /** Whether this aircraft is a traffic/other aircraft. */
  isTraffic?: boolean;
}

/** Instruction overlay displayed above the diagram. */
export type InstructionState =
  | "hold-short"
  | "line-up-wait"
  | "cleared-takeoff"
  | "cleared-cross"
  | "cleared-land"
  | "go-around"
  | "none";

/** Full typed preset for the RunwayHoldingPointDiagram. */
export interface HpDiagramPreset {
  id: string;
  label: string;
  runway: string;
  holdingPointId: string;
  aircraft: DiagramAircraft[];
  runwayState: RunwayState;
  instructionState: InstructionState;
  showLabels: boolean;
  showSafetyZones: boolean;
}

export const HP_DIAGRAM_PRESETS: Record<string, HpDiagramPreset> = {
  "hp-clear": {
    id: "hp-clear",
    label: "Runway clear — aircraft at A1",
    runway: "24",
    holdingPointId: "hp-a1",
    aircraft: [
      { id: "own", position: "before-hp", heading: 90, label: "G-ABCD", isOwnShip: true },
    ],
    runwayState: "clear",
    instructionState: "none",
    showLabels: true,
    showSafetyZones: true,
  },
  "hp-traffic-final": {
    id: "hp-traffic-final",
    label: "Traffic on final — hold short",
    runway: "24",
    holdingPointId: "hp-a1",
    aircraft: [
      { id: "own",     position: "before-hp", heading: 90, label: "G-ABCD", isOwnShip: true },
      { id: "traffic", position: "on-final",  heading: 90, label: "G-WXYZ", isTraffic: true },
    ],
    runwayState: "traffic-on-final",
    instructionState: "hold-short",
    showLabels: true,
    showSafetyZones: true,
  },
  "hp-line-up": {
    id: "hp-line-up",
    label: "Cleared: line up and wait",
    runway: "24",
    holdingPointId: "hp-a1",
    aircraft: [
      { id: "own", position: "at-hp", heading: 90, label: "G-ABCD", isOwnShip: true },
    ],
    runwayState: "line-up-authorized",
    instructionState: "line-up-wait",
    showLabels: true,
    showSafetyZones: true,
  },
  "hp-runway-occupied": {
    id: "hp-runway-occupied",
    label: "Runway occupied — hold short",
    runway: "24",
    holdingPointId: "hp-a1",
    aircraft: [
      { id: "own",     position: "before-hp", heading: 90, label: "G-ABCD", isOwnShip: true },
      { id: "traffic", position: "on-runway",  heading: 90, label: "G-WXYZ", isTraffic: true },
    ],
    runwayState: "occupied",
    instructionState: "hold-short",
    showLabels: true,
    showSafetyZones: true,
  },
};

/* ------------------------------------------------------------------ */
/* Batch 2B — Circuit diagram types                                   */
/* ------------------------------------------------------------------ */

/**
 * Named circuit leg identifiers — stable IDs used across exercises.
 */
export type CircuitLeg =
  | "upwind"
  | "crosswind"
  | "downwind"
  | "base"
  | "final";

/** Circuit direction — left-hand (standard) or right-hand. */
export type CircuitDirection = "left" | "right";

/**
 * Touch-and-go / full-stop intention declared on downwind.
 * "none" = not declared yet.
 */
export type CircuitIntention = "touch-and-go" | "full-stop" | "none";

/** An aircraft shown on the circuit diagram. */
export interface CircuitAircraft {
  id: string;
  leg: CircuitLeg;
  /** Fractional progress along the leg: 0 = start, 1 = end. */
  legProgress?: number;
  label?: string;
  isOwnShip?: boolean;
  isTraffic?: boolean;
  /** Sequence number in the circuit (1 = first to land). */
  sequence?: number;
  /** Whether this aircraft has traffic-in-sight confirmed. */
  trafficInSight?: boolean;
}

/** A named, reusable circuit diagram preset. */
export interface CircuitDiagramPreset {
  id: string;
  label: string;
  runway: string;
  direction: CircuitDirection;
  aircraft: CircuitAircraft[];
  highlightedLeg?: CircuitLeg;
  intention?: CircuitIntention;
  showExtendPath?: boolean;
  showOrbitMarker?: boolean;
  showDirectionArrows?: boolean;
  showLabels?: boolean;
}

/* ------------------------------------------------------------------ */
/* Brindale Taxi Map v2 — types and data                              */
/* ------------------------------------------------------------------ */

/**
 * Node in the taxi map graph. Positions use the 300 × 500 SVG viewBox.
 * A1 is a departure holding point — NOT a runway entry or backtrack access.
 * Runway crossings are only possible via the B1–C1 and B2–C2 corridors.
 */
export type TaxiNodeKind =
  | "stand"
  | "holding-point"
  | "crossing-threshold"
  | "junction"
  | "threshold";

export interface TaxiNodeDef {
  id: string;
  pos: { x: number; y: number };
  label: string;
  kind: TaxiNodeKind;
}

/**
 * Which taxiway (or special corridor) a segment belongs to.
 * "b1-c1" and "b2-c2" are the ONLY runway crossing corridors.
 * "connector" is for stand/apron stubs (visual only, not interactive).
 */
export type TaxiSegmentTaxiway =
  | "alfa"
  | "bravo"
  | "charlie"
  | "delta"
  | "b1-c1"
  | "b2-c2"
  | "connector";

/** A named, selectable segment between two points on the map. */
export interface TaxiSegmentDef {
  id: string;
  label: string;
  points: Array<{ x: number; y: number }>;
  taxiway: TaxiSegmentTaxiway;
}

/**
 * A geometrically bidirectional runway crossing corridor.
 * Each corridor can be traversed in either direction when explicitly
 * authorised by ATC. The crossing permission belongs to the corridor,
 * NOT to Bravo, Charlie or Delta as whole taxiways.
 */
export type TaxiCorridorId = "b1-c1" | "b2-c2";

export interface TaxiCorridorDef {
  id: TaxiCorridorId;
  label: string;
  /** The segment ID that represents this corridor in the segments dict. */
  segmentId: string;
  /** Node at the south (lower) end of the corridor. */
  southNodeId: string;
  /** Node at the north (upper) end of the corridor. */
  northNodeId: string;
}

/** An ordered sequence of segment IDs forming a named taxi route. */
export interface TaxiDemoRoute {
  id: string;
  label: string;
  segmentIds: string[];
}

/** Named SVG viewBox presets for the taxi map. */
export type TaxiViewId = "overview" | "focused-b1c1" | "focused-b2c2" | "focused-d1";

export interface TaxiMapV2 {
  /** SVG viewBox dimensions for the full map. */
  viewBox: { w: number; h: number };
  nodes: Record<string, TaxiNodeDef>;
  segments: Record<string, TaxiSegmentDef>;
  corridors: TaxiCorridorDef[];
  routes: Record<string, TaxiDemoRoute>;
  views: Record<TaxiViewId, { viewBox: string; label: string }>;
}

/**
 * Brindale Taxi Map v2 data.
 *
 * Geometry (all coordinates in a 300 × 500 SVG viewBox, y increases downward):
 *   Secondary Apron (Stands 7–8 + Training Area) — top zone  y≈22–87
 *   Charlie taxiway  — y = 120   (north of runway)
 *   Runway 06/24     — gentle diagonal, center y ≈ 222→204 (left→right)
 *   Bravo taxiway    — y = 258   (south of runway — does NOT cross runway)
 *   Delta taxiway    — x = 65, y = 258→300 (south alternative/junction)
 *   Alfa taxiway     — y = 300   (main apron service taxiway)
 *   Main Apron       — y≈332–404 (Stands 1–6)
 *
 * Runway crossing:
 *   ONLY via B1–C1 corridor (x=118, y=258→120) or B2–C2 corridor (x=178, y=258→120).
 *   Both corridors are geometrically bidirectional.
 *   Crossing requires explicit ATC authorisation.
 *   A1 is a departure holding point on Alfa — NOT a runway entry.
 */
export const TAXI_MAP_V2: TaxiMapV2 = {
  viewBox: { w: 300, h: 500 },

  nodes: {
    // Main Apron — Stands 1–6
    "stand-1": { id: "stand-1", pos: { x: 82,  y: 360 }, label: "S1", kind: "stand" },
    "stand-2": { id: "stand-2", pos: { x: 106, y: 360 }, label: "S2", kind: "stand" },
    "stand-3": { id: "stand-3", pos: { x: 130, y: 360 }, label: "S3", kind: "stand" },
    "stand-4": { id: "stand-4", pos: { x: 154, y: 360 }, label: "S4", kind: "stand" },
    "stand-5": { id: "stand-5", pos: { x: 178, y: 360 }, label: "S5", kind: "stand" },
    "stand-6": { id: "stand-6", pos: { x: 202, y: 360 }, label: "S6", kind: "stand" },
    // Secondary Apron — Stands 7–8
    "stand-7": { id: "stand-7", pos: { x: 95,  y: 50  }, label: "S7", kind: "stand" },
    "stand-8": { id: "stand-8", pos: { x: 148, y: 50  }, label: "S8", kind: "stand" },
    // Holding point A1 — departure holding on Alfa near runway 24 threshold.
    // A1 is NOT a runway entry or backtrack access point.
    "hp-a1": { id: "hp-a1", pos: { x: 260, y: 300 }, label: "A1", kind: "holding-point" },
    // Bravo-side crossing thresholds (south of runway)
    "hp-b1": { id: "hp-b1", pos: { x: 118, y: 258 }, label: "B1", kind: "crossing-threshold" },
    "hp-b2": { id: "hp-b2", pos: { x: 178, y: 258 }, label: "B2", kind: "crossing-threshold" },
    // Charlie-side crossing thresholds (north of runway)
    "hp-c1": { id: "hp-c1", pos: { x: 118, y: 120 }, label: "C1", kind: "crossing-threshold" },
    "hp-c2": { id: "hp-c2", pos: { x: 178, y: 120 }, label: "C2", kind: "crossing-threshold" },
    // Delta junction D1
    "hp-d1": { id: "hp-d1", pos: { x: 65,  y: 279 }, label: "D1", kind: "junction" },
    // Runway thresholds (schematic positions at map edges)
    "rwy-06": { id: "rwy-06", pos: { x: 15,  y: 222 }, label: "06", kind: "threshold" },
    "rwy-24": { id: "rwy-24", pos: { x: 285, y: 204 }, label: "24", kind: "threshold" },
  },

  segments: {
    // ── Alfa (y=300, south network, east–west) ──────────────────────────
    "seg-alfa-w": {
      id: "seg-alfa-w",
      label: "Alfa west",
      points: [{ x: 20, y: 300 }, { x: 65, y: 300 }],
      taxiway: "alfa",
    },
    "seg-alfa-mid": {
      id: "seg-alfa-mid",
      label: "Alfa main (Delta junction → A1)",
      points: [{ x: 65, y: 300 }, { x: 260, y: 300 }],
      taxiway: "alfa",
    },
    "seg-alfa-e": {
      id: "seg-alfa-e",
      label: "Alfa east stub",
      points: [{ x: 260, y: 300 }, { x: 272, y: 300 }],
      taxiway: "alfa",
    },
    // ── Delta (x=65, Alfa↔D1↔Bravo, south alternative) ─────────────────
    "seg-delta": {
      id: "seg-delta",
      label: "Delta (Alfa – D1 – Bravo)",
      points: [{ x: 65, y: 300 }, { x: 65, y: 279 }, { x: 65, y: 258 }],
      taxiway: "delta",
    },
    // ── Bravo (y=258, south of runway, east–west) ─────────────────────
    "seg-bravo-w": {
      id: "seg-bravo-w",
      label: "Bravo west end",
      points: [{ x: 52, y: 258 }, { x: 65, y: 258 }],
      taxiway: "bravo",
    },
    "seg-bravo-d1-b1": {
      id: "seg-bravo-d1-b1",
      label: "Bravo – D1 to B1",
      points: [{ x: 65, y: 258 }, { x: 118, y: 258 }],
      taxiway: "bravo",
    },
    "seg-bravo-b1-b2": {
      id: "seg-bravo-b1-b2",
      label: "Bravo – B1 to B2",
      points: [{ x: 118, y: 258 }, { x: 178, y: 258 }],
      taxiway: "bravo",
    },
    "seg-bravo-b2-e": {
      id: "seg-bravo-b2-e",
      label: "Bravo east (B2 to end)",
      points: [{ x: 178, y: 258 }, { x: 242, y: 258 }],
      taxiway: "bravo",
    },
    // ── Crossing corridors (only paths that traverse the runway) ─────────
    // B1–C1: bidirectional corridor at x=118, from B1 (y=258) through runway to C1 (y=120).
    "seg-cross-b1c1": {
      id: "seg-cross-b1c1",
      label: "B1–C1 crossing corridor",
      points: [{ x: 118, y: 258 }, { x: 118, y: 120 }],
      taxiway: "b1-c1",
    },
    // B2–C2: bidirectional corridor at x=178, from B2 (y=258) through runway to C2 (y=120).
    "seg-cross-b2c2": {
      id: "seg-cross-b2c2",
      label: "B2–C2 crossing corridor",
      points: [{ x: 178, y: 258 }, { x: 178, y: 120 }],
      taxiway: "b2-c2",
    },
    // ── Charlie (y=120, north of runway, east–west) ───────────────────────
    "seg-charlie-w": {
      id: "seg-charlie-w",
      label: "Charlie west",
      points: [{ x: 52, y: 120 }, { x: 118, y: 120 }],
      taxiway: "charlie",
    },
    "seg-charlie-mid": {
      id: "seg-charlie-mid",
      label: "Charlie – C1 to C2",
      points: [{ x: 118, y: 120 }, { x: 178, y: 120 }],
      taxiway: "charlie",
    },
    "seg-charlie-e": {
      id: "seg-charlie-e",
      label: "Charlie east",
      points: [{ x: 178, y: 120 }, { x: 242, y: 120 }],
      taxiway: "charlie",
    },
  },

  corridors: [
    {
      id: "b1-c1",
      label: "B1–C1 crossing corridor",
      segmentId: "seg-cross-b1c1",
      southNodeId: "hp-b1",
      northNodeId: "hp-c1",
    },
    {
      id: "b2-c2",
      label: "B2–C2 crossing corridor",
      segmentId: "seg-cross-b2c2",
      southNodeId: "hp-b2",
      northNodeId: "hp-c2",
    },
  ],

  routes: {
    "route-stand3-to-b1": {
      id: "route-stand3-to-b1",
      label: "Stand 3 → Alfa → Bravo → B1",
      segmentIds: ["seg-alfa-mid", "seg-delta", "seg-bravo-d1-b1"],
    },
    "route-stand3-to-secondary": {
      id: "route-stand3-to-secondary",
      label: "Stand 3 → Alfa → Bravo → B1 → B1–C1 corridor (B1→C1) → Charlie → Secondary Apron",
      segmentIds: [
        "seg-alfa-mid",
        "seg-delta",
        "seg-bravo-d1-b1",
        "seg-cross-b1c1",
        "seg-charlie-w",
      ],
    },
  },

  views: {
    overview:        { viewBox: "0 0 300 500",    label: "Overview" },
    "focused-b1c1":  { viewBox: "55 90 185 185",  label: "B1–C1 crossing" },
    "focused-b2c2":  { viewBox: "110 90 185 185", label: "B2–C2 crossing" },
    "focused-d1":    { viewBox: "20 240 150 110",  label: "D1 intersection" },
  },
};

export const CIRCUIT_DIAGRAM_PRESETS: Record<string, CircuitDiagramPreset> = {
  "circuit-overview": {
    id: "circuit-overview",
    label: "Circuit overview — no aircraft",
    runway: "24",
    direction: "left",
    aircraft: [],
    showDirectionArrows: true,
    showLabels: true,
  },
  "circuit-downwind-report": {
    id: "circuit-downwind-report",
    label: "Own aircraft — downwind, intention declared",
    runway: "24",
    direction: "left",
    aircraft: [
      { id: "own", leg: "downwind", legProgress: 0.5, label: "G-ABCD", isOwnShip: true },
    ],
    highlightedLeg: "downwind",
    intention: "touch-and-go",
    showDirectionArrows: true,
    showLabels: true,
  },
  "circuit-traffic-sequencing": {
    id: "circuit-traffic-sequencing",
    label: "Sequencing — own aircraft #2 behind traffic",
    runway: "24",
    direction: "left",
    aircraft: [
      { id: "traffic", leg: "base",     legProgress: 0.5, label: "G-WXYZ", isTraffic: true,  sequence: 1 },
      { id: "own",     leg: "downwind", legProgress: 0.8, label: "G-ABCD", isOwnShip: true,  sequence: 2, trafficInSight: true },
    ],
    highlightedLeg: "downwind",
    showDirectionArrows: true,
    showLabels: true,
  },
  "circuit-extend-downwind": {
    id: "circuit-extend-downwind",
    label: "Extend downwind instruction",
    runway: "24",
    direction: "left",
    aircraft: [
      { id: "own", leg: "downwind", legProgress: 0.9, label: "G-ABCD", isOwnShip: true },
    ],
    highlightedLeg: "downwind",
    showExtendPath: true,
    showDirectionArrows: true,
    showLabels: true,
  },
  "circuit-touch-and-go": {
    id: "circuit-touch-and-go",
    label: "Touch-and-go — own aircraft on final",
    runway: "24",
    direction: "left",
    aircraft: [
      { id: "own", leg: "final", legProgress: 0.5, label: "G-ABCD", isOwnShip: true },
    ],
    highlightedLeg: "final",
    intention: "touch-and-go",
    showDirectionArrows: true,
    showLabels: true,
  },
};
