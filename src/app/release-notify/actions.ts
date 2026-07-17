"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";

export type CampaignRow = {
  id: string;
  slug: string;
  title: string;
  releaseAt: string; // ISO
  linkUrl: string | null;
  status: string;
  signupCount: number;
};

// Turn a release title into a URL-safe slug. Kept short and readable because it
// shows in the link the artist shares with fans.
function baseSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "release"
  );
}

export async function getReleaseCampaigns(): Promise<CampaignRow[]> {
  const userId = await requireUserId();
  const rows = await prisma.releaseCampaign.findMany({
    where: { userId },
    orderBy: { releaseAt: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      releaseAt: true,
      linkUrl: true,
      status: true,
      _count: { select: { signups: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    releaseAt: r.releaseAt.toISOString(),
    linkUrl: r.linkUrl,
    status: r.status,
    signupCount: r._count.signups,
  }));
}

// Whether the artist has a public site record. The notify page pulls its photo
// and name from there, so we warn in the UI if it's missing.
export async function hasArtistSite(): Promise<boolean> {
  const userId = await requireUserId();
  const site = await prisma.artistSite.findFirst({
    where: { userId },
    select: { id: true },
  });
  return !!site;
}

export async function createReleaseCampaign(
  title: string,
  releaseDate: string, // "YYYY-MM-DD" from a date input
  linkUrl: string
): Promise<{ ok: boolean; error?: string; slug?: string }> {
  const userId = await requireUserId();

  const cleanTitle = title.trim();
  if (!cleanTitle) return { ok: false, error: "Give the release a name." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) {
    return { ok: false, error: "Pick a release date." };
  }
  // Store the date at UTC midnight — it's a calendar date, not a moment, and the
  // notify page renders it in UTC so every fan sees the artist's chosen day.
  const releaseAt = new Date(`${releaseDate}T00:00:00.000Z`);
  if (Number.isNaN(releaseAt.getTime())) {
    return { ok: false, error: "That release date isn't valid." };
  }

  const link = linkUrl.trim();
  if (link && !/^https?:\/\//i.test(link)) {
    return { ok: false, error: "The listen link should start with https://" };
  }

  // Find a free slug: base, then base-2, base-3, … so titles can repeat safely.
  const base = baseSlug(cleanTitle);
  let slug = base;
  for (let n = 2; n < 100; n++) {
    const taken = await prisma.releaseCampaign.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!taken) break;
    slug = `${base}-${n}`;
  }

  try {
    await prisma.releaseCampaign.create({
      data: {
        userId,
        slug,
        title: cleanTitle,
        releaseAt,
        linkUrl: link || null,
      },
    });
  } catch {
    return { ok: false, error: "Couldn't create that. Please try again." };
  }

  revalidatePath("/release-notify");
  return { ok: true, slug };
}

export async function updateReleaseCampaign(
  id: string,
  fields: { title?: string; releaseDate?: string; linkUrl?: string; status?: string }
): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();

  // Ownership check — never trust the id alone.
  const existing = await prisma.releaseCampaign.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "Release not found." };

  const data: Record<string, unknown> = {};
  if (fields.title !== undefined) {
    const t = fields.title.trim();
    if (!t) return { ok: false, error: "Give the release a name." };
    data.title = t;
  }
  if (fields.releaseDate !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.releaseDate)) {
      return { ok: false, error: "Pick a valid release date." };
    }
    data.releaseAt = new Date(`${fields.releaseDate}T00:00:00.000Z`);
  }
  if (fields.linkUrl !== undefined) {
    const link = fields.linkUrl.trim();
    if (link && !/^https?:\/\//i.test(link)) {
      return { ok: false, error: "The listen link should start with https://" };
    }
    data.linkUrl = link || null;
  }
  if (fields.status !== undefined) {
    if (!["scheduled", "announced", "canceled"].includes(fields.status)) {
      return { ok: false, error: "Unknown status." };
    }
    data.status = fields.status;
    if (fields.status === "announced") data.announcedAt = new Date();
  }

  try {
    await prisma.releaseCampaign.update({ where: { id }, data });
  } catch {
    return { ok: false, error: "Couldn't save that change." };
  }
  revalidatePath("/release-notify");
  return { ok: true };
}

export async function deleteReleaseCampaign(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const existing = await prisma.releaseCampaign.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "Release not found." };

  // Signups cascade-delete with the campaign (schema onDelete: Cascade).
  try {
    await prisma.releaseCampaign.delete({ where: { id } });
  } catch {
    return { ok: false, error: "Couldn't delete that." };
  }
  revalidatePath("/release-notify");
  return { ok: true };
}
