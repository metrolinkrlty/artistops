"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getInsights() {
  const userId = await requireUserId();
  const insights = await prisma.aIInsight.findMany({
    where: { userId, dismissed: false },
    orderBy: { createdAt: "desc" },
  });
  return insights.map((i) => ({
    id: i.id,
    category: i.category,
    title: i.title,
    body: i.body,
    confidence: i.confidence ?? 0.8,
    actionable: i.actionable,
    createdAt: i.createdAt.toISOString(),
  }));
}

export async function dismissInsight(id: string) {
  const userId = await requireUserId();
  await prisma.aIInsight.updateMany({ where: { id, userId }, data: { dismissed: true } });
  revalidatePath("/ai-insights");
}
