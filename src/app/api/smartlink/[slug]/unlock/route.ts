import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public: a fan submits their email on a gated /listen page. We add them to the
// owning artist's mailing list, then the page reveals the platform links.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let email = "";
  try {
    const body = await req.json();
    email = String(body.email || "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400, headers: CORS });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email" }, { status: 400, headers: CORS });
  }

  const link = await prisma.smartLink.findUnique({ where: { slug }, select: { userId: true, isActive: true } });
  if (!link || !link.isActive) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404, headers: CORS });
  }

  // Route the subscriber to the owning artist's site (so they show in the dashboard).
  const site = link.userId
    ? await prisma.artistSite.findUnique({ where: { userId: link.userId }, select: { slug: true, userId: true } })
    : null;
  const siteSlug = site?.slug || slug;

  try {
    await prisma.mailingSubscriber.upsert({
      where: { site_email: { site: siteSlug, email } },
      create: { site: siteSlug, email, source: `listen:${slug}`, userId: link.userId ?? null, notifyOptIn: false },
      update: { ...(link.userId ? { userId: link.userId } : {}) },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not save. Try again." }, { status: 500, headers: CORS });
  }

  return NextResponse.json({ ok: true }, { headers: CORS });
}
