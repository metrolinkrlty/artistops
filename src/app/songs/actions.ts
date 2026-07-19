"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { supabaseAdmin, AUDIO_BUCKET } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";

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
  if (!data.title || !data.artist) return;
  await prisma.song.create({ data: { ...data, userId } });
  revalidatePath("/songs");
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
