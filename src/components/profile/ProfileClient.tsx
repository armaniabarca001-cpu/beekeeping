"use client";

import { useState } from "react";
import Link from "next/link";

interface ProfileStats {
  apiariesCount: number;
  hivesCount: number;
  inspectionsCount: number;
  treatmentsCount: number;
  queenCellCounts: Record<string, number>;
  targetPestCounts: Record<string, number>;
  avgMiteReduction: number | null;
}

interface ProfileClientProps {
  name: string;
  email: string;
  yearsBeekeeping: number | null;
  stats: ProfileStats;
}

export function ProfileClient({ name, email, yearsBeekeeping, stats }: ProfileClientProps) {
  const [nameValue, setNameValue] = useState(name);
  const [years, setYears] = useState(yearsBeekeeping ?? 0);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    setSubmitting(true);
    setSaved(false);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameValue, yearsBeekeeping: years }),
    });
    setSubmitting(false);
    setSaved(true);
  }

  return (
    <div className="flex flex-1 flex-col bg-offwhite-500 px-8 py-10 text-navy-500">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Profile</h1>
          <Link href="/apiaries" className="text-sm text-slate-500 hover:text-navy-500">
            &larr; Apiaries
          </Link>
        </div>

        <div className="rounded-lg border border-slate-100 bg-white p-5">
          <p className="mb-3 text-sm text-slate-500">{email}</p>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              Name
              <input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="rounded border border-slate-100 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Years beekeeping
              <input
                type="number"
                min={0}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="rounded border border-slate-100 px-3 py-2"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={submitting}
            className="mt-4 rounded-full bg-honey-500 px-5 py-2 text-sm font-semibold text-navy-500 hover:bg-honey-300 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
          {saved && <span className="ml-3 text-sm text-slate-500">Saved.</span>}
        </div>

        <div>
          <p className="mb-3 text-sm font-medium">At a glance</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Apiaries" value={stats.apiariesCount} />
            <StatTile label="Active hives" value={stats.hivesCount} />
            <StatTile label="Inspections logged" value={stats.inspectionsCount} />
            <StatTile label="Treatments logged" value={stats.treatmentsCount} />
          </div>
        </div>

        {Object.keys(stats.targetPestCounts).length > 0 && (
          <BreakdownList title="Treatments by target pest" counts={stats.targetPestCounts} />
        )}

        {Object.keys(stats.queenCellCounts).length > 0 && (
          <BreakdownList title="Queen cells observed, by type" counts={stats.queenCellCounts} />
        )}

        {stats.avgMiteReduction != null && (
          <div className="rounded-lg border border-slate-100 bg-white p-5">
            <p className="text-sm text-slate-500">
              Average mite count change per treatment (before minus after)
            </p>
            <p className="text-2xl font-semibold">
              {stats.avgMiteReduction > 0 ? "-" : "+"}
              {Math.abs(stats.avgMiteReduction).toFixed(1)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function BreakdownList({ title, counts }: { title: string; counts: Record<string, number> }) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-5">
      <p className="mb-2 text-sm font-medium">{title}</p>
      <ul className="flex flex-col gap-1 text-sm text-slate-600">
        {entries.map(([key, count]) => (
          <li key={key} className="flex items-center justify-between">
            <span>{key.replace(/_/g, " ")}</span>
            <span className="font-medium text-navy-500">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
