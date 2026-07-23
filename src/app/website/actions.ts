"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { mapSmartLinkToStreamLinks, mergeStreamLinks } from "@/lib/streamLinks";
import { requireUserId } from "@/lib/session";
import { sendEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { supabaseAdmin, IMAGE_BUCKET } from "@/lib/supabaseAdmin";
import { SECTION_KEYS, type Show } from "./site-fields";
import { FONT_KEYS } from "@/lib/siteFonts";
import { getAppSetting, SETTING_AD_RETARGETING_GLOBAL } from "@/lib/settings";

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
  const showMusicNotes = formData.get("showMusicNotes") != null;
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
  // Only the booking/contact recipient lives on the Website form. The address
  // pool and the From / Reply-To / Notify settings are managed on the Fan Email
  // page via saveEmailSettings, so we deliberately don't touch them here.
  const contactEmail = email("contactEmail");
  if (contactEmail && typeof contactEmail === "object") {
    return { ok: false, error: "Contact email is not a valid email address." };
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
    showMusicNotes,
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

// Managed on the Fan Email page: the address pool plus the From / Reply-To /
// Notify settings. Kept separate from saveArtistSite so saving one never blanks
// the other.
export async function saveEmailSettings(input: {
  availableEmails: string[];
  notifyEmail: string | null;
  mailFromEmail: string | null;
  mailReplyTo: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const norm = (v: string | null): string | null | { invalid: string } => {
    if (!v) return null;
    const t = v.trim();
    if (!re.test(t)) return { invalid: t };
    return t.toLowerCase();
  };
  const notifyEmail = norm(input.notifyEmail);
  const mailFromEmail = norm(input.mailFromEmail);
  const mailReplyTo = norm(input.mailReplyTo);
  for (const [label, val] of [
    ["Notify email", notifyEmail],
    ["Mailing from", mailFromEmail],
    ["Reply-to", mailReplyTo],
  ] as const) {
    if (val && typeof val === "object") {
      return { ok: false, error: `${label} is not a valid email address.` };
    }
  }

  const availableEmails = Array.from(
    new Set(input.availableEmails.map((e) => e.trim().toLowerCase()).filter((e) => re.test(e)))
  );

  const site = await prisma.artistSite.findUnique({ where: { userId }, select: { id: true } });
  if (!site) return { ok: false, error: "Create your website first." };

  await prisma.artistSite.update({
    where: { userId },
    data: {
      availableEmails,
      notifyEmail: notifyEmail as string | null,
      mailFromEmail: mailFromEmail as string | null,
      mailReplyTo: mailReplyTo as string | null,
    },
  });

  revalidatePath("/email");
  revalidatePath("/website");
  revalidatePath("/settings");
  return { ok: true };
}

// Artist opts their fan list in/out of social ad retargeting (Meta Custom
// Audience). Still gated by the global admin master switch at send time.
export async function setAdRetargeting(enabled: boolean): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const site = await prisma.artistSite.findUnique({ where: { userId }, select: { id: true } });
  if (!site) return { ok: false, error: "Create your website first." };
  // Enforce the global master switch server-side too: an artist can't enable
  // their toggle while the platform-wide switch is off (belt-and-suspenders with
  // the disabled UI). Turning OFF is always allowed.
  if (enabled) {
    const global = await getAppSetting(SETTING_AD_RETARGETING_GLOBAL, "off");
    if (global !== "on") return { ok: false, error: "Ad retargeting is turned off platform-wide." };
  }
  await prisma.artistSite.update({ where: { userId }, data: { adRetargetingEnabled: enabled } });
  revalidatePath("/email");
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

// Broadcast a message to all of this artist's subscribers. The From must be one
// of the artist's own saved addresses; replies come back to it.
export async function emailMyList(
  from: string,
  subject: string,
  message: string,
  recipients: string[]
): Promise<{ ok: boolean; error?: string; sent?: number }> {
  const userId = await requireUserId();
  const fromAddr = from.trim().toLowerCase();
  const cleanSubject = subject.trim();
  const cleanMessage = message.trim();
  if (!cleanSubject || !cleanMessage) return { ok: false, error: "Add a subject and a message." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromAddr)) return { ok: false, error: "Choose a valid From address." };

  const site = await prisma.artistSite.findUnique({
    where: { userId },
    select: { slug: true, availableEmails: true, displayName: true, adRetargetingEnabled: true },
  });
  const allowed = new Set((site?.availableEmails ?? []).map((e) => e.trim().toLowerCase()));
  if (!allowed.has(fromAddr)) return { ok: false, error: "That From address isn't in your saved list." };

  // Only the selected recipients that are still subscribed. Unsubscribed people
  // are excluded here regardless of what the client sent.
  const wanted = new Set(recipients.map((e) => e.trim().toLowerCase()));
  const subs = await prisma.mailingSubscriber.findMany({
    where: { OR: [{ userId }, ...(site ? [{ site: site.slug }] : [])], unsubscribed: false, deleted: false },
    select: { id: true, email: true, unsubToken: true },
  });
  const seen = new Set<string>();
  const targets = subs.filter((s) => {
    const e = s.email.toLowerCase();
    if (!wanted.has(e) || seen.has(e)) return false;
    seen.add(e);
    return true;
  });
  if (targets.length === 0) return { ok: false, error: "No eligible recipients selected." };
  if (targets.length > 2000) return { ok: false, error: "Too many recipients for one send." };

  // Give every recipient a one-click unsubscribe token.
  const { randomUUID } = await import("node:crypto");
  await Promise.all(
    targets.map(async (t) => {
      if (!t.unsubToken) {
        t.unsubToken = randomUUID();
        await prisma.mailingSubscriber.update({ where: { id: t.id }, data: { unsubToken: t.unsubToken } });
      }
    })
  );

  const base = process.env.APP_URL || "https://artistops.net";
  const who = site?.displayName || "Your artist";
  // Only offer the ads-only opt-out when this artist actually runs ad matching,
  // otherwise the link would promise something that isn't happening.
  const adsOn =
    (await getAppSetting(SETTING_AD_RETARGETING_GLOBAL, "off")) === "on" && !!site?.adRetargetingEnabled;
  const esc = (s: string) => s.replace(/[<>&]/g, (c) => (c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;"));
  const fromHeader = `${who} <${fromAddr}>`;
  const bodyHtml = `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;white-space:pre-wrap">${esc(cleanMessage)}</div>`;

  // Batched: 20 in parallel per chunk, chunks sequential.
  let sent = 0;
  for (let i = 0; i < targets.length; i += 20) {
    const chunk = targets.slice(i, i + 20);
    const results = await Promise.all(
      chunk.map((t) => {
        const unsub = `${base}/api/unsubscribe?t=${t.unsubToken}`;
        const adsOut = `${unsub}&ads=1`;
        const html =
          bodyHtml +
          `<hr style="margin:20px 0;border:none;border-top:1px solid #eee">` +
          `<p style="color:#999;font-size:12px">You&rsquo;re receiving this because you joined ${esc(who)}&rsquo;s mailing list. <a href="${unsub}" style="color:#999">Unsubscribe</a>.` +
          (adsOn
            ? ` Prefer to keep the emails but not see our ads on Instagram &amp; Facebook? <a href="${adsOut}" style="color:#999">Opt out of ads</a>.`
            : "") +
          `</p>`;
        // Reply-To = the From address; List-Unsubscribe enables Gmail's native button.
        return sendEmail(t.email, cleanSubject, html, fromAddr, fromHeader, {
          "List-Unsubscribe": `<${unsub}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        }).catch(() => ({ ok: false, skipped: false }));
      })
    );
    sent += results.filter((r) => r.ok || (r as { skipped?: boolean }).skipped).length;
  }
  return { ok: true, sent };
}

// ---- Saved recipient lists (segments) ----------------------------------------

export async function getMailingLists() {
  const userId = await requireUserId();
  return prisma.mailingList.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, emails: true, updatedAt: true },
  });
}

// Save (or overwrite by name) a named selection of subscriber emails.
export async function saveMailingList(name: string, emails: string[]): Promise<{ ok: boolean; error?: string; id?: string }> {
  const userId = await requireUserId();
  const clean = name.trim();
  if (!clean) return { ok: false, error: "Give the list a name." };
  const list = Array.from(new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean)));
  const rec = await prisma.mailingList.upsert({
    where: { userId_name: { userId, name: clean } },
    create: { userId, name: clean, emails: list },
    update: { emails: list },
  });
  revalidatePath("/website");
  return { ok: true, id: rec.id };
}

export async function deleteMailingList(id: string): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  await prisma.mailingList.deleteMany({ where: { id, userId } });
  revalidatePath("/website");
  return { ok: true };
}

// Manually add a subscriber. Marked source "manual". Respects a prior opt-out:
// re-adding an unsubscribed address does NOT resubscribe them.
export async function addSubscriber(email: string, name?: string): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return { ok: false, error: "Enter a valid email address." };
  const site = await prisma.artistSite.findUnique({ where: { userId }, select: { slug: true } });
  const slug = site?.slug;
  if (!slug) return { ok: false, error: "Set up your website first." };
  await prisma.mailingSubscriber.upsert({
    where: { site_email: { site: slug, email: e } },
    create: { site: slug, email: e, name: name?.trim() || null, source: "manual", userId },
    update: { ...(name?.trim() ? { name: name.trim() } : {}) },
  });
  revalidatePath("/website");
  return { ok: true };
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
    select: { id: true, title: true, gate: true, streamLinks: true, linksMode: true },
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
  const allowed = ["spotify", "apple", "amazon", "bandcamp", "youtube", "soundcloud"];
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

// Pull the artist's Smart Link platform URLs onto every website track that's
// linked to a catalog song. Smart Link values win for the platforms they cover;
// hand-typed links for other platforms are kept. Returns how many were updated.
export async function syncStreamLinksFromSmartLinks(): Promise<{ ok: boolean; updated: number }> {
  const userId = await requireUserId();
  const site = await prisma.artistSite.findUnique({ where: { userId }, select: { slug: true } });
  if (!site) return { ok: false, updated: 0 };

  const tracks = await prisma.siteTrack.findMany({
    where: { site: site.slug, songId: { not: null } },
    select: { id: true, songId: true, streamLinks: true },
  });
  if (!tracks.length) return { ok: true, updated: 0 };

  // Newest Smart Link per song.
  const links = await prisma.smartLink.findMany({
    where: { userId, songId: { in: tracks.map((t) => t.songId!) } },
    orderBy: { updatedAt: "desc" },
    select: { songId: true, platforms: true },
  });
  const bySong = new Map<string, unknown>();
  for (const l of links) if (l.songId && !bySong.has(l.songId)) bySong.set(l.songId, l.platforms);

  let updated = 0;
  for (const t of tracks) {
    const derived = mapSmartLinkToStreamLinks(bySong.get(t.songId!));
    if (!Object.keys(derived).length) continue;
    const merged = mergeStreamLinks(t.streamLinks, derived);
    if (JSON.stringify(merged) === JSON.stringify(t.streamLinks ?? {})) continue;
    await prisma.siteTrack.update({ where: { id: t.id }, data: { streamLinks: merged } });
    updated++;
  }
  if (updated) revalidatePath("/website");
  return { ok: true, updated };
}

// When to show a single song's streaming links, overriding the site default.
// "default" = use the site setting; "before" = always; "after" = only once
// unlocked; "off" = never for this song.
export async function setSiteTrackLinksMode(id: string, mode: string) {
  const userId = await requireUserId();
  if (!["default", "before", "after", "off"].includes(mode)) return;
  const site = await prisma.artistSite.findUnique({ where: { userId }, select: { slug: true } });
  if (!site) return;
  const owned = await prisma.siteTrack.findFirst({ where: { id, site: site.slug }, select: { id: true } });
  if (!owned) return;
  await prisma.siteTrack.update({ where: { id }, data: { linksMode: mode } });
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

// Soft-delete toggle (reversible). Deleted subscribers can't be emailed or added
// to a list; undeleting restores their prior subscription state (green if they
// were subscribed, yellow if they'd unsubscribed).
export async function setSubscriberDeleted(id: string, deleted: boolean) {
  const userId = await requireUserId();
  const site = await prisma.artistSite.findUnique({ where: { userId }, select: { slug: true } });
  await prisma.mailingSubscriber.updateMany({
    where: { id, OR: [{ userId }, ...(site ? [{ site: site.slug }] : [])] },
    data: { deleted, deletedAt: deleted ? new Date() : null },
  });
  revalidatePath("/website");
}

// Admin-only hard delete — permanently removes the record (junk/test cleanup).
export async function purgeSubscriber(id: string): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  if (!me?.isAdmin) return { ok: false, error: "Admins only." };
  await prisma.mailingSubscriber.deleteMany({ where: { id } });
  revalidatePath("/website");
  return { ok: true };
}
