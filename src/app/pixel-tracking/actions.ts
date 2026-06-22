"use server";

import { prisma } from "@/lib/prisma";

export async function getPixelEvents() {
  const events = await prisma.pixelEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { song: { select: { title: true } } },
  });
  return events.map((e) => ({
    id: e.id,
    songTitle: e.song?.title ?? null,
    visitorId: e.visitorId,
    pageUrl: e.pageUrl,
    eventType: e.eventType,
    utmSource: e.utmSource,
    utmCampaign: e.utmCampaign,
    createdAt: e.createdAt.toISOString(),
  }));
}
