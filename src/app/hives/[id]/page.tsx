import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HiveDetailClient } from "@/components/hive/HiveDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function HiveDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const hive = await prisma.hive.findFirst({
    where: { id, deletedAt: null, apiary: { userId: session.user.id } },
    include: {
      apiary: true,
      hiveBoxes: { include: { frames: true }, orderBy: { positionOrder: "asc" } },
    },
  });
  if (!hive) notFound();

  return (
    <HiveDetailClient
      hiveId={hive.id}
      hiveName={hive.name}
      apiaryId={hive.apiaryId}
      apiaryName={hive.apiary.name}
      equipmentWidth={hive.equipmentWidth}
      hiveBoxes={hive.hiveBoxes.map((box) => ({
        id: box.id,
        boxType: box.boxType,
        positionOrder: box.positionOrder,
        frameCapacity: box.frameCapacity,
        framesInstalledCount: box.framesInstalledCount,
        frames: box.frames
          .map((f) => ({ id: f.id, frameNumber: f.frameNumber }))
          .sort((a, b) => a.frameNumber - b.frameNumber),
      }))}
    />
  );
}
