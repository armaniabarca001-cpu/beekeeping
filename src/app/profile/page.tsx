import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileClient } from "@/components/profile/ProfileClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;

  const [user, apiariesCount, hivesCount, inspectionsCount, queenCells, treatments] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, yearsBeekeeping: true },
      }),
      prisma.apiary.count({ where: { userId } }),
      prisma.hive.count({ where: { deletedAt: null, apiary: { userId } } }),
      prisma.inspection.count({ where: { deletedAt: null, hive: { apiary: { userId } } } }),
      prisma.queenCell.findMany({
        where: { frameObservation: { inspection: { hive: { apiary: { userId } } } } },
        select: { cellType: true },
      }),
      prisma.treatment.findMany({
        where: { hive: { apiary: { userId } } },
        select: { targetPest: true, miteCountBefore: true, miteCountAfter: true },
      }),
    ]);

  const queenCellCounts: Record<string, number> = {};
  for (const qc of queenCells) queenCellCounts[qc.cellType] = (queenCellCounts[qc.cellType] ?? 0) + 1;

  const targetPestCounts: Record<string, number> = {};
  for (const t of treatments) targetPestCounts[t.targetPest] = (targetPestCounts[t.targetPest] ?? 0) + 1;

  const reductions = treatments
    .filter((t) => t.miteCountBefore != null && t.miteCountAfter != null)
    .map((t) => t.miteCountBefore! - t.miteCountAfter!);
  const avgMiteReduction =
    reductions.length > 0 ? reductions.reduce((a, b) => a + b, 0) / reductions.length : null;

  return (
    <ProfileClient
      name={user?.name ?? ""}
      email={user?.email ?? ""}
      yearsBeekeeping={user?.yearsBeekeeping ?? null}
      stats={{
        apiariesCount,
        hivesCount,
        inspectionsCount,
        treatmentsCount: treatments.length,
        queenCellCounts,
        targetPestCounts,
        avgMiteReduction,
      }}
    />
  );
}
