"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCopyrights() {
  return prisma.copyright.findMany({
    orderBy: { createdAt: "desc" },
    include: { song: { select: { id: true, title: true } } },
  });
}

export async function getSongOptions() {
  return prisma.song.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } });
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
  const data = parse(formData);
  if (!data.songId) return;
  await prisma.copyright.create({ data });
  revalidatePath("/copyrights");
}

export async function updateCopyright(id: string, formData: FormData) {
  const data = parse(formData);
  if (!data.songId) return;
  await prisma.copyright.update({ where: { id }, data });
  revalidatePath("/copyrights");
}

export async function deleteCopyright(id: string) {
  await prisma.copyright.delete({ where: { id } });
  revalidatePath("/copyrights");
}
