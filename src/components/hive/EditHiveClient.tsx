"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BOX_LABELS,
  FRAME_HOLDING_BOX_TYPES,
  frameCapacityFor,
  type BoxType,
  type EquipmentWidth,
} from "@/lib/hive-boxes";
import type { HiveBoxSpec } from "./types";

const HiveScene = dynamic(() => import("./HiveScene").then((m) => m.HiveScene), {
  ssr: false,
});

interface ExistingBox {
  id: string;
  boxType: BoxType;
  positionOrder: number;
  frameCapacity: number;
  framesInstalledCount: number;
}

interface BodyBox {
  key: string;
  dbId?: string;
  boxType: BoxType;
  framesInstalledCount: number;
}

const ADDABLE_BODY_BOXES: BoxType[] = ["deep", "medium_super", "shallow_super", "queen_excluder"];

function has(boxes: ExistingBox[], type: BoxType) {
  return boxes.some((b) => b.boxType === type);
}

export function EditHiveClient({
  hiveId,
  hiveName,
  equipmentWidth,
  existingBoxes,
}: {
  hiveId: string;
  hiveName: string;
  equipmentWidth: EquipmentWidth;
  existingBoxes: ExistingBox[];
}) {
  const router = useRouter();
  const frameCapacity = frameCapacityFor(equipmentWidth);

  const [name, setName] = useState(hiveName);
  const [hasStand, setHasStand] = useState(has(existingBoxes, "hive_stand"));
  const [hasLandingBoard, setHasLandingBoard] = useState(has(existingBoxes, "landing_board"));
  const [hasEntranceReducer, setHasEntranceReducer] = useState(
    has(existingBoxes, "entrance_reducer"),
  );
  const [bodyBoxes, setBodyBoxes] = useState<BodyBox[]>(() =>
    existingBoxes
      .filter((b) => FRAME_HOLDING_BOX_TYPES.includes(b.boxType) || b.boxType === "queen_excluder")
      .map((b) => ({
        key: b.id,
        dbId: b.id,
        boxType: b.boxType,
        framesInstalledCount: b.framesInstalledCount,
      })),
  );
  const [hasInnerCover, setHasInnerCover] = useState(has(existingBoxes, "inner_cover"));
  const [hasOuterCover, setHasOuterCover] = useState(has(existingBoxes, "outer_cover"));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function addBodyBox(boxType: BoxType) {
    setBodyBoxes((boxes) => [
      ...boxes,
      { key: crypto.randomUUID(), boxType, framesInstalledCount: frameCapacity },
    ]);
  }

  function removeBodyBox(key: string) {
    const box = bodyBoxes.find((b) => b.key === key);
    if (
      box?.dbId &&
      !confirm(
        "This box already has frames. Removing it deletes those frames and any inspection history recorded for them. Continue?",
      )
    ) {
      return;
    }
    setBodyBoxes((boxes) => boxes.filter((b) => b.key !== key));
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

  async function handleSave() {
    if (!name) {
      setError("Give the hive a name.");
      return;
    }
    setSubmitting(true);
    setError(null);

    let order = 0;
    const hiveBoxesPayload: Record<string, unknown>[] = [];
    if (hasStand) hiveBoxesPayload.push({ boxType: "hive_stand", positionOrder: order++ });
    if (hasLandingBoard) hiveBoxesPayload.push({ boxType: "landing_board", positionOrder: order++ });
    if (hasEntranceReducer)
      hiveBoxesPayload.push({ boxType: "entrance_reducer", positionOrder: order++ });
    for (const b of bodyBoxes) {
      if (b.dbId) {
        hiveBoxesPayload.push({ id: b.dbId, boxType: b.boxType, positionOrder: order++ });
      } else {
        const holdsFrames = b.boxType !== "queen_excluder";
        hiveBoxesPayload.push({
          boxType: b.boxType,
          positionOrder: order++,
          frameCapacity: holdsFrames ? frameCapacity : 0,
          framesInstalledCount: holdsFrames ? b.framesInstalledCount : 0,
        });
      }
    }
    if (hasInnerCover) hiveBoxesPayload.push({ boxType: "inner_cover", positionOrder: order++ });
    if (hasOuterCover) hiveBoxesPayload.push({ boxType: "outer_cover", positionOrder: order++ });

    const res = await fetch(`/api/hives/${hiveId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, hiveBoxes: hiveBoxesPayload }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not save changes.");
      setSubmitting(false);
      return;
    }

    router.push(`/hives/${hiveId}`);
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <div className="flex w-full flex-col gap-4 overflow-y-auto bg-offwhite-500 px-8 py-8 text-navy-500 md:w-96">
        <div>
          <Link href={`/hives/${hiveId}`} className="text-sm text-slate-500 hover:text-navy-500">
            &larr; Cancel
          </Link>
          <h1 className="mt-1 text-xl font-semibold">Edit hive</h1>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Hive name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-slate-100 bg-white px-4 py-2 outline-none focus:border-honey-500"
          />
        </label>

        <p className="text-xs text-slate-500">
          Equipment width: {equipmentWidth === "ten_frame" ? "10-frame" : "8-frame"} (locked in per
          hive)
        </p>

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
            <div key={b.key} className="flex items-center justify-between gap-2">
              <span>
                {BOX_LABELS[b.boxType]}
                {b.dbId && <span className="ml-1 text-xs text-slate-400">(existing)</span>}
              </span>
              {b.boxType !== "queen_excluder" && (
                <input
                  type="number"
                  min={1}
                  max={frameCapacity}
                  value={b.framesInstalledCount}
                  disabled={Boolean(b.dbId)}
                  onChange={(e) =>
                    setBodyBoxes((boxes) =>
                      boxes.map((x) =>
                        x.key === b.key ? { ...x, framesInstalledCount: Number(e.target.value) } : x,
                      ),
                    )
                  }
                  className="w-16 rounded border border-slate-100 px-2 py-1 text-xs disabled:bg-slate-50"
                  title="Frames installed"
                />
              )}
              <button
                type="button"
                onClick={() => removeBodyBox(b.key)}
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
          onClick={handleSave}
          disabled={submitting}
          className="mt-2 rounded-full bg-honey-500 py-3 font-semibold text-navy-500 hover:bg-honey-300 disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save changes"}
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
        b.key,
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
