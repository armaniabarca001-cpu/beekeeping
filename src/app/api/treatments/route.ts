import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { getOwnedHive } from "@/lib/ownership";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hiveId = new URL(request.url).searchParams.get("hiveId");
  if (!hiveId) {
    return NextResponse.json({ error: "hiveId query param is required." }, { status: 400 });
  }

  const hive = await getOwnedHive(hiveId, userId);
  if (!hive) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const treatments = await prisma.treatment.findMany({
    where: { hiveId },
    include: { reminders: true },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json({ treatments });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    hiveId,
    productName,
    targetPest,
    stripCount,
    startDate,
    durationDays,
    miteCountBefore,
  } = await request.json();

  if (!hiveId || !productName || !targetPest || !stripCount || !startDate || !durationDays) {
    return NextResponse.json(
      {
        error:
          "hiveId, productName, targetPest, stripCount, startDate, and durationDays are required.",
      },
      { status: 400 },
    );
  }

  const hive = await getOwnedHive(hiveId, userId);
  if (!hive) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const start = new Date(startDate);
  const remindAt = new Date(start.getTime() + durationDays * MS_PER_DAY);

  const treatment = await prisma.treatment.create({
    data: {
      hiveId,
      productName,
      targetPest,
      stripCount,
      startDate: start,
      durationDays,
      miteCountBefore,
      reminders: {
        // Google Calendar sync itself is not wired up yet - googleCalendarEventId
        // stays null until that integration lands (spec Section 4.6).
        create: [{ remindAt }],
      },
    },
    include: { reminders: true },
  });

  return NextResponse.json({ treatment }, { status: 201 });
}
