"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getWebsiteUrl(): Promise<string> {
  const userId = await requireUserId();
  const row = await prisma.setting.findUnique({
    where: { userId_key: { userId, key: "websiteUrl" } },
    select: { value: true },
  });
  return row?.value ?? "";
}

export async function saveWebsiteUrl(url: string): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  const value = String(url ?? "").trim();
  await prisma.setting.upsert({
    where: { userId_key: { userId, key: "websiteUrl" } },
    update: { value },
    create: { userId, key: "websiteUrl", value },
  });
  revalidatePath("/analytics");
  revalidatePath("/pixel-tracking");
  return { ok: true };
}
