"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";

export type SocialLinks = {
  instagram?: string;
  spotify?: string;
  appleMusic?: string;
  youtube?: string;
  facebook?: string;
  tiktok?: string;
  bandcamp?: string;
  website?: string;
};

const SOCIAL_KEYS: (keyof SocialLinks)[] = [
  "instagram",
  "spotify",
  "appleMusic",
  "youtube",
  "facebook",
  "tiktok",
  "bandcamp",
  "website",
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getArtistSite() {
  const userId = await requireUserId();
  return prisma.artistSite.findUnique({ where: { userId } });
}

export async function saveArtistSite(formData: FormData) {
  const userId = await requireUserId();

  const displayName = String(formData.get("displayName") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const slug = slugify(rawSlug || displayName);
  if (!displayName || !slug) {
    return { ok: false, error: "Display name and slug are required." };
  }

  const tagline = String(formData.get("tagline") || "").trim() || null;
  const location = String(formData.get("location") || "").trim() || null;
  const bio = String(formData.get("bio") || "").trim() || null;

  const email = (field: string) => {
    const v = String(formData.get(field) || "").trim();
    if (!v) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { invalid: v };
    return v;
  };
  const contactEmail = email("contactEmail");
  const notifyEmail = email("notifyEmail");
  const mailFromEmail = email("mailFromEmail");
  const mailReplyTo = email("mailReplyTo");
  for (const [label, val] of [
    ["Contact email", contactEmail],
    ["Notify email", notifyEmail],
    ["Mailing from", mailFromEmail],
    ["Reply-to", mailReplyTo],
  ] as const) {
    if (val && typeof val === "object") {
      return { ok: false, error: `${label} is not a valid email address.` };
    }
  }

  const socialLinks: SocialLinks = {};
  for (const key of SOCIAL_KEYS) {
    const val = String(formData.get(`social_${key}`) || "").trim();
    if (val) socialLinks[key] = val;
  }

  // Guard against another artist already owning this slug.
  const slugOwner = await prisma.artistSite.findUnique({ where: { slug } });
  if (slugOwner && slugOwner.userId !== userId) {
    return { ok: false, error: `The slug "${slug}" is already taken.` };
  }

  const emailFields = {
    contactEmail: contactEmail as string | null,
    notifyEmail: notifyEmail as string | null,
    mailFromEmail: mailFromEmail as string | null,
    mailReplyTo: mailReplyTo as string | null,
  };

  await prisma.artistSite.upsert({
    where: { userId },
    create: { userId, slug, displayName, tagline, location, bio, socialLinks, ...emailFields },
    update: { slug, displayName, tagline, location, bio, socialLinks, ...emailFields },
  });

  // Keep this artist's existing subscribers pointed at the (possibly new) slug.
  await prisma.mailingSubscriber.updateMany({
    where: { userId },
    data: { site: slug },
  });
  // Claim any subscribers captured under this slug before the site record existed.
  await prisma.mailingSubscriber.updateMany({
    where: { site: slug, userId: null },
    data: { userId },
  });

  revalidatePath("/website");
  return { ok: true };
}

export async function getSubscribers() {
  const userId = await requireUserId();
  const site = await prisma.artistSite.findUnique({
    where: { userId },
    select: { slug: true },
  });

  return prisma.mailingSubscriber.findMany({
    where: {
      OR: [{ userId }, ...(site ? [{ site: site.slug }] : [])],
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteSubscriber(id: string) {
  const userId = await requireUserId();
  const site = await prisma.artistSite.findUnique({
    where: { userId },
    select: { slug: true },
  });
  await prisma.mailingSubscriber.deleteMany({
    where: {
      id,
      OR: [{ userId }, ...(site ? [{ site: site.slug }] : [])],
    },
  });
  revalidatePath("/website");
}
