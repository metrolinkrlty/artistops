"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail, approvedEmailHtml } from "@/lib/email";
import { artistWantsEmail } from "@/app/messages/actions";
import { setAppSetting, SETTING_LOGIN_TAGLINE, DEFAULT_LOGIN_TAGLINE, SETTING_AD_RETARGETING_GLOBAL, SETTING_PRIVACY_POLICY, DEFAULT_PRIVACY_POLICY } from "@/lib/settings";

async function requireAdmin() {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.isAdmin) redirect("/");
  return userId;
}

// Edit the sign-in page tagline. Empty input resets to the built-in default.
export async function updateLoginTagline(value: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  const clean = value.trim();
  await setAppSetting(SETTING_LOGIN_TAGLINE, clean || DEFAULT_LOGIN_TAGLINE);
  revalidatePath("/login");
  revalidatePath("/admin");
  return { ok: true };
}

// Global master switch for social ad retargeting across all artists.
export async function updateAdRetargetingGlobal(on: boolean): Promise<{ ok: boolean }> {
  await requireAdmin();
  await setAppSetting(SETTING_AD_RETARGETING_GLOBAL, on ? "on" : "off");
  revalidatePath("/admin");
  revalidatePath("/email");
  return { ok: true };
}

// Edit the public privacy policy (markdown). Empty input resets to the default draft.
export async function updatePrivacyPolicy(content: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  const clean = content.trim();
  await setAppSetting(SETTING_PRIVACY_POLICY, clean || DEFAULT_PRIVACY_POLICY);
  revalidatePath("/privacy");
  revalidatePath("/admin");
  return { ok: true };
}

export async function approveUser(id: string) {
  await requireAdmin();
  const user = await prisma.user.update({ where: { id }, data: { status: "APPROVED" } });
  // Await so the serverless function doesn't freeze before the email sends.
  await sendEmail(user.email, "Your ArtistOps account is approved! 🎉", approvedEmailHtml(user.artistName), user.email).catch((e) => console.error("Approval email failed:", e));
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

export type AdminMessageView = {
  id: string;
  fromAdmin: boolean;
  body: string;
  createdAt: string;
};

// The full thread with one artist, for the admin panel.
export async function getUserThread(userId: string): Promise<AdminMessageView[]> {
  await requireAdmin();
  const rows = await prisma.message.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, fromAdmin: true, body: true, createdAt: true },
  });
  // Mark artist → team messages read now that the admin is viewing them.
  await prisma.message.updateMany({
    where: { userId, fromAdmin: false, readAt: null },
    data: { readAt: new Date() },
  });
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

// Admin replies to an artist in-app, and emails them a nudge to come read it.
export async function adminSendMessage(
  userId: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const text = body.trim();
  if (!text) return { ok: false, error: "Write a message first." };
  if (text.length > 5000) return { ok: false, error: "That message is too long." };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, artistName: true } });
  if (!user) return { ok: false, error: "Artist not found." };

  await prisma.message.create({ data: { userId, fromAdmin: true, body: text } });

  // Email the artist a copy only if they've opted in (default on).
  if (await artistWantsEmail(userId)) {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@artistops.net";
    await sendEmail(
      user.email,
      "New message from the ArtistOps team",
      `<div style="font-family:Inter,Arial,sans-serif;color:#333;padding:16px"><p>Hi ${user.artistName}, you have a new message in ArtistOps:</p><blockquote style="border-left:3px solid #6366f1;padding-left:12px;color:#555;white-space:pre-wrap">${text.replace(/</g, "&lt;")}</blockquote><p><a href="https://artistops.net/messages">Open ArtistOps to reply</a></p></div>`,
      adminEmail
    ).catch((e) => console.error("Message email failed:", e));
  }

  revalidatePath("/admin");
  return { ok: true };
}

// Recipient groups for a blast.
function blastWhere(scope: string) {
  if (scope === "everyone") return {};
  if (scope === "approved") return { status: "APPROVED" };
  // default: approved non-admin artists
  return { status: "APPROVED", isAdmin: false };
}

export async function countBlastRecipients(scope: string): Promise<number> {
  await requireAdmin();
  return prisma.user.count({ where: blastWhere(scope) });
}

// Send an announcement email to a group of users. Each gets their own email
// (never CC — no leaking addresses), with replies routed to the admin.
export async function sendBlast(
  subject: string,
  message: string,
  scope: string
): Promise<{ ok: boolean; sent?: number; failed?: number; error?: string }> {
  await requireAdmin();
  const cleanSubject = subject.trim();
  const cleanMessage = message.trim();
  if (!cleanSubject) return { ok: false, error: "Add a subject." };
  if (!cleanMessage) return { ok: false, error: "Write a message." };

  const recipients = await prisma.user.findMany({ where: blastWhere(scope), select: { email: true, artistName: true } });
  if (recipients.length === 0) return { ok: false, error: "No recipients in that group." };

  const adminEmail = process.env.ADMIN_EMAIL || "admin@artistops.net";
  const bodyHtml = (name: string) => `
  <div style="font-family:Inter,Arial,sans-serif;background:#0f1117;color:#fff;padding:32px;border-radius:12px;max-width:520px;margin:0 auto">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <div style="width:40px;height:40px;background:#6366f1;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px">🎵</div>
      <span style="font-size:20px;font-weight:700">ArtistOps</span>
    </div>
    <p style="color:#8b8fa8;margin:0 0 12px">Hi ${name},</p>
    <div style="color:#c7cad8;white-space:pre-wrap;line-height:1.6">${cleanMessage.replace(/</g, "&lt;")}</div>
    <p style="color:#5a5e72;font-size:12px;margin:20px 0 0">Reply to this email to reach us.</p>
  </div>`;

  let sent = 0, failed = 0;
  // Sequential to stay under shared-hosting SMTP rate limits.
  for (const r of recipients) {
    const res = await sendEmail(r.email, cleanSubject, bodyHtml(r.artistName || "there"), adminEmail);
    if (res.ok) sent++; else failed++;
  }
  return { ok: true, sent, failed };
}

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

  // Unread artist → team messages per user, for an admin badge. Defensive.
  const unreadByUser = new Map<string, number>();
  try {
    const grouped = await prisma.message.groupBy({
      by: ["userId"],
      where: { fromAdmin: false, readAt: null },
      _count: { _all: true },
    });
    for (const g of grouped) unreadByUser.set(g.userId, g._count._all);
  } catch {
    // Table not migrated yet.
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
      unreadMessages: unreadByUser.get(u.id) ?? 0,
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
