import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/sign-out-button";

export default async function ApiariesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const apiaries = await prisma.apiary.findMany({
    where: { userId: session.user.id },
    include: { hives: { where: { deletedAt: null } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-1 flex-col bg-offwhite-500 px-8 py-10 text-navy-500">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Your apiaries</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/apiaries/new"
              className="rounded-full bg-honey-500 px-5 py-2 font-medium text-navy-500 hover:bg-honey-300"
            >
              + New apiary
            </Link>
            <Link href="/profile" className="text-sm text-slate-500 hover:text-navy-500">
              Profile
            </Link>
            <SignOutButton />
          </div>
        </div>

        {apiaries.length === 0 ? (
          <p className="text-slate-500">
            No apiaries yet.{" "}
            <Link href="/apiaries/new" className="font-medium text-navy-500 hover:underline">
              Add your first one
            </Link>
            .
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {apiaries.map((apiary) => (
              <li key={apiary.id}>
                <Link
                  href={`/apiaries/${apiary.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-5 py-4 hover:border-honey-500"
                >
                  <div>
                    <p className="font-medium">{apiary.name}</p>
                    <p className="text-sm text-slate-500">{apiary.address}</p>
                  </div>
                  <span className="text-sm text-slate-500">
                    {apiary.hives.length} hive{apiary.hives.length === 1 ? "" : "s"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
