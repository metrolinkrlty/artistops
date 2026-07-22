"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { supabaseAdmin, AUDIO_BUCKET } from "@/lib/supabaseAdmin";
import { RIGHTS_DOC_TYPES } from "./doc-types";

type Split = { name: string; percentage: number };

export async function getRightsData() {
  const userId = await requireUserId();
  const [songs, copyrights, docs] = await Promise.all([
    prisma.song.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.copyright.findMany({ where: { userId } }),
    prisma.rightsDocument.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
  ]);
  const titleById = new Map(songs.map((s) => [s.id, s.title]));

  const songRights = songs.map((s) => {
    // Find the copyright record that covers this song (individual or group)
    const cr = copyrights.find((c) => c.songIds.includes(s.id));
    // splits should be an array of { name, percentage }; tolerate a legacy
    // object form ({ "Name": 100 }) or null without crashing the page.
    const raw = s.splits as unknown;
    const splitArr: Split[] = Array.isArray(raw)
      ? (raw as Split[])
      : raw && typeof raw === "object"
        ? Object.entries(raw as Record<string, unknown>).map(([name, percentage]) => ({ name, percentage: Number(percentage) }))
        : [];
    const splits = splitArr.map((sp) => ({ name: sp.name, pct: sp.percentage }));
    return {
      id: s.id,
      title: s.title,
      isrc: s.isrc,
      writers: splits.map((sp) => `${sp.name} (${sp.pct}%)`),
      publishers: s.publishers,
      masterOwner: s.artist,
      pro: cr?.proName ?? null,
      mlc: !!cr?.registeredWithMLC,
      soundExchange: !!cr?.registeredWithSX,
      syncAvailable: !!(cr?.registeredWithPRO && cr?.registeredWithMLC),
      splits,
    };
  });

  const now = Date.now();
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;
  const documents = docs.map((doc) => {
    let status: "active" | "expiring" = "active";
    if (doc.expiresAt) {
      const diff = doc.expiresAt.getTime() - now;
      if (diff < ninetyDays) status = "expiring";
    }
    return {
      id: doc.id,
      songId: doc.songId,
      songTitle: titleById.get(doc.songId) ?? "—",
      type: doc.type,
      title: doc.title,
      parties: doc.parties,
      expiresAt: doc.expiresAt ? doc.expiresAt.toISOString().slice(0, 10) : null,
      notes: doc.notes,
      fileUrl: doc.fileUrl,
      status,
    };
  });

  return { songRights, documents };
}

// ---------- Document files ----------
// Stored in the private audio bucket under a rights/ prefix, so contracts are
// only ever reachable through a short-lived signed URL — never public.

export async function createRightsDocUploadUrl(fileName: string) {
  const userId = await requireUserId();
  const safe = fileName.replace(/[^\w.\-]+/g, "_").slice(-80);
  const path = `${userId}/rights/${crypto.randomUUID()}-${safe}`;
  const { data, error } = await supabaseAdmin.storage.from(AUDIO_BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error(error?.message || "Could not create upload URL");
  return { path, token: data.token };
}

export async function getRightsDocUrl(path: string): Promise<string | null> {
  const userId = await requireUserId();
  if (!path.startsWith(`${userId}/`)) return null; // only your own files
  const { data } = await supabaseAdmin.storage.from(AUDIO_BUCKET).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

// ---------- Document CRUD ----------

export type RightsDocInput = {
  songId: string;
  type: string;
  title: string;
  parties: string[];
  expiresAt: string | null;
  notes: string | null;
  fileUrl: string | null;
};

function normalize(input: RightsDocInput) {
  const type = (RIGHTS_DOC_TYPES as readonly string[]).includes(input.type) ? input.type : "license";
  return {
    songId: input.songId,
    type,
    title: input.title.trim().slice(0, 200),
    parties: (input.parties || []).map((p) => p.trim()).filter(Boolean).slice(0, 20),
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    notes: input.notes?.trim() || null,
    fileUrl: input.fileUrl || null,
  };
}

async function assertOwnedSong(userId: string, songId: string) {
  return prisma.song.findFirst({ where: { id: songId, userId }, select: { id: true } });
}

export async function createRightsDocument(input: RightsDocInput): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  if (!input.title?.trim()) return { ok: false, error: "Give the document a title." };
  if (!input.songId) return { ok: false, error: "Pick which song this covers." };
  if (!(await assertOwnedSong(userId, input.songId))) return { ok: false, error: "Song not found." };

  await prisma.rightsDocument.create({ data: { userId, ...normalize(input) } });
  revalidatePath("/rights");
  return { ok: true };
}

export async function updateRightsDocument(id: string, input: RightsDocInput): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  if (!input.title?.trim()) return { ok: false, error: "Give the document a title." };
  const existing = await prisma.rightsDocument.findFirst({ where: { id, userId }, select: { id: true, fileUrl: true } });
  if (!existing) return { ok: false, error: "Document not found." };
  if (input.songId && !(await assertOwnedSong(userId, input.songId))) return { ok: false, error: "Song not found." };

  const data = normalize(input);
  // Replacing the file? Drop the old object so storage doesn't accumulate orphans.
  if (existing.fileUrl && existing.fileUrl !== data.fileUrl && existing.fileUrl.startsWith(`${userId}/`)) {
    try { await supabaseAdmin.storage.from(AUDIO_BUCKET).remove([existing.fileUrl]); } catch { /* best-effort */ }
  }
  await prisma.rightsDocument.update({ where: { id }, data });
  revalidatePath("/rights");
  return { ok: true };
}

export async function deleteRightsDocument(id: string): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const doc = await prisma.rightsDocument.findFirst({ where: { id, userId }, select: { id: true, fileUrl: true } });
  if (!doc) return { ok: false, error: "Document not found." };
  if (doc.fileUrl && doc.fileUrl.startsWith(`${userId}/`)) {
    try { await supabaseAdmin.storage.from(AUDIO_BUCKET).remove([doc.fileUrl]); } catch { /* best-effort */ }
  }
  await prisma.rightsDocument.delete({ where: { id } });
  revalidatePath("/rights");
  return { ok: true };
}
