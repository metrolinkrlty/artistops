import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, platform, country, device, os, browser, referrer, utmSource, utmMedium, utmCampaign } = body;

    const link = await prisma.smartLink.findUnique({ where: { slug: String(slug || "") } });
    if (!link) return NextResponse.json({ success: false, error: "Unknown link" }, { status: 404 });

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

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
