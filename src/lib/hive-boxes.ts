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

export type FoundationType = "wax" | "plastic" | "foundationless";

export const BOX_TYPES: BoxType[] = [
  "hive_stand",
  "landing_board",
  "entrance_reducer",
  "deep",
  "medium_super",
  "shallow_super",
  "queen_excluder",
  "inner_cover",
  "outer_cover",
];

// Boxes that physically hold frames a beekeeper can click into.
export const FRAME_HOLDING_BOX_TYPES: BoxType[] = ["deep", "medium_super", "shallow_super"];

export function boxHoldsFrames(boxType: BoxType): boolean {
  return FRAME_HOLDING_BOX_TYPES.includes(boxType);
}

export function frameCapacityFor(equipmentWidth: EquipmentWidth): number {
  return equipmentWidth === "ten_frame" ? 10 : 8;
}

export const BOX_LABELS: Record<BoxType, string> = {
  hive_stand: "Hive stand",
  landing_board: "Landing board",
  entrance_reducer: "Entrance reducer",
  deep: "Deep",
  medium_super: "Medium super",
  shallow_super: "Shallow super",
  queen_excluder: "Queen excluder",
  inner_cover: "Inner cover",
  outer_cover: "Outer cover",
};
