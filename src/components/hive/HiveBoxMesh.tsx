"use client";

import { useMemo, useState } from "react";
import { Edges } from "@react-three/drei";
import { BOX_HEIGHTS, FRAME_HOLDING_BOX_TYPES, type HiveBoxSpec } from "./types";
import {
  getCorrugatedMetalTexture,
  getHoneycombTexture,
  getPaintedTexture,
  getWoodTexture,
} from "./textures";

const DEPTH = 1.0;
const FRAME_THICKNESS = 0.03;
const BORDER = 0.05;

// Satin-painted mustard finish for the box body, matching a typical painted
// Langstroth setup; the stand and entrance reducer stay bare/stained wood.
const PAINTED_BOX_TYPES = new Set(["deep", "medium_super", "shallow_super", "landing_board"]);
const BOX_TINTS: Record<string, string> = {
  hive_stand: "#8a6a42",
  landing_board: "#dba52e",
  entrance_reducer: "#7a5a35",
  deep: "#dba52e",
  medium_super: "#dba52e",
  shallow_super: "#dba52e",
  inner_cover: "#c9a35f",
  outer_cover: "#dba52e",
};
const EXCLUDER_COLOR = "#c7cdd3";
const METAL_COLOR = "#c7ccd1";
const HANDLE_METAL_COLOR = "#9aa0a6";

function HandleHardware({ boxWidth }: { boxWidth: number }) {
  return (
    <>
      {[1, -1].map((sign) => (
        <group key={sign} position={[(sign * boxWidth) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh position={[0, 0, sign > 0 ? 0.01 : -0.01]}>
            <capsuleGeometry args={[0.025, 0.16, 4, 8]} />
            <meshStandardMaterial color={HANDLE_METAL_COLOR} metalness={0.85} roughness={0.3} />
          </mesh>
          {[1, -1].map((end) => (
            <mesh key={end} position={[end * 0.09, 0, sign > 0 ? 0.005 : -0.005]}>
              <boxGeometry args={[0.03, 0.045, 0.01]} />
              <meshStandardMaterial color={HANDLE_METAL_COLOR} metalness={0.7} roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

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

function BoxShell({ box, width, height }: { box: HiveBoxSpec; width: number; height: number }) {
  const isExcluder = box.boxType === "queen_excluder";
  const isMetalCover = box.boxType === "outer_cover";
  const isPainted = PAINTED_BOX_TYPES.has(box.boxType) || isMetalCover;
  const holdsFrames = FRAME_HOLDING_BOX_TYPES.includes(box.boxType);
  const tint = BOX_TINTS[box.boxType] ?? "#c9a35f";

  const woodTexture = useMemo(() => getWoodTexture(), []);
  const plainPainted = useMemo(
    () => (isPainted ? getPaintedTexture(tint, { withJoints: holdsFrames }) : null),
    [isPainted, tint, holdsFrames],
  );
  const frontPainted = useMemo(
    () => (isPainted && holdsFrames ? getPaintedTexture(tint, { withHandle: true }) : null),
    [isPainted, holdsFrames, tint],
  );
  const metalTexture = useMemo(() => (isMetalCover ? getCorrugatedMetalTexture() : null), [
    isMetalCover,
  ]);

  if (isExcluder) {
    return (
      <mesh>
        <boxGeometry args={[width, height, DEPTH]} />
        <meshStandardMaterial
          color={EXCLUDER_COLOR}
          metalness={0.7}
          roughness={0.4}
          transparent
          opacity={0.6}
        />
        <Edges scale={1} color="#00000040" />
      </mesh>
    );
  }

  const opacity = holdsFrames ? 0.3 : 1;
  const transparent = holdsFrames;

  if (isMetalCover) {
    // +x, -x, +y, -y, +z, -z
    return (
      <mesh>
        <boxGeometry args={[width, height, DEPTH]} />
        <meshStandardMaterial attach="material-0" map={woodTexture} color={tint} roughness={0.8} />
        <meshStandardMaterial attach="material-1" map={woodTexture} color={tint} roughness={0.8} />
        <meshStandardMaterial
          attach="material-2"
          map={metalTexture}
          color={METAL_COLOR}
          metalness={0.75}
          roughness={0.3}
        />
        <meshStandardMaterial attach="material-3" map={woodTexture} color={tint} roughness={0.8} />
        <meshStandardMaterial attach="material-4" map={woodTexture} color={tint} roughness={0.8} />
        <meshStandardMaterial attach="material-5" map={woodTexture} color={tint} roughness={0.8} />
        <Edges scale={1} color="#00000030" />
      </mesh>
    );
  }

  if (isPainted && holdsFrames) {
    return (
      <group>
        <mesh>
          <boxGeometry args={[width, height, DEPTH]} />
          <meshStandardMaterial
            attach="material-0"
            map={plainPainted!}
            roughness={0.55}
            transparent={transparent}
            opacity={opacity}
          />
          <meshStandardMaterial
            attach="material-1"
            map={plainPainted!}
            roughness={0.55}
            transparent={transparent}
            opacity={opacity}
          />
          <meshStandardMaterial
            attach="material-2"
            map={plainPainted!}
            roughness={0.55}
            transparent={transparent}
            opacity={opacity}
          />
          <meshStandardMaterial
            attach="material-3"
            map={plainPainted!}
            roughness={0.55}
            transparent={transparent}
            opacity={opacity}
          />
          <meshStandardMaterial
            attach="material-4"
            map={frontPainted!}
            roughness={0.55}
            transparent={transparent}
            opacity={opacity}
          />
          <meshStandardMaterial
            attach="material-5"
            map={frontPainted!}
            roughness={0.55}
            transparent={transparent}
            opacity={opacity}
          />
          <Edges scale={1} color="#00000030" />
        </mesh>
        <HandleHardware boxWidth={width} />
      </group>
    );
  }

  return (
    <mesh>
      <boxGeometry args={[width, height, DEPTH]} />
      <meshStandardMaterial
        map={isPainted ? plainPainted! : woodTexture}
        color={isPainted ? undefined : tint}
        roughness={isPainted ? 0.55 : 0.85}
        transparent={transparent}
        opacity={opacity}
      />
      <Edges scale={1} color="#00000030" />
    </mesh>
  );
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
      <BoxShell box={box} width={width} height={height} />
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
