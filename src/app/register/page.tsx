"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    setSubmitting(false);
    if (result?.error) {
      router.push("/login");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-offwhite-500 px-8">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex items-center gap-2">
          <span className="text-2xl">🐝</span>
          <span className="text-xl font-semibold text-navy-500">HiveTracker</span>
        </div>

        <h1 className="mb-8 text-2xl font-semibold text-navy-500">
          Create an account
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-slate-100 bg-white px-4 py-3 text-navy-500 outline-none focus:border-honey-500"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-slate-100 bg-white px-4 py-3 text-navy-500 outline-none focus:border-honey-500"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-slate-100 bg-white px-4 py-3 text-navy-500 outline-none focus:border-honey-500"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-full bg-honey-500 py-3 font-semibold text-navy-500 transition-colors hover:bg-honey-300 disabled:opacity-60"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-navy-500 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
