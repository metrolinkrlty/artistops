"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { unlockCookieName, UNLOCK_MAX_AGE, addTrackToCookie } from "./unlock";

// Public visitor actions (no auth) for the multi-tenant renderer. Per-song gates
// mirror Luke's bespoke site: email captures the address, share/follow trust the
// click. Full playback is authorized per track via the unlock cookie.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Add one trackId to this site's unlock cookie.
async function grantTrack(slug: string, trackId: string) {
  const store = await cookies();
  const current = store.get(unlockCookieName(slug))?.value;
  store.set(unlockCookieName(slug), addTrackToCookie(current, trackId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: UNLOCK_MAX_AGE,
  });
}

// Email gate: capture the address and unlock THIS song.
export async function unlockSiteTrackEmail(
  slug: string,
  trackId: string,
  email: string,
  name?: string
): Promise<{ ok: boolean; error?: string }> {
  const clean = String(email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(clean)) return { ok: false, error: "Enter a valid email." };

  const site = await prisma.artistSite.findUnique({ where: { slug }, select: { userId: true } });
  if (!site) return { ok: false, error: "Site not found." };

  await prisma.mailingSubscriber.upsert({
    where: { site_email: { site: slug, email: clean } },
    create: { site: slug, email: clean, name: name?.trim() || null, notifyOptIn: false, source: "song_unlock", userId: site.userId },
    update: {},
  });

  await grantTrack(slug, trackId);
  return { ok: true };
}

// Share / follow gate: optimistic — we can't verify a real share, so trust the
// click and unlock THIS song. Restricted to share/follow-gated songs so this
// endpoint can never bypass an email gate.
export async function unlockSiteTrackShareFollow(
  slug: string,
  trackId: string
): Promise<{ ok: boolean }> {
  if (!trackId) return { ok: false };
  const t = await prisma.siteTrack.findUnique({
    where: { site_trackId: { site: slug, trackId } },
    select: { gate: true },
  });
  if (!t || (t.gate !== "share" && t.gate !== "follow")) return { ok: false };
  await grantTrack(slug, trackId);
  return { ok: true };
}
