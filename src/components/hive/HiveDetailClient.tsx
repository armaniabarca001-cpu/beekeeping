"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EquipmentWidth } from "@/lib/hive-boxes";
import {
  BACKGROUND_THEMES,
  BACKGROUND_THEME_LABELS,
  isBackgroundTheme,
  type BackgroundTheme,
} from "@/lib/background-themes";
import type { HiveBoxSpec } from "./types";
import { FrameHistoryPanel } from "./FrameHistoryPanel";
import { WeatherWidget } from "./WeatherWidget";
import type { FrameStatus } from "@/app/api/hives/[id]/frame-status/route";
import { Button } from "@/components/ui/Button";
import { Menu, MenuItem, IconButton } from "@/components/ui/Menu";

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
  backgroundTheme: string;
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
  backgroundTheme,
  hiveBoxes,
}: HiveDetailClientProps) {
  const router = useRouter();
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [frameStatus, setFrameStatus] = useState<Record<string, FrameStatus>>({});
  const [activeFilters, setActiveFilters] = useState<Set<BooleanFilterKey | typeof PCT_FILTER_KEY>>(
    new Set(),
  );
  const [deleting, setDeleting] = useState(false);
  const [theme, setTheme] = useState<BackgroundTheme>(
    isBackgroundTheme(backgroundTheme) ? backgroundTheme : "garden",
  );

  async function handleThemeChange(next: BackgroundTheme) {
    setTheme(next);
    await fetch(`/api/hives/${hiveId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ backgroundTheme: next }),
    });
  }

  async function handleDelete() {
    if (
      !confirm(`Delete "${hiveName}"? This removes the hive and all of its inspection history.`)
    ) {
      return;
    }
    setDeleting(true);
    const res = await fetch(`/api/hives/${hiveId}`, { method: "DELETE" });
    if (res.ok) {
      router.push(`/apiaries/${apiaryId}`);
    } else {
      setDeleting(false);
      alert("Could not delete the hive.");
    }
  }

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
      <div className="flex items-center gap-6 border-b border-white/10 bg-navy-500 px-6 py-3.5 text-offwhite-500">
        <div className="min-w-0">
          <Link
            href={`/apiaries/${apiaryId}`}
            className="text-xs text-slate-400 transition-colors hover:text-honey-500"
          >
            {apiaryName}
          </Link>
          <h1 className="truncate text-base font-semibold leading-tight">{hiveName}</h1>
        </div>

        <div className="hidden md:block">
          <WeatherWidget hiveId={hiveId} />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button href={`/hives/${hiveId}/treatments`} tone="dark" variant="secondary" size="sm">
            Treatments
          </Button>
          <Button href={`/hives/${hiveId}/inspections/new`} variant="primary" size="sm">
            Start inspection
          </Button>
          <Menu
            align="right"
            trigger={
              <IconButton tone="dark" label="More actions">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="8" cy="3" r="1.4" />
                  <circle cx="8" cy="8" r="1.4" />
                  <circle cx="8" cy="13" r="1.4" />
                </svg>
              </IconButton>
            }
          >
            <MenuItem onClick={() => router.push(`/hives/${hiveId}/edit`)}>Edit hive</MenuItem>
            <MenuItem onClick={handleDelete} danger>
              {deleting ? "Deleting..." : "Delete hive"}
            </MenuItem>
          </Menu>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-navy-700 px-6 py-2.5">
        <span className="mr-1 text-xs font-medium text-slate-300">Highlight</span>
        {BOOLEAN_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleFilter(key)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              activeFilters.has(key)
                ? "border-honey-500 bg-honey-500/15 text-honey-300"
                : "border-white/10 text-slate-300 hover:border-white/25"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => toggleFilter(PCT_FILTER_KEY)}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
            activeFilters.has(PCT_FILTER_KEY)
              ? "border-honey-500 bg-honey-500/15 text-honey-300"
              : "border-white/10 text-slate-300 hover:border-white/25"
          }`}
        >
          % capped honey
        </button>

        <span className="ml-2 hidden text-xs text-slate-400 lg:inline">
          Click a frame for its history
        </span>

        <label className="ml-auto flex items-center gap-2 text-xs text-slate-400">
          Background
          <select
            value={theme}
            onChange={(e) => handleThemeChange(e.target.value as BackgroundTheme)}
            className="rounded-md border border-white/10 bg-navy-500 px-2.5 py-1.5 text-xs text-offwhite-500 outline-none transition-colors hover:border-white/25 focus:border-honey-500"
          >
            {BACKGROUND_THEMES.map((t) => (
              <option key={t} value={t}>
                {BACKGROUND_THEME_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="relative flex-1 bg-navy-900">
        <HiveScene
          equipmentWidth={equipmentWidth}
          boxes={boxes}
          onFrameSelect={handleFrameSelect}
          highlightedFrameKeys={highlightedFrameKeys}
          backgroundTheme={theme}
        />
      </div>

      {selectedFrameId && (
        <FrameHistoryPanel frameId={selectedFrameId} onClose={() => setSelectedFrameId(null)} />
      )}
    </div>
  );
}
