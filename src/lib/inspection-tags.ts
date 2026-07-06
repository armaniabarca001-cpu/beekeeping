export const QUEEN_CELL_TYPES = ["swarm", "supersedure", "emergency", "play_cup"] as const;
export type QueenCellType = (typeof QUEEN_CELL_TYPES)[number];

export const QUEEN_CELL_LOCATIONS = ["bottom_edge", "side_edge", "mid_face", "unknown"] as const;
export type QueenCellLocation = (typeof QUEEN_CELL_LOCATIONS)[number];

export const QUADRANT_KEYS = ["top_left", "top_right", "bottom_left", "bottom_right"] as const;
export type QuadrantKey = (typeof QUADRANT_KEYS)[number];

export type QuadrantTagKey =
  | "hasBrood"
  | "hasCappedBrood"
  | "hasEggs"
  | "hasLarvae"
  | "hasCappedHoney"
  | "hasNectar";

export interface QuadrantTags {
  hasBrood: boolean;
  hasCappedBrood: boolean;
  hasEggs: boolean;
  hasLarvae: boolean;
  hasCappedHoney: boolean;
  hasNectar: boolean;
}

export const QUADRANT_TAG_FIELDS: { key: QuadrantTagKey; label: string; color: string }[] = [
  { key: "hasBrood", label: "Brood", color: "#c99a54" },
  { key: "hasCappedBrood", label: "Capped brood", color: "#8a5a2b" },
  { key: "hasEggs", label: "Eggs", color: "#f4f1e8" },
  { key: "hasLarvae", label: "Larvae", color: "#f2e29b" },
  { key: "hasCappedHoney", label: "Capped honey", color: "#e8b93f" },
  { key: "hasNectar", label: "Nectar", color: "#bfe08a" },
];

function emptyQuadrantTags(): QuadrantTags {
  return {
    hasBrood: false,
    hasCappedBrood: false,
    hasEggs: false,
    hasLarvae: false,
    hasCappedHoney: false,
    hasNectar: false,
  };
}

export interface QueenCellEntry {
  id: string;
  cellType: QueenCellType;
  capped: boolean;
  count: number;
  // Free-position placement on the frame diagram, 0-1 (top-left origin).
  positionX: number;
  positionY: number;
}

// Coarse categorical fallback derived from where the marker was dropped -
// the schema keeps this enum for backward compatibility / non-visual queries.
export function deriveLocationFromPosition(x: number, y: number): QueenCellLocation {
  if (y > 0.82) return "bottom_edge";
  if (x < 0.12 || x > 0.88) return "side_edge";
  return "mid_face";
}

export interface FrameSideData {
  queenPresent: boolean;
  cappedHoneyPct: number | null;
  notes: string;
  audioDataUrl: string | null;
  quadrants: Record<QuadrantKey, QuadrantTags>;
  queenCells: QueenCellEntry[];
}

export function emptySideData(): FrameSideData {
  return {
    queenPresent: false,
    cappedHoneyPct: null,
    notes: "",
    audioDataUrl: null,
    quadrants: {
      top_left: emptyQuadrantTags(),
      top_right: emptyQuadrantTags(),
      bottom_left: emptyQuadrantTags(),
      bottom_right: emptyQuadrantTags(),
    },
    queenCells: [],
  };
}

export function sideHasData(side: FrameSideData): boolean {
  const anyQuadrantTag = QUADRANT_KEYS.some((q) =>
    Object.values(side.quadrants[q]).some(Boolean),
  );
  return (
    anyQuadrantTag ||
    side.queenPresent ||
    side.cappedHoneyPct != null ||
    side.notes.trim().length > 0 ||
    side.audioDataUrl != null ||
    side.queenCells.length > 0
  );
}

// OR-reduced across quadrants - kept for the frame_observations-level boolean
// columns, which stay as a "does this exist anywhere on this side" summary.
export function aggregateQuadrantTags(side: FrameSideData): QuadrantTags {
  const result = emptyQuadrantTags();
  for (const q of QUADRANT_KEYS) {
    for (const key of Object.keys(result) as (keyof QuadrantTags)[]) {
      if (side.quadrants[q][key]) result[key] = true;
    }
  }
  return result;
}
