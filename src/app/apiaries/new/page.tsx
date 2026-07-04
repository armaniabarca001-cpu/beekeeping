"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const ApiaryMap = dynamic(
  () => import("@/components/apiary/ApiaryMap").then((m) => m.ApiaryMap),
  { ssr: false },
);

export default function NewApiaryPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [lookupAddress, setLookupAddress] = useState("");
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (!center) {
      setError("Look up an address first so the apiary has a location.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/apiaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, address, lat: center.lat, lng: center.lng }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not create the apiary.");
      setSubmitting(false);
      return;
    }

    const { apiary } = await res.json();
    router.push(`/apiaries/${apiary.id}`);
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <div className="flex w-full flex-col gap-4 bg-offwhite-500 px-8 py-10 text-navy-500 md:w-96">
        <h1 className="text-2xl font-semibold">New apiary</h1>

        <label className="flex flex-col gap-1 text-sm">
          Apiary name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Backyard"
            className="rounded-lg border border-slate-100 bg-white px-4 py-2 outline-none focus:border-honey-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Address
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, Springfield"
            className="rounded-lg border border-slate-100 bg-white px-4 py-2 outline-none focus:border-honey-500"
          />
        </label>

        <button
          type="button"
          onClick={() => setLookupAddress(address)}
          disabled={!address}
          className="rounded-full border border-slate-300 py-2 font-medium hover:bg-offwhite-300 disabled:opacity-50"
        >
          Locate on map
        </button>

        {center && (
          <p className="text-xs text-slate-500">
            Resolved: {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleCreate}
          disabled={submitting || !name || !center}
          className="mt-2 rounded-full bg-honey-500 py-3 font-semibold text-navy-500 hover:bg-honey-300 disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create apiary"}
        </button>
      </div>

      <div className="flex-1">
        {lookupAddress ? (
          <ApiaryMap address={lookupAddress} hives={[]} onCenterResolved={setCenter} />
        ) : (
          <div className="flex h-full items-center justify-center bg-navy-900 text-slate-300">
            Enter an address and click &quot;Locate on map&quot; to preview it here.
          </div>
        )}
      </div>
    </div>
  );
}
