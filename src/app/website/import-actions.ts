"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { supabaseAdmin, IMAGE_BUCKET } from "@/lib/supabaseAdmin";
import { assertSafeUrl, fetchCapped, cleanHtmlForModel, decodeHtml } from "@/lib/webImport";
import type { SocialLinks } from "./actions";

const MODEL = "claude-opus-4-8";
const SOCIAL_KEYS: (keyof SocialLinks)[] = [
  "spotify", "appleMusic", "youtube", "instagram", "facebook", "tiktok", "bandcamp", "website",
];
const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
};
const MAX_GALLERY = 8;

function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

type Extracted = {
  displayName: string;
  tagline: string;
  location: string;
  bio: string;
  themeColor: string;
  socialLinks: Partial<Record<keyof SocialLinks, string>>;
  heroImageUrl: string;
  galleryImageUrls: string[];
};

const EXTRACT_TOOL: Anthropic.Tool = {
  name: "extracted_site",
  description: "Return the artist profile information extracted from the website HTML.",
  input_schema: {
    type: "object",
    properties: {
      displayName: { type: "string", description: "The artist or band name. Empty string if unclear." },
      tagline: { type: "string", description: "Short genre/vibe line. Empty if none." },
      location: { type: "string", description: "Home base / city. Empty if none." },
      bio: { type: "string", description: "The artist's about/bio text. Preserve paragraphs separated by a blank line. Empty if none." },
      themeColor: { type: "string", description: "A 6-digit hex accent color that fits the site's brand/vibe, e.g. '#e0a530'. Empty if unsure." },
      socialLinks: {
        type: "object",
        description: "Absolute URLs to the artist's profiles, only for platforms actually linked on the page.",
        properties: Object.fromEntries(SOCIAL_KEYS.map((k) => [k, { type: "string" }])),
        additionalProperties: false,
      },
      heroImageUrl: { type: "string", description: "Absolute URL of the single best large hero/banner/header photo of the artist. Empty if none." },
      galleryImageUrls: { type: "array", items: { type: "string" }, description: "Absolute URLs of up to 8 additional photos of the artist (not logos/icons/sponsor images)." },
    },
    required: ["displayName", "tagline", "location", "bio", "themeColor", "socialLinks", "heroImageUrl", "galleryImageUrls"],
    additionalProperties: false,
  },
};

async function importOneImage(rawUrl: string, slug: string, kind: string): Promise<string | null> {
  try {
    const safe = await assertSafeUrl(rawUrl);
    const { contentType, bytes } = await fetchCapped(safe.toString(), {
      maxBytes: 8 * 1024 * 1024,
      timeoutMs: 10000,
      accept: "image/*",
    });
    const ext = IMAGE_EXT[contentType.split(";")[0].trim().toLowerCase()];
    if (!ext || bytes.byteLength < 2048) return null; // not a real image
    const rand = Math.random().toString(36).slice(2, 7);
    const path = `sites/${slug}/imported-${kind}-${Date.now()}-${rand}.${ext}`;
    const { error } = await supabaseAdmin.storage.from(IMAGE_BUCKET).upload(path, bytes, {
      contentType,
      upsert: true,
    });
    if (error) return null;
    return supabaseAdmin.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

export async function importFromWebsite(
  rawUrl: string
): Promise<{ ok: boolean; error?: string; slug?: string; summary?: string[] }> {
  const userId = await requireUserId();
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "Import isn't configured yet (missing ANTHROPIC_API_KEY)." };
  }

  let url: URL;
  try {
    url = await assertSafeUrl(rawUrl);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid URL." };
  }

  // 1. Fetch + clean the page.
  let html: string;
  try {
    const { bytes } = await fetchCapped(url.toString(), {
      maxBytes: 3 * 1024 * 1024,
      timeoutMs: 12000,
      accept: "text/html",
    });
    html = cleanHtmlForModel(decodeHtml(bytes));
  } catch {
    return { ok: false, error: "Couldn't load that website. Check the URL and try again." };
  }
  if (html.length < 200) {
    return { ok: false, error: "That page didn't have enough content to import." };
  }

  // 2. Extract with Claude.
  let data: Extracted;
  try {
    const anthropic = new Anthropic();
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2500,
      system:
        "You extract an artist's profile from their website's HTML so it can seed a new site. " +
        "Only use information present on the page — never invent facts. Return absolute image URLs " +
        "(resolve any relative paths against the base URL given). Choose real photos of the artist for " +
        "hero/gallery, not logos, icons, or sponsor images.",
      tools: [EXTRACT_TOOL],
      tool_choice: { type: "tool", name: "extracted_site" },
      messages: [{ role: "user", content: `Base URL: ${url.toString()}\n\nHTML:\n${html}` }],
    });
    const tu = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (!tu) throw new Error("no extraction");
    data = tu.input as Extracted;
  } catch (err) {
    console.error("[import] extraction failed", err);
    return { ok: false, error: "Couldn't read that website. Please try again." };
  }

  // 3. Resolve the slug (existing site keeps its slug; new one derives a unique slug).
  const existing = await prisma.artistSite.findUnique({
    where: { userId },
    select: { slug: true, galleryImages: true },
  });
  let slug = existing?.slug ?? "";
  if (!slug) {
    const base = slugify(data.displayName) || slugify(url.hostname) || "artist";
    slug = base;
    for (let i = 2; i < 60; i++) {
      const owner = await prisma.artistSite.findUnique({ where: { slug }, select: { userId: true } });
      if (!owner || owner.userId === userId) break;
      slug = `${base}-${i}`;
    }
  }

  // 4. Download images into our own storage.
  await supabaseAdmin.storage.createBucket(IMAGE_BUCKET, { public: true }).catch(() => {});
  let heroUrl: string | null = null;
  if (isHttpUrl(data.heroImageUrl)) {
    heroUrl = await importOneImage(data.heroImageUrl, slug, "hero");
  }
  const galleryCandidates = (data.galleryImageUrls || [])
    .filter(isHttpUrl)
    .filter((u) => u !== data.heroImageUrl)
    .slice(0, MAX_GALLERY);
  const galleryUrls: string[] = [];
  for (const g of galleryCandidates) {
    const up = await importOneImage(g, slug, "gallery");
    if (up) galleryUrls.push(up);
  }

  // 5. Build the config from what we found.
  const summary: string[] = [];
  const fields: Record<string, unknown> = {};
  const name = data.displayName?.trim() || url.hostname.replace(/^www\./, "");
  fields.displayName = name;
  if (data.tagline?.trim()) { fields.tagline = data.tagline.trim(); summary.push("tagline"); }
  if (data.location?.trim()) { fields.location = data.location.trim(); summary.push("location"); }
  if (data.bio?.trim()) { fields.bio = data.bio.trim(); summary.push("bio"); }
  if (/^#[0-9a-fA-F]{6}$/.test(data.themeColor || "")) { fields.themeColor = data.themeColor.toLowerCase(); summary.push("accent color"); }

  const social: SocialLinks = {};
  for (const key of SOCIAL_KEYS) {
    const v = data.socialLinks?.[key];
    if (v && isHttpUrl(v)) {
      // Skip bare domain roots (e.g. "https://open.spotify.com") — only keep
      // links that actually point to a profile.
      try {
        const pu = new URL(v);
        if (pu.pathname && pu.pathname !== "/") social[key] = v;
      } catch {
        /* skip */
      }
    }
  }
  if (Object.keys(social).length) { fields.socialLinks = social; summary.push(`${Object.keys(social).length} links`); }
  if (heroUrl) { fields.heroImageUrl = heroUrl; summary.push("hero photo"); }
  const mergedGallery = Array.from(new Set([...(existing?.galleryImages ?? []), ...galleryUrls]));
  if (galleryUrls.length) { fields.galleryImages = mergedGallery; summary.push(`${galleryUrls.length} gallery photos`); }

  // 6. Persist (create the site if new, else pre-fill).
  try {
    await prisma.artistSite.upsert({
      where: { userId },
      create: { userId, slug, hiddenSections: [], ...fields, displayName: name },
      update: fields,
    });
  } catch (err) {
    console.error("[import] save failed", err);
    return { ok: false, error: "Imported the content but couldn't save it. Try again." };
  }

  revalidatePath("/website");
  return { ok: true, slug, summary: summary.length ? summary : ["basic details"] };
}
