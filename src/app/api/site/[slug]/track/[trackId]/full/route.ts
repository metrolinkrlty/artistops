import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin, AUDIO_BUCKET } from "@/lib/supabaseAdmin";
import { unlockCookieName, isTrackUnlocked } from "@/app/sites/unlock";

// Cookie-gated full-track stream for the multi-tenant renderer. The visitor
// must have unlocked this slug (email gate) — then we sign the private full
// track and proxy the bytes with Range support. The signed URL is never
// exposed, and there's no download disposition.

const FULL_TTL = 120; // seconds

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; trackId: string }> }
) {
  const { slug, trackId } = await params;

  const track = await prisma.siteTrack.findUnique({
    where: { site_trackId: { site: slug, trackId } },
    select: { fullPath: true, gate: true },
  });
  if (!track) return new NextResponse("Not found", { status: 404 });

  // Free songs are always streamable; otherwise the cookie must authorize THIS
  // track (per-song), with legacy "1" still meaning everything.
  const store = await cookies();
  const cookieVal = store.get(unlockCookieName(slug))?.value;
  if (track.gate !== "free" && !isTrackUnlocked(cookieVal, trackId)) {
    return new NextResponse("Locked", { status: 403 });
  }

  const { data, error } = await supabaseAdmin.storage
    .from(AUDIO_BUCKET)
    .createSignedUrl(track.fullPath, FULL_TTL);
  if (error || !data) return new NextResponse("Error", { status: 500 });

  const range = req.headers.get("range");
  const upstream = await fetch(data.signedUrl, {
    headers: range ? { Range: range } : {},
  });

  const headers = new Headers();
  for (const h of ["content-type", "content-length", "content-range", "accept-ranges", "cache-control"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  if (!headers.has("accept-ranges")) headers.set("accept-ranges", "bytes");
  if (!headers.has("content-type")) headers.set("content-type", "audio/mpeg");
  headers.set("content-disposition", "inline");

  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
