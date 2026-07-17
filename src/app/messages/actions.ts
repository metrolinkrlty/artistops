"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
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

// How many unread team messages the artist has — for the sidebar badge.
export async function getMyUnreadCount(): Promise<number> {
  const userId = await requireUserId();
  try {
    return await prisma.message.count({ where: { userId, fromAdmin: true, readAt: null } });
  } catch {
    return 0; // table not migrated yet
  }
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
