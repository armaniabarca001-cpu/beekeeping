import { prisma } from "@/lib/prisma";

// Every query path scopes down from the owning user (spec Section 7):
// apiaries -> hives -> hive_boxes -> frames -> inspections / treatments.

export async function getOwnedApiary(apiaryId: string, userId: string) {
  return prisma.apiary.findFirst({ where: { id: apiaryId, userId } });
}

export async function getOwnedHive(hiveId: string, userId: string) {
  return prisma.hive.findFirst({
    where: { id: hiveId, deletedAt: null, apiary: { userId } },
  });
}
