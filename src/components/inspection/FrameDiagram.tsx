"use client";

import { useRef, useState } from "react";
import {
  QUADRANT_KEYS,
  QUADRANT_TAG_FIELDS,
  type QuadrantKey,
  type QuadrantTagKey,
  type QuadrantTags,
  type QueenCellEntry,
} from "@/lib/inspection-tags";

const WIDTH = 300;
const HEIGHT = 150;

const QUADRANT_RECTS: Record<QuadrantKey, { x: number; y: number }> = {
  top_left: { x: 0, y: 0 },
  top_right: { x: WIDTH / 2, y: 0 },
  bottom_left: { x: 0, y: HEIGHT / 2 },
  bottom_right: { x: WIDTH / 2, y: HEIGHT / 2 },
};

interface FrameDiagramProps {
  quadrants: Record<QuadrantKey, QuadrantTags>;
  activeBrush: QuadrantTagKey | null;
  onToggleQuadrantTag: (quadrant: QuadrantKey, tag: QuadrantTagKey) => void;
  queenCells: QueenCellEntry[];
  selectedQueenCellId: string | null;
  onSelectQueenCell: (id: string) => void;
  onMoveQueenCell: (id: string, x: number, y: number) => void;
  placingQueenCell: boolean;
  onPlaceQueenCell: (x: number, y: number) => void;
}

export function FrameDiagram({
  quadrants,
  activeBrush,
  onToggleQuadrantTag,
  queenCells,
  selectedQueenCellId,
  onSelectQueenCell,
  onMoveQueenCell,
  placingQueenCell,
  onPlaceQueenCell,
}: FrameDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function toNormalized(clientX: number, clientY: number) {
    const rect = svgRef.current!.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    return { x, y };
  }

  function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!placingQueenCell) return;
    const { x, y } = toNormalized(e.clientX, e.clientY);
    onPlaceQueenCell(x, y);
  }

  function handleMarkerPointerDown(id: string, e: React.PointerEvent) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDraggingId(id);
    onSelectQueenCell(id);
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!draggingId) return;
    const { x, y } = toNormalized(e.clientX, e.clientY);
    onMoveQueenCell(draggingId, x, y);
  }

  return (
    <div className="flex flex-col gap-2">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={`w-full rounded border border-slate-200 bg-[#f3e2b3] ${
          placingQueenCell ? "cursor-crosshair" : ""
        }`}
        onClick={handleSvgClick}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDraggingId(null)}
      >
        {/* wood frame border */}
        <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="none" stroke="#a9764a" strokeWidth={6} />

        {QUADRANT_KEYS.map((q) => {
          const { x, y } = QUADRANT_RECTS[q];
          const activeTags = QUADRANT_TAG_FIELDS.filter((t) => quadrants[q][t.key]);
          return (
            <g key={q}>
              <rect
                x={x}
                y={y}
                width={WIDTH / 2}
                height={HEIGHT / 2}
                fill="transparent"
                stroke="#c9a35f"
                strokeDasharray="2,2"
                onClick={(e) => {
                  if (placingQueenCell) return; // let it bubble to the SVG's click handler
                  e.stopPropagation();
                  if (activeBrush) onToggleQuadrantTag(q, activeBrush);
                }}
                className={activeBrush && !placingQueenCell ? "cursor-pointer" : ""}
              />
              {activeTags.map((t, i) => (
                <circle
                  key={t.key}
                  cx={x + 14 + i * 16}
                  cy={y + 14}
                  r={6}
                  fill={t.color}
                  stroke="#00000030"
                  pointerEvents="none"
                />
              ))}
            </g>
          );
        })}

        {queenCells.map((qc) => (
          <circle
            key={qc.id}
            cx={qc.positionX * WIDTH}
            cy={qc.positionY * HEIGHT}
            r={selectedQueenCellId === qc.id ? 9 : 7}
            fill="#ef4444"
            stroke="#ffffff"
            strokeWidth={2}
            className="cursor-move"
            onPointerDown={(e) => handleMarkerPointerDown(qc.id, e)}
          />
        ))}
      </svg>

      <div className="flex flex-wrap gap-1.5">
        {QUADRANT_TAG_FIELDS.map((t) => (
          <span key={t.key} className="flex items-center gap-1 text-[11px] text-slate-500">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: t.color, border: "1px solid #0002" }}
            />
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}
