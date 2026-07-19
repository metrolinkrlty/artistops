import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Allow an artist's own website (different origin) to record clicks.
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
    const { slug, platform, country, device, os, browser, referrer, utmSource, utmMedium, utmCampaign } = body;

    const link = await prisma.smartLink.findUnique({ where: { slug: String(slug || "") } });
    if (!link) return NextResponse.json({ success: false, error: "Unknown link" }, { status: 404, headers: CORS });

    await prisma.smartLinkClick.create({
      data: {
        smartLinkId: link.id,
        userId: link.userId,
        platform: platform || null,
        country: country || null,
        device: device || null,
        os: os || null,
        browser: browser || null,
        referrer: referrer || null,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
      },
    });

    return NextResponse.json({ success: true }, { status: 200, headers: CORS });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400, headers: CORS });
  }
}
