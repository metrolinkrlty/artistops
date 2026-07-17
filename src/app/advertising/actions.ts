"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { supabaseAdmin, IMAGE_BUCKET } from "@/lib/supabaseAdmin";

const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
};

// Upload a campaign flyer/creative image. Returns its public URL; the client
// keeps the list and submits it with the campaign (creativeAssets field).
export async function uploadCampaignFlyer(formData: FormData): Promise<{ ok: boolean; url?: string; error?: string }> {
  const userId = await requireUserId();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image to upload." };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { ok: false, error: "Flyer must be under 8 MB." };
  }
  const ext = IMAGE_EXT[file.type];
  if (!ext) {
    return { ok: false, error: "Use a JPG, PNG, WebP, or GIF image." };
  }

  await supabaseAdmin.storage.createBucket(IMAGE_BUCKET, { public: true }).catch(() => {});
  const path = `campaigns/${userId}/flyer-${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: upErr } = await supabaseAdmin.storage
    .from(IMAGE_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (upErr) return { ok: false, error: "Upload failed. Try again." };

  const { data } = supabaseAdmin.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

export async function getAdCampaigns() {
  const userId = await requireUserId();
  return prisma.adCampaign.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { song: { select: { id: true, title: true } } },
  });
}

export async function getSongOptions() {
  const userId = await requireUserId();
  return prisma.song.findMany({ where: { userId }, select: { id: true, title: true }, orderBy: { title: "asc" } });
}

const num = (v: FormDataEntryValue | null) => (v && String(v).trim() !== "" ? Number(v) : null);

function parse(formData: FormData) {
  const start = String(formData.get("startDate") || "");
  const end = String(formData.get("endDate") || "");
  const impressions = num(formData.get("impressions"));
  const clicks = num(formData.get("clicks"));
  const ctr = impressions && clicks ? Number(((clicks / impressions) * 100).toFixed(2)) : null;
  // Flyer/creative image URLs, sent as a comma-separated hidden field.
  const creativeAssets = String(formData.get("creativeAssets") || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  return {
    name: String(formData.get("name") || "").trim(),
    platform: String(formData.get("platform") || "Meta"),
    objective: String(formData.get("objective") || "").trim() || null,
    songId: String(formData.get("songId") || "") || null,
    budget: num(formData.get("budget")),
    startDate: start ? new Date(start) : null,
    endDate: end ? new Date(end) : null,
    targetAudience: String(formData.get("targetAudience") || "").trim() || null,
    creativeAssets,
    status: String(formData.get("status") || "DRAFT") as never,
    impressions,
    clicks,
    ctr,
    conversions: num(formData.get("conversions")),
    revenueAttributed: num(formData.get("revenueAttributed")),
  };
}

export async function createAdCampaign(formData: FormData) {
  const userId = await requireUserId();
  const data = parse(formData);
  if (!data.name) return;
  await prisma.adCampaign.create({ data: { ...data, userId } });
  revalidatePath("/advertising");
}

export async function updateAdCampaign(id: string, formData: FormData) {
  const userId = await requireUserId();
  const data = parse(formData);
  if (!data.name) return;
  await prisma.adCampaign.updateMany({ where: { id, userId }, data });
  revalidatePath("/advertising");
}

export async function deleteAdCampaign(id: string) {
  const userId = await requireUserId();
  await prisma.adCampaign.deleteMany({ where: { id, userId } });
  revalidatePath("/advertising");
}
