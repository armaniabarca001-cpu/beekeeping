export const QUEEN_CELL_TYPES = ["swarm", "supersedure", "emergency", "play_cup"] as const;
export type QueenCellType = (typeof QUEEN_CELL_TYPES)[number];

export const QUEEN_CELL_LOCATIONS = ["bottom_edge", "side_edge", "mid_face", "unknown"] as const;
export type QueenCellLocation = (typeof QUEEN_CELL_LOCATIONS)[number];

export interface QueenCellEntry {
  id: string;
  cellType: QueenCellType;
  locationOnFrame: QueenCellLocation;
  capped: boolean;
  count: number;
}

export interface FrameSideData {
  hasBrood: boolean;
  hasCappedBrood: boolean;
  hasEggs: boolean;
  hasLarvae: boolean;
  queenPresent: boolean;
  hasCappedHoney: boolean;
  hasNectar: boolean;
  cappedHoneyPct: number | null;
  notes: string;
  audioDataUrl: string | null;
  queenCells: QueenCellEntry[];
}

export function emptySideData(): FrameSideData {
  return {
    hasBrood: false,
    hasCappedBrood: false,
    hasEggs: false,
    hasLarvae: false,
    queenPresent: false,
    hasCappedHoney: false,
    hasNectar: false,
    cappedHoneyPct: null,
    notes: "",
    audioDataUrl: null,
    queenCells: [],
  };
}

export function sideHasData(side: FrameSideData): boolean {
  return (
    side.hasBrood ||
    side.hasCappedBrood ||
    side.hasEggs ||
    side.hasLarvae ||
    side.queenPresent ||
    side.hasCappedHoney ||
    side.hasNectar ||
    side.cappedHoneyPct != null ||
    side.notes.trim().length > 0 ||
    side.audioDataUrl != null ||
    side.queenCells.length > 0
  );
}

export const TAG_FIELDS: { key: keyof FrameSideData; label: string }[] = [
  { key: "hasBrood", label: "Brood" },
  { key: "hasCappedBrood", label: "Capped brood" },
  { key: "hasEggs", label: "Eggs" },
  { key: "hasLarvae", label: "Larvae" },
  { key: "queenPresent", label: "Queen present" },
  { key: "hasCappedHoney", label: "Capped honey" },
  { key: "hasNectar", label: "Nectar" },
];
