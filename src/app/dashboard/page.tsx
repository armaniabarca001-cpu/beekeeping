import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex flex-1 flex-col bg-offwhite-500 px-8 py-10 text-navy-500">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            Welcome, {session.user.name ?? session.user.email}
          </h1>
          <SignOutButton />
        </div>
        <p className="text-slate-500">
          Apiary map and hive builder stubs land here next.
        </p>
      </div>
    </div>
  );
}
