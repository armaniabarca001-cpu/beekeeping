"use client";

import { useState } from "react";
import {
  QUEEN_CELL_LOCATIONS,
  QUEEN_CELL_TYPES,
  TAG_FIELDS,
  type FrameSideData,
} from "@/lib/inspection-tags";
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
  const data = activeSide === "side_a" ? sideA : sideB;

  function update(patch: Partial<FrameSideData>) {
    onChangeSide(activeSide, { ...data, ...patch });
  }

  function addQueenCell() {
    update({
      queenCells: [
        ...data.queenCells,
        {
          id: crypto.randomUUID(),
          cellType: "supersedure",
          locationOnFrame: "mid_face",
          capped: false,
          count: 1,
        },
      ],
    });
  }

  function updateQueenCell(id: string, patch: Partial<FrameSideData["queenCells"][number]>) {
    update({
      queenCells: data.queenCells.map((qc) => (qc.id === id ? { ...qc, ...patch } : qc)),
    });
  }

  function removeQueenCell(id: string) {
    update({ queenCells: data.queenCells.filter((qc) => qc.id !== id) });
  }

  return (
    <div className="flex flex-col gap-4">
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

      <div className="flex flex-wrap gap-2">
        {TAG_FIELDS.map(({ key, label }) => (
          <label
            key={key}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${
              data[key]
                ? "border-honey-500 bg-honey-100 text-navy-500"
                : "border-slate-200 text-slate-500"
            }`}
          >
            <input
              type="checkbox"
              checked={Boolean(data[key])}
              onChange={(e) => update({ [key]: e.target.checked } as Partial<FrameSideData>)}
              className="mr-1.5 accent-honey-500"
            />
            {label}
          </label>
        ))}
      </div>

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
            onClick={addQueenCell}
            className="text-xs text-navy-500 hover:underline"
          >
            + Add queen cell
          </button>
        </div>
        {data.queenCells.map((qc) => (
          <div key={qc.id} className="flex flex-wrap items-center gap-2 text-sm">
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
            <select
              value={qc.locationOnFrame}
              onChange={(e) => updateQueenCell(qc.id, { locationOnFrame: e.target.value as never })}
              className="rounded border border-slate-200 px-2 py-1"
            >
              {QUEEN_CELL_LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
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
            <button
              type="button"
              onClick={() => removeQueenCell(qc.id)}
              className="text-xs text-red-600 hover:underline"
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

      <AudioRecorder value={data.audioDataUrl} onChange={(dataUrl) => update({ audioDataUrl: dataUrl })} />
    </div>
  );
}
