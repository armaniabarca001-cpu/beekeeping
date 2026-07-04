"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { HiveBoxSpec } from "@/components/hive/types";

const HiveScene = dynamic(
  () => import("@/components/hive/HiveScene").then((m) => m.HiveScene),
  { ssr: false },
);

// Sample stack: stand -> landing board -> entrance reducer -> deep x2 ->
// queen excluder -> medium super -> inner cover -> outer cover (spec 4.2).
const DEMO_BOXES: HiveBoxSpec[] = [
  { id: "stand", boxType: "hive_stand", positionOrder: 0, frameCapacity: 0, framesInstalledCount: 0 },
  { id: "landing", boxType: "landing_board", positionOrder: 1, frameCapacity: 0, framesInstalledCount: 0 },
  { id: "reducer", boxType: "entrance_reducer", positionOrder: 2, frameCapacity: 0, framesInstalledCount: 0 },
  { id: "deep-1", boxType: "deep", positionOrder: 3, frameCapacity: 10, framesInstalledCount: 10 },
  { id: "deep-2", boxType: "deep", positionOrder: 4, frameCapacity: 10, framesInstalledCount: 9 },
  { id: "excluder", boxType: "queen_excluder", positionOrder: 5, frameCapacity: 0, framesInstalledCount: 0 },
  { id: "super-1", boxType: "medium_super", positionOrder: 6, frameCapacity: 10, framesInstalledCount: 10 },
  { id: "inner", boxType: "inner_cover", positionOrder: 7, frameCapacity: 0, framesInstalledCount: 0 },
  { id: "outer", boxType: "outer_cover", positionOrder: 8, frameCapacity: 0, framesInstalledCount: 0 },
];

export default function HiveDemoPage() {
  const [selected, setSelected] = useState<{ hiveBoxId: string; frameNumber: number } | null>(
    null,
  );

  return (
    <div className="flex flex-1 flex-col bg-navy-900">
      <div className="border-b border-slate-700 px-6 py-4 text-offwhite-500">
        <h1 className="text-lg font-semibold">Demo hive (10-frame, 2 deeps + 1 medium super)</h1>
        <p className="text-sm text-slate-300">
          Drag to orbit, scroll to zoom, click a frame to select it.
          {selected && (
            <span className="ml-2 text-honey-500">
              Selected: box {selected.hiveBoxId}, frame {selected.frameNumber}
            </span>
          )}
        </p>
      </div>
      <div className="flex-1">
        <HiveScene
          equipmentWidth="ten_frame"
          boxes={DEMO_BOXES}
          onFrameSelect={(hiveBoxId, frameNumber) => setSelected({ hiveBoxId, frameNumber })}
        />
      </div>
    </div>
  );
}
