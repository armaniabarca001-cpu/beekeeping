import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiaryDetailClient } from "@/components/apiary/ApiaryDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ApiaryDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const apiary = await prisma.apiary.findFirst({
    where: { id, userId: session.user.id },
    include: { hives: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } } },
  });
  if (!apiary) notFound();

  return (
    <ApiaryDetailClient
      apiaryId={apiary.id}
      apiaryName={apiary.name}
      address={apiary.address}
      center={{ lat: apiary.lat, lng: apiary.lng }}
      hives={apiary.hives.map((h) => ({ id: h.id, name: h.name, lat: h.lat, lng: h.lng }))}
    />
  );
}
