"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { HivePin } from "@/components/apiary/ApiaryMap";

const ApiaryMap = dynamic(
  () => import("@/components/apiary/ApiaryMap").then((m) => m.ApiaryMap),
  { ssr: false },
);

const DEMO_HIVES: HivePin[] = [
  { id: "hive-1", name: "Hive 1 - Backyard", lat: 37.7749, lng: -122.4194 },
];

export default function ApiaryDemoPage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-slate-100 bg-offwhite-500 px-6 py-4 text-navy-500">
        <h1 className="text-lg font-semibold">Demo apiary</h1>
        <p className="text-sm text-slate-500">
          Click a pin to select a hive, or click the map to drop a new one.
          {selected && <span className="ml-2 text-honey-700">Selected: {selected}</span>}
        </p>
      </div>
      <div className="relative flex-1">
        <ApiaryMap
          center={{ lat: 37.7749, lng: -122.4194 }}
          hives={DEMO_HIVES}
          onHiveClick={setSelected}
          onMapClick={(lat, lng) => console.log("new hive pin at", lat, lng)}
        />
      </div>
    </div>
  );
}
