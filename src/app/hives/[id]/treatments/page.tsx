import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TreatmentsClient } from "@/components/treatments/TreatmentsClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function HiveTreatmentsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const hive = await prisma.hive.findFirst({
    where: { id, deletedAt: null, apiary: { userId: session.user.id } },
    include: { treatments: { include: { reminders: true }, orderBy: { startDate: "desc" } } },
  });
  if (!hive) notFound();

  return (
    <TreatmentsClient
      hiveId={hive.id}
      hiveName={hive.name}
      treatments={hive.treatments.map((t) => ({
        id: t.id,
        productName: t.productName,
        targetPest: t.targetPest,
        stripCount: t.stripCount,
        startDate: t.startDate.toISOString(),
        durationDays: t.durationDays,
        miteCountBefore: t.miteCountBefore,
        miteCountAfter: t.miteCountAfter,
        reminders: t.reminders.map((r) => ({ id: r.id, remindAt: r.remindAt.toISOString() })),
      }))}
    />
  );
}
