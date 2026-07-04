import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { getOwnedApiary } from "@/lib/ownership";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const apiary = await prisma.apiary.findFirst({
    where: { id, userId },
    include: { hives: { where: { deletedAt: null } } },
  });
  if (!apiary) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ apiary });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedApiary(id, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, address, lat, lng } = await request.json();
  const apiary = await prisma.apiary.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(address !== undefined && { address }),
      ...(lat !== undefined && { lat }),
      ...(lng !== undefined && { lng }),
    },
  });
  return NextResponse.json({ apiary });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedApiary(id, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.apiary.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
