"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { mapSmartLinkToStreamLinks, mergeStreamLinks } from "@/lib/streamLinks";

type Platform = { name: string; url: string; priority: number };

// Push a song's Smart Link platform URLs onto any website tracks featuring it,
// so the "Full song on …" chips stay in sync without re-typing.
async function propagateToSiteTracks(songId: string | null, platforms: Platform[]) {
  if (!songId) return;
  const derived = mapSmartLinkToStreamLinks(platforms);
  if (!Object.keys(derived).length) return;
  const tracks = await prisma.siteTrack.findMany({ where: { songId }, select: { id: true, streamLinks: true } });
  for (const t of tracks) {
    await prisma.siteTrack.update({ where: { id: t.id }, data: { streamLinks: mergeStreamLinks(t.streamLinks, derived) } });
  }
  if (tracks.length) revalidatePath("/website");
}

export async function getSmartLinks() {
  const userId = await requireUserId();
  const links = await prisma.smartLink.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { clicks: true },
  });
  return links.map((l) => {
    const platforms = (l.platforms as unknown as Platform[]) || [];
    const total = l.clicks.length;
    const platCount = new Map<string, number>();
    for (const c of l.clicks) if (c.platform) platCount.set(c.platform, (platCount.get(c.platform) || 0) + 1);
    const topPlatform = Array.from(platCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || platforms[0]?.name || "—";
    return { id: l.id, slug: l.slug, title: l.title, artistName: l.artistName, platforms, totalClicks: total, topPlatform, isActive: l.isActive };
  });
}

export async function getSongOptions() {
  const userId = await requireUserId();
  return prisma.song.findMany({ where: { userId }, select: { id: true, title: true }, orderBy: { title: "asc" } });
}

export async function createSmartLink(formData: FormData) {
  const userId = await requireUserId();
  const title = String(formData.get("title") || "").trim();
  let slug = String(formData.get("slug") || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
  if (!title || !slug) return;

  const names = formData.getAll("platformName").map(String);
  const urls = formData.getAll("platformUrl").map(String);
  const platforms: Platform[] = names
    .map((name, i) => ({ name, url: urls[i] || "", priority: i + 1 }))
    .filter((p) => p.url.trim() !== "");

  const existing = await prisma.smartLink.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const songId = String(formData.get("songId") || "") || null;
  await prisma.smartLink.create({
    data: {
      userId,
      slug,
      title,
      artistName: user?.artistName || "Artist",
      songId,
      platforms: platforms as never,
      isActive: true,
    },
  });
  await propagateToSiteTracks(songId, platforms);
  revalidatePath("/smart-links");
}

export async function deleteSmartLink(id: string) {
  const userId = await requireUserId();
  const owned = await prisma.smartLink.findFirst({ where: { id, userId } });
  if (!owned) return;
  await prisma.smartLinkClick.deleteMany({ where: { smartLinkId: id } });
  await prisma.smartLink.delete({ where: { id } });
  revalidatePath("/smart-links");
}

export async function toggleSmartLink(id: string, isActive: boolean) {
  const userId = await requireUserId();
  await prisma.smartLink.updateMany({ where: { id, userId }, data: { isActive } });
  revalidatePath("/smart-links");
}
