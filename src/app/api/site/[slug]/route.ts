import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public, read-only site configuration for an artist website.
// The website fetches this to render its bio, location, and social links.
// Audio/featured-song data is added in Phase 2.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const site = await prisma.artistSite.findUnique({
    where: { slug },
    select: {
      slug: true,
      displayName: true,
      tagline: true,
      location: true,
      bio: true,
      heroImageUrl: true,
      socialLinks: true,
    },
  });

  if (!site) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404, headers: CORS }
    );
  }

  return NextResponse.json({ ok: true, site }, { headers: CORS });
}
