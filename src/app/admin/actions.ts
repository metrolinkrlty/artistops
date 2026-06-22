"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail, approvedEmailHtml } from "@/lib/email";

async function requireAdmin() {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.isAdmin) redirect("/");
  return userId;
}

export async function approveUser(id: string) {
  await requireAdmin();
  const user = await prisma.user.update({ where: { id }, data: { status: "APPROVED" } });
  sendEmail(user.email, "Your ArtistOps account is approved! 🎉", approvedEmailHtml(user.artistName), user.email).catch(console.error);
  revalidatePath("/admin");
  return { ok: true };
}

export async function rejectUser(id: string) {
  await requireAdmin();
  await prisma.user.update({ where: { id }, data: { status: "REJECTED" } });
  revalidatePath("/admin");
  return { ok: true };
}

export async function getUsers() {
  await requireAdmin();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  const counts = await Promise.all(
    users.map(async (u) => ({
      userId: u.id,
      songs: await prisma.song.count({ where: { userId: u.id } }),
      revenue: await prisma.revenue.aggregate({ where: { userId: u.id }, _sum: { amount: true } }),
    }))
  );
  return users.map((u) => {
    const c = counts.find((x) => x.userId === u.id)!;
    return {
      id: u.id,
      email: u.email,
      artistName: u.artistName,
      isAdmin: u.isAdmin,
      status: u.status,
      createdAt: u.createdAt.toISOString(),
      songs: c.songs,
      totalRevenue: c.revenue._sum.amount ?? 0,
    };
  });
}

export async function createUser(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const artistName = String(formData.get("artistName") || "").trim();
  const password = String(formData.get("password") || "");
  const isAdmin = formData.get("isAdmin") === "on";

  if (!email || !artistName || password.length < 6) return { error: "All fields required; password min 6 chars" };
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "Email already in use" };

  await prisma.user.create({ data: { email, artistName, passwordHash: await hashPassword(password), isAdmin, status: "APPROVED" } });
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateUser(id: string, formData: FormData) {
  await requireAdmin();
  const artistName = String(formData.get("artistName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const isAdmin = formData.get("isAdmin") === "on";
  const newPassword = String(formData.get("newPassword") || "");
  const status = String(formData.get("status") || "APPROVED");

  const data: Record<string, unknown> = { artistName, email, isAdmin, status };
  if (newPassword.length >= 6) data.passwordHash = await hashPassword(newPassword);

  await prisma.user.update({ where: { id }, data });
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteUser(id: string) {
  const adminId = await requireAdmin();
  if (id === adminId) return { error: "Cannot delete your own account" };

  // Delete all user data
  for (const t of [
    "smartLinkClick", "playlistSong", "passwordReset", "copyright", "distribution", "revenue",
    "streamPlay", "socialPost", "adCampaign", "pixelEvent", "rightsDocument", "aIInsight",
    "forecast", "listenerDemographic", "smartLink", "playlist", "connector", "contact",
    "distributor", "song", "setting",
  ]) {
    // @ts-expect-error dynamic
    await prisma[t].deleteMany({ where: { userId: id } });
  }
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin");
  return { ok: true };
}
