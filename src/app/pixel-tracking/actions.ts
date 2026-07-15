"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getPixels() {
  const userId = await requireUserId();
  const pixels = await prisma.pixel.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return pixels.map((p) => ({ id: p.id, name: p.name }));
}

export async function createPixel(name: string) {
  const userId = await requireUserId();
  const clean = String(name || "").trim().slice(0, 60);
  if (!clean) return;
  await prisma.pixel.create({ data: { userId, name: clean } });
  revalidatePath("/pixel-tracking");
}

export async function deletePixel(id: string) {
  const userId = await requireUserId();
  const pixel = await prisma.pixel.findFirst({ where: { id, userId } });
  if (!pixel) return;
  // Keep the historical events but detach them from the deleted pixel.
  await prisma.pixelEvent.updateMany({ where: { pixelId: id }, data: { pixelId: null } });
  await prisma.pixel.delete({ where: { id } });
  revalidatePath("/pixel-tracking");
}

// Which pixel (if any) the artist has designated for their external website.
// Read defensively so a not-yet-migrated DB still renders the page.
export async function getWebsitePixelId(): Promise<string | null> {
  const userId = await requireUserId();
  try {
    const site = await prisma.artistSite.findUnique({
      where: { userId },
      select: { websitePixelId: true },
    });
    return site?.websitePixelId ?? null;
  } catch {
    return null;
  }
}

// Designate (or clear) the pixel that powers the artist's external website.
// The site reads this from its config and installs the pixel with no redeploy.
export async function setWebsitePixel(
  pixelId: string | null
): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  if (pixelId) {
    const owned = await prisma.pixel.findFirst({ where: { id: pixelId, userId }, select: { id: true } });
    if (!owned) return { ok: false, error: "That pixel doesn't exist." };
  }
  try {
    await prisma.artistSite.update({ where: { userId }, data: { websitePixelId: pixelId } });
  } catch {
    return { ok: false, error: "Couldn't save — set up your website first, then try again." };
  }
  revalidatePath("/pixel-tracking");
  return { ok: true };
}

export async function getPixelEvents() {
  const userId = await requireUserId();
  const events = await prisma.pixelEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { song: { select: { title: true } }, pixel: { select: { name: true } } },
  });
  return events.map((e) => ({
    id: e.id,
    pixelId: e.pixelId,
    pixelName: e.pixel?.name ?? null,
    songTitle: e.song?.title ?? null,
    visitorId: e.visitorId,
    pageUrl: e.pageUrl,
    eventType: e.eventType,
    utmSource: e.utmSource,
    utmCampaign: e.utmCampaign,
    createdAt: e.createdAt.toISOString(),
  }));
}
