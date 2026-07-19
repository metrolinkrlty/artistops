"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { supabaseAdmin, AUDIO_BUCKET } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { mapSmartLinkToStreamLinks } from "@/lib/streamLinks";

// The platforms a song's Smart Link can carry, entered right on the Song.
// key = internal, name = the Smart Link display name (kept in sync with the
// /smart-links platform names + the website chip mapper).
export const SONG_PLATFORMS: { key: string; name: string }[] = [
  { key: "spotify", name: "Spotify" },
  { key: "apple", name: "Apple Music" },
  { key: "youtube", name: "YouTube Music" },
  { key: "amazon", name: "Amazon Music" },
  { key: "soundcloud", name: "SoundCloud" },
  { key: "bandcamp", name: "Bandcamp" },
];

// Mint a pre-signed upload URL scoped to the current user's folder. The browser
// pushes the file bytes directly to Supabase Storage using this URL.
export async function createAudioUploadUrl(fileName: string) {
  const userId = await requireUserId();
  const safe = fileName.replace(/[^\w.\-]+/g, "_").slice(-80);
  const path = `${userId}/${crypto.randomUUID()}-${safe}`;
  const { data, error } = await supabaseAdmin.storage.from(AUDIO_BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error(error?.message || "Could not create upload URL");
  return { path, token: data.token };
}

// Short-lived signed URL for playback/download of a stored object.
export async function getAudioUrl(path: string): Promise<string | null> {
  const userId = await requireUserId();
  if (!path.startsWith(`${userId}/`)) return null; // only your own files
  const { data } = await supabaseAdmin.storage.from(AUDIO_BUCKET).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

// The catalog song ids already featured on the artist's website (for the ✓ badge).
export async function getFeaturedSongIds(): Promise<string[]> {
  const userId = await requireUserId();
  const site = await prisma.artistSite.findUnique({ where: { userId }, select: { slug: true } });
  if (!site) return [];
  const tracks = await prisma.siteTrack.findMany({
    where: { site: site.slug, songId: { not: null } },
    select: { songId: true },
  });
  return tracks.map((t) => t.songId!).filter(Boolean);
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "track";
}

// The catalog song ids that have a Smart Link (for the 🔗 badge).
export async function getSongSmartLinkIds(): Promise<string[]> {
  const userId = await requireUserId();
  const links = await prisma.smartLink.findMany({ where: { userId, songId: { not: null } }, select: { songId: true } });
  return [...new Set(links.map((l) => l.songId!))];
}

// A song's current platform URLs (from its Smart Link), keyed for the editor.
export async function getSongSmartLink(songId: string): Promise<Record<string, string>> {
  const userId = await requireUserId();
  const sl = await prisma.smartLink.findFirst({ where: { userId, songId }, orderBy: { updatedAt: "desc" }, select: { platforms: true } });
  const out: Record<string, string> = {};
  if (sl && Array.isArray(sl.platforms)) {
    for (const p of sl.platforms as { name?: string; url?: string }[]) {
      const key = SONG_PLATFORMS.find((sp) => sp.name.toLowerCase() === String(p?.name || "").trim().toLowerCase())?.key;
      if (key && p?.url) out[key] = String(p.url);
    }
  }
  return out;
}

// Save a song's platform URLs onto its Smart Link (creating one if needed) and
// push them to any website track featuring the song. The Song is the source of
// truth here, so the website chips are SET from these links (not merged).
export async function upsertSongSmartLink(songId: string, links: Record<string, string>): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const song = await prisma.song.findFirst({ where: { id: songId, userId }, select: { id: true, title: true, artist: true } });
  if (!song) return { ok: false, error: "Song not found." };

  const platforms = SONG_PLATFORMS
    .map((sp, i) => ({ name: sp.name, url: String(links?.[sp.key] || "").trim(), priority: i + 1 }))
    .filter((p) => /^https?:\/\/\S+$/i.test(p.url));

  const existing = await prisma.smartLink.findFirst({ where: { userId, songId }, orderBy: { updatedAt: "desc" }, select: { id: true } });
  if (existing) {
    await prisma.smartLink.update({ where: { id: existing.id }, data: { platforms: platforms as never } });
  } else if (platforms.length) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { artistName: true } });
    let slug = slugify(song.title);
    if (await prisma.smartLink.findUnique({ where: { slug } })) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    await prisma.smartLink.create({
      data: { userId, songId, slug, title: song.title, artistName: user?.artistName || song.artist || "Artist", platforms: platforms as never, isActive: true },
    });
  }

  // Website chips: the song is authoritative, so set them from these links.
  const derived = mapSmartLinkToStreamLinks(platforms);
  const tracks = await prisma.siteTrack.findMany({ where: { songId }, select: { id: true } });
  for (const t of tracks) {
    await prisma.siteTrack.update({ where: { id: t.id }, data: { streamLinks: Object.keys(derived).length ? derived : Prisma.JsonNull } });
  }

  revalidatePath("/songs");
  revalidatePath("/smart-links");
  if (tracks.length) revalidatePath("/website");
  return { ok: true };
}

// Feature a catalog song on the artist's public website. The browser has already
// trimmed + uploaded a short preview clip (previewPath); here we copy the full
// audio to a site-owned object and create the linked SiteTrack.
export async function featureSongOnWebsite(
  songId: string,
  previewPath: string
): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const site = await prisma.artistSite.findUnique({ where: { userId }, select: { slug: true } });
  if (!site) return { ok: false, error: "Set up your website first (Website tab), then feature songs on it." };

  const song = await prisma.song.findFirst({ where: { id: songId, userId }, select: { id: true, title: true, audioFileRef: true } });
  if (!song) return { ok: false, error: "Song not found." };
  if (!song.audioFileRef) return { ok: false, error: "Upload audio for this song first, then feature it." };
  if (!previewPath.startsWith(`${userId}/`)) return { ok: false, error: "Invalid preview." };

  const existing = await prisma.siteTrack.findFirst({ where: { site: site.slug, songId }, select: { id: true } });
  if (existing) return { ok: false, error: "This song is already on your website." };

  // Unique trackId (slug) within this site.
  const base = slugify(song.title);
  const taken = new Set((await prisma.siteTrack.findMany({ where: { site: site.slug }, select: { trackId: true } })).map((t) => t.trackId));
  let trackId = base;
  for (let n = 2; taken.has(trackId); n++) trackId = `${base}-${n}`;

  // Give the site its own copy of the full audio so deleting the catalog song
  // (which removes its file) never breaks the website track.
  const ext = (song.audioFileRef.split(".").pop() || "mp3").toLowerCase().replace(/[^a-z0-9]/g, "") || "mp3";
  const fullPath = `${userId}/site-${trackId}-${crypto.randomUUID()}.${ext}`;
  const { error: copyErr } = await supabaseAdmin.storage.from(AUDIO_BUCKET).copy(song.audioFileRef, fullPath);
  if (copyErr) return { ok: false, error: "Could not copy the audio. Try again." };

  // Pre-fill the "Full song on …" links from this song's Smart Link, if any.
  const smartLink = await prisma.smartLink.findFirst({
    where: { userId, songId },
    orderBy: { updatedAt: "desc" },
    select: { platforms: true },
  });
  const streamLinks = mapSmartLinkToStreamLinks(smartLink?.platforms);

  const maxOrder = await prisma.siteTrack.aggregate({ where: { site: site.slug }, _max: { order: true } });
  await prisma.siteTrack.create({
    data: {
      userId,
      site: site.slug,
      songId,
      trackId,
      title: song.title,
      order: (maxOrder._max.order ?? -1) + 1,
      gate: "email",
      previewPath,
      fullPath,
      ...(Object.keys(streamLinks).length ? { streamLinks } : {}),
    },
  });

  revalidatePath("/songs");
  revalidatePath("/website");
  return { ok: true };
}

export type SongStatus =
  | "DEMO"
  | "MIXED"
  | "MASTERED"
  | "RELEASED"
  | "REGISTERED"
  | "MONETIZED";

export async function getSongs() {
  const userId = await requireUserId();
  const [songs, copyrights] = await Promise.all([
    prisma.song.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.copyright.findMany({ where: { userId }, select: { songIds: true, registeredWithPRO: true, registeredWithMLC: true, registeredWithSX: true } }),
  ]);
  return songs.map((s) => {
    const cr = copyrights.find((c) => c.songIds.includes(s.id));
    return { ...s, copyrights: cr ? [cr] : [] };
  });
}

function parseForm(formData: FormData) {
  const writers = String(formData.get("writers") || "")
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean);
  const publishers = String(formData.get("publishers") || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const bpmRaw = formData.get("bpm");
  const releaseRaw = String(formData.get("releaseDate") || "");

  return {
    title: String(formData.get("title") || "").trim(),
    artist: String(formData.get("artist") || "").trim(),
    writers,
    publishers,
    splits: writers.length
      ? writers.map((name, i) => ({
          name,
          percentage: Math.round(100 / writers.length) + (i === 0 ? 100 - Math.round(100 / writers.length) * writers.length : 0),
        }))
      : [],
    isrc: String(formData.get("isrc") || "").trim() || null,
    upc: String(formData.get("upc") || "").trim() || null,
    releaseDate: releaseRaw ? new Date(releaseRaw) : null,
    genre: String(formData.get("genre") || "").trim() || null,
    subgenre: String(formData.get("subgenre") || "").trim() || null,
    bpm: bpmRaw ? Number(bpmRaw) : null,
    key: String(formData.get("key") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
    collectionTitle: String(formData.get("collectionTitle") || "").trim() || null,
    status: (String(formData.get("status") || "DEMO") as SongStatus),
    audioFileRef: String(formData.get("audioFileRef") || "").trim() || null,
    metadataFile: String(formData.get("metadataFile") || "").trim() || null,
    masterFileUrl: String(formData.get("masterFileUrl") || "").trim() || null,
  };
}

export async function createSong(formData: FormData) {
  const userId = await requireUserId();
  const data = parseForm(formData);
  if (!data.title || !data.artist) return { id: null };
  const song = await prisma.song.create({ data: { ...data, userId } });
  revalidatePath("/songs");
  return { id: song.id };
}

export async function updateSong(id: string, formData: FormData) {
  const userId = await requireUserId();
  const data = parseForm(formData);
  if (!data.title || !data.artist) return;
  await prisma.song.updateMany({ where: { id, userId }, data });
  revalidatePath("/songs");
}

export async function deleteSong(id: string) {
  const userId = await requireUserId();
  // verify ownership first
  const song = await prisma.song.findFirst({ where: { id, userId } });
  if (!song) return;
  // remove the stored audio object, if any
  if (song.audioFileRef) {
    await supabaseAdmin.storage.from(AUDIO_BUCKET).remove([song.audioFileRef]).catch(() => {});
  }
  // remove dependent rows first to satisfy FK constraints
  // Only delete copyrights that solely cover this song; group copyrights covering other songs are kept
  const soloCoprights = await prisma.copyright.findMany({ where: { userId, songIds: { equals: [id] } } });
  if (soloCoprights.length) await prisma.copyright.deleteMany({ where: { id: { in: soloCoprights.map(c => c.id) } } });
  await prisma.distribution.deleteMany({ where: { songId: id } });
  await prisma.revenue.deleteMany({ where: { songId: id } });
  await prisma.streamPlay.deleteMany({ where: { songId: id } });
  await prisma.socialPost.deleteMany({ where: { songId: id } });
  await prisma.adCampaign.deleteMany({ where: { songId: id } });
  await prisma.pixelEvent.deleteMany({ where: { songId: id } });
  await prisma.song.delete({ where: { id } });
  revalidatePath("/songs");
}
