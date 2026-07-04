import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function PATCH(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, yearsBeekeeping } = await request.json();

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name }),
      ...(yearsBeekeeping !== undefined && { yearsBeekeeping }),
    },
    select: { id: true, name: true, yearsBeekeeping: true },
  });

  return NextResponse.json({ user });
}
