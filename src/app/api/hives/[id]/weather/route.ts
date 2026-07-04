import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { getOwnedHive } from "@/lib/ownership";
import { getCurrentWeather } from "@/lib/weather";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: hiveId } = await params;
  const hive = await getOwnedHive(hiveId, userId);
  if (!hive) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const weather = await getCurrentWeather(hive.lat, hive.lng);
  if (!weather) {
    return NextResponse.json({ configured: false, weather: null });
  }

  await prisma.weatherSnapshot.create({
    data: {
      hiveId,
      wind: weather.wind,
      humidity: weather.humidity,
      temp: weather.temp,
      pollen: weather.pollen,
    },
  });

  return NextResponse.json({ configured: true, weather });
}
