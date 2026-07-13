"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MiteCountChart, type MiteCountPoint } from "./MiteCountChart";
import { Button } from "@/components/ui/Button";

const TARGET_PESTS = ["varroa", "small_hive_beetle", "nosema", "other"] as const;

export interface TreatmentRow {
  id: string;
  productName: string;
  targetPest: string;
  stripCount: number;
  startDate: string;
  durationDays: number;
  miteCountBefore: number | null;
  miteCountAfter: number | null;
  reminders: { id: string; remindAt: string }[];
}

interface TreatmentsClientProps {
  hiveId: string;
  hiveName: string;
  treatments: TreatmentRow[];
}

export function TreatmentsClient({ hiveId, hiveName, treatments }: TreatmentsClientProps) {
  const router = useRouter();
  const [productName, setProductName] = useState("");
  const [targetPest, setTargetPest] = useState<(typeof TARGET_PESTS)[number]>("varroa");
  const [stripCount, setStripCount] = useState(1);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [durationDays, setDurationDays] = useState(20);
  const [miteCountBefore, setMiteCountBefore] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const chartPoints: MiteCountPoint[] = [...treatments]
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((t) => ({ id: t.id, date: t.startDate, before: t.miteCountBefore, after: t.miteCountAfter }));

  async function handleSubmit() {
    if (!productName) {
      setError("Product name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/treatments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hiveId,
        productName,
        targetPest,
        stripCount,
        startDate,
        durationDays,
        miteCountBefore: miteCountBefore === "" ? undefined : miteCountBefore,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not save the treatment.");
      setSubmitting(false);
      return;
    }

    setProductName("");
    setMiteCountBefore("");
    setSubmitting(false);
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col bg-offwhite-500 px-8 py-8 text-navy-500">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Treatments - {hiveName}</h1>
          <Button href={`/hives/${hiveId}`} variant="ghost" size="sm">
            &larr; Back to hive
          </Button>
        </div>

        <div className="rounded-lg border border-slate-100 bg-white p-4">
          <p className="mb-3 text-sm font-medium">Mite count trend</p>
          <MiteCountChart points={chartPoints} />
        </div>

        <div className="rounded-lg border border-slate-100 bg-white p-4">
          <p className="mb-3 text-sm font-medium">Log a treatment</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="flex flex-col gap-1">
              Product
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Formic Pro"
                className="rounded-md border border-slate-200 px-3 py-2 outline-none transition-colors focus:border-honey-500"
              />
            </label>
            <label className="flex flex-col gap-1">
              Target pest
              <select
                value={targetPest}
                onChange={(e) => setTargetPest(e.target.value as typeof targetPest)}
                className="rounded-md border border-slate-200 px-3 py-2 outline-none transition-colors focus:border-honey-500"
              >
                {TARGET_PESTS.map((p) => (
                  <option key={p} value={p}>
                    {p.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              Strip count
              <input
                type="number"
                min={1}
                value={stripCount}
                onChange={(e) => setStripCount(Number(e.target.value))}
                className="rounded-md border border-slate-200 px-3 py-2 outline-none transition-colors focus:border-honey-500"
              />
            </label>
            <label className="flex flex-col gap-1">
              Duration (days)
              <input
                type="number"
                min={1}
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="rounded-md border border-slate-200 px-3 py-2 outline-none transition-colors focus:border-honey-500"
              />
            </label>
            <label className="flex flex-col gap-1">
              Start date
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-md border border-slate-200 px-3 py-2 outline-none transition-colors focus:border-honey-500"
              />
            </label>
            <label className="flex flex-col gap-1">
              Mite count before
              <input
                type="number"
                min={0}
                value={miteCountBefore}
                onChange={(e) =>
                  setMiteCountBefore(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="rounded-md border border-slate-200 px-3 py-2 outline-none transition-colors focus:border-honey-500"
              />
            </label>
          </div>

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          <Button variant="primary" className="mt-4" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Log treatment"}
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">History</p>
          {treatments.length === 0 && <p className="text-sm text-slate-500">No treatments logged yet.</p>}
          {[...treatments]
            .sort((a, b) => b.startDate.localeCompare(a.startDate))
            .map((t) => (
              <div key={t.id} className="rounded-lg border border-slate-100 bg-white p-4 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {t.productName} - {t.targetPest.replace(/_/g, " ")}
                  </p>
                  <p className="text-slate-500">{new Date(t.startDate).toLocaleDateString()}</p>
                </div>
                <p className="mt-1 text-slate-600">
                  {t.stripCount} strip{t.stripCount === 1 ? "" : "s"}, {t.durationDays} days
                  {t.miteCountBefore != null && ` · mite count before: ${t.miteCountBefore}`}
                  {t.miteCountAfter != null && ` · after: ${t.miteCountAfter}`}
                </p>
                {t.reminders.length > 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    Reminder: {new Date(t.reminders[0].remindAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
