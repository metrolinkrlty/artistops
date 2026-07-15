"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { unlockCookieName, UNLOCK_MAX_AGE } from "./unlock";

// Public visitor action (no auth): capture an email and unlock full-track
// playback for this artist's site via a per-slug cookie. Mirrors the flow on
// Luke's bespoke site, but for the multi-tenant renderer.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function unlockSiteTracks(
  slug: string,
  email: string,
  name?: string
): Promise<{ ok: boolean; error?: string }> {
  const clean = String(email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(clean)) return { ok: false, error: "Enter a valid email." };

  const site = await prisma.artistSite.findUnique({
    where: { slug },
    select: { userId: true },
  });
  if (!site) return { ok: false, error: "Site not found." };

  // Record the email but never downgrade an existing opt-in.
  await prisma.mailingSubscriber.upsert({
    where: { site_email: { site: slug, email: clean } },
    create: {
      site: slug,
      email: clean,
      name: name?.trim() || null,
      notifyOptIn: false,
      source: "song_unlock",
      userId: site.userId,
    },
    update: {},
  });

  const store = await cookies();
  store.set(unlockCookieName(slug), "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: UNLOCK_MAX_AGE,
  });

  return { ok: true };
}
