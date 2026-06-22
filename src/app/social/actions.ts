"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSocialPosts() {
  return prisma.socialPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { song: { select: { id: true, title: true } } },
  });
}

export async function getSongOptions() {
  return prisma.song.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } });
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
  await prisma.socialPost.create({ data: parse(formData) });
  revalidatePath("/social");
}

export async function updateSocialPost(id: string, formData: FormData) {
  await prisma.socialPost.update({ where: { id }, data: parse(formData) });
  revalidatePath("/social");
}

export async function deleteSocialPost(id: string) {
  await prisma.socialPost.delete({ where: { id } });
  revalidatePath("/social");
}
