import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditHiveClient } from "@/components/hive/EditHiveClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditHivePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const hive = await prisma.hive.findFirst({
    where: { id, deletedAt: null, apiary: { userId: session.user.id } },
    include: { hiveBoxes: { orderBy: { positionOrder: "asc" } } },
  });
  if (!hive) notFound();

  return (
    <EditHiveClient
      hiveId={hive.id}
      hiveName={hive.name}
      equipmentWidth={hive.equipmentWidth}
      existingBoxes={hive.hiveBoxes.map((box) => ({
        id: box.id,
        boxType: box.boxType,
        positionOrder: box.positionOrder,
        frameCapacity: box.frameCapacity,
        framesInstalledCount: box.framesInstalledCount,
      }))}
    />
  );
}
