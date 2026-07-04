"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setSubmitting(false);
    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/apiaries");
  }

  return (
    <div className="flex min-h-screen flex-1">
      {/* Left panel */}
      <div className="flex w-full flex-col justify-center bg-offwhite-500 px-8 py-12 sm:px-16 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2">
            <span className="text-2xl">🐝</span>
            <span className="text-xl font-semibold text-navy-500">
              HiveTracker
            </span>
          </div>

          <h1 className="mb-8 text-2xl font-semibold text-navy-500">
            Log in to your Account
          </h1>

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/apiaries" })}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white py-3 font-medium text-navy-500 transition-colors hover:bg-offwhite-300"
          >
            Continue with Google
          </button>

          <div className="mb-6 flex items-center gap-3 text-sm text-slate-500">
            <div className="h-px flex-1 bg-slate-100" />
            or continue with email
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-slate-100 bg-white px-4 py-3 text-navy-500 outline-none focus:border-honey-500"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-100 bg-white px-4 py-3 pr-16 text-navy-500 outline-none focus:border-honey-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-4 text-sm text-slate-500"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-500">
                <input type="checkbox" className="accent-honey-500" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-slate-500 hover:text-navy-500">
                Forgot Password?
              </Link>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-full bg-honey-500 py-3 font-semibold text-navy-500 transition-colors hover:bg-honey-300 disabled:opacity-60"
            >
              {submitting ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-navy-500 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="relative hidden flex-col items-center justify-center bg-navy-500 px-16 lg:flex lg:w-1/2">
        <div className="max-w-sm text-center">
          <div className="mb-10 flex items-center justify-center gap-4 text-4xl">
            <span>📍</span>
            <span>🐝</span>
            <span>🌤️</span>
            <span>📅</span>
          </div>
          <h2 className="mb-4 text-3xl font-semibold text-offwhite-500">
            Inspect smarter, not longer.
          </h2>
          <p className="text-slate-300">
            Track every hive, every frame, every visit.
          </p>
        </div>

        <div className="absolute bottom-12 flex gap-2">
          <span className="h-2 w-2 rounded-full bg-honey-500" />
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          <span className="h-2 w-2 rounded-full bg-slate-300" />
        </div>
      </div>
    </div>
  );
}
