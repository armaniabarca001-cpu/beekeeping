import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { getOwnedApiary } from "@/lib/ownership";
import { boxHoldsFrames, type BoxType, type EquipmentWidth, type FoundationType } from "@/lib/hive-boxes";

interface HiveBoxInput {
  boxType: BoxType;
  positionOrder: number;
  frameCapacity?: number;
  framesInstalledCount?: number;
  foundationType?: FoundationType;
}

export async function GET(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiaryId = new URL(request.url).searchParams.get("apiaryId");
  if (!apiaryId) {
    return NextResponse.json({ error: "apiaryId query param is required." }, { status: 400 });
  }

  const apiary = await getOwnedApiary(apiaryId, userId);
  if (!apiary) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const hives = await prisma.hive.findMany({
    where: { apiaryId, deletedAt: null },
    include: { hiveBoxes: { orderBy: { positionOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ hives });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    apiaryId,
    name,
    equipmentWidth,
    lat,
    lng,
    hiveBoxes = [],
  }: {
    apiaryId: string;
    name: string;
    equipmentWidth: EquipmentWidth;
    lat: number;
    lng: number;
    hiveBoxes?: HiveBoxInput[];
  } = await request.json();

  if (!apiaryId || !name || !equipmentWidth || typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json(
      { error: "apiaryId, name, equipmentWidth, lat, and lng are required." },
      { status: 400 },
    );
  }

  const apiary = await getOwnedApiary(apiaryId, userId);
  if (!apiary) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  const hive = await prisma.hive.create({
    data: {
      apiaryId,
      name,
      equipmentWidth,
      lat,
      lng,
      hiveBoxes: {
        create: hiveBoxes.map((box) => {
          const frameCapacity = box.frameCapacity ?? 0;
          const framesInstalledCount = box.framesInstalledCount ?? frameCapacity;
          const holdsFrames = boxHoldsFrames(box.boxType);
          return {
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
          };
        }),
      },
    },
    include: { hiveBoxes: { include: { frames: true }, orderBy: { positionOrder: "asc" } } },
  });
  return NextResponse.json({ hive }, { status: 201 });
}
