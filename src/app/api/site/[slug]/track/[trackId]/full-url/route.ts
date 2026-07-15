import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin, AUDIO_BUCKET } from "@/lib/supabaseAdmin";

// Server-to-server ONLY: returns a short-lived signed URL for a full track.
// Protected by SITE_INGEST_KEY so it can't be used to bypass the website's
// email gate. The website calls this from its own server after checking the
// visitor's unlock cookie, then proxies the bytes (never exposing this URL).

const FULL_TTL = 120; // seconds

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; trackId: string }> }
) {
  const requiredKey = process.env.SITE_INGEST_KEY;
  if (!requiredKey || req.headers.get("x-site-key") !== requiredKey) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { slug, trackId } = await params;
  const track = await prisma.siteTrack.findUnique({
    where: { site_trackId: { site: slug, trackId } },
    select: { fullPath: true },
  });
  if (!track) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin.storage
    .from(AUDIO_BUCKET)
    .createSignedUrl(track.fullPath, FULL_TTL);
  if (error || !data) {
    return NextResponse.json({ ok: false, error: "Sign failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: data.signedUrl });
}
