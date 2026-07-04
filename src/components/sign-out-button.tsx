"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-navy-500 hover:bg-offwhite-300"
    >
      Sign out
    </button>
  );
}
