"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getStreamingData() {
  const [plays, songs] = await Promise.all([
    prisma.streamPlay.findMany({
      orderBy: { period: "desc" },
      include: { song: { select: { title: true, isrc: true } } },
    }),
    prisma.song.findMany({ select: { id: true, title: true, isrc: true }, orderBy: { title: "asc" } }),
  ]);

  const rows = plays.map((p) => ({
    id: p.id,
    songTitle: p.song?.title ?? "—",
    platform: p.platform,
    period: p.period.toISOString(),
    isrc: p.isrc ?? p.song?.isrc ?? null,
    plays: p.plays,
  }));

  // ISRC-centric grouping
  const isrcMap = new Map<string, { isrc: string; song: string; platforms: Record<string, number>; total: number }>();
  for (const r of rows) {
    const key = `${r.isrc || r.songTitle}`;
    if (!isrcMap.has(key)) isrcMap.set(key, { isrc: r.isrc || "—", song: r.songTitle, platforms: {}, total: 0 });
    const entry = isrcMap.get(key)!;
    entry.platforms[r.platform] = (entry.platforms[r.platform] || 0) + r.plays;
    entry.total += r.plays;
  }
  const isrcData = Array.from(isrcMap.values()).sort((a, b) => b.total - a.total);

  // Platform comparison
  const platMap = new Map<string, number>();
  for (const r of rows) platMap.set(r.platform, (platMap.get(r.platform) || 0) + r.plays);
  const grand = Array.from(platMap.values()).reduce((a, b) => a + b, 0) || 1;
  const platformComparison = Array.from(platMap.entries())
    .map(([platform, plays]) => ({ platform, plays, pct: Number(((plays / grand) * 100).toFixed(1)) }))
    .sort((a, b) => b.plays - a.plays);

  return { rows, songs, isrcData, platformComparison };
}

export async function createStreamPlay(formData: FormData) {
  const period = String(formData.get("period") || "");
  const songId = String(formData.get("songId") || "");
  if (!songId) return;
  await prisma.streamPlay.create({
    data: {
      songId,
      platform: String(formData.get("platform") || "Spotify"),
      plays: Number(formData.get("plays") || 0),
      period: period ? new Date(period) : new Date(),
      isrc: String(formData.get("isrc") || "").trim() || null,
    },
  });
  revalidatePath("/streaming");
}

export async function deleteStreamPlay(id: string) {
  await prisma.streamPlay.delete({ where: { id } });
  revalidatePath("/streaming");
}
