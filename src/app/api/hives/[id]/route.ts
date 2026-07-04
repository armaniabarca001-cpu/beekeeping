import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { getOwnedHive } from "@/lib/ownership";

interface RouteContext {
  params: Promise<{ id: string }>;
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

  const { name, lat, lng } = await request.json();
  const hive = await prisma.hive.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(lat !== undefined && { lat }),
      ...(lng !== undefined && { lng }),
    },
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
