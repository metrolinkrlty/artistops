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

// Email an applicant/user directly from the admin panel — e.g. to ask a pending
// applicant who referred them before approving. Reply-to is the admin so their
// answer comes back to you.
export async function messageUser(
  id: string,
  subject: string,
  message: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const cleanSubject = subject.trim();
  const cleanMessage = message.trim();
  if (!cleanSubject) return { ok: false, error: "Add a subject." };
  if (!cleanMessage) return { ok: false, error: "Write a message." };

  const user = await prisma.user.findUnique({ where: { id }, select: { email: true, artistName: true } });
  if (!user) return { ok: false, error: "User not found." };

  const adminEmail = process.env.ADMIN_EMAIL || "admin@artistops.net";
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;background:#0f1117;color:#fff;padding:32px;border-radius:12px;max-width:480px;margin:0 auto">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <div style="width:40px;height:40px;background:#6366f1;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px">🎵</div>
      <span style="font-size:20px;font-weight:700">ArtistOps</span>
    </div>
    <p style="color:#c7cad8;white-space:pre-wrap;line-height:1.6;margin:0">${cleanMessage.replace(/</g, "&lt;")}</p>
    <p style="color:#5a5e72;font-size:12px;margin:20px 0 0">Reply to this email to reach us directly.</p>
  </div>`;

  const res = await sendEmail(user.email, cleanSubject, html, adminEmail);
  if (!res.ok) {
    return { ok: false, error: res.skipped ? "Email isn't configured on the server." : "Couldn't send the message." };
  }
  return { ok: true };
}

export type MembershipApplicationView = {
  role: string;
  referredBy: string;
  workLink: string | null;
  goals: string[];
  catalogSize: string | null;
  location: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  artist: "Artist",
  band: "Band member",
  manager: "Artist manager",
  label: "Label / industry professional",
  producer: "Producer / engineer",
  other: "Other",
};

export async function getUsers() {
  await requireAdmin();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  // Signup questionnaires, keyed by userId. Defensive: users who signed up before
  // the questionnaire existed simply have no application.
  const appsByUser = new Map<string, MembershipApplicationView>();
  try {
    const apps = await prisma.membershipApplication.findMany({
      where: { userId: { in: users.map((u) => u.id) } },
    });
    for (const a of apps) {
      if (!a.userId) continue;
      appsByUser.set(a.userId, {
        role: ROLE_LABELS[a.role] || a.role,
        referredBy: a.referredBy,
        workLink: a.workLink,
        goals: a.goals,
        catalogSize: a.catalogSize,
        location: a.location,
      });
    }
  } catch {
    // Table not migrated yet — no applications to show.
  }

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
      application: appsByUser.get(u.id) ?? null,
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
