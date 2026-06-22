"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";

const SETTING_KEYS = ["proMembership", "ipiNumber", "websiteUrl"];

export async function getSettings(): Promise<Record<string, string>> {
  const userId = await requireUserId();
  const [user, rows] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.setting.findMany({ where: { userId } }),
  ]);
  const map: Record<string, string> = {
    artistName: user?.artistName || "",
    email: user?.email || "",
    proMembership: "",
    ipiNumber: "",
    websiteUrl: "",
  };
  for (const r of rows) map[r.key] = r.value;
  return map;
}

export async function saveSettings(formData: FormData) {
  const userId = await requireUserId();

  const artistName = String(formData.get("artistName") || "").trim();
  if (artistName) {
    await prisma.user.update({ where: { id: userId }, data: { artistName } });
  }

  for (const key of SETTING_KEYS) {
    const value = String(formData.get(key) ?? "");
    await prisma.setting.upsert({
      where: { userId_key: { userId, key } },
      update: { value },
      create: { userId, key, value },
    });
  }
  revalidatePath("/settings");
  revalidatePath("/", "layout");
}
