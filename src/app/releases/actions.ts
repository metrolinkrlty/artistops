"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getReleases() {
  const userId = await requireUserId();
  return prisma.distribution.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      song: { select: { id: true, title: true } },
      distributor: { select: { id: true, name: true } },
    },
  });
}

export async function getReleaseOptions() {
  const userId = await requireUserId();
  const [songs, distributors] = await Promise.all([
    prisma.song.findMany({ where: { userId }, select: { id: true, title: true, isrc: true, upc: true }, orderBy: { title: "asc" } }),
    prisma.distributor.findMany({ where: { userId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
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
  const userId = await requireUserId();
  const data = parse(formData);
  if (!data.songId || !data.distributorId) return;
  // verify both belong to the user
  const [song, dist] = await Promise.all([
    prisma.song.findFirst({ where: { id: data.songId, userId } }),
    prisma.distributor.findFirst({ where: { id: data.distributorId, userId } }),
  ]);
  if (!song || !dist) return;
  await prisma.distribution.create({ data: { ...data, userId } });
  revalidatePath("/releases");
}

export async function updateRelease(id: string, formData: FormData) {
  const userId = await requireUserId();
  const data = parse(formData);
  if (!data.songId || !data.distributorId) return;
  await prisma.distribution.updateMany({ where: { id, userId }, data });
  revalidatePath("/releases");
}

export async function deleteRelease(id: string) {
  const userId = await requireUserId();
  await prisma.distribution.deleteMany({ where: { id, userId } });
  revalidatePath("/releases");
}
