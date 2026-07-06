import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";

export interface GeocodeSuggestion {
  label: string;
  lat: number;
  lng: number;
}

export async function GET(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q || q.length < 3) return NextResponse.json({ suggestions: [] });

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");

  const res = await fetch(url, {
    headers: {
      // Nominatim's usage policy requires an identifying User-Agent.
      "User-Agent": "HiveTracker/1.0 (contact: armaniabarca001@gmail.com)",
    },
  });

  if (!res.ok) return NextResponse.json({ suggestions: [] });

  const results: { display_name: string; lat: string; lon: string }[] = await res.json();
  const suggestions: GeocodeSuggestion[] = results.map((r) => ({
    label: r.display_name,
    lat: Number(r.lat),
    lng: Number(r.lon),
  }));

  return NextResponse.json({ suggestions });
}
