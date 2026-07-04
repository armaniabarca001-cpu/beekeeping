"use client";

import { useState } from "react";

export interface MiteCountPoint {
  id: string;
  date: string;
  before: number | null;
  after: number | null;
}

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 32 };

export function MiteCountChart({ points }: { points: MiteCountPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const withData = points.filter((p) => p.before != null || p.after != null);
  if (withData.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No mite counts recorded yet - add a treatment with a mite count to start the trend.
      </p>
    );
  }

  const maxCount = Math.max(1, ...withData.flatMap((p) => [p.before ?? 0, p.after ?? 0]));
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;

  function x(i: number) {
    return PAD.left + (withData.length === 1 ? innerW / 2 : (i / (withData.length - 1)) * innerW);
  }
  function y(value: number) {
    return PAD.top + innerH - (value / maxCount) * innerH;
  }

  function pathFor(key: "before" | "after") {
    const segments: string[] = [];
    withData.forEach((p, i) => {
      const v = p[key];
      if (v == null) return;
      segments.push(`${segments.length === 0 ? "M" : "L"} ${x(i)} ${y(v)}`);
    });
    return segments.join(" ");
  }

  const hovered = hoverIndex != null ? withData[hoverIndex] : null;

  return (
    <div className="viz-root">
      <style>{`
        .viz-root {
          --surface-1: #fcfcfb;
          --text-primary: #0b0b0b;
          --text-secondary: #52514e;
          --muted: #898781;
          --gridline: #e1e0d9;
          --baseline: #c3c2b7;
          --series-before: #2a78d6;
          --series-after: #1baf7a;
        }
        @media (prefers-color-scheme: dark) {
          .viz-root {
            --surface-1: #1a1a19;
            --text-primary: #ffffff;
            --text-secondary: #c3c2b7;
            --muted: #898781;
            --gridline: #2c2c2a;
            --baseline: #383835;
            --series-before: #3987e5;
            --series-after: #199e70;
          }
        }
      `}</style>

      <div className="mb-2 flex items-center gap-4 text-xs" style={{ color: "var(--text-secondary)" }}>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: "var(--series-before)" }}
          />
          Mite count before treatment
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: "var(--series-after)" }}
          />
          Mite count after treatment
        </span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ background: "var(--surface-1)" }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <line
          x1={PAD.left}
          y1={PAD.top + innerH}
          x2={WIDTH - PAD.right}
          y2={PAD.top + innerH}
          stroke="var(--baseline)"
        />
        <path d={pathFor("before")} fill="none" stroke="var(--series-before)" strokeWidth={2} />
        <path d={pathFor("after")} fill="none" stroke="var(--series-after)" strokeWidth={2} />

        {withData.map((p, i) => (
          <g key={p.id}>
            {p.before != null && (
              <circle cx={x(i)} cy={y(p.before)} r={4} fill="var(--series-before)" />
            )}
            {p.after != null && <circle cx={x(i)} cy={y(p.after)} r={4} fill="var(--series-after)" />}
            <rect
              x={x(i) - innerW / withData.length / 2}
              y={PAD.top}
              width={innerW / withData.length}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
            />
          </g>
        ))}

        {hovered && (
          <line
            x1={x(hoverIndex!)}
            y1={PAD.top}
            x2={x(hoverIndex!)}
            y2={PAD.top + innerH}
            stroke="var(--muted)"
            strokeDasharray="3,3"
          />
        )}
      </svg>

      {hovered && (
        <div className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
          {new Date(hovered.date).toLocaleDateString()} — before: {hovered.before ?? "-"}, after:{" "}
          {hovered.after ?? "-"}
        </div>
      )}
    </div>
  );
}
