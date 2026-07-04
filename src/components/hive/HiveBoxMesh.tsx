"use client";

import { useMemo, useState } from "react";
import {
  BOX_COLORS,
  BOX_HEIGHTS,
  FRAME_HOLDING_BOX_TYPES,
  type HiveBoxSpec,
} from "./types";

const DEPTH = 1.0;
const FRAME_THICKNESS = 0.03;

interface FrameMeshProps {
  x: number;
  height: number;
  isSelected: boolean;
  onClick: () => void;
}

function FrameMesh({ x, height, isSelected, onClick }: FrameMeshProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <mesh
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
      <boxGeometry args={[FRAME_THICKNESS, height * 0.85, DEPTH * 0.85]} />
      <meshStandardMaterial
        color={isSelected ? "#ffd369" : hovered ? "#ffe5a5" : "#fff4da"}
      />
    </mesh>
  );
}

interface HiveBoxMeshProps {
  box: HiveBoxSpec;
  width: number;
  y: number;
  selectedFrame: number | null;
  onFrameClick: (hiveBoxId: string, frameNumber: number) => void;
}

export function HiveBoxMesh({
  box,
  width,
  y,
  selectedFrame,
  onFrameClick,
}: HiveBoxMeshProps) {
  const height = BOX_HEIGHTS[box.boxType];
  const color = BOX_COLORS[box.boxType];
  const holdsFrames = FRAME_HOLDING_BOX_TYPES.includes(box.boxType);

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
        <meshStandardMaterial color={color} transparent opacity={holdsFrames ? 0.35 : 1} />
      </mesh>
      {framePositions.map((x, i) => (
        <FrameMesh
          key={i}
          x={x}
          height={height}
          isSelected={selectedFrame === i + 1}
          onClick={() => onFrameClick(box.id, i + 1)}
        />
      ))}
    </group>
  );
}
