"use client";

import { useEffect, useState } from "react";

interface QueenCell {
  id: string;
  cellType: string;
  locationOnFrame: string;
  capped: boolean;
  count: number;
}

interface QuadrantObservation {
  id: string;
  quadrant: string;
  hasBrood: boolean;
  hasCappedBrood: boolean;
  hasEggs: boolean;
  hasLarvae: boolean;
  hasCappedHoney: boolean;
  hasNectar: boolean;
  notes: string | null;
}

interface FrameObservation {
  id: string;
  side: string;
  hasBrood: boolean;
  hasCappedBrood: boolean;
  hasEggs: boolean;
  hasLarvae: boolean;
  queenPresent: boolean;
  hasCappedHoney: boolean;
  hasNectar: boolean;
  cappedHoneyPct: number | null;
  notes: string | null;
  inspection: { id: string; timestamp: string };
  quadrantObservations: QuadrantObservation[];
  queenCells: QueenCell[];
}

const TAG_LABELS: [key: keyof FrameObservation, label: string][] = [
  ["hasBrood", "Brood"],
  ["hasCappedBrood", "Capped brood"],
  ["hasEggs", "Eggs"],
  ["hasLarvae", "Larvae"],
  ["queenPresent", "Queen present"],
  ["hasCappedHoney", "Capped honey"],
  ["hasNectar", "Nectar"],
] as unknown as [keyof FrameObservation, string][];

export function FrameHistoryPanel({
  frameId,
  onClose,
}: {
  frameId: string;
  onClose: () => void;
}) {
  const [result, setResult] = useState<{ frameId: string; observations: FrameObservation[] } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/frames/${frameId}/observations`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setResult({ frameId, observations: data.observations ?? [] });
      });
    return () => {
      cancelled = true;
    };
  }, [frameId]);

  const observations = result?.frameId === frameId ? result.observations : null;

  return (
    <div className="absolute inset-y-0 right-0 z-10 flex w-full max-w-sm flex-col overflow-y-auto border-l border-slate-700 bg-offwhite-500 text-navy-500 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold">Frame history</h2>
        <button type="button" onClick={onClose} className="text-slate-500 hover:text-navy-500">
          Close
        </button>
      </div>

      <div className="flex flex-col gap-4 p-5">
        {observations === null && <p className="text-sm text-slate-500">Loading...</p>}
        {observations?.length === 0 && (
          <p className="text-sm text-slate-500">No inspections recorded for this frame yet.</p>
        )}
        {observations?.map((obs) => (
          <div key={obs.id} className="rounded-lg border border-slate-100 bg-white p-4">
            <p className="text-xs text-slate-500">
              {new Date(obs.inspection.timestamp).toLocaleString()} - {obs.side === "side_a" ? "Side A" : "Side B"}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TAG_LABELS.filter(([key]) => obs[key]).map(([key, label]) => (
                <span
                  key={String(key)}
                  className="rounded-full bg-honey-100 px-2 py-0.5 text-xs text-honey-900"
                >
                  {label}
                </span>
              ))}
              {obs.cappedHoneyPct != null && (
                <span className="rounded-full bg-honey-100 px-2 py-0.5 text-xs text-honey-900">
                  {obs.cappedHoneyPct}% capped
                </span>
              )}
            </div>
            {obs.notes && <p className="mt-2 text-sm text-slate-600">{obs.notes}</p>}
            {obs.queenCells.length > 0 && (
              <div className="mt-2 text-xs text-slate-600">
                Queen cells:{" "}
                {obs.queenCells
                  .map((qc) => `${qc.count}x ${qc.cellType} (${qc.locationOnFrame})`)
                  .join(", ")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
