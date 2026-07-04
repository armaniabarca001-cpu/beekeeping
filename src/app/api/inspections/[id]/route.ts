import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const inspection = await prisma.inspection.findFirst({
    where: { id, deletedAt: null, hive: { apiary: { userId } } },
    include: {
      media: true,
      frameObservations: { include: { quadrantObservations: true, queenCells: true } },
    },
  });
  if (!inspection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ inspection });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.inspection.findFirst({
    where: { id, deletedAt: null, hive: { apiary: { userId } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.inspection.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
