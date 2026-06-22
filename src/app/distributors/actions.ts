"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getDistributors() {
  const distributors = await prisma.distributor.findMany({ orderBy: { name: "asc" } });
  const result = [];
  for (const d of distributors) {
    const activeSongs = await prisma.distribution.count({
      where: { distributorId: d.id, status: "ACTIVE" },
    });
    const revAgg = await prisma.revenue.aggregate({
      where: { distributorId: d.id },
      _sum: { amount: true },
    });
    result.push({ ...d, activeSongs, totalRevenue: revAgg._sum.amount ?? 0 });
  }
  return result;
}

function parse(formData: FormData) {
  return {
    name: String(formData.get("name") || "").trim(),
    accountId: String(formData.get("accountId") || "").trim() || null,
    email: String(formData.get("email") || "").trim() || null,
    website: String(formData.get("website") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
  };
}

export async function createDistributor(formData: FormData) {
  const data = parse(formData);
  if (!data.name) return;
  await prisma.distributor.create({ data });
  revalidatePath("/distributors");
}

export async function updateDistributor(id: string, formData: FormData) {
  const data = parse(formData);
  if (!data.name) return;
  await prisma.distributor.update({ where: { id }, data });
  revalidatePath("/distributors");
}

export async function deleteDistributor(id: string) {
  await prisma.distribution.deleteMany({ where: { distributorId: id } });
  await prisma.revenue.updateMany({ where: { distributorId: id }, data: { distributorId: null } });
  await prisma.distributor.delete({ where: { id } });
  revalidatePath("/distributors");
}
