"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getCopyrights() {
  const userId = await requireUserId();
  return prisma.copyright.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { song: { select: { id: true, title: true } } },
  });
}

export async function getSongOptions() {
  const userId = await requireUserId();
  return prisma.song.findMany({ where: { userId }, select: { id: true, title: true }, orderBy: { title: "asc" } });
}

function parse(formData: FormData) {
  const filing = String(formData.get("filingDate") || "");
  return {
    songId: String(formData.get("songId") || ""),
    registrationNumber: String(formData.get("registrationNumber") || "").trim() || null,
    filingDate: filing ? new Date(filing) : null,
    claimant: String(formData.get("claimant") || "").trim() || null,
    proName: String(formData.get("proName") || "").trim() || null,
    workType: String(formData.get("workType") || "").trim() || "Musical Work",
    registeredWithUSCO: formData.get("registeredWithUSCO") === "on",
    registeredWithPRO: formData.get("registeredWithPRO") === "on",
    registeredWithMLC: formData.get("registeredWithMLC") === "on",
    registeredWithSX: formData.get("registeredWithSX") === "on",
    registeredWithDist: formData.get("registeredWithDist") === "on",
  };
}

export async function createCopyright(formData: FormData) {
  const userId = await requireUserId();
  const data = parse(formData);
  if (!data.songId) return;
  // ensure the song belongs to this user
  const song = await prisma.song.findFirst({ where: { id: data.songId, userId } });
  if (!song) return;
  await prisma.copyright.create({ data: { ...data, userId } });
  revalidatePath("/copyrights");
}

export async function updateCopyright(id: string, formData: FormData) {
  const userId = await requireUserId();
  const data = parse(formData);
  if (!data.songId) return;
  await prisma.copyright.updateMany({ where: { id, userId }, data });
  revalidatePath("/copyrights");
}

export async function deleteCopyright(id: string) {
  const userId = await requireUserId();
  await prisma.copyright.deleteMany({ where: { id, userId } });
  revalidatePath("/copyrights");
}
