import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// The tracking snippet runs on the artist's own (external) website, so every
// request is cross-origin. Allow it and answer the CORS preflight.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      pixelId,
      visitorId,
      pageUrl,
      referrer,
      eventType,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      songId,
    } = body;

    if (!pixelId || !visitorId || !pageUrl || !eventType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400, headers: CORS });
    }

    // A pixel id is a Pixel token embedded in the snippet. Fall back to treating
    // it as a user id so the legacy single-pixel snippet keeps working.
    const pixel = await prisma.pixel.findUnique({
      where: { id: String(pixelId) },
      select: { id: true, userId: true },
    });
    let ownerId: string;
    let resolvedPixelId: string | null;
    if (pixel) {
      ownerId = pixel.userId;
      resolvedPixelId = pixel.id;
    } else {
      const user = await prisma.user.findUnique({
        where: { id: String(pixelId) },
        select: { id: true },
      });
      if (!user) {
        return NextResponse.json({ error: "Unknown pixel" }, { status: 404, headers: CORS });
      }
      ownerId = user.id;
      resolvedPixelId = null;
    }

    // Only attribute to a song the pixel owner actually owns.
    let validSongId: string | null = null;
    if (songId) {
      const song = await prisma.song.findFirst({
        where: { id: String(songId), userId: ownerId },
        select: { id: true },
      });
      validSongId = song?.id ?? null;
    }

    const str = (v: unknown, max: number) => (v == null ? null : String(v).slice(0, max));

    await prisma.pixelEvent.create({
      data: {
        userId: ownerId,
        pixelId: resolvedPixelId,
        songId: validSongId,
        visitorId: String(visitorId).slice(0, 100),
        pageUrl: String(pageUrl).slice(0, 500),
        referrer: str(referrer, 500),
        eventType: String(eventType).slice(0, 50),
        utmSource: str(utmSource, 200),
        utmMedium: str(utmMedium, 200),
        utmCampaign: str(utmCampaign, 200),
        utmContent: str(utmContent, 200),
        utmTerm: str(utmTerm, 200),
      },
    });

    return NextResponse.json({ success: true }, { status: 200, headers: CORS });
  } catch (error) {
    console.error("Pixel API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ArtistOps Pixel API running" }, { headers: CORS });
}
