import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: frameId } = await params;

  const frame = await prisma.frame.findFirst({
    where: { id: frameId, hiveBox: { hive: { apiary: { userId } } } },
  });
  if (!frame) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const observations = await prisma.frameObservation.findMany({
    where: { frameId },
    include: { inspection: true, quadrantObservations: true, queenCells: true },
    orderBy: { inspection: { timestamp: "desc" } },
  });

  return NextResponse.json({ observations });
}
