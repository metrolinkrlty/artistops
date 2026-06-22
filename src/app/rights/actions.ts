"use server";

import { prisma } from "@/lib/prisma";

type Split = { name: string; percentage: number };

export async function getRightsData() {
  const [songs, docs] = await Promise.all([
    prisma.song.findMany({ orderBy: { createdAt: "asc" }, include: { copyrights: true } }),
    prisma.rightsDocument.findMany({ orderBy: { createdAt: "asc" } }),
  ]);
  const titleById = new Map(songs.map((s) => [s.id, s.title]));

  const songRights = songs.map((s) => {
    const cr = s.copyrights[0];
    const splits = ((s.splits as unknown as Split[]) || []).map((sp) => ({ name: sp.name, pct: sp.percentage }));
    return {
      id: s.id,
      title: s.title,
      isrc: s.isrc,
      writers: splits.map((sp) => `${sp.name} (${sp.pct}%)`),
      publishers: s.publishers,
      masterOwner: s.artist,
      pro: cr?.proName ?? null,
      mlc: !!cr?.registeredWithMLC,
      soundExchange: !!cr?.registeredWithSX,
      syncAvailable: !!(cr?.registeredWithPRO && cr?.registeredWithMLC),
      splits,
    };
  });

  const now = Date.now();
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;
  const documents = docs.map((d) => {
    let status: "active" | "expiring" = "active";
    if (d.expiresAt) {
      const diff = d.expiresAt.getTime() - now;
      if (diff < ninetyDays) status = "expiring";
    }
    return {
      id: d.id,
      songTitle: titleById.get(d.songId) ?? "—",
      type: d.type,
      title: d.title,
      parties: d.parties,
      expiresAt: d.expiresAt ? d.expiresAt.toISOString().slice(0, 10) : null,
      status,
    };
  });

  return { songRights, documents };
}
