"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getSocialPosts() {
  const userId = await requireUserId();
  return prisma.socialPost.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { song: { select: { id: true, title: true } } },
  });
}

export async function getSongOptions() {
  const userId = await requireUserId();
  return prisma.song.findMany({ where: { userId }, select: { id: true, title: true }, orderBy: { title: "asc" } });
}

function parse(formData: FormData) {
  const scheduled = String(formData.get("scheduledAt") || "");
  const posted = String(formData.get("postedAt") || "");
  return {
    songId: String(formData.get("songId") || "") || null,
    platform: String(formData.get("platform") || "Instagram"),
    status: String(formData.get("status") || "IDEA") as never,
    caption: String(formData.get("caption") || "").trim() || null,
    campaign: String(formData.get("campaign") || "").trim() || null,
    hashtags: String(formData.get("hashtags") || "")
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean),
    scheduledAt: scheduled ? new Date(scheduled) : null,
    postedAt: posted ? new Date(posted) : null,
  };
}

export async function createSocialPost(formData: FormData) {
  const userId = await requireUserId();
  await prisma.socialPost.create({ data: { ...parse(formData), userId } });
  revalidatePath("/social");
}

export async function updateSocialPost(id: string, formData: FormData) {
  const userId = await requireUserId();
  await prisma.socialPost.updateMany({ where: { id, userId }, data: parse(formData) });
  revalidatePath("/social");
}

export async function deleteSocialPost(id: string) {
  const userId = await requireUserId();
  await prisma.socialPost.deleteMany({ where: { id, userId } });
  revalidatePath("/social");
}
