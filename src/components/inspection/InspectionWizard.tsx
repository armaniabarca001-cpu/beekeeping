"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BOX_LABELS, type BoxType } from "@/lib/hive-boxes";
import { Button } from "@/components/ui/Button";
import {
  QUADRANT_KEYS,
  aggregateQuadrantTags,
  deriveLocationFromPosition,
  emptySideData,
  sideHasData,
  type FrameSideData,
} from "@/lib/inspection-tags";
import { FrameEditor } from "./FrameEditor";

interface FrameRef {
  frameId: string;
  frameNumber: number;
  boxId: string;
  boxType: BoxType;
}

interface InspectionWizardProps {
  hiveId: string;
  hiveName: string;
  frames: FrameRef[];
}

interface FrameEntry {
  sideA: FrameSideData;
  sideB: FrameSideData;
}

export function InspectionWizard({ hiveId, hiveName, frames }: InspectionWizardProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [generalNotes, setGeneralNotes] = useState("");
  const [frameData, setFrameData] = useState<Record<string, FrameEntry>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const current = frames[currentIndex];

  const groupedByBox = useMemo(() => {
    const groups = new Map<string, FrameRef[]>();
    for (const f of frames) {
      if (!groups.has(f.boxId)) groups.set(f.boxId, []);
      groups.get(f.boxId)!.push(f);
    }
    return groups;
  }, [frames]);

  function entryFor(frameId: string): FrameEntry {
    return frameData[frameId] ?? { sideA: emptySideData(), sideB: emptySideData() };
  }

  function updateSide(frameId: string, side: "side_a" | "side_b", data: FrameSideData) {
    setFrameData((prev) => {
      const existing = prev[frameId] ?? { sideA: emptySideData(), sideB: emptySideData() };
      return {
        ...prev,
        [frameId]: side === "side_a" ? { ...existing, sideA: data } : { ...existing, sideB: data },
      };
    });
  }

  function frameHasData(frameId: string): boolean {
    const entry = frameData[frameId];
    if (!entry) return false;
    return sideHasData(entry.sideA) || sideHasData(entry.sideB);
  }

  async function handleFinish() {
    setSubmitting(true);
    setError(null);

    const frameObservations: Record<string, unknown>[] = [];
    const media: Record<string, unknown>[] = [];

    for (const frame of frames) {
      const entry = frameData[frame.frameId];
      if (!entry) continue;
      for (const side of ["side_a", "side_b"] as const) {
        const sd = side === "side_a" ? entry.sideA : entry.sideB;
        if (!sideHasData(sd)) continue;
        const aggregate = aggregateQuadrantTags(sd);
        frameObservations.push({
          frameId: frame.frameId,
          side,
          hasBrood: aggregate.hasBrood,
          hasCappedBrood: aggregate.hasCappedBrood,
          hasEggs: aggregate.hasEggs,
          hasLarvae: aggregate.hasLarvae,
          queenPresent: sd.queenPresent,
          hasCappedHoney: aggregate.hasCappedHoney,
          hasNectar: aggregate.hasNectar,
          cappedHoneyPct: sd.cappedHoneyPct ?? undefined,
          notes: sd.notes || undefined,
          quadrantObservations: QUADRANT_KEYS.filter((q) =>
            Object.values(sd.quadrants[q]).some(Boolean),
          ).map((q) => ({ quadrant: q, ...sd.quadrants[q] })),
          queenCells: sd.queenCells.map((qc) => ({
            cellType: qc.cellType,
            locationOnFrame: deriveLocationFromPosition(qc.positionX, qc.positionY),
            capped: qc.capped,
            count: qc.count,
            positionX: qc.positionX,
            positionY: qc.positionY,
          })),
        });
        if (sd.audioDataUrl) {
          media.push({ frameId: frame.frameId, mediaType: "audio", fileUrl: sd.audioDataUrl });
        }
      }
    }

    if (frameObservations.length === 0 && !generalNotes.trim()) {
      setError("Record something for at least one frame, or add general notes, before finishing.");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hiveId, generalNotes: generalNotes || undefined, frameObservations, media }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not save the inspection.");
      setSubmitting(false);
      return;
    }

    router.push(`/hives/${hiveId}`);
  }

  return (
    <div className="flex flex-1">
      <aside className="w-56 shrink-0 overflow-y-auto border-r border-slate-100 bg-offwhite-500 p-4">
        <Button href={`/hives/${hiveId}`} variant="ghost" size="sm" className="mb-4">
          &larr; Cancel
        </Button>
        {[...groupedByBox.entries()].map(([boxId, boxFrames]) => (
          <div key={boxId} className="mb-4">
            <p className="mb-1 text-xs font-semibold uppercase text-slate-400">
              {BOX_LABELS[boxFrames[0].boxType]}
            </p>
            <div className="flex flex-wrap gap-1">
              {boxFrames.map((f) => {
                const idx = frames.indexOf(f);
                return (
                  <button
                    key={f.frameId}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-8 w-8 rounded text-xs font-medium ${
                      idx === currentIndex
                        ? "bg-honey-500 text-navy-500"
                        : frameHasData(f.frameId)
                          ? "bg-honey-100 text-navy-500"
                          : "bg-white text-slate-500"
                    }`}
                  >
                    {f.frameNumber}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </aside>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
        <div>
          <h1 className="text-xl font-semibold text-navy-500">Inspecting {hiveName}</h1>
          <p className="text-sm text-slate-500">
            Frame {currentIndex + 1} of {frames.length}
          </p>
        </div>

        {current ? (
          <FrameEditor
            boxLabel={BOX_LABELS[current.boxType]}
            frameNumber={current.frameNumber}
            sideA={entryFor(current.frameId).sideA}
            sideB={entryFor(current.frameId).sideB}
            onChangeSide={(side, data) => updateSide(current.frameId, side, data)}
          />
        ) : (
          <p className="text-slate-500">This hive has no frame-holding boxes yet.</p>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          >
            Previous frame
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={currentIndex >= frames.length - 1}
            onClick={() => setCurrentIndex((i) => Math.min(frames.length - 1, i + 1))}
          >
            Next frame
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4">
          <label className="flex flex-col gap-1 text-sm">
            General notes for this inspection
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              rows={2}
              className="rounded-lg border border-slate-100 bg-white px-4 py-3 outline-none focus:border-honey-500"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button variant="primary" className="w-fit" onClick={handleFinish} disabled={submitting}>
            {submitting ? "Saving..." : "Finish & save inspection"}
          </Button>
        </div>
      </div>
    </div>
  );
}
