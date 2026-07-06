import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { getOwnedHive } from "@/lib/ownership";

interface FrameObservationInput {
  frameId: string;
  side: "side_a" | "side_b";
  hasBrood?: boolean;
  hasCappedBrood?: boolean;
  hasEggs?: boolean;
  hasLarvae?: boolean;
  queenPresent?: boolean;
  hasCappedHoney?: boolean;
  hasNectar?: boolean;
  cappedHoneyPct?: number;
  notes?: string;
  quadrantObservations?: {
    quadrant: "top_left" | "top_right" | "bottom_left" | "bottom_right";
    hasBrood?: boolean;
    hasCappedBrood?: boolean;
    hasEggs?: boolean;
    hasLarvae?: boolean;
    hasCappedHoney?: boolean;
    hasNectar?: boolean;
    notes?: string;
  }[];
  queenCells?: {
    cellType: "swarm" | "supersedure" | "emergency" | "play_cup";
    locationOnFrame: "bottom_edge" | "side_edge" | "mid_face" | "unknown";
    capped?: boolean;
    count?: number;
    positionX?: number;
    positionY?: number;
  }[];
}

interface InspectionMediaInput {
  frameId?: string;
  mediaType: "audio" | "video";
  fileUrl: string;
  durationSeconds?: number;
}

export async function GET(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hiveId = new URL(request.url).searchParams.get("hiveId");
  if (!hiveId) {
    return NextResponse.json({ error: "hiveId query param is required." }, { status: 400 });
  }

  const hive = await getOwnedHive(hiveId, userId);
  if (!hive) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const inspections = await prisma.inspection.findMany({
    where: { hiveId, deletedAt: null },
    include: {
      media: true,
      frameObservations: { include: { quadrantObservations: true, queenCells: true } },
    },
    orderBy: { timestamp: "desc" },
  });
  return NextResponse.json({ inspections });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    hiveId,
    generalNotes,
    timestamp,
    frameObservations = [],
    media = [],
  }: {
    hiveId: string;
    generalNotes?: string;
    timestamp?: string;
    frameObservations?: FrameObservationInput[];
    media?: InspectionMediaInput[];
  } = body;

  if (!hiveId) {
    return NextResponse.json({ error: "hiveId is required." }, { status: 400 });
  }

  const hive = await getOwnedHive(hiveId, userId);
  if (!hive) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const inspection = await prisma.inspection.create({
    data: {
      hiveId,
      enteredByUserId: userId,
      generalNotes,
      ...(timestamp && { timestamp: new Date(timestamp) }),
      frameObservations: {
        create: frameObservations.map((fo) => ({
          frameId: fo.frameId,
          side: fo.side,
          hasBrood: fo.hasBrood ?? false,
          hasCappedBrood: fo.hasCappedBrood ?? false,
          hasEggs: fo.hasEggs ?? false,
          hasLarvae: fo.hasLarvae ?? false,
          queenPresent: fo.queenPresent ?? false,
          hasCappedHoney: fo.hasCappedHoney ?? false,
          hasNectar: fo.hasNectar ?? false,
          cappedHoneyPct: fo.cappedHoneyPct,
          notes: fo.notes,
          quadrantObservations: {
            create: (fo.quadrantObservations ?? []).map((q) => ({
              quadrant: q.quadrant,
              hasBrood: q.hasBrood ?? false,
              hasCappedBrood: q.hasCappedBrood ?? false,
              hasEggs: q.hasEggs ?? false,
              hasLarvae: q.hasLarvae ?? false,
              hasCappedHoney: q.hasCappedHoney ?? false,
              hasNectar: q.hasNectar ?? false,
              notes: q.notes,
            })),
          },
          queenCells: {
            create: (fo.queenCells ?? []).map((qc) => ({
              cellType: qc.cellType,
              locationOnFrame: qc.locationOnFrame,
              capped: qc.capped ?? false,
              count: qc.count ?? 1,
              positionX: qc.positionX,
              positionY: qc.positionY,
            })),
          },
        })),
      },
      media: {
        create: media.map((m) => ({
          frameId: m.frameId,
          mediaType: m.mediaType,
          fileUrl: m.fileUrl,
          durationSeconds: m.durationSeconds,
        })),
      },
    },
    include: {
      media: true,
      frameObservations: { include: { quadrantObservations: true, queenCells: true } },
    },
  });

  return NextResponse.json({ inspection }, { status: 201 });
}
