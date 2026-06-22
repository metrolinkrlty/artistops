"use server";

import { prisma } from "@/lib/prisma";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function getForecastData() {
  const rows = await prisma.forecast.findMany({ orderBy: { period: "asc" } });

  const byPeriod = new Map<string, { label: string; streams: number; revenue: number; followers: number; projected: boolean }>();
  for (const r of rows) {
    const key = `${r.period.getFullYear()}-${r.period.getMonth()}`;
    if (!byPeriod.has(key)) {
      const yy = String(r.period.getFullYear()).slice(2);
      byPeriod.set(key, { label: `${MONTH_LABELS[r.period.getMonth()]} '${yy}`, streams: 0, revenue: 0, followers: 0, projected: false });
    }
    const e = byPeriod.get(key)!;
    const value = r.actual ?? r.predicted;
    if (r.metric === "streams") e.streams = value;
    else if (r.metric === "revenue") e.revenue = value;
    else if (r.metric === "followers") e.followers = value;
    if (r.actual === null) e.projected = true;
  }

  const monthlyData = Array.from(byPeriod.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([, v]) => ({ month: v.label, streams: v.streams, revenue: v.revenue, followers: v.followers, projected: v.projected }));
  const firstProjected = monthlyData.find((m) => m.projected) || monthlyData[monthlyData.length - 1];

  return { monthlyData, nextMonth: firstProjected };
}
