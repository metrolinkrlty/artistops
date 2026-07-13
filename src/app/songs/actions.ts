"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";

export type SongStatus =
  | "DEMO"
  | "MIXED"
  | "MASTERED"
  | "RELEASED"
  | "REGISTERED"
  | "MONETIZED";

export async function getSongs() {
  const userId = await requireUserId();
  const [songs, copyrights] = await Promise.all([
    prisma.song.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.copyright.findMany({ where: { userId }, select: { songIds: true, registeredWithPRO: true, registeredWithMLC: true, registeredWithSX: true } }),
  ]);
  return songs.map((s) => {
    const cr = copyrights.find((c) => c.songIds.includes(s.id));
    return { ...s, copyrights: cr ? [cr] : [] };
  });
}

function parseForm(formData: FormData) {
  const writers = String(formData.get("writers") || "")
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean);
  const publishers = String(formData.get("publishers") || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const bpmRaw = formData.get("bpm");
  const releaseRaw = String(formData.get("releaseDate") || "");

  return {
    title: String(formData.get("title") || "").trim(),
    artist: String(formData.get("artist") || "").trim(),
    writers,
    publishers,
    splits: writers.length
      ? writers.map((name, i) => ({
          name,
          percentage: Math.round(100 / writers.length) + (i === 0 ? 100 - Math.round(100 / writers.length) * writers.length : 0),
        }))
      : [],
    isrc: String(formData.get("isrc") || "").trim() || null,
    upc: String(formData.get("upc") || "").trim() || null,
    releaseDate: releaseRaw ? new Date(releaseRaw) : null,
    genre: String(formData.get("genre") || "").trim() || null,
    bpm: bpmRaw ? Number(bpmRaw) : null,
    key: String(formData.get("key") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
    collectionTitle: String(formData.get("collectionTitle") || "").trim() || null,
    status: (String(formData.get("status") || "DEMO") as SongStatus),
  };
}

export async function createSong(formData: FormData) {
  const userId = await requireUserId();
  const data = parseForm(formData);
  if (!data.title || !data.artist) return;
  await prisma.song.create({ data: { ...data, userId } });
  revalidatePath("/songs");
}

export async function updateSong(id: string, formData: FormData) {
  const userId = await requireUserId();
  const data = parseForm(formData);
  if (!data.title || !data.artist) return;
  await prisma.song.updateMany({ where: { id, userId }, data });
  revalidatePath("/songs");
}

export async function deleteSong(id: string) {
  const userId = await requireUserId();
  // verify ownership first
  const song = await prisma.song.findFirst({ where: { id, userId } });
  if (!song) return;
  // remove dependent rows first to satisfy FK constraints
  // Only delete copyrights that solely cover this song; group copyrights covering other songs are kept
  const soloCoprights = await prisma.copyright.findMany({ where: { userId, songIds: { equals: [id] } } });
  if (soloCoprights.length) await prisma.copyright.deleteMany({ where: { id: { in: soloCoprights.map(c => c.id) } } });
  await prisma.distribution.deleteMany({ where: { songId: id } });
  await prisma.revenue.deleteMany({ where: { songId: id } });
  await prisma.streamPlay.deleteMany({ where: { songId: id } });
  await prisma.socialPost.deleteMany({ where: { songId: id } });
  await prisma.adCampaign.deleteMany({ where: { songId: id } });
  await prisma.pixelEvent.deleteMany({ where: { songId: id } });
  await prisma.song.delete({ where: { id } });
  revalidatePath("/songs");
}
