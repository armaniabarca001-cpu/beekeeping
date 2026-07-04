import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { getOwnedHive } from "@/lib/ownership";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export interface FrameStatus {
  hasBrood: boolean;
  hasCappedBrood: boolean;
  hasEggs: boolean;
  hasLarvae: boolean;
  hasCappedHoney: boolean;
  hasNectar: boolean;
  hasQueenCells: boolean;
  cappedHoneyPct: number | null;
}

const BOOLEAN_KEYS = [
  "hasBrood",
  "hasCappedBrood",
  "hasEggs",
  "hasLarvae",
  "hasCappedHoney",
  "hasNectar",
] as const;

export async function GET(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: hiveId } = await params;
  const hive = await getOwnedHive(hiveId, userId);
  if (!hive) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const observations = await prisma.frameObservation.findMany({
    where: { frame: { hiveBox: { hiveId } } },
    include: { queenCells: true, inspection: { select: { timestamp: true } } },
    orderBy: { inspection: { timestamp: "desc" } },
  });

  // Latest observation per (frameId, side); observations are already ordered
  // newest-first, so the first one seen per key wins.
  const latestBySide = new Map<string, (typeof observations)[number]>();
  for (const obs of observations) {
    const key = `${obs.frameId}:${obs.side}`;
    if (!latestBySide.has(key)) latestBySide.set(key, obs);
  }

  const frameStatus: Record<string, FrameStatus> = {};
  for (const obs of latestBySide.values()) {
    const status =
      frameStatus[obs.frameId] ??
      (frameStatus[obs.frameId] = {
        hasBrood: false,
        hasCappedBrood: false,
        hasEggs: false,
        hasLarvae: false,
        hasCappedHoney: false,
        hasNectar: false,
        hasQueenCells: false,
        cappedHoneyPct: null,
      });

    for (const key of BOOLEAN_KEYS) {
      if (obs[key]) status[key] = true;
    }
    if (obs.queenCells.length > 0) status.hasQueenCells = true;
    if (obs.cappedHoneyPct != null) {
      status.cappedHoneyPct = Math.max(status.cappedHoneyPct ?? 0, obs.cappedHoneyPct);
    }
  }

  return NextResponse.json({ frameStatus });
}
