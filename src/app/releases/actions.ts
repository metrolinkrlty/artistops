"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getReleases() {
  return prisma.distribution.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      song: { select: { id: true, title: true } },
      distributor: { select: { id: true, name: true } },
    },
  });
}

export async function getReleaseOptions() {
  const [songs, distributors] = await Promise.all([
    prisma.song.findMany({ select: { id: true, title: true, isrc: true, upc: true }, orderBy: { title: "asc" } }),
    prisma.distributor.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return { songs, distributors };
}

function parse(formData: FormData) {
  const release = String(formData.get("releaseDate") || "");
  return {
    songId: String(formData.get("songId") || ""),
    distributorId: String(formData.get("distributorId") || ""),
    isrc: String(formData.get("isrc") || "").trim() || null,
    upc: String(formData.get("upc") || "").trim() || null,
    stores: String(formData.get("stores") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    status: String(formData.get("status") || "ACTIVE") as never,
    releaseDate: release ? new Date(release) : null,
  };
}

export async function createRelease(formData: FormData) {
  const data = parse(formData);
  if (!data.songId || !data.distributorId) return;
  await prisma.distribution.create({ data });
  revalidatePath("/releases");
}

export async function updateRelease(id: string, formData: FormData) {
  const data = parse(formData);
  if (!data.songId || !data.distributorId) return;
  await prisma.distribution.update({ where: { id }, data });
  revalidatePath("/releases");
}

export async function deleteRelease(id: string) {
  await prisma.distribution.delete({ where: { id } });
  revalidatePath("/releases");
}
