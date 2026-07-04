import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-offwhite-500 px-6 text-navy-500">
      <div className="flex max-w-xl flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">HiveTracker</h1>
        <p className="text-lg text-slate-500">
          Inspect smarter, not longer. Track every hive, every frame, every
          visit.
        </p>
        <Link
          href="/login"
          className="rounded-full bg-honey-500 px-6 py-3 font-medium text-navy-500 transition-colors hover:bg-honey-300"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
