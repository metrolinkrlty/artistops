"use server";

import { prisma } from "@/lib/prisma";

export async function getPlaylists() {
  const [playlists, songs] = await Promise.all([
    prisma.playlist.findMany({ orderBy: { followerCount: "desc" }, include: { songs: true } }),
    prisma.song.findMany({ select: { id: true, title: true } }),
  ]);
  const titleById = new Map(songs.map((s) => [s.id, s.title]));
  return playlists.map((pl) => {
    const ps = pl.songs[0];
    return {
      id: pl.id,
      name: pl.name,
      platform: pl.platform,
      type: pl.type,
      followers: pl.followerCount ?? 0,
      song: ps ? titleById.get(ps.songId) ?? "—" : "—",
      streams: ps?.streams ?? 0,
      revenue: ps?.estimatedRevenue ?? 0,
      addedAt: ps?.addedAt ? ps.addedAt.toISOString().slice(0, 10) : "—",
    };
  });
}
