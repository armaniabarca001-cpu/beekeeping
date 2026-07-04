import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InspectionWizard } from "@/components/inspection/InspectionWizard";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewInspectionPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const hive = await prisma.hive.findFirst({
    where: { id, deletedAt: null, apiary: { userId: session.user.id } },
    include: {
      hiveBoxes: { include: { frames: true }, orderBy: { positionOrder: "asc" } },
    },
  });
  if (!hive) notFound();

  const frames = hive.hiveBoxes.flatMap((box) =>
    box.frames
      .slice()
      .sort((a, b) => a.frameNumber - b.frameNumber)
      .map((frame) => ({
        frameId: frame.id,
        frameNumber: frame.frameNumber,
        boxId: box.id,
        boxType: box.boxType,
      })),
  );

  return <InspectionWizard hiveId={hive.id} hiveName={hive.name} frames={frames} />;
}
