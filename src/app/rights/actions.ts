"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

type Split = { name: string; percentage: number };

export async function getRightsData() {
  const userId = await requireUserId();
  const [songs, copyrights, docs] = await Promise.all([
    prisma.song.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.copyright.findMany({ where: { userId } }),
    prisma.rightsDocument.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
  ]);
  const titleById = new Map(songs.map((s) => [s.id, s.title]));

  const songRights = songs.map((s) => {
    // Find the copyright record that covers this song (individual or group)
    const cr = copyrights.find((c) => c.songIds.includes(s.id));
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
  const documents = docs.map((doc) => {
    let status: "active" | "expiring" = "active";
    if (doc.expiresAt) {
      const diff = doc.expiresAt.getTime() - now;
      if (diff < ninetyDays) status = "expiring";
    }
    return {
      id: doc.id,
      songTitle: titleById.get(doc.songId) ?? "—",
      type: doc.type,
      title: doc.title,
      parties: doc.parties,
      expiresAt: doc.expiresAt ? doc.expiresAt.toISOString().slice(0, 10) : null,
      status,
    };
  });

  return { songRights, documents };
}
