import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint: an artist's website posts a captured email here.
// notifyOptIn=true means the visitor explicitly asked to hear about future
// releases and shows. Emails captured only to unlock a full track come in with
// notifyOptIn=false. One row per (site, email); opt-in is never downgraded.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-site-key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Optional shared-secret gate. If SITE_INGEST_KEY is configured, require it.
  const requiredKey = process.env.SITE_INGEST_KEY;
  if (requiredKey && req.headers.get("x-site-key") !== requiredKey) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401, headers: CORS }
    );
  }

  let email = "";
  let notifyOptIn = false;
  let name: string | null = null;
  let source: string | null = null;
  try {
    const body = await req.json();
    email = String(body.email || "").trim().toLowerCase();
    notifyOptIn = Boolean(body.notifyOptIn);
    name = body.name ? String(body.name).trim() : null;
    source = body.source ? String(body.source).trim() : null;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400, headers: CORS }
    );
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid email" },
      { status: 400, headers: CORS }
    );
  }

  // Resolve the owning artist (if a site record exists) so subscribers show up
  // in that artist's dashboard. Still store even if no site row exists yet.
  const site = await prisma.artistSite.findUnique({
    where: { slug },
    select: { userId: true },
  });

  try {
    await prisma.mailingSubscriber.upsert({
      where: { site_email: { site: slug, email } },
      create: {
        site: slug,
        email,
        name,
        notifyOptIn,
        source,
        userId: site?.userId ?? null,
      },
      update: {
        // Never downgrade an existing opt-in; upgrade to true if they opt in now.
        ...(notifyOptIn ? { notifyOptIn: true } : {}),
        ...(name ? { name } : {}),
        ...(source ? { source } : {}),
        ...(site?.userId ? { userId: site.userId } : {}),
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not save. Try again." },
      { status: 500, headers: CORS }
    );
  }

  return NextResponse.json({ ok: true }, { headers: CORS });
}
