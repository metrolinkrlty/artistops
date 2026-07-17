import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  exchangeCodeForTokens,
  getSpotifyUserId,
} from "@/lib/spotify";
import { encryptToken, verifyState } from "@/lib/presaveCrypto";

// Spotify redirects the fan back here after they approve (or deny). We exchange
// the code for tokens, store the encrypted refresh token, and send them to a
// friendly "you're all set" page. On release day a scheduled job replays these.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const done = (slug: string, status: "ok" | "denied" | "error") =>
    NextResponse.redirect(new URL(`/presave/${slug}?presave=${status}`, url.origin));

  // Verify state first so we always know which campaign to return the fan to.
  const slug = state ? verifyState(state) : null;
  if (!slug) {
    return NextResponse.json({ ok: false, error: "Invalid or expired request." }, { status: 400 });
  }

  // The fan clicked "Cancel" on Spotify's consent screen.
  if (error || !code) {
    return done(slug, "denied");
  }

  const campaign = await prisma.preSaveCampaign.findUnique({
    where: { slug },
    select: { id: true, status: true },
  });
  if (!campaign || campaign.status !== "scheduled") {
    return done(slug, "error");
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      // Spotify only omits refresh_token if we didn't request offline-style access;
      // for the authorization_code flow it should always be present.
      throw new Error("No refresh token returned by Spotify.");
    }
    const spotifyUserId = await getSpotifyUserId(tokens.access_token);
    const encrypted = encryptToken(tokens.refresh_token);

    // One pre-save per fan per campaign — a re-authorize just refreshes the token.
    await prisma.preSave.upsert({
      where: { campaignId_spotifyUserId: { campaignId: campaign.id, spotifyUserId } },
      create: {
        campaignId: campaign.id,
        spotifyUserId,
        refreshToken: encrypted,
        status: "pending",
      },
      update: { refreshToken: encrypted, status: "pending" },
    });

    return done(slug, "ok");
  } catch (e) {
    console.error("[presave callback]", e);
    return done(slug, "error");
  }
}
