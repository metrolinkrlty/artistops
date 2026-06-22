"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getInsights() {
  const insights = await prisma.aIInsight.findMany({
    where: { dismissed: false },
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
  await prisma.aIInsight.update({ where: { id }, data: { dismissed: true } });
  revalidatePath("/ai-insights");
}
