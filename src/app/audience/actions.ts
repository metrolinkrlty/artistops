"use server";

import { prisma } from "@/lib/prisma";

export async function getAudienceData() {
  const rows = await prisma.listenerDemographic.findMany();

  const cityRows = rows.filter((r) => r.city);
  const cityTotal = cityRows.reduce((s, r) => s + r.streams, 0) || 1;
  const topCities = cityRows
    .map((r) => ({ city: r.city!, country: r.country || "", streams: r.streams, pct: Number(((r.streams / cityTotal) * 100).toFixed(1)) }))
    .sort((a, b) => b.streams - a.streams);

  const countryRows = rows.filter((r) => !r.city && r.country && !r.ageGroup && r.platform === "all");
  const countryTotal = countryRows.reduce((s, r) => s + r.streams, 0) || 1;
  const topCountries = countryRows
    .map((r) => ({ country: r.country!, streams: r.streams, pct: Number(((r.streams / countryTotal) * 100).toFixed(1)) }))
    .sort((a, b) => b.streams - a.streams);

  const agRows = rows.filter((r) => r.ageGroup);
  const agMap = new Map<string, { male: number; female: number }>();
  for (const r of agRows) {
    if (!agMap.has(r.ageGroup!)) agMap.set(r.ageGroup!, { male: 0, female: 0 });
    const e = agMap.get(r.ageGroup!)!;
    if (r.gender === "female") e.female += r.streams; else e.male += r.streams;
  }
  const AGE_ORDER = ["13-17", "18-24", "25-34", "35-44", "45-54", "55+"];
  const ageGender = AGE_ORDER.filter((g) => agMap.has(g)).map((group) => ({ group, ...agMap.get(group)! }));

  const platRows = rows.filter((r) => r.platform && r.platform !== "all");
  const platTotal = platRows.reduce((s, r) => s + r.streams, 0) || 1;
  const platforms = platRows
    .map((r) => ({ name: r.platform, pct: Number(((r.streams / platTotal) * 100).toFixed(0)) }))
    .sort((a, b) => b.pct - a.pct);

  return { topCities, topCountries, ageGender, platforms };
}
