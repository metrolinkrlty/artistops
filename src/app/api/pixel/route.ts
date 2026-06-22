import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
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

    if (!visitorId || !pageUrl || !eventType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // In production, save to database using Prisma
    // For now, log to console
    console.log("[Pixel Event]", {
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
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Pixel API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ArtistOps Pixel API running" });
}
