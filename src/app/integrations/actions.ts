"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getConnectorStatuses(): Promise<Record<string, { status: string; lastSync: string | null }>> {
  const userId = await requireUserId();
  const rows = await prisma.connector.findMany({ where: { userId } });
  const map: Record<string, { status: string; lastSync: string | null }> = {};
  for (const r of rows) {
    map[r.platform] = { status: r.status, lastSync: r.lastSync ? r.lastSync.toISOString() : null };
  }
  return map;
}

export async function setConnectorStatus(key: string, name: string, type: string, status: "CONNECTED" | "DISCONNECTED") {
  const userId = await requireUserId();
  const existing = await prisma.connector.findFirst({ where: { platform: key, userId } });
  const data = {
    userId,
    name,
    platform: key,
    type: type as never,
    status: status as never,
    lastSync: status === "CONNECTED" ? new Date() : null,
  };
  if (existing) {
    await prisma.connector.update({ where: { id: existing.id }, data });
  } else {
    await prisma.connector.create({ data });
  }
  revalidatePath("/integrations");
}
