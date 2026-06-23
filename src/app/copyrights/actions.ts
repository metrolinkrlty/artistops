"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getCopyrights() {
  const userId = await requireUserId();
  const [copyrights, songs] = await Promise.all([
    prisma.copyright.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.song.findMany({ where: { userId }, select: { id: true, title: true } }),
  ]);
  const songMap = new Map(songs.map((s) => [s.id, s.title]));
  return copyrights.map((c) => ({
    ...c,
    songTitles: c.songIds.map((id) => songMap.get(id) || id),
    isGroup: c.songIds.length > 1,
  }));
}

export async function getSongOptions() {
  const userId = await requireUserId();
  return prisma.song.findMany({ where: { userId }, select: { id: true, title: true }, orderBy: { title: "asc" } });
}

function parse(formData: FormData) {
  const filing = String(formData.get("filingDate") || "");
  // songIds comes as multiple values from checkboxes
  const songIds = formData.getAll("songIds").map(String).filter(Boolean);
  return {
    songIds,
    groupTitle: String(formData.get("groupTitle") || "").trim() || null,
    serviceRequestNumber: String(formData.get("serviceRequestNumber") || "").trim() || null,
    serviceRequestUrl: String(formData.get("serviceRequestUrl") || "").trim() || null,
    registrationNumber: String(formData.get("registrationNumber") || "").trim() || null,
    registrationCertUrl: String(formData.get("registrationCertUrl") || "").trim() || null,
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
  if (!data.songIds.length) return;
  // verify all songs belong to this user
  const owned = await prisma.song.findMany({ where: { id: { in: data.songIds }, userId }, select: { id: true } });
  if (!owned.length) return;
  await prisma.copyright.create({ data: { ...data, userId } });
  revalidatePath("/copyrights");
}

export async function updateCopyright(id: string, formData: FormData) {
  const userId = await requireUserId();
  const data = parse(formData);
  if (!data.songIds.length) return;
  await prisma.copyright.updateMany({ where: { id, userId }, data });
  revalidatePath("/copyrights");
}

export async function deleteCopyright(id: string) {
  const userId = await requireUserId();
  await prisma.copyright.deleteMany({ where: { id, userId } });
  revalidatePath("/copyrights");
}
