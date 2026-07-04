export type BoxType =
  | "hive_stand"
  | "landing_board"
  | "entrance_reducer"
  | "deep"
  | "medium_super"
  | "shallow_super"
  | "queen_excluder"
  | "inner_cover"
  | "outer_cover";

export type EquipmentWidth = "eight_frame" | "ten_frame";

export interface HiveBoxSpec {
  id: string;
  boxType: BoxType;
  positionOrder: number;
  frameCapacity: number;
  framesInstalledCount: number;
}

// Boxes that physically hold frames a beekeeper can click into.
export const FRAME_HOLDING_BOX_TYPES: BoxType[] = [
  "deep",
  "medium_super",
  "shallow_super",
];

export const BOX_HEIGHTS: Record<BoxType, number> = {
  hive_stand: 0.3,
  landing_board: 0.05,
  entrance_reducer: 0.05,
  deep: 0.9,
  medium_super: 0.6,
  shallow_super: 0.45,
  queen_excluder: 0.05,
  inner_cover: 0.05,
  outer_cover: 0.15,
};

// Tinted variants of the HiveTracker palette (spec Section 3), used to shade
// different hive components in the 3D model.
export const BOX_COLORS: Record<BoxType, string> = {
  hive_stand: "#1a1e25", // navy-700
  landing_board: "#7a7e83", // navy-300
  entrance_reducer: "#ffd369", // honey-500
  deep: "#222831", // navy-500
  medium_super: "#393e46", // slate-500
  shallow_super: "#888b90", // slate-300
  queen_excluder: "#ffe5a5", // honey-300
  inner_cover: "#2b2e34", // slate-700
  outer_cover: "#1a1c20", // slate-900
};

export function equipmentWidthToUnits(width: EquipmentWidth): number {
  return width === "ten_frame" ? 1.6 : 1.3;
}
