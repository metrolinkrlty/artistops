"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getRevenueData() {
  const [rows, songs, streamAgg, campaigns] = await Promise.all([
    prisma.revenue.findMany({
      orderBy: { period: "desc" },
      include: { song: { select: { title: true } } },
    }),
    prisma.song.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    prisma.streamPlay.aggregate({ _sum: { plays: true } }),
    prisma.adCampaign.findMany({
      where: { revenueAttributed: { not: null } },
      select: { name: true, revenueAttributed: true, impressions: true },
      orderBy: { revenueAttributed: "desc" },
    }),
  ]);
  return {
    rows: rows.map((r) => ({
      id: r.id,
      songTitle: r.song?.title ?? null,
      platform: r.platform,
      revenueType: r.revenueType,
      amount: r.amount,
      period: r.period.toISOString(),
    })),
    songs,
    totalStreams: streamAgg._sum.plays ?? 0,
    campaigns: campaigns.map((c) => ({ campaign: c.name, revenue: c.revenueAttributed ?? 0 })),
  };
}

const REVENUE_TYPES = [
  "STREAMING", "PRO_ROYALTY", "MECHANICAL", "SOUND_EXCHANGE",
  "SYNC_LICENSE", "YOUTUBE_CONTENT_ID", "TIKTOK", "OTHER",
];

export async function createRevenue(formData: FormData) {
  const period = String(formData.get("period") || "");
  const rt = String(formData.get("revenueType") || "STREAMING");
  await prisma.revenue.create({
    data: {
      songId: String(formData.get("songId") || "") || null,
      platform: String(formData.get("platform") || "").trim() || "Spotify",
      revenueType: (REVENUE_TYPES.includes(rt) ? rt : "OTHER") as never,
      amount: Number(formData.get("amount") || 0),
      currency: "USD",
      period: period ? new Date(period) : new Date(),
    },
  });
  revalidatePath("/revenue");
}

export async function deleteRevenue(id: string) {
  await prisma.revenue.delete({ where: { id } });
  revalidatePath("/revenue");
}
