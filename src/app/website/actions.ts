"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { supabaseAdmin, IMAGE_BUCKET } from "@/lib/supabaseAdmin";
import { SECTION_KEYS, type Show } from "./site-fields";
import { FONT_KEYS } from "@/lib/siteFonts";

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
  const heroSubtext = String(formData.get("heroSubtext") || "").trim() || null;

  const rawTheme = String(formData.get("themeColor") || "").trim();
  if (rawTheme && !/^#[0-9a-fA-F]{6}$/.test(rawTheme)) {
    return { ok: false, error: "Accent color must be a 6-digit hex like #e0a530." };
  }
  const themeColor = rawTheme ? rawTheme.toLowerCase() : null;

  // Website heading font — only accept a known key, else leave unset (default).
  const rawFont = String(formData.get("fontFamily") || "").trim();
  const fontFamily = FONT_KEYS.includes(rawFont) ? rawFont : null;

  const footerText = String(formData.get("footerText") || "").trim().slice(0, 300) || null;

  const styleRaw = String(formData.get("playerStyle") || "waveform");
  const playerStyle = ["waveform", "shade", "simple", "classic"].includes(styleRaw) ? styleRaw : "waveform";

  const showStreamLinks = formData.get("showStreamLinks") != null;
  const streamLinksAfterGate = String(formData.get("streamLinksTiming") || "before") === "after";

  const heroCtaPrimary = String(formData.get("heroCtaPrimary") || "").trim() || null;
  const heroCtaSecondary = String(formData.get("heroCtaSecondary") || "").trim() || null;

  // Song-unlock gate settings.
  const rawPreview = parseInt(String(formData.get("previewSeconds") || ""), 10);
  const previewSeconds = Number.isFinite(rawPreview) ? Math.min(30, Math.max(5, rawPreview)) : 30;
  const gateRaw = String(formData.get("unlockGate") || "email");
  const unlockGate = ["email", "share", "follow"].includes(gateRaw) ? gateRaw : "email";
  const unlockFollowUrl = String(formData.get("unlockFollowUrl") || "").trim() || null;
  const fbLikeShare = !!formData.get("fbLikeShare");
  const fbPageUrl = String(formData.get("fbPageUrl") || "").trim() || null;

  // Section visibility: a checkbox per toggleable section (checked = visible).
  const hiddenSections = SECTION_KEYS.filter((k) => !formData.get(`section_${k}`));

  // Shows: one per line, "date | venue | city | ticket url" (city/url optional).
  const shows: Show[] = String(formData.get("shows") || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [date, venue, city, ticketUrl] = line.split("|").map((s) => s.trim());
      return {
        date: date || "",
        venue: venue || "",
        city: city || "",
        ticketUrl: ticketUrl || "",
      };
    })
    .filter((s) => s.date || s.venue);

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

  // The pool of addresses the dropdowns pick from (comma/newline separated).
  const availableEmails = Array.from(
    new Set(
      String(formData.get("availableEmails") || "")
        .split(/[\n,]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    )
  );

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
    availableEmails,
    contactEmail: contactEmail as string | null,
    notifyEmail: notifyEmail as string | null,
    mailFromEmail: mailFromEmail as string | null,
    mailReplyTo: mailReplyTo as string | null,
  };

  const siteFields = {
    slug,
    displayName,
    tagline,
    location,
    bio,
    heroSubtext,
    themeColor,
    fontFamily,
    footerText,
    playerStyle,
    showStreamLinks,
    streamLinksAfterGate,
    heroCtaPrimary,
    heroCtaSecondary,
    previewSeconds,
    unlockGate,
    unlockFollowUrl,
    fbLikeShare,
    fbPageUrl,
    hiddenSections,
    shows,
    socialLinks,
    ...emailFields,
  };

  await prisma.artistSite.upsert({
    where: { userId },
    create: { userId, ...siteFields },
    update: siteFields,
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

const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Uploads a hero or gallery image to Supabase and records its public URL on the
// artist's site. kind = "hero" (single) | "gallery" (appended).
export async function uploadSiteImage(formData: FormData) {
  const userId = await requireUserId();
  const site = await prisma.artistSite.findUnique({
    where: { userId },
    select: { slug: true, galleryImages: true },
  });
  if (!site) return { ok: false, error: "Save your site details first." };

  const kind = String(formData.get("kind") || "");
  if (kind !== "hero" && kind !== "gallery") {
    return { ok: false, error: "Invalid image type." };
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image to upload." };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { ok: false, error: "Image must be under 8 MB." };
  }
  const ext = IMAGE_EXT[file.type];
  if (!ext) {
    return { ok: false, error: "Use a JPG, PNG, WebP, or GIF image." };
  }

  // Make sure the (public) bucket exists; ignore "already exists".
  await supabaseAdmin.storage.createBucket(IMAGE_BUCKET, { public: true }).catch(() => {});

  const path = `sites/${site.slug}/${kind}-${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: upErr } = await supabaseAdmin.storage
    .from(IMAGE_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (upErr) return { ok: false, error: "Upload failed. Try again." };

  const { data } = supabaseAdmin.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  const url = data.publicUrl;

  if (kind === "hero") {
    await prisma.artistSite.update({ where: { userId }, data: { heroImageUrl: url } });
  } else {
    await prisma.artistSite.update({
      where: { userId },
      data: { galleryImages: [...site.galleryImages, url] },
    });
  }
  revalidatePath("/website");
  return { ok: true, url };
}

export async function clearHeroImage() {
  const userId = await requireUserId();
  await prisma.artistSite.update({ where: { userId }, data: { heroImageUrl: null } });
  revalidatePath("/website");
}

export async function removeGalleryImage(url: string) {
  const userId = await requireUserId();
  const site = await prisma.artistSite.findUnique({
    where: { userId },
    select: { galleryImages: true, hiddenGalleryImages: true },
  });
  if (!site) return;
  await prisma.artistSite.update({
    where: { userId },
    data: {
      galleryImages: site.galleryImages.filter((u) => u !== url),
      hiddenGalleryImages: site.hiddenGalleryImages.filter((u) => u !== url),
    },
  });
  revalidatePath("/website");
}

// Hide a photo from the public gallery but keep it in the library.
export async function hideGalleryImage(url: string) {
  const userId = await requireUserId();
  const site = await prisma.artistSite.findUnique({
    where: { userId },
    select: { galleryImages: true, hiddenGalleryImages: true },
  });
  if (!site || !site.galleryImages.includes(url)) return;
  await prisma.artistSite.update({
    where: { userId },
    data: {
      galleryImages: site.galleryImages.filter((u) => u !== url),
      hiddenGalleryImages: Array.from(new Set([...site.hiddenGalleryImages, url])),
    },
  });
  revalidatePath("/website");
}

// Restore a hidden photo to the public gallery.
export async function showGalleryImage(url: string) {
  const userId = await requireUserId();
  const site = await prisma.artistSite.findUnique({
    where: { userId },
    select: { galleryImages: true, hiddenGalleryImages: true },
  });
  if (!site || !site.hiddenGalleryImages.includes(url)) return;
  await prisma.artistSite.update({
    where: { userId },
    data: {
      hiddenGalleryImages: site.hiddenGalleryImages.filter((u) => u !== url),
      galleryImages: Array.from(new Set([...site.galleryImages, url])),
    },
  });
  revalidatePath("/website");
}

// Reorder the gallery to the given sequence (must be the same set of photos).
export async function reorderGalleryImages(urls: string[]) {
  const userId = await requireUserId();
  const site = await prisma.artistSite.findUnique({
    where: { userId },
    select: { galleryImages: true },
  });
  if (!site) return;
  const current = new Set(site.galleryImages);
  const next = urls.filter((u) => current.has(u));
  // Append any the client didn't include, so nothing is lost.
  for (const u of site.galleryImages) if (!next.includes(u)) next.push(u);
  await prisma.artistSite.update({ where: { userId }, data: { galleryImages: next } });
  revalidatePath("/website");
}

// Promote an existing gallery photo to the hero background (used by drag-to-hero).
export async function setHeroImage(url: string) {
  const userId = await requireUserId();
  const site = await prisma.artistSite.findUnique({
    where: { userId },
    select: { galleryImages: true },
  });
  if (!site) return;
  // Only allow images the artist already owns (a gallery photo).
  if (!site.galleryImages.includes(url)) return;
  await prisma.artistSite.update({ where: { userId }, data: { heroImageUrl: url } });
  revalidatePath("/website");
}

// The tracks featured on the artist's website, in display order.
export async function getSiteTracks() {
  const userId = await requireUserId();
  const site = await prisma.artistSite.findUnique({ where: { userId }, select: { slug: true } });
  if (!site) return [];
  const tracks = await prisma.siteTrack.findMany({
    where: { site: site.slug },
    orderBy: { order: "asc" },
    select: { id: true, title: true, gate: true, streamLinks: true },
  });
  return tracks;
}

// Save a song's links to monetizing platforms (Spotify/Apple/Bandcamp/etc.).
// Only accepts http(s) URLs; empty values are dropped, all-empty stores null.
export async function setSiteTrackLinks(id: string, links: Record<string, string>) {
  const userId = await requireUserId();
  const site = await prisma.artistSite.findUnique({ where: { userId }, select: { slug: true } });
  if (!site) return;
  const owned = await prisma.siteTrack.findFirst({ where: { id, site: site.slug }, select: { id: true } });
  if (!owned) return;
  const allowed = ["spotify", "apple", "bandcamp", "youtube", "soundcloud"];
  const clean: Record<string, string> = {};
  for (const key of allowed) {
    const url = String(links?.[key] || "").trim();
    if (/^https?:\/\/\S+$/i.test(url)) clean[key] = url.slice(0, 500);
  }
  await prisma.siteTrack.update({
    where: { id },
    data: { streamLinks: Object.keys(clean).length ? clean : Prisma.JsonNull },
  });
  revalidatePath("/website");
}

// Set how a single song unlocks: "email" | "share" | "follow" | "free".
export async function setSiteTrackGate(id: string, gate: string) {
  const userId = await requireUserId();
  if (!["email", "share", "follow", "free"].includes(gate)) return;
  const site = await prisma.artistSite.findUnique({ where: { userId }, select: { slug: true } });
  if (!site) return;
  // Only this artist's own tracks.
  const owned = await prisma.siteTrack.findFirst({ where: { id, site: site.slug }, select: { id: true } });
  if (!owned) return;
  await prisma.siteTrack.update({ where: { id }, data: { gate } });
  revalidatePath("/website");
}

// Persist a new order for the website's tracks (the first one plays first).
export async function reorderSiteTracks(ids: string[]) {
  const userId = await requireUserId();
  const site = await prisma.artistSite.findUnique({ where: { userId }, select: { slug: true } });
  if (!site) return;
  const owned = await prisma.siteTrack.findMany({ where: { site: site.slug }, select: { id: true } });
  const ownedIds = new Set(owned.map((t) => t.id));
  const seq = ids.filter((id) => ownedIds.has(id));
  await prisma.$transaction(seq.map((id, i) => prisma.siteTrack.update({ where: { id }, data: { order: i } })));
  revalidatePath("/website");
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
