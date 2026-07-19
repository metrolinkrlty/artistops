import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin, AUDIO_BUCKET } from "@/lib/supabaseAdmin";

// Public: the featured tracks for an artist website, each with a short-lived
// signed URL for its 30-second preview. Full tracks are NOT exposed here — they
// come only through the key-protected full-url endpoint after an email unlock.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const PREVIEW_TTL = 60 * 60 * 2; // 2 hours

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const tracks = await prisma.siteTrack.findMany({
    where: { site: slug },
    orderBy: { order: "asc" },
  });

  const out = await Promise.all(
    tracks.map(async (t) => {
      const { data } = await supabaseAdmin.storage
        .from(AUDIO_BUCKET)
        .createSignedUrl(t.previewPath, PREVIEW_TTL);
      return {
        trackId: t.trackId,
        title: t.title,
        gate: t.gate,
        previewUrl: data?.signedUrl ?? null,
        streamLinks: (t.streamLinks as Record<string, string> | null) ?? null,
        linksMode: t.linksMode ?? "default",
      };
    })
  );

  return NextResponse.json({ ok: true, tracks: out }, { headers: CORS });
}
