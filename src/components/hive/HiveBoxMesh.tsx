"use client";

import { useMemo, useState } from "react";
import { BOX_HEIGHTS, FRAME_HOLDING_BOX_TYPES, type HiveBoxSpec } from "./types";
import { getHoneycombTexture, getWoodTexture } from "./textures";

const DEPTH = 1.0;
const FRAME_THICKNESS = 0.03;
const BORDER = 0.05;

// Tints multiplied onto the shared wood texture per box type - keeps every
// wooden component reading as the same pine, just weathered/painted
// differently (telescoping cover a touch darker, stand more sun-worn).
const BOX_TINTS: Record<string, string> = {
  hive_stand: "#8f7350",
  landing_board: "#c9a56e",
  entrance_reducer: "#b98d55",
  deep: "#d9b877",
  medium_super: "#d9b877",
  shallow_super: "#d9b877",
  inner_cover: "#cfa96b",
  outer_cover: "#a9865a",
};
const EXCLUDER_COLOR = "#c7cdd3";

interface FrameMeshProps {
  x: number;
  height: number;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
}

function FrameMesh({ x, height, isSelected, isHighlighted, onClick }: FrameMeshProps) {
  const [hovered, setHovered] = useState(false);
  const woodTexture = useMemo(() => getWoodTexture(), []);
  const honeycombTexture = useMemo(() => getHoneycombTexture(), []);

  const faceHeight = height * 0.85;
  const faceDepth = DEPTH * 0.85;
  const innerHeight = faceHeight - BORDER * 2;
  const innerDepth = faceDepth - BORDER * 2;

  const emissive = isHighlighted ? "#ef4444" : isSelected ? "#ffd369" : hovered ? "#ffe5a5" : "#000000";
  const emissiveIntensity = isHighlighted || isSelected ? 0.5 : hovered ? 0.25 : 0;

  return (
    <group
      position={[x, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* top and bottom bars */}
      {[1, -1].map((sign) => (
        <mesh key={sign} position={[0, (sign * (faceHeight - BORDER)) / 2, 0]}>
          <boxGeometry args={[FRAME_THICKNESS, BORDER, faceDepth]} />
          <meshStandardMaterial
            map={woodTexture}
            color="#e2c084"
            roughness={0.85}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      ))}
      {/* side bars */}
      {[1, -1].map((sign) => (
        <mesh key={sign} position={[0, 0, (sign * (faceDepth - BORDER)) / 2]}>
          <boxGeometry args={[FRAME_THICKNESS, innerHeight, BORDER]} />
          <meshStandardMaterial
            map={woodTexture}
            color="#e2c084"
            roughness={0.85}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      ))}
      {/* honeycomb wax foundation */}
      <mesh>
        <boxGeometry args={[FRAME_THICKNESS * 0.6, innerHeight, innerDepth]} />
        <meshStandardMaterial
          map={honeycombTexture}
          roughness={0.5}
          metalness={0.05}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity * 0.6}
        />
      </mesh>
    </group>
  );
}

interface HiveBoxMeshProps {
  box: HiveBoxSpec;
  width: number;
  y: number;
  selectedFrame: number | null;
  highlightedFrameNumbers?: Set<number>;
  onFrameClick: (hiveBoxId: string, frameNumber: number) => void;
}

export function HiveBoxMesh({
  box,
  width,
  y,
  selectedFrame,
  highlightedFrameNumbers,
  onFrameClick,
}: HiveBoxMeshProps) {
  const height = BOX_HEIGHTS[box.boxType];
  const holdsFrames = FRAME_HOLDING_BOX_TYPES.includes(box.boxType);
  const isExcluder = box.boxType === "queen_excluder";
  const woodTexture = useMemo(() => getWoodTexture(), []);

  // Frame 1 = leftmost, facing the entrance (spec Section 4.3).
  // Fewer frames than capacity are spaced wider across the same box width
  // (spec Section 9 - e.g. 9 frames in a 10-frame box for thicker comb).
  const framePositions = useMemo(() => {
    if (!holdsFrames) return [];
    const count = box.framesInstalledCount || box.frameCapacity;
    const usableWidth = width * 0.9;
    const step = usableWidth / count;
    const start = -usableWidth / 2 + step / 2;
    return Array.from({ length: count }, (_, i) => start + i * step);
  }, [holdsFrames, box.framesInstalledCount, box.frameCapacity, width]);

  return (
    <group position={[0, y + height / 2, 0]}>
      <mesh>
        <boxGeometry args={[width, height, DEPTH]} />
        {isExcluder ? (
          <meshStandardMaterial
            color={EXCLUDER_COLOR}
            metalness={0.7}
            roughness={0.4}
            transparent
            opacity={0.6}
          />
        ) : (
          <meshStandardMaterial
            map={woodTexture}
            color={BOX_TINTS[box.boxType]}
            roughness={0.85}
            transparent
            opacity={holdsFrames ? 0.3 : 1}
          />
        )}
      </mesh>
      {framePositions.map((x, i) => (
        <FrameMesh
          key={i}
          x={x}
          height={height}
          isSelected={selectedFrame === i + 1}
          isHighlighted={highlightedFrameNumbers?.has(i + 1) ?? false}
          onClick={() => onFrameClick(box.id, i + 1)}
        />
      ))}
    </group>
  );
}
