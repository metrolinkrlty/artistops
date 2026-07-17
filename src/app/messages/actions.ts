"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId, getCurrentUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";

export type MessageView = {
  id: string;
  fromAdmin: boolean;
  body: string;
  createdAt: string;
};

// The signed-in artist's own thread with the ArtistOps team.
export async function getMyThread(): Promise<MessageView[]> {
  const userId = await requireUserId();
  const rows = await prisma.message.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, fromAdmin: true, body: true, createdAt: true },
  });
  // Mark team → artist messages as read now that the artist is viewing them.
  await prisma.message.updateMany({
    where: { userId, fromAdmin: true, readAt: null },
    data: { readAt: new Date() },
  });
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

// Unread count for the header badge, role-aware:
//  - admin  → all artist → team messages not yet read
//  - artist → team → me messages not yet read
export async function getHeaderUnread(): Promise<number> {
  const userId = await getCurrentUserId();
  if (!userId) return 0;
  try {
    const me = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
    if (me?.isAdmin) {
      return await prisma.message.count({ where: { fromAdmin: false, readAt: null } });
    }
    return await prisma.message.count({ where: { userId, fromAdmin: true, readAt: null } });
  } catch {
    return 0; // table not migrated yet
  }
}

export type ConversationSummary = {
  userId: string;
  artistName: string;
  email: string;
  unread: number;
  lastBody: string;
  lastAt: string;
  lastFromAdmin: boolean;
};

// Admin inbox: one row per artist who has any messages, newest activity first.
export async function getConversations(): Promise<ConversationSummary[]> {
  const userId = await requireUserId();
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  if (!me?.isAdmin) return [];

  const messages = await prisma.message.findMany({
    orderBy: { createdAt: "asc" },
    select: { userId: true, fromAdmin: true, body: true, createdAt: true, readAt: true },
  });
  const byUser = new Map<string, { unread: number; lastBody: string; lastAt: Date; lastFromAdmin: boolean }>();
  for (const m of messages) {
    const cur = byUser.get(m.userId) ?? { unread: 0, lastBody: "", lastAt: m.createdAt, lastFromAdmin: m.fromAdmin };
    if (!m.fromAdmin && !m.readAt) cur.unread += 1;
    cur.lastBody = m.body;
    cur.lastAt = m.createdAt;
    cur.lastFromAdmin = m.fromAdmin;
    byUser.set(m.userId, cur);
  }
  const ids = [...byUser.keys()];
  const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, artistName: true, email: true } });
  const nameById = new Map(users.map((u) => [u.id, u]));

  return ids
    .map((id) => {
      const c = byUser.get(id)!;
      const u = nameById.get(id);
      return {
        userId: id,
        artistName: u?.artistName ?? "Unknown",
        email: u?.email ?? "",
        unread: c.unread,
        lastBody: c.lastBody,
        lastAt: c.lastAt.toISOString(),
        lastFromAdmin: c.lastFromAdmin,
      };
    })
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

// Artist sends a message to the team.
export async function sendMyMessage(body: string): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const text = body.trim();
  if (!text) return { ok: false, error: "Write a message first." };
  if (text.length > 5000) return { ok: false, error: "That message is too long." };

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { artistName: true, email: true } });
  await prisma.message.create({ data: { userId, fromAdmin: false, body: text } });

  // Nudge the admin by email so replies don't sit unseen.
  const adminEmail = process.env.ADMIN_EMAIL || "admin@artistops.net";
  sendEmail(
    adminEmail,
    `New message from ${me?.artistName || "an artist"} in ArtistOps`,
    `<div style="font-family:Inter,Arial,sans-serif;color:#333;padding:16px"><p>${me?.artistName || "An artist"} sent a message in ArtistOps:</p><blockquote style="border-left:3px solid #6366f1;padding-left:12px;color:#555;white-space:pre-wrap">${text.replace(/</g, "&lt;")}</blockquote><p><a href="https://artistops.net/admin">Open the admin panel to reply</a></p></div>`,
    me?.email || undefined
  ).catch(console.error);

  revalidatePath("/messages");
  return { ok: true };
}
