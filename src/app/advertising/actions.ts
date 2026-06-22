"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";

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
  return {
    name: String(formData.get("name") || "").trim(),
    platform: String(formData.get("platform") || "Meta"),
    objective: String(formData.get("objective") || "").trim() || null,
    songId: String(formData.get("songId") || "") || null,
    budget: num(formData.get("budget")),
    startDate: start ? new Date(start) : null,
    endDate: end ? new Date(end) : null,
    targetAudience: String(formData.get("targetAudience") || "").trim() || null,
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
