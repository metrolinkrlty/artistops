"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const DEFAULTS: Record<string, string> = {
  artistName: "Alex Rivera",
  email: "alex@alexrivera.com",
  proMembership: "ASCAP",
  ipiNumber: "012345678",
  websiteUrl: "",
};

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  const map: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) map[r.key] = r.value;
  return map;
}

export async function saveSettings(formData: FormData) {
  const keys = ["artistName", "email", "proMembership", "ipiNumber", "websiteUrl"];
  for (const key of keys) {
    const value = String(formData.get(key) ?? "");
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  revalidatePath("/settings");
}
