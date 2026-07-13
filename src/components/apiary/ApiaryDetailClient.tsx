"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { HivePin } from "./ApiaryMap";
import { Button } from "@/components/ui/Button";

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
    <div className="flex flex-1 flex-col md:flex-row">
      <div className="flex w-full flex-col gap-6 overflow-y-auto bg-offwhite-500 px-6 py-6 text-navy-500 md:w-96 md:shrink-0">
        <div>
          <Link href="/apiaries" className="text-sm text-slate-500 hover:text-navy-500">
            &larr; All apiaries
          </Link>
          <h1 className="mt-2 text-lg font-semibold">{apiaryName}</h1>
          <p className="text-sm text-slate-500">{address}</p>
        </div>

        {pendingPin ? (
          <div className="flex flex-col gap-3 rounded-lg border border-honey-500 bg-honey-100 p-4">
            <p className="text-sm font-medium">
              New hive at {pendingPin.lat.toFixed(5)}, {pendingPin.lng.toFixed(5)}
            </p>
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  router.push(
                    `/apiaries/${apiaryId}/hives/new?lat=${pendingPin.lat}&lng=${pendingPin.lng}`,
                  )
                }
              >
                Add hive here
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setPendingPin(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="rounded-lg border border-slate-100 bg-white p-4 text-sm text-slate-500">
            Click anywhere on the map to place a new hive.
          </p>
        )}

        <div>
          <p className="mb-2 text-sm font-medium">
            Hives ({hives.length})
          </p>
          {hives.length === 0 ? (
            <p className="text-sm text-slate-500">No hives yet - place one on the map.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {hives.map((hive) => (
                <li key={hive.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/hives/${hive.id}`)}
                    className="w-full rounded-lg border border-slate-100 bg-white px-4 py-3 text-left text-sm hover:border-honey-500"
                  >
                    {hive.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="relative flex-1">
        <ApiaryMap
          center={center}
          hives={hives}
          pendingPin={pendingPin}
          onHiveClick={(hiveId) => router.push(`/hives/${hiveId}`)}
          onMapClick={(lat, lng) => setPendingPin({ lat, lng })}
        />
      </div>
    </div>
  );
}
