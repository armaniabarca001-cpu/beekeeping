"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  BOX_LABELS,
  frameCapacityFor,
  type BoxType,
  type EquipmentWidth,
} from "@/lib/hive-boxes";
import type { HiveBoxSpec } from "@/components/hive/types";

const HiveScene = dynamic(
  () => import("@/components/hive/HiveScene").then((m) => m.HiveScene),
  { ssr: false },
);

interface BodyBox {
  id: string;
  boxType: BoxType;
  framesInstalledCount: number;
}

const ADDABLE_BODY_BOXES: BoxType[] = ["deep", "medium_super", "shallow_super", "queen_excluder"];

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `body-${idCounter}`;
}

export default function NewHivePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  const [name, setName] = useState("");
  const [equipmentWidth, setEquipmentWidth] = useState<EquipmentWidth>("ten_frame");
  const [hasStand, setHasStand] = useState(true);
  const [hasLandingBoard, setHasLandingBoard] = useState(true);
  const [hasEntranceReducer, setHasEntranceReducer] = useState(false);
  const [bodyBoxes, setBodyBoxes] = useState<BodyBox[]>(() => [
    { id: nextId(), boxType: "deep", framesInstalledCount: frameCapacityFor("ten_frame") },
  ]);
  const [hasInnerCover, setHasInnerCover] = useState(true);
  const [hasOuterCover, setHasOuterCover] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const frameCapacity = frameCapacityFor(equipmentWidth);

  function addBodyBox(boxType: BoxType) {
    setBodyBoxes((boxes) => [
      ...boxes,
      { id: nextId(), boxType, framesInstalledCount: frameCapacity },
    ]);
  }

  function removeBodyBox(id: string) {
    setBodyBoxes((boxes) => boxes.filter((b) => b.id !== id));
  }

  function updateFramesInstalled(id: string, count: number) {
    setBodyBoxes((boxes) =>
      boxes.map((b) => (b.id === id ? { ...b, framesInstalledCount: count } : b)),
    );
  }

  const orderedBoxes: HiveBoxSpec[] = buildOrderedBoxes({
    hasStand,
    hasLandingBoard,
    hasEntranceReducer,
    bodyBoxes,
    hasInnerCover,
    hasOuterCover,
    frameCapacity,
  });

  async function handleCreate() {
    if (!name) {
      setError("Give the hive a name.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/hives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiaryId: params.id,
        name,
        equipmentWidth,
        lat,
        lng,
        hiveBoxes: orderedBoxes.map(({ boxType, positionOrder, frameCapacity, framesInstalledCount }) => ({
          boxType,
          positionOrder,
          frameCapacity,
          framesInstalledCount,
        })),
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not create the hive.");
      setSubmitting(false);
      return;
    }

    const { hive } = await res.json();
    router.push(`/hives/${hive.id}`);
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <div className="flex w-full flex-col gap-4 overflow-y-auto bg-offwhite-500 px-8 py-8 text-navy-500 md:w-96">
        <h1 className="text-xl font-semibold">Build a new hive</h1>

        <label className="flex flex-col gap-1 text-sm">
          Hive name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Hive 1 - Backyard"
            className="rounded-lg border border-slate-100 bg-white px-4 py-2 outline-none focus:border-honey-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Equipment width (locked in per hive)
          <select
            value={equipmentWidth}
            onChange={(e) => setEquipmentWidth(e.target.value as EquipmentWidth)}
            className="rounded-lg border border-slate-100 bg-white px-4 py-2 outline-none focus:border-honey-500"
          >
            <option value="ten_frame">10-frame</option>
            <option value="eight_frame">8-frame</option>
          </select>
        </label>

        <div className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-white p-4 text-sm">
          <ToggleRow label="Hive stand" checked={hasStand} onChange={setHasStand} />
          <ToggleRow label="Landing board" checked={hasLandingBoard} onChange={setHasLandingBoard} />
          <ToggleRow
            label="Entrance reducer"
            checked={hasEntranceReducer}
            onChange={setHasEntranceReducer}
          />
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-white p-4 text-sm">
          <p className="font-medium">Boxes (bottom to top)</p>
          {bodyBoxes.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-2">
              <span>{BOX_LABELS[b.boxType]}</span>
              {b.boxType !== "queen_excluder" && (
                <input
                  type="number"
                  min={1}
                  max={frameCapacity}
                  value={b.framesInstalledCount}
                  onChange={(e) => updateFramesInstalled(b.id, Number(e.target.value))}
                  className="w-16 rounded border border-slate-100 px-2 py-1 text-xs"
                  title="Frames installed"
                />
              )}
              <button
                type="button"
                onClick={() => removeBodyBox(b.id)}
                className="text-xs text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
          <div className="mt-2 flex flex-wrap gap-2">
            {ADDABLE_BODY_BOXES.map((boxType) => (
              <button
                key={boxType}
                type="button"
                onClick={() => addBodyBox(boxType)}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs hover:bg-offwhite-300"
              >
                + {BOX_LABELS[boxType]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-white p-4 text-sm">
          <ToggleRow label="Inner cover" checked={hasInnerCover} onChange={setHasInnerCover} />
          <ToggleRow
            label="Telescoping outer cover"
            checked={hasOuterCover}
            onChange={setHasOuterCover}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleCreate}
          disabled={submitting}
          className="mt-2 rounded-full bg-honey-500 py-3 font-semibold text-navy-500 hover:bg-honey-300 disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create hive"}
        </button>
      </div>

      <div className="relative flex-1 bg-navy-900">
        <HiveScene equipmentWidth={equipmentWidth} boxes={orderedBoxes} />
      </div>
    </div>
  );
}

function buildOrderedBoxes({
  hasStand,
  hasLandingBoard,
  hasEntranceReducer,
  bodyBoxes,
  hasInnerCover,
  hasOuterCover,
  frameCapacity,
}: {
  hasStand: boolean;
  hasLandingBoard: boolean;
  hasEntranceReducer: boolean;
  bodyBoxes: BodyBox[];
  hasInnerCover: boolean;
  hasOuterCover: boolean;
  frameCapacity: number;
}): HiveBoxSpec[] {
  const boxes: HiveBoxSpec[] = [];
  let order = 0;
  if (hasStand) boxes.push(spec("stand", "hive_stand", order++, 0, 0));
  if (hasLandingBoard) boxes.push(spec("landing", "landing_board", order++, 0, 0));
  if (hasEntranceReducer) boxes.push(spec("reducer", "entrance_reducer", order++, 0, 0));
  for (const b of bodyBoxes) {
    const holdsFrames = b.boxType !== "queen_excluder";
    boxes.push(
      spec(
        b.id,
        b.boxType,
        order++,
        holdsFrames ? frameCapacity : 0,
        holdsFrames ? b.framesInstalledCount : 0,
      ),
    );
  }
  if (hasInnerCover) boxes.push(spec("inner", "inner_cover", order++, 0, 0));
  if (hasOuterCover) boxes.push(spec("outer", "outer_cover", order++, 0, 0));
  return boxes;
}

function spec(
  id: string,
  boxType: BoxType,
  positionOrder: number,
  frameCapacity: number,
  framesInstalledCount: number,
): HiveBoxSpec {
  return { id, boxType, positionOrder, frameCapacity, framesInstalledCount };
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-honey-500"
      />
    </label>
  );
}
