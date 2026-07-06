"use client";

import { useState } from "react";
import {
  QUEEN_CELL_TYPES,
  QUADRANT_TAG_FIELDS,
  deriveLocationFromPosition,
  type FrameSideData,
  type QuadrantKey,
  type QuadrantTagKey,
} from "@/lib/inspection-tags";
import { FrameDiagram } from "./FrameDiagram";
import { AudioRecorder } from "./AudioRecorder";

interface FrameEditorProps {
  boxLabel: string;
  frameNumber: number;
  sideA: FrameSideData;
  sideB: FrameSideData;
  onChangeSide: (side: "side_a" | "side_b", data: FrameSideData) => void;
}

export function FrameEditor({ boxLabel, frameNumber, sideA, sideB, onChangeSide }: FrameEditorProps) {
  const [activeSide, setActiveSide] = useState<"side_a" | "side_b">("side_a");
  const [activeBrush, setActiveBrush] = useState<QuadrantTagKey | null>("hasBrood");
  const [selectedQueenCellId, setSelectedQueenCellId] = useState<string | null>(null);
  const [placingQueenCell, setPlacingQueenCell] = useState(false);
  const data = activeSide === "side_a" ? sideA : sideB;

  function update(patch: Partial<FrameSideData>) {
    onChangeSide(activeSide, { ...data, ...patch });
  }

  function toggleQuadrantTag(quadrant: QuadrantKey, tag: QuadrantTagKey) {
    update({
      quadrants: {
        ...data.quadrants,
        [quadrant]: { ...data.quadrants[quadrant], [tag]: !data.quadrants[quadrant][tag] },
      },
    });
  }

  function placeQueenCell(x: number, y: number) {
    const id = crypto.randomUUID();
    update({
      queenCells: [...data.queenCells, { id, cellType: "supersedure", capped: false, count: 1, positionX: x, positionY: y }],
    });
    setSelectedQueenCellId(id);
    setPlacingQueenCell(false);
  }

  function moveQueenCell(id: string, x: number, y: number) {
    update({
      queenCells: data.queenCells.map((qc) => (qc.id === id ? { ...qc, positionX: x, positionY: y } : qc)),
    });
  }

  function updateQueenCell(id: string, patch: Partial<FrameSideData["queenCells"][number]>) {
    update({ queenCells: data.queenCells.map((qc) => (qc.id === id ? { ...qc, ...patch } : qc)) });
  }

  function removeQueenCell(id: string) {
    update({ queenCells: data.queenCells.filter((qc) => qc.id !== id) });
    if (selectedQueenCellId === id) setSelectedQueenCellId(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy-500">
          {boxLabel}, Frame {frameNumber}
        </h2>
        <div className="flex w-fit rounded-full bg-slate-100 p-1 text-sm">
          {(["side_a", "side_b"] as const).map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => setActiveSide(side)}
              className={`rounded-full px-4 py-1.5 font-medium ${
                activeSide === side ? "bg-honey-500 text-navy-500" : "text-slate-500"
              }`}
            >
              {side === "side_a" ? "Side A" : "Side B"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: the visual frame, always in view while entering details */}
        <div className="flex flex-col gap-2">
          <FrameDiagram
            quadrants={data.quadrants}
            activeBrush={activeBrush}
            onToggleQuadrantTag={toggleQuadrantTag}
            queenCells={data.queenCells}
            selectedQueenCellId={selectedQueenCellId}
            onSelectQueenCell={setSelectedQueenCellId}
            onMoveQueenCell={moveQueenCell}
            placingQueenCell={placingQueenCell}
            onPlaceQueenCell={placeQueenCell}
          />
          <p className="text-xs text-slate-500">
            {placingQueenCell
              ? "Click on the frame to drop a queen cell marker."
              : activeBrush
                ? `Painting "${QUADRANT_TAG_FIELDS.find((t) => t.key === activeBrush)?.label}" - click a quadrant to mark it.`
                : "Pick a tag below, then click quadrants to mark where it appears."}
          </p>
        </div>

        {/* Right: the input form for whichever frame/side is on the left */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-500">Tag a region</p>
            <div className="flex flex-wrap gap-2">
              {QUADRANT_TAG_FIELDS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveBrush(activeBrush === t.key ? null : t.key)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${
                    activeBrush === t.key
                      ? "border-honey-500 bg-honey-100 text-navy-500"
                      : "border-slate-200 text-slate-500"
                  }`}
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: t.color, border: "1px solid #0002" }}
                  />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={data.queenPresent}
              onChange={(e) => update({ queenPresent: e.target.checked })}
              className="accent-honey-500"
            />
            Queen present on this side
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            % capped honey
            <input
              type="number"
              min={0}
              max={100}
              value={data.cappedHoneyPct ?? ""}
              onChange={(e) =>
                update({ cappedHoneyPct: e.target.value === "" ? null : Number(e.target.value) })
              }
              className="w-20 rounded border border-slate-200 px-2 py-1"
            />
          </label>

          <div className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-navy-500">Queen cells</p>
              <button
                type="button"
                onClick={() => setPlacingQueenCell(true)}
                className="rounded-full bg-honey-500 px-3 py-1 text-xs font-medium text-navy-500 hover:bg-honey-300"
              >
                + Place on frame
              </button>
            </div>
            {data.queenCells.length === 0 && (
              <p className="text-xs text-slate-400">None placed yet.</p>
            )}
            {data.queenCells.map((qc) => (
              <div
                key={qc.id}
                onClick={() => setSelectedQueenCellId(qc.id)}
                className={`flex flex-wrap items-center gap-2 rounded border p-2 text-sm ${
                  selectedQueenCellId === qc.id ? "border-honey-500 bg-honey-100" : "border-slate-100"
                }`}
              >
                <select
                  value={qc.cellType}
                  onChange={(e) => updateQueenCell(qc.id, { cellType: e.target.value as never })}
                  className="rounded border border-slate-200 px-2 py-1"
                >
                  {QUEEN_CELL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={qc.count}
                  onChange={(e) => updateQueenCell(qc.id, { count: Number(e.target.value) })}
                  className="w-16 rounded border border-slate-200 px-2 py-1"
                />
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={qc.capped}
                    onChange={(e) => updateQueenCell(qc.id, { capped: e.target.checked })}
                    className="accent-honey-500"
                  />
                  Capped
                </label>
                <span className="text-xs text-slate-400">
                  {deriveLocationFromPosition(qc.positionX, qc.positionY).replace(/_/g, " ")}
                </span>
                <button
                  type="button"
                  onClick={() => removeQueenCell(qc.id)}
                  className="ml-auto text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <textarea
            value={data.notes}
            onChange={(e) => update({ notes: e.target.value })}
            placeholder="Typed notes for this frame/side..."
            rows={3}
            className="rounded-lg border border-slate-100 bg-white px-4 py-3 text-sm outline-none focus:border-honey-500"
          />

          <AudioRecorder
            value={data.audioDataUrl}
            onChange={(dataUrl) => update({ audioDataUrl: dataUrl })}
          />
        </div>
      </div>
    </div>
  );
}
