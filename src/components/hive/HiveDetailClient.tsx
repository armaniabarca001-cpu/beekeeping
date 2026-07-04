"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { EquipmentWidth } from "@/lib/hive-boxes";
import type { HiveBoxSpec } from "./types";
import { FrameHistoryPanel } from "./FrameHistoryPanel";
import { WeatherWidget } from "./WeatherWidget";
import type { FrameStatus } from "@/app/api/hives/[id]/frame-status/route";

const HiveScene = dynamic(() => import("./HiveScene").then((m) => m.HiveScene), {
  ssr: false,
});

interface HiveBoxWithFrames extends HiveBoxSpec {
  frames: { id: string; frameNumber: number }[];
}

interface HiveDetailClientProps {
  hiveId: string;
  hiveName: string;
  apiaryId: string;
  apiaryName: string;
  equipmentWidth: EquipmentWidth;
  hiveBoxes: HiveBoxWithFrames[];
}

type BooleanFilterKey =
  | "hasQueenCells"
  | "hasCappedBrood"
  | "hasEggs"
  | "hasLarvae"
  | "hasCappedHoney"
  | "hasNectar";

const BOOLEAN_FILTERS: { key: BooleanFilterKey; label: string }[] = [
  { key: "hasQueenCells", label: "Queen cells" },
  { key: "hasCappedBrood", label: "Capped brood" },
  { key: "hasEggs", label: "Eggs" },
  { key: "hasLarvae", label: "Larvae" },
  { key: "hasCappedHoney", label: "Capped honey" },
  { key: "hasNectar", label: "Nectar" },
];
const PCT_FILTER_KEY = "cappedHoneyPct";

export function HiveDetailClient({
  hiveId,
  hiveName,
  apiaryId,
  apiaryName,
  equipmentWidth,
  hiveBoxes,
}: HiveDetailClientProps) {
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [frameStatus, setFrameStatus] = useState<Record<string, FrameStatus>>({});
  const [activeFilters, setActiveFilters] = useState<Set<BooleanFilterKey | typeof PCT_FILTER_KEY>>(
    new Set(),
  );

  useEffect(() => {
    fetch(`/api/hives/${hiveId}/frame-status`)
      .then((res) => res.json())
      .then((data) => setFrameStatus(data.frameStatus ?? {}));
  }, [hiveId]);

  const boxes: HiveBoxSpec[] = hiveBoxes.map((box) => ({
    id: box.id,
    boxType: box.boxType,
    positionOrder: box.positionOrder,
    frameCapacity: box.frameCapacity,
    framesInstalledCount: box.framesInstalledCount,
  }));

  const frameLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const box of hiveBoxes) {
      for (const frame of box.frames) {
        map.set(`${box.id}:${frame.frameNumber}`, frame.id);
      }
    }
    return map;
  }, [hiveBoxes]);

  const frameKeyById = useMemo(() => {
    const map = new Map<string, string>();
    for (const [key, frameId] of frameLookup) map.set(frameId, key);
    return map;
  }, [frameLookup]);

  const highlightedFrameKeys = useMemo(() => {
    if (activeFilters.size === 0) return undefined;
    const keys = new Set<string>();
    for (const [frameId, status] of Object.entries(frameStatus)) {
      const matches = [...activeFilters].some((filter) =>
        filter === PCT_FILTER_KEY ? (status.cappedHoneyPct ?? 0) > 0 : status[filter],
      );
      if (matches) {
        const key = frameKeyById.get(frameId);
        if (key) keys.add(key);
      }
    }
    return keys;
  }, [activeFilters, frameStatus, frameKeyById]);

  function toggleFilter(key: BooleanFilterKey | typeof PCT_FILTER_KEY) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleFrameSelect(hiveBoxId: string, frameNumber: number) {
    const frameId = frameLookup.get(`${hiveBoxId}:${frameNumber}`);
    if (frameId) setSelectedFrameId(frameId);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-slate-700 bg-navy-500 px-6 py-4 text-offwhite-500">
        <div>
          <h1 className="text-lg font-semibold">{hiveName}</h1>
          <Link href={`/apiaries/${apiaryId}`} className="text-sm text-slate-300 hover:text-honey-500">
            &larr; {apiaryName}
          </Link>
        </div>
        <WeatherWidget hiveId={hiveId} />
        <div className="flex items-center gap-3">
          <Link
            href={`/hives/${hiveId}/treatments`}
            className="rounded-full border border-slate-500 px-5 py-2 text-sm font-medium text-offwhite-500 hover:border-honey-500 hover:text-honey-500"
          >
            Treatments
          </Link>
          <Link
            href={`/hives/${hiveId}/inspections/new`}
            className="rounded-full bg-honey-500 px-5 py-2 text-sm font-semibold text-navy-500 hover:bg-honey-300"
          >
            Start inspection
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-700 bg-navy-500 px-6 py-3">
        {BOOLEAN_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleFilter(key)}
            className={`rounded-full border px-3 py-1 text-xs ${
              activeFilters.has(key)
                ? "border-red-500 bg-red-500/20 text-red-300"
                : "border-slate-600 text-slate-300 hover:border-slate-400"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => toggleFilter(PCT_FILTER_KEY)}
          className={`rounded-full border px-3 py-1 text-xs ${
            activeFilters.has(PCT_FILTER_KEY)
              ? "border-red-500 bg-red-500/20 text-red-300"
              : "border-slate-600 text-slate-300 hover:border-slate-400"
          }`}
        >
          % capped honey
        </button>
      </div>

      <div className="relative flex-1 bg-navy-900">
        <HiveScene
          equipmentWidth={equipmentWidth}
          boxes={boxes}
          onFrameSelect={handleFrameSelect}
          highlightedFrameKeys={highlightedFrameKeys}
        />
        <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 text-xs text-navy-500 shadow">
          Click a frame to see its inspection history
        </div>
      </div>

      {selectedFrameId && (
        <FrameHistoryPanel frameId={selectedFrameId} onClose={() => setSelectedFrameId(null)} />
      )}
    </div>
  );
}
