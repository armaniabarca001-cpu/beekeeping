import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { getOwnedHive } from "@/lib/ownership";
import { boxHoldsFrames, type BoxType, type FoundationType } from "@/lib/hive-boxes";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface HiveBoxPatchInput {
  id?: string;
  boxType: BoxType;
  positionOrder: number;
  frameCapacity?: number;
  framesInstalledCount?: number;
  foundationType?: FoundationType;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const hive = await prisma.hive.findFirst({
    where: { id, deletedAt: null, apiary: { userId } },
    include: { hiveBoxes: { include: { frames: true }, orderBy: { positionOrder: "asc" } } },
  });
  if (!hive) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ hive });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedHive(id, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const {
    name,
    lat,
    lng,
    backgroundTheme,
    hiveBoxes,
  }: {
    name?: string;
    lat?: number;
    lng?: number;
    backgroundTheme?: string;
    hiveBoxes?: HiveBoxPatchInput[];
  } = await request.json();

  if (hiveBoxes) {
    const current = await prisma.hiveBox.findMany({ where: { hiveId: id }, select: { id: true } });
    const currentIds = new Set(current.map((b) => b.id));
    const keptIds = new Set(hiveBoxes.filter((b) => b.id).map((b) => b.id!));
    const toDeleteIds = [...currentIds].filter((boxId) => !keptIds.has(boxId));
    const now = new Date();

    await prisma.$transaction([
      ...(toDeleteIds.length > 0
        ? [prisma.hiveBox.deleteMany({ where: { id: { in: toDeleteIds } } })]
        : []),
      ...hiveBoxes
        .filter((box) => box.id)
        .map((box) =>
          prisma.hiveBox.update({
            where: { id: box.id },
            data: { positionOrder: box.positionOrder },
          }),
        ),
      ...hiveBoxes
        .filter((box) => !box.id)
        .map((box) => {
          const frameCapacity = box.frameCapacity ?? 0;
          const framesInstalledCount = box.framesInstalledCount ?? frameCapacity;
          const holdsFrames = boxHoldsFrames(box.boxType);
          return prisma.hiveBox.create({
            data: {
              hiveId: id,
              boxType: box.boxType,
              positionOrder: box.positionOrder,
              frameCapacity,
              framesInstalledCount,
              frames: holdsFrames
                ? {
                    create: Array.from({ length: framesInstalledCount }, (_, i) => ({
                      frameNumber: i + 1,
                      foundationType: box.foundationType ?? "wax",
                      dateInstalled: now,
                    })),
                  }
                : undefined,
            },
          });
        }),
    ]);
  }

  const hive = await prisma.hive.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(lat !== undefined && { lat }),
      ...(lng !== undefined && { lng }),
      ...(backgroundTheme !== undefined && { backgroundTheme }),
    },
    include: { hiveBoxes: { include: { frames: true }, orderBy: { positionOrder: "asc" } } },
  });
  return NextResponse.json({ hive });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedHive(id, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.hive.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
