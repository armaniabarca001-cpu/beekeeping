import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiaries = await prisma.apiary.findMany({
    where: { userId },
    include: { hives: { where: { deletedAt: null } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ apiaries });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, address, lat, lng } = await request.json();
  if (!name || !address || typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json(
      { error: "name, address, lat, and lng are required." },
      { status: 400 },
    );
  }

  const apiary = await prisma.apiary.create({
    data: { userId, name, address, lat, lng },
  });
  return NextResponse.json({ apiary }, { status: 201 });
}
