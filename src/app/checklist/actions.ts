"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { CHECKLIST_TASKS } from "./tasks";

export type ChecklistState = { key: string; done: boolean; auto: boolean };

// Auto-completed keys derived from the artist's actual data. Wrapped defensively
// so any DB hiccup just yields no auto-completions rather than breaking the bell.
async function detectAuto(userId: string): Promise<Set<string>> {
  const done = new Set<string>();
  try {
    const [songs, audio, meta, copyrights, distributors, smartLinks, pixels, adPixels, site] =
      await Promise.all([
        prisma.song.count({ where: { userId } }),
        prisma.song.count({ where: { userId, audioFileRef: { not: null } } }),
        prisma.song.count({ where: { userId, OR: [{ isrc: { not: null } }, { upc: { not: null } }] } }),
        prisma.copyright.count({ where: { userId } }),
        prisma.distributor.count({ where: { userId } }),
        prisma.smartLink.count({ where: { userId } }),
        prisma.pixel.count({ where: { userId } }),
        prisma.adPixel.count({ where: { userId } }).catch(() => 0),
        prisma.artistSite.findUnique({
          where: { userId },
          select: { displayName: true, socialLinks: true, websitePixelId: true },
        }),
      ]);

    if (site) done.add("profile");
    if (site) done.add("website");
    if (songs > 0) done.add("add-songs");
    if (audio > 0) done.add("upload-audio");
    if (meta > 0) done.add("metadata");
    if (copyrights > 0) done.add("copyrights");
    if (distributors > 0) done.add("distributor");
    if (smartLinks > 0) done.add("smart-links");
    if (pixels > 0 || site?.websitePixelId) done.add("pixel");
    if (adPixels > 0) done.add("ad-pixels");
    const social = (site?.socialLinks as Record<string, string> | null) || null;
    if (social && Object.values(social).some((v) => v)) done.add("social");
  } catch {
    // ignore — return whatever we managed to detect
  }
  return done;
}

async function getManualDone(userId: string): Promise<Set<string>> {
  try {
    const rows = await prisma.checklistItem.findMany({
      where: { userId, done: true },
      select: { key: true },
    });
    return new Set(rows.map((r) => r.key));
  } catch {
    return new Set();
  }
}

// Returns each task's done + auto flags. Auto tasks derive from data; manual
// tasks come from the artist's own check-offs.
export async function getChecklist(): Promise<ChecklistState[]> {
  const userId = await requireUserId();
  const [manualDone, autoDone] = await Promise.all([
    getManualDone(userId),
    detectAuto(userId),
  ]);
  return CHECKLIST_TASKS.map((t) => ({
    key: t.key,
    auto: !!t.auto,
    done: t.auto ? autoDone.has(t.key) : manualDone.has(t.key),
  }));
}

export async function toggleChecklistItem(
  key: string,
  done: boolean
): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const task = CHECKLIST_TASKS.find((t) => t.key === key);
  if (!task) return { ok: false, error: "Unknown task." };
  // Auto tasks reflect real data — they can't be checked by hand.
  if (task.auto) return { ok: false, error: "This one completes automatically." };
  try {
    await prisma.checklistItem.upsert({
      where: { userId_key: { userId, key } },
      create: { userId, key, done },
      update: { done },
    });
  } catch {
    return { ok: false, error: "Couldn't save — the checklist isn't set up yet." };
  }
  return { ok: true };
}
