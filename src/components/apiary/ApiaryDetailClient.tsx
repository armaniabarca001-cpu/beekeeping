"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { HivePin } from "./ApiaryMap";

const ApiaryMap = dynamic(() => import("./ApiaryMap").then((m) => m.ApiaryMap), {
  ssr: false,
});

interface ApiaryDetailClientProps {
  apiaryId: string;
  apiaryName: string;
  address: string;
  center: { lat: number; lng: number };
  hives: HivePin[];
}

export function ApiaryDetailClient({
  apiaryId,
  apiaryName,
  address,
  center,
  hives,
}: ApiaryDetailClientProps) {
  const router = useRouter();
  const [pendingPin, setPendingPin] = useState<{ lat: number; lng: number } | null>(null);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 bg-offwhite-500 px-6 py-4 text-navy-500">
        <div>
          <h1 className="text-lg font-semibold">{apiaryName}</h1>
          <p className="text-sm text-slate-500">{address}</p>
        </div>
        <Link href="/apiaries" className="text-sm text-slate-500 hover:text-navy-500">
          &larr; All apiaries
        </Link>
      </div>

      <div className="relative flex-1">
        <ApiaryMap
          center={center}
          hives={hives}
          pendingPin={pendingPin}
          onHiveClick={(hiveId) => router.push(`/hives/${hiveId}`)}
          onMapClick={(lat, lng) => setPendingPin({ lat, lng })}
        />

        {pendingPin && (
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white px-5 py-3 shadow-lg">
            <span className="text-sm text-navy-500">
              New hive at {pendingPin.lat.toFixed(5)}, {pendingPin.lng.toFixed(5)}
            </span>
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/apiaries/${apiaryId}/hives/new?lat=${pendingPin.lat}&lng=${pendingPin.lng}`,
                )
              }
              className="rounded-full bg-honey-500 px-4 py-1.5 text-sm font-medium text-navy-500 hover:bg-honey-300"
            >
              Add hive here
            </button>
            <button
              type="button"
              onClick={() => setPendingPin(null)}
              className="text-sm text-slate-500 hover:text-navy-500"
            >
              Cancel
            </button>
          </div>
        )}

        {!pendingPin && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 text-xs text-slate-500 shadow">
            Click anywhere on the map to place a new hive
          </div>
        )}
      </div>
    </div>
  );
}
