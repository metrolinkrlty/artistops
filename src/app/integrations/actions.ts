"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Connector status is persisted keyed by the catalog id, stored in Connector.platform.
export async function getConnectorStatuses(): Promise<Record<string, { status: string; lastSync: string | null }>> {
  const rows = await prisma.connector.findMany();
  const map: Record<string, { status: string; lastSync: string | null }> = {};
  for (const r of rows) {
    map[r.platform] = { status: r.status, lastSync: r.lastSync ? r.lastSync.toISOString() : null };
  }
  return map;
}

export async function setConnectorStatus(key: string, name: string, type: string, status: "CONNECTED" | "DISCONNECTED") {
  const existing = await prisma.connector.findFirst({ where: { platform: key } });
  const data = {
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
