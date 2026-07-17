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
      heroSubtext: true,
      themeColor: true,
      galleryImages: true,
      hiddenSections: true,
      shows: true,
      heroCtaPrimary: true,
      heroCtaSecondary: true,
      previewSeconds: true,
      unlockGate: true,
      unlockFollowUrl: true,
      fbLikeShare: true,
      fbPageUrl: true,
      socialLinks: true,
      contactEmail: true,
    },
  });

  if (!site) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404, headers: CORS }
    );
  }

  // The website tracking pixel is data-driven: the external site reads this and
  // installs the pixel with no redeploy. Queried separately and defensively so
  // that a DB not yet carrying `websitePixelId` still serves site content.
  let pixelId: string | null = null;
  const adPixels: Record<string, string> = {};
  try {
    const p = await prisma.artistSite.findUnique({
      where: { slug },
      select: { websitePixelId: true, userId: true },
    });
    pixelId = p?.websitePixelId ?? null;
    if (p?.userId) {
      const rows = await prisma.adPixel.findMany({
        where: { userId: p.userId },
        select: { platform: true, pixelId: true },
      });
      for (const r of rows) adPixels[r.platform] = r.pixelId;
    }
  } catch {
    pixelId = null;
  }

  return NextResponse.json({ ok: true, site: { ...site, pixelId, adPixels } }, { headers: CORS });
}
