"use client";

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { HiveBoxMesh } from "./HiveBoxMesh";
import { SceneBackground } from "./Backgrounds";
import type { BackgroundTheme } from "@/lib/background-themes";
import {
  BOX_HEIGHTS,
  equipmentWidthToUnits,
  type EquipmentWidth,
  type HiveBoxSpec,
} from "./types";

interface HiveSceneProps {
  equipmentWidth: EquipmentWidth;
  boxes: HiveBoxSpec[];
  onFrameSelect?: (hiveBoxId: string, frameNumber: number) => void;
  // Keys formatted as `${hiveBoxId}:${frameNumber}`.
  highlightedFrameKeys?: Set<string>;
  backgroundTheme?: BackgroundTheme;
}

export function HiveScene({
  equipmentWidth,
  boxes,
  onFrameSelect,
  highlightedFrameKeys,
  backgroundTheme = "garden",
}: HiveSceneProps) {
  const [selected, setSelected] = useState<{ hiveBoxId: string; frameNumber: number } | null>(
    null,
  );
  const width = equipmentWidthToUnits(equipmentWidth);
  const sorted = useMemo(
    () => [...boxes].sort((a, b) => a.positionOrder - b.positionOrder),
    [boxes],
  );

  function handleFrameClick(hiveBoxId: string, frameNumber: number) {
    setSelected({ hiveBoxId, frameNumber });
    onFrameSelect?.(hiveBoxId, frameNumber);
  }

  const { positioned, totalHeight } = useMemo(() => {
    const result = sorted.reduce<{ positioned: { box: HiveBoxSpec; y: number }[]; y: number }>(
      (acc, box) => {
        acc.positioned.push({ box, y: acc.y });
        acc.y += BOX_HEIGHTS[box.boxType];
        return acc;
      },
      { positioned: [], y: 0 },
    );
    return { positioned: result.positioned, totalHeight: result.y };
  }, [sorted]);

  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [3, 1.6, 3], fov: 45 }} shadows>
        <SceneBackground theme={backgroundTheme} hiveRadius={width * 0.7} />
        {positioned.map(({ box, y }) => {
          const highlightedFrameNumbers = highlightedFrameKeys
            ? new Set(
                [...highlightedFrameKeys]
                  .filter((key) => key.startsWith(`${box.id}:`))
                  .map((key) => Number(key.split(":")[1])),
              )
            : undefined;
          return (
            <HiveBoxMesh
              key={box.id}
              box={box}
              width={width}
              y={y}
              selectedFrame={selected?.hiveBoxId === box.id ? selected.frameNumber : null}
              highlightedFrameNumbers={highlightedFrameNumbers}
              onFrameClick={handleFrameClick}
            />
          );
        })}
        <OrbitControls enablePan enableZoom enableRotate target={[0, totalHeight / 2, 0]} />
      </Canvas>
    </div>
  );
}
