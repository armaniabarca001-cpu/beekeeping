import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { getOwnedApiary } from "@/lib/ownership";

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

  const { apiaryId, name, equipmentWidth, lat, lng } = await request.json();
  if (!apiaryId || !name || !equipmentWidth || typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json(
      { error: "apiaryId, name, equipmentWidth, lat, and lng are required." },
      { status: 400 },
    );
  }

  const apiary = await getOwnedApiary(apiaryId, userId);
  if (!apiary) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const hive = await prisma.hive.create({
    data: { apiaryId, name, equipmentWidth, lat, lng },
  });
  return NextResponse.json({ hive }, { status: 201 });
}
