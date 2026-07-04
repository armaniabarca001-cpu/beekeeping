import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getOwnedTreatment(id: string, userId: string) {
  return prisma.treatment.findFirst({
    where: { id, hive: { apiary: { userId } } },
  });
}

export async function GET(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const treatment = await prisma.treatment.findFirst({
    where: { id, hive: { apiary: { userId } } },
    include: { reminders: true },
  });
  if (!treatment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ treatment });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedTreatment(id, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { miteCountAfter } = await request.json();
  const treatment = await prisma.treatment.update({
    where: { id },
    data: { ...(miteCountAfter !== undefined && { miteCountAfter }) },
  });
  return NextResponse.json({ treatment });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedTreatment(id, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.treatment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
