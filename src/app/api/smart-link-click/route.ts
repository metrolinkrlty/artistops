import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, platform, country, device, os, browser, referrer, utmSource, utmMedium, utmCampaign } = body;

    // In production this would write to DB
    console.log("[SmartLinkClick]", {
      slug,
      platform,
      country,
      device,
      os,
      browser,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
